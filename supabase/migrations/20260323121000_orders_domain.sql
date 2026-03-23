CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED')),
    total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
    currency TEXT NOT NULL DEFAULT 'CREDITS',
    shipping_address TEXT,
    tracking_number TEXT,
    idempotency_key TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
    ADD COLUMN IF NOT EXISTS metadata JSONB,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'orders_idempotency_key_not_blank_chk'
    ) THEN
        ALTER TABLE public.orders
            ADD CONSTRAINT orders_idempotency_key_not_blank_chk
            CHECK (idempotency_key IS NULL OR LENGTH(TRIM(idempotency_key)) > 0);
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_user_idempotency
    ON public.orders(user_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_user_created
    ON public.orders(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    line_total NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_order_items_order_book
    ON public.order_items(order_id, book_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order
    ON public.order_items(order_id);

CREATE OR REPLACE FUNCTION public.enforce_order_updates()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_is_service BOOLEAN := public.is_service_role();
BEGIN
    IF NEW.user_id <> OLD.user_id THEN
        RAISE EXCEPTION 'Order owner is immutable';
    END IF;

    IF NOT v_is_service THEN
        IF NEW.status <> OLD.status THEN
            IF OLD.status <> 'PENDING' OR NEW.status <> 'CANCELLED' THEN
                RAISE EXCEPTION 'Only pending orders can be cancelled by user';
            END IF;
        END IF;

        IF NEW.total_amount <> OLD.total_amount
           OR NEW.currency <> OLD.currency
           OR NEW.tracking_number IS DISTINCT FROM OLD.tracking_number THEN
            RAISE EXCEPTION 'Restricted order fields cannot be changed directly';
        END IF;
    ELSE
        IF NEW.status <> OLD.status THEN
            IF NOT (
                (OLD.status = 'PENDING' AND NEW.status IN ('CONFIRMED','CANCELLED')) OR
                (OLD.status = 'CONFIRMED' AND NEW.status IN ('PROCESSING','CANCELLED')) OR
                (OLD.status = 'PROCESSING' AND NEW.status IN ('SHIPPED','CANCELLED')) OR
                (OLD.status = 'SHIPPED' AND NEW.status IN ('DELIVERED'))
            ) THEN
                RAISE EXCEPTION 'Invalid order status transition';
            END IF;
        END IF;
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_order_updates ON public.orders;
CREATE TRIGGER trg_enforce_order_updates
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.enforce_order_updates();

CREATE OR REPLACE FUNCTION public.update_order_status(
    p_order_id UUID,
    p_new_status TEXT
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_is_service BOOLEAN := public.is_service_role();
    v_order public.orders%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    IF p_new_status NOT IN ('PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED') THEN
        RAISE EXCEPTION 'Invalid status';
    END IF;

    IF v_is_service THEN
        UPDATE public.orders
        SET status = p_new_status
        WHERE id = p_order_id
        RETURNING * INTO v_order;
    ELSE
        UPDATE public.orders
        SET status = p_new_status
        WHERE id = p_order_id
          AND user_id = v_uid
        RETURNING * INTO v_order;
    END IF;

    IF v_order.id IS NULL THEN
        RAISE EXCEPTION 'Order not found or not accessible';
    END IF;

    RETURN v_order;
END;
$$;

REVOKE ALL ON FUNCTION public.update_order_status(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_order_status(UUID, TEXT) TO authenticated;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders FORCE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items FORCE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT SELECT, INSERT ON public.order_items TO authenticated;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'orders_select_own'
    ) THEN
        CREATE POLICY orders_select_own
            ON public.orders
            FOR SELECT
            USING (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'orders_insert_own'
    ) THEN
        CREATE POLICY orders_insert_own
            ON public.orders
            FOR INSERT
            WITH CHECK (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'orders_update_own'
    ) THEN
        CREATE POLICY orders_update_own
            ON public.orders
            FOR UPDATE
            USING (user_id = auth.uid())
            WITH CHECK (user_id = auth.uid());
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'order_items' AND policyname = 'order_items_select_own'
    ) THEN
        CREATE POLICY order_items_select_own
            ON public.order_items
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1
                    FROM public.orders o
                    WHERE o.id = order_items.order_id
                      AND o.user_id = auth.uid()
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'order_items' AND policyname = 'order_items_insert_own'
    ) THEN
        CREATE POLICY order_items_insert_own
            ON public.order_items
            FOR INSERT
            WITH CHECK (
                EXISTS (
                    SELECT 1
                    FROM public.orders o
                    WHERE o.id = order_items.order_id
                      AND o.user_id = auth.uid()
                )
            );
    END IF;
END $$;
