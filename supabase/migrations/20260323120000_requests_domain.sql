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

CREATE OR REPLACE VIEW public.v_open_book_requests AS
SELECT *
FROM public.book_requests
WHERE status IN ('OPEN','MATCH_PENDING','MATCHED');

CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(auth.jwt()->>'role', '') = 'service_role';
$$;

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
BEFORE UPDATE ON public.book_requests
FOR EACH ROW
EXECUTE FUNCTION public.enforce_book_request_updates();

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
        SELECT * INTO v_existing
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

    SELECT * INTO v_row
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

REVOKE ALL ON FUNCTION public.create_request(UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_request(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_request(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_request(UUID) TO authenticated;

ALTER TABLE public.book_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_requests FORCE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.book_requests TO authenticated;
GRANT SELECT ON public.v_open_book_requests TO authenticated;

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
