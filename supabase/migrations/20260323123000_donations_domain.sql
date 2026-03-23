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
    ON public.ngos(LOWER(name));

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
BEFORE UPDATE ON public.donations
FOR EACH ROW
EXECUTE FUNCTION public.enforce_donation_updates();

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
        SELECT * INTO v_existing
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

REVOKE ALL ON FUNCTION public.create_donation(UUID, INTEGER, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_donation(UUID, INTEGER, TEXT, TEXT) TO authenticated;

ALTER TABLE public.ngos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ngos FORCE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations FORCE ROW LEVEL SECURITY;

GRANT SELECT ON public.ngos TO authenticated, anon;
GRANT SELECT, INSERT ON public.donations TO authenticated;

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
