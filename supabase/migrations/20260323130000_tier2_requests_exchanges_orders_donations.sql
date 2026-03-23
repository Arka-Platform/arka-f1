-- Tier 2: transactional domain primitives
-- - Book requests (get flow)
-- - Exchanges + credits wallet
-- - Orders + order items + controlled status transitions
-- - NGOs + donations lifecycle
--
-- Design goals:
-- 1) idempotent migrations and RPC operations
-- 2) append-only financial ledger
-- 3) race-safe balance updates
-- 4) strict RLS and ownership boundaries

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(auth.jwt()->>'role', '') = 'service_role';
$$;

-- Re-harden profile field protection to allow only internal balance updates.
CREATE OR REPLACE FUNCTION public.protect_user_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_service BOOLEAN := public.is_service_role();
    v_uid UUID := auth.uid();
    v_allow_internal_balance_update BOOLEAN := COALESCE(current_setting('app.allow_balance_update', true), '') = 'on';
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF v_uid IS NOT NULL AND NEW.id <> v_uid THEN
            RAISE EXCEPTION 'Cannot create profile for another user';
        END IF;

        IF v_uid IS NOT NULL AND NOT v_is_service THEN
            NEW.is_admin := false;
            NEW.credit_balance := COALESCE(NEW.credit_balance, 0);
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.id <> OLD.id THEN
            RAISE EXCEPTION 'Profile id is immutable';
        END IF;

        IF v_uid IS NOT NULL AND NOT v_is_service THEN
            NEW.is_admin := OLD.is_admin;
            NEW.email := OLD.email;
            IF NOT v_allow_internal_balance_update THEN
                NEW.credit_balance := OLD.credit_balance;
            END IF;
        END IF;
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Credit ledger (append-only) and exchanges
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exchange_id UUID,
    order_id UUID,
    reference_type TEXT NOT NULL CHECK (reference_type IN ('EXCHANGE','ORDER','ADJUSTMENT','DONATION','REFUND')),
    direction TEXT NOT NULL CHECK (direction IN ('CREDIT','DEBIT')),
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.credit_transactions
    ADD COLUMN IF NOT EXISTS exchange_id UUID,
    ADD COLUMN IF NOT EXISTS order_id UUID,
    ADD COLUMN IF NOT EXISTS reference_type TEXT,
    ADD COLUMN IF NOT EXISTS direction TEXT,
    ADD COLUMN IF NOT EXISTS amount NUMERIC(12,2),
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS metadata JSONB,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'credit_transactions_reference_type_chk'
    ) THEN
        ALTER TABLE public.credit_transactions
            ADD CONSTRAINT credit_transactions_reference_type_chk
            CHECK (reference_type IN ('EXCHANGE','ORDER','ADJUSTMENT','DONATION','REFUND'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'credit_transactions_direction_chk'
    ) THEN
        ALTER TABLE public.credit_transactions
            ADD CONSTRAINT credit_transactions_direction_chk
            CHECK (direction IN ('CREDIT','DEBIT'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'credit_transactions_amount_chk'
    ) THEN
        ALTER TABLE public.credit_transactions
            ADD CONSTRAINT credit_transactions_amount_chk
            CHECK (amount > 0);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_created
    ON public.credit_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_exchange
    ON public.credit_transactions(exchange_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_order
    ON public.credit_transactions(order_id);

CREATE TABLE IF NOT EXISTS public.exchanges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
    request_id UUID,
    gross_amount NUMERIC(12,2) NOT NULL CHECK (gross_amount > 0),
    platform_fee NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (platform_fee >= 0),
    net_amount NUMERIC(12,2) GENERATED ALWAYS AS (gross_amount - platform_fee) STORED,
    status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('PENDING','COMPLETED','FAILED','CANCELLED')),
    idempotency_key TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

ALTER TABLE public.exchanges
    ADD COLUMN IF NOT EXISTS request_id UUID,
    ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
    ADD COLUMN IF NOT EXISTS metadata JSONB,
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

ALTER TABLE public.exchanges
    ALTER COLUMN buyer_id SET NOT NULL,
    ALTER COLUMN seller_id SET NOT NULL,
    ALTER COLUMN gross_amount SET NOT NULL,
    ALTER COLUMN platform_fee SET NOT NULL,
    ALTER COLUMN status SET NOT NULL,
    ALTER COLUMN idempotency_key SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'exchanges_status_chk'
    ) THEN
        ALTER TABLE public.exchanges
            ADD CONSTRAINT exchanges_status_chk
            CHECK (status IN ('PENDING','COMPLETED','FAILED','CANCELLED'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'exchanges_buyer_seller_distinct_chk'
    ) THEN
        ALTER TABLE public.exchanges
            ADD CONSTRAINT exchanges_buyer_seller_distinct_chk
            CHECK (buyer_id <> seller_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'exchanges_idempotency_key_not_blank_chk'
    ) THEN
        ALTER TABLE public.exchanges
            ADD CONSTRAINT exchanges_idempotency_key_not_blank_chk
            CHECK (LENGTH(TRIM(idempotency_key)) > 0);
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_exchanges_buyer_idempotency
    ON public.exchanges (buyer_id, idempotency_key);
CREATE INDEX IF NOT EXISTS idx_exchanges_seller_created
    ON public.exchanges(seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exchanges_buyer_created
    ON public.exchanges(buyer_id, created_at DESC);

-- Make balance updates impossible outside controlled RPC by default.
CREATE OR REPLACE FUNCTION public.guard_credit_balance_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.credit_balance IS DISTINCT FROM OLD.credit_balance
       AND COALESCE(current_setting('app.allow_balance_update', true), '') <> 'on' THEN
        RAISE EXCEPTION 'Direct credit_balance update is not allowed';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_credit_balance_update ON public.users;
CREATE TRIGGER trg_guard_credit_balance_update
BEFORE UPDATE OF credit_balance
ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.guard_credit_balance_update();

-- credit_transactions is append-only.
CREATE OR REPLACE FUNCTION public.enforce_append_only_credit_transactions()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'credit_transactions is append-only';
END;
$$;

DROP TRIGGER IF EXISTS trg_credit_transactions_no_update_delete ON public.credit_transactions;
CREATE TRIGGER trg_credit_transactions_no_update_delete
BEFORE UPDATE OR DELETE
ON public.credit_transactions
FOR EACH ROW
EXECUTE FUNCTION public.enforce_append_only_credit_transactions();

-- ---------------------------------------------------------------------------
-- Book requests (get flow)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.book_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','MATCH_PENDING','MATCHED','CANCELLED','EXPIRED','FULFILLED')),
    notes TEXT,
    matching_metadata JSONB,
    idempotency_key TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ
);

ALTER TABLE public.book_requests
    ADD COLUMN IF NOT EXISTS matching_metadata JSONB,
    ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'book_requests_idempotency_key_not_blank_chk'
    ) THEN
        ALTER TABLE public.book_requests
            ADD CONSTRAINT book_requests_idempotency_key_not_blank_chk
            CHECK (idempotency_key IS NULL OR LENGTH(TRIM(idempotency_key)) > 0);
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_book_requests_user_book_active
    ON public.book_requests(user_id, book_id)
    WHERE status IN ('OPEN','MATCH_PENDING','MATCHED');

CREATE UNIQUE INDEX IF NOT EXISTS uq_book_requests_user_idempotency
    ON public.book_requests(user_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_book_requests_user_status_created
    ON public.book_requests(user_id, status, created_at DESC);

-- ---------------------------------------------------------------------------
-- Orders + items + transitions
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- NGOs + donations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ngos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    verified BOOLEAN NOT NULL DEFAULT false,
    contact_email TEXT,
    contact_phone TEXT,
    website TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ngos_name
    ON public.ngos (LOWER(name));

CREATE TABLE IF NOT EXISTS public.donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    ngo_id UUID NOT NULL REFERENCES public.ngos(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'CREATED' CHECK (status IN ('CREATED','PROCESSED','COMPLETED','CANCELLED')),
    item_count INTEGER NOT NULL DEFAULT 1 CHECK (item_count > 0),
    notes TEXT,
    idempotency_key TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

ALTER TABLE public.donations
    ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
    ADD COLUMN IF NOT EXISTS metadata JSONB,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'donations_idempotency_key_not_blank_chk'
    ) THEN
        ALTER TABLE public.donations
            ADD CONSTRAINT donations_idempotency_key_not_blank_chk
            CHECK (idempotency_key IS NULL OR LENGTH(TRIM(idempotency_key)) > 0);
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_donations_user_idempotency
    ON public.donations(user_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_donations_user_created
    ON public.donations(user_id, created_at DESC);

-- Add FKs after all referenced tables exist.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'credit_transactions_exchange_fkey'
    ) THEN
        ALTER TABLE public.credit_transactions
            ADD CONSTRAINT credit_transactions_exchange_fkey
            FOREIGN KEY (exchange_id) REFERENCES public.exchanges(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'credit_transactions_order_fkey'
    ) THEN
        ALTER TABLE public.credit_transactions
            ADD CONSTRAINT credit_transactions_order_fkey
            FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'exchanges_request_fkey'
    ) THEN
        ALTER TABLE public.exchanges
            ADD CONSTRAINT exchanges_request_fkey
            FOREIGN KEY (request_id) REFERENCES public.book_requests(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE OR REPLACE VIEW public.v_open_book_requests AS
SELECT *
FROM public.book_requests
WHERE status IN ('OPEN','MATCH_PENDING','MATCHED');

-- ---------------------------------------------------------------------------
-- Transition guards
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_book_request_updates()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_is_service BOOLEAN := public.is_service_role();
BEGIN
    IF NEW.user_id <> OLD.user_id OR NEW.book_id <> OLD.book_id THEN
        RAISE EXCEPTION 'Immutable columns changed';
    END IF;

    IF NOT v_is_service THEN
        IF NEW.status <> OLD.status THEN
            IF OLD.status <> 'OPEN' OR NEW.status <> 'CANCELLED' THEN
                RAISE EXCEPTION 'Invalid request status transition';
            END IF;
            NEW.cancelled_at := NOW();
        END IF;
    ELSE
        IF NEW.status <> OLD.status THEN
            IF NOT (
                (OLD.status = 'OPEN' AND NEW.status IN ('MATCH_PENDING','MATCHED','CANCELLED','EXPIRED')) OR
                (OLD.status = 'MATCH_PENDING' AND NEW.status IN ('MATCHED','CANCELLED','EXPIRED')) OR
                (OLD.status = 'MATCHED' AND NEW.status IN ('FULFILLED','CANCELLED'))
            ) THEN
                RAISE EXCEPTION 'Invalid request status transition';
            END IF;
            IF NEW.status = 'CANCELLED' THEN
                NEW.cancelled_at := NOW();
            END IF;
        END IF;
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_book_request_updates ON public.book_requests;
CREATE TRIGGER trg_enforce_book_request_updates
BEFORE UPDATE
ON public.book_requests
FOR EACH ROW
EXECUTE FUNCTION public.enforce_book_request_updates();

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
BEFORE UPDATE
ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.enforce_order_updates();

CREATE OR REPLACE FUNCTION public.enforce_donation_updates()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_is_service BOOLEAN := public.is_service_role();
BEGIN
    IF NEW.user_id <> OLD.user_id OR NEW.ngo_id <> OLD.ngo_id THEN
        RAISE EXCEPTION 'Donation owner and ngo are immutable';
    END IF;

    IF NOT v_is_service AND NEW.status <> OLD.status THEN
        RAISE EXCEPTION 'Only service role can transition donation status';
    END IF;

    IF v_is_service AND NEW.status <> OLD.status THEN
        IF NOT (
            (OLD.status = 'CREATED' AND NEW.status IN ('PROCESSED','CANCELLED')) OR
            (OLD.status = 'PROCESSED' AND NEW.status IN ('COMPLETED','CANCELLED'))
        ) THEN
            RAISE EXCEPTION 'Invalid donation status transition';
        END IF;
        IF NEW.status = 'COMPLETED' THEN
            NEW.completed_at := NOW();
        END IF;
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_donation_updates ON public.donations;
CREATE TRIGGER trg_enforce_donation_updates
BEFORE UPDATE
ON public.donations
FOR EACH ROW
EXECUTE FUNCTION public.enforce_donation_updates();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchanges FORCE ROW LEVEL SECURITY;
ALTER TABLE public.book_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_requests FORCE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders FORCE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items FORCE ROW LEVEL SECURITY;
ALTER TABLE public.ngos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ngos FORCE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations FORCE ROW LEVEL SECURITY;

-- Base grants (RLS still applies).
GRANT SELECT ON public.credit_transactions TO authenticated;
GRANT SELECT ON public.exchanges TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.book_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT SELECT ON public.ngos TO authenticated, anon;
GRANT SELECT, INSERT ON public.donations TO authenticated;
GRANT SELECT ON public.v_open_book_requests TO authenticated;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'credit_transactions' AND policyname = 'credit_transactions_select_own'
    ) THEN
        CREATE POLICY credit_transactions_select_own
            ON public.credit_transactions
            FOR SELECT
            USING (user_id = auth.uid());
    END IF;
END $$;

-- Internal-only policy used by controlled RPC while app.allow_balance_update=on.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'users_balance_update_internal'
    ) THEN
        CREATE POLICY users_balance_update_internal
            ON public.users
            FOR UPDATE
            USING (
                auth.uid() IS NOT NULL
                AND COALESCE(current_setting('app.allow_balance_update', true), '') = 'on'
            )
            WITH CHECK (
                COALESCE(current_setting('app.allow_balance_update', true), '') = 'on'
            );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'exchanges' AND policyname = 'exchanges_select_participant'
    ) THEN
        CREATE POLICY exchanges_select_participant
            ON public.exchanges
            FOR SELECT
            USING (buyer_id = auth.uid() OR seller_id = auth.uid());
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'book_requests' AND policyname = 'book_requests_select_own'
    ) THEN
        CREATE POLICY book_requests_select_own
            ON public.book_requests
            FOR SELECT
            USING (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'book_requests' AND policyname = 'book_requests_insert_own'
    ) THEN
        CREATE POLICY book_requests_insert_own
            ON public.book_requests
            FOR INSERT
            WITH CHECK (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'book_requests' AND policyname = 'book_requests_update_own'
    ) THEN
        CREATE POLICY book_requests_update_own
            ON public.book_requests
            FOR UPDATE
            USING (user_id = auth.uid())
            WITH CHECK (user_id = auth.uid());
    END IF;
