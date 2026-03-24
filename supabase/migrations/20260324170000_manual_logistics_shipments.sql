CREATE TABLE IF NOT EXISTS public.shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    provider_name TEXT,
    preference TEXT NOT NULL CHECK (preference IN ('cheapest', 'fastest', 'balanced', 'manual')),
    tracking_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending_manual_dispatch' CHECK (
        status IN ('pending_manual_dispatch', 'dispatched', 'in_transit', 'delivered')
    ),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'shipments_provider_name_not_blank_chk'
    ) THEN
        ALTER TABLE public.shipments
            ADD CONSTRAINT shipments_provider_name_not_blank_chk
            CHECK (provider_name IS NULL OR LENGTH(TRIM(provider_name)) > 0);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'shipments_manual_preference_requires_provider_chk'
    ) THEN
        ALTER TABLE public.shipments
            ADD CONSTRAINT shipments_manual_preference_requires_provider_chk
            CHECK (preference <> 'manual' OR provider_name IS NOT NULL);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_shipments_order_created
    ON public.shipments(order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shipments_status_created
    ON public.shipments(status, created_at DESC);

CREATE OR REPLACE FUNCTION public.touch_shipments_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_shipments_updated_at ON public.shipments;
CREATE TRIGGER trg_touch_shipments_updated_at
BEFORE UPDATE ON public.shipments
FOR EACH ROW
EXECUTE FUNCTION public.touch_shipments_updated_at();

CREATE OR REPLACE FUNCTION public.enforce_shipment_status_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.status <> OLD.status THEN
        IF NOT (
            (OLD.status = 'pending_manual_dispatch' AND NEW.status IN ('dispatched')) OR
            (OLD.status = 'dispatched' AND NEW.status IN ('in_transit', 'delivered')) OR
            (OLD.status = 'in_transit' AND NEW.status IN ('delivered')) OR
            (OLD.status = NEW.status)
        ) THEN
            RAISE EXCEPTION 'Invalid shipment status transition from % to %', OLD.status, NEW.status;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_shipment_status_transition ON public.shipments;
CREATE TRIGGER trg_enforce_shipment_status_transition
BEFORE UPDATE ON public.shipments
FOR EACH ROW
EXECUTE FUNCTION public.enforce_shipment_status_transition();

CREATE OR REPLACE FUNCTION public.is_admin_user(p_uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.users u
        WHERE u.id = p_uid
          AND COALESCE(u.is_admin, false) = true
    );
$$;

REVOKE ALL ON FUNCTION public.is_admin_user(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_user(UUID) TO authenticated;

ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments FORCE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.shipments TO authenticated;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'shipments'
          AND policyname = 'shipments_select_owner_or_admin'
    ) THEN
        CREATE POLICY shipments_select_owner_or_admin
            ON public.shipments
            FOR SELECT
            USING (
                public.is_admin_user(auth.uid())
                OR EXISTS (
                    SELECT 1
                    FROM public.orders o
                    WHERE o.id = shipments.order_id
                      AND o.user_id = auth.uid()
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'shipments'
          AND policyname = 'shipments_insert_admin_only'
    ) THEN
        CREATE POLICY shipments_insert_admin_only
            ON public.shipments
            FOR INSERT
            WITH CHECK (public.is_admin_user(auth.uid()));
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'shipments'
          AND policyname = 'shipments_update_admin_only'
    ) THEN
        CREATE POLICY shipments_update_admin_only
            ON public.shipments
            FOR UPDATE
            USING (public.is_admin_user(auth.uid()))
            WITH CHECK (public.is_admin_user(auth.uid()));
    END IF;
END $$;
