CREATE TABLE IF NOT EXISTS public.user_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source TEXT,
    session_id TEXT,
    correlation_id TEXT,
    idempotency_key TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'user_events_event_type_not_blank_chk'
    ) THEN
        ALTER TABLE public.user_events
            ADD CONSTRAINT user_events_event_type_not_blank_chk
            CHECK (LENGTH(TRIM(event_type)) > 0);
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_events_idempotency
    ON public.user_events(user_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_events_user_time
    ON public.user_events(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_events_type_time
    ON public.user_events(event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_events_occurred_at
    ON public.user_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_events_metadata_gin
    ON public.user_events USING GIN (metadata);

CREATE OR REPLACE FUNCTION public.enforce_append_only_user_events()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'user_events is append-only';
END;
$$;

DROP TRIGGER IF EXISTS trg_user_events_no_update_delete ON public.user_events;
CREATE TRIGGER trg_user_events_no_update_delete
BEFORE UPDATE OR DELETE
ON public.user_events
FOR EACH ROW
EXECUTE FUNCTION public.enforce_append_only_user_events();

CREATE OR REPLACE FUNCTION public.record_user_event(
    p_event_type TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_occurred_at TIMESTAMPTZ DEFAULT NOW(),
    p_source TEXT DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL,
    p_correlation_id TEXT DEFAULT NULL,
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS public.user_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_existing public.user_events%ROWTYPE;
    v_row public.user_events%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    IF p_event_type IS NULL OR LENGTH(TRIM(p_event_type)) = 0 THEN
        RAISE EXCEPTION 'event_type is required';
    END IF;

    IF p_idempotency_key IS NOT NULL THEN
        SELECT *
        INTO v_existing
        FROM public.user_events
        WHERE user_id = v_uid
          AND idempotency_key = p_idempotency_key
        LIMIT 1;

        IF v_existing.id IS NOT NULL THEN
            RETURN v_existing;
        END IF;
    END IF;

    INSERT INTO public.user_events (
        user_id, event_type, occurred_at, source, session_id, correlation_id, idempotency_key, metadata
    )
    VALUES (
        v_uid, p_event_type, COALESCE(p_occurred_at, NOW()), p_source, p_session_id, p_correlation_id, p_idempotency_key, COALESCE(p_metadata, '{}'::jsonb)
    )
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.record_user_event(TEXT, JSONB, TIMESTAMPTZ, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_user_event(TEXT, JSONB, TIMESTAMPTZ, TEXT, TEXT, TEXT, TEXT) TO authenticated;

ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_events FORCE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.user_events TO authenticated;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_events' AND policyname = 'user_events_select_own'
    ) THEN
        CREATE POLICY user_events_select_own
            ON public.user_events
            FOR SELECT
            USING (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_events' AND policyname = 'user_events_insert_own'
    ) THEN
        CREATE POLICY user_events_insert_own
            ON public.user_events
            FOR INSERT
            WITH CHECK (user_id = auth.uid());
    END IF;
END $$;