END $$;

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

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ngos' AND policyname = 'ngos_select_all'
    ) THEN
        CREATE POLICY ngos_select_all
            ON public.ngos
            FOR SELECT
            USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'donations' AND policyname = 'donations_select_own'
    ) THEN
        CREATE POLICY donations_select_own
            ON public.donations
            FOR SELECT
            USING (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'donations' AND policyname = 'donations_insert_own'
    ) THEN
        CREATE POLICY donations_insert_own
            ON public.donations
            FOR INSERT
            WITH CHECK (user_id = auth.uid());
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- RPC functions
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_request(
    p_book_id UUID,
    p_notes TEXT DEFAULT NULL,
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS public.book_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_existing public.book_requests%ROWTYPE;
    v_row public.book_requests%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    IF p_book_id IS NULL THEN
        RAISE EXCEPTION 'book_id is required';
    END IF;

    IF p_idempotency_key IS NOT NULL THEN
        SELECT *
        INTO v_existing
        FROM public.book_requests
        WHERE user_id = v_uid
          AND idempotency_key = p_idempotency_key
        LIMIT 1;

        IF v_existing.id IS NOT NULL THEN
            IF v_existing.book_id <> p_book_id
               OR COALESCE(v_existing.notes, '') <> COALESCE(p_notes, '') THEN
                RAISE EXCEPTION 'Idempotency key reused with different payload';
            END IF;
            RETURN v_existing;
        END IF;
    END IF;

    INSERT INTO public.book_requests (user_id, book_id, notes, idempotency_key)
    VALUES (v_uid, p_book_id, p_notes, p_idempotency_key)
    ON CONFLICT DO NOTHING;

    SELECT *
    INTO v_row
    FROM public.book_requests
    WHERE user_id = v_uid
      AND (
            (p_idempotency_key IS NOT NULL AND idempotency_key = p_idempotency_key)
            OR (book_id = p_book_id AND status IN ('OPEN','MATCH_PENDING','MATCHED'))
      )
    ORDER BY created_at DESC
    LIMIT 1;

    RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_request(
    p_request_id UUID
)
RETURNS public.book_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_row public.book_requests%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    UPDATE public.book_requests
    SET status = 'CANCELLED'
    WHERE id = p_request_id
      AND user_id = v_uid
      AND status = 'OPEN'
    RETURNING * INTO v_row;

    IF v_row.id IS NULL THEN
        SELECT * INTO v_row
        FROM public.book_requests
        WHERE id = p_request_id
          AND user_id = v_uid
        LIMIT 1;
    END IF;

    RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.perform_exchange(
    p_seller_id UUID,
    p_book_id UUID DEFAULT NULL,
    p_request_id UUID DEFAULT NULL,
    p_gross_amount NUMERIC(12,2) DEFAULT NULL,
    p_platform_fee NUMERIC(12,2) DEFAULT 0,
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS public.exchanges
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_buyer_id UUID := auth.uid();
    v_existing public.exchanges%ROWTYPE;
    v_exchange public.exchanges%ROWTYPE;
    v_total_debit NUMERIC(12,2);
    v_buyer_balance NUMERIC(12,2);
    v_lock_first UUID;
    v_lock_second UUID;
    v_locked_count INT;
BEGIN
    IF v_buyer_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    IF p_seller_id IS NULL OR p_seller_id = v_buyer_id THEN
        RAISE EXCEPTION 'Invalid seller';
    END IF;
    IF p_idempotency_key IS NULL OR LENGTH(TRIM(p_idempotency_key)) = 0 THEN
        RAISE EXCEPTION 'idempotency_key is required';
    END IF;
    IF p_gross_amount IS NULL OR p_gross_amount <= 0 THEN
        RAISE EXCEPTION 'gross_amount must be > 0';
    END IF;
    IF p_platform_fee < 0 OR p_platform_fee > p_gross_amount THEN
        RAISE EXCEPTION 'Invalid platform_fee';
    END IF;

    SELECT *
    INTO v_existing
    FROM public.exchanges
    WHERE buyer_id = v_buyer_id
      AND idempotency_key = p_idempotency_key
    LIMIT 1;

    IF v_existing.id IS NOT NULL THEN
        IF v_existing.seller_id <> p_seller_id
           OR COALESCE(v_existing.book_id, '00000000-0000-0000-0000-000000000000'::UUID) <> COALESCE(p_book_id, '00000000-0000-0000-0000-000000000000'::UUID)
           OR COALESCE(v_existing.request_id, '00000000-0000-0000-0000-000000000000'::UUID) <> COALESCE(p_request_id, '00000000-0000-0000-0000-000000000000'::UUID)
           OR v_existing.gross_amount <> p_gross_amount
           OR v_existing.platform_fee <> p_platform_fee THEN
            RAISE EXCEPTION 'Idempotency key reused with different payload';
        END IF;
        RETURN v_existing;
    END IF;

    v_total_debit := p_gross_amount;
    v_lock_first := LEAST(v_buyer_id, p_seller_id);
    v_lock_second := GREATEST(v_buyer_id, p_seller_id);

    -- Lock participants in deterministic order to avoid deadlocks.
    PERFORM 1 FROM public.users WHERE id = v_lock_first FOR UPDATE;
    PERFORM 1 FROM public.users WHERE id = v_lock_second FOR UPDATE;
    SELECT COUNT(*)
    INTO v_locked_count
    FROM public.users
    WHERE id IN (v_buyer_id, p_seller_id);

    IF v_locked_count <> 2 THEN
        RAISE EXCEPTION 'Buyer/seller profile missing';
    END IF;

    SELECT credit_balance
    INTO v_buyer_balance
    FROM public.users
    WHERE id = v_buyer_id
    FOR UPDATE;

    IF v_buyer_balance IS NULL THEN
        RAISE EXCEPTION 'Buyer profile not found';
    END IF;
    IF v_buyer_balance < v_total_debit THEN
        RAISE EXCEPTION 'Insufficient credits';
    END IF;

    INSERT INTO public.exchanges (
        buyer_id,
        seller_id,
        book_id,
        request_id,
        gross_amount,
        platform_fee,
        status,
        idempotency_key,
        completed_at
    )
    VALUES (
        v_buyer_id,
        p_seller_id,
        p_book_id,
        p_request_id,
        p_gross_amount,
        p_platform_fee,
        'COMPLETED',
        p_idempotency_key,
        NOW()
    )
    RETURNING * INTO v_exchange;

    INSERT INTO public.credit_transactions (
        user_id, exchange_id, reference_type, direction, amount, description
    ) VALUES
        (v_buyer_id, v_exchange.id, 'EXCHANGE', 'DEBIT', p_gross_amount, 'Exchange debit'),
        (p_seller_id, v_exchange.id, 'EXCHANGE', 'CREDIT', (p_gross_amount - p_platform_fee), 'Exchange credit');

    PERFORM set_config('app.allow_balance_update', 'on', true);

    UPDATE public.users
    SET credit_balance = credit_balance - p_gross_amount
    WHERE id = v_buyer_id;

    UPDATE public.users
    SET credit_balance = credit_balance + (p_gross_amount - p_platform_fee)
    WHERE id = p_seller_id;

    IF p_request_id IS NOT NULL THEN
        UPDATE public.book_requests
        SET status = 'FULFILLED'
        WHERE id = p_request_id
          AND status IN ('OPEN','MATCH_PENDING','MATCHED');
    END IF;

    RETURN v_exchange;
END;
$$;

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

CREATE OR REPLACE FUNCTION public.create_donation(
    p_ngo_id UUID,
    p_item_count INTEGER DEFAULT 1,
    p_notes TEXT DEFAULT NULL,
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS public.donations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_existing public.donations%ROWTYPE;
    v_row public.donations%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    IF p_ngo_id IS NULL THEN
        RAISE EXCEPTION 'ngo_id is required';
    END IF;
    IF p_item_count IS NULL OR p_item_count <= 0 THEN
        RAISE EXCEPTION 'item_count must be > 0';
    END IF;

    IF p_idempotency_key IS NOT NULL THEN
        SELECT *
        INTO v_existing
        FROM public.donations
        WHERE user_id = v_uid
          AND idempotency_key = p_idempotency_key
        LIMIT 1;

        IF v_existing.id IS NOT NULL THEN
            IF v_existing.ngo_id <> p_ngo_id
               OR v_existing.item_count <> p_item_count
               OR COALESCE(v_existing.notes, '') <> COALESCE(p_notes, '') THEN
                RAISE EXCEPTION 'Idempotency key reused with different payload';
            END IF;
            RETURN v_existing;
        END IF;
    END IF;

    INSERT INTO public.donations (user_id, ngo_id, item_count, notes, idempotency_key)
    VALUES (v_uid, p_ngo_id, p_item_count, p_notes, p_idempotency_key)
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.create_request(UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_request(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.perform_exchange(UUID, UUID, UUID, NUMERIC, NUMERIC, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_order_status(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_donation(UUID, INTEGER, TEXT, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_request(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.perform_exchange(UUID, UUID, UUID, NUMERIC, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_order_status(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_donation(UUID, INTEGER, TEXT, TEXT) TO authenticated;
