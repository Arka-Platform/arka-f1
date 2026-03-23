CREATE TABLE IF NOT EXISTS public.user_trust_scores (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    trust_score NUMERIC(6,2) NOT NULL DEFAULT 0 CHECK (trust_score >= 0),
    events_considered BIGINT NOT NULL DEFAULT 0 CHECK (events_considered >= 0),
    completion_rate NUMERIC(6,2) NOT NULL DEFAULT 0 CHECK (completion_rate >= 0),
    reliability_score NUMERIC(6,2) NOT NULL DEFAULT 0 CHECK (reliability_score >= 0),
    responsiveness_score NUMERIC(6,2) NOT NULL DEFAULT 0 CHECK (responsiveness_score >= 0),
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    score_version INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_trust_scores_computed_at
    ON public.user_trust_scores(computed_at DESC);

CREATE OR REPLACE FUNCTION public.compute_user_trust_score(p_user_id UUID)
RETURNS public.user_trust_scores
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_events BIGINT := 0;
    v_completed BIGINT := 0;
    v_cancelled BIGINT := 0;
    v_response_events BIGINT := 0;
    v_completion_rate NUMERIC(6,2) := 0;
    v_reliability NUMERIC(6,2) := 0;
    v_responsiveness NUMERIC(6,2) := 0;
    v_trust_score NUMERIC(6,2) := 0;
    v_row public.user_trust_scores%ROWTYPE;
BEGIN
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'user_id is required';
    END IF;

    SELECT COUNT(*) INTO v_total_events
    FROM public.user_events
    WHERE user_id = p_user_id;

    SELECT COUNT(*) INTO v_completed
    FROM public.user_events
    WHERE user_id = p_user_id
      AND event_type IN ('EXCHANGE_COMPLETED','ORDER_DELIVERED','REQUEST_FULFILLED','DONATION_COMPLETED');

    SELECT COUNT(*) INTO v_cancelled
    FROM public.user_events
    WHERE user_id = p_user_id
      AND event_type IN ('EXCHANGE_CANCELLED','ORDER_CANCELLED','REQUEST_CANCELLED','DONATION_CANCELLED');

    SELECT COUNT(*) INTO v_response_events
    FROM public.user_events
    WHERE user_id = p_user_id
      AND event_type IN ('REQUEST_OPENED','REQUEST_RESPONDED');

    IF (v_completed + v_cancelled) > 0 THEN
        v_completion_rate := ROUND((v_completed::NUMERIC / (v_completed + v_cancelled)) * 100, 2);
    END IF;

    v_reliability := LEAST(100, GREATEST(0, v_completion_rate));
    v_responsiveness := LEAST(100, GREATEST(0, CASE WHEN v_response_events > 0 THEN 70 ELSE 40 END));

    v_trust_score := ROUND(
        (v_reliability * 0.65)
        + (v_responsiveness * 0.25)
        + (LEAST(100, LN(v_total_events + 1) * 18) * 0.10),
        2
    );

    INSERT INTO public.user_trust_scores (
        user_id,
        trust_score,
        events_considered,
        completion_rate,
        reliability_score,
        responsiveness_score,
        computed_at,
        updated_at
    )
    VALUES (
        p_user_id,
        v_trust_score,
        v_total_events,
        v_completion_rate,
        v_reliability,
        v_responsiveness,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE
    SET
        trust_score = EXCLUDED.trust_score,
        events_considered = EXCLUDED.events_considered,
        completion_rate = EXCLUDED.completion_rate,
        reliability_score = EXCLUDED.reliability_score,
        responsiveness_score = EXCLUDED.responsiveness_score,
        computed_at = NOW(),
        updated_at = NOW();

    SELECT * INTO v_row
    FROM public.user_trust_scores
    WHERE user_id = p_user_id;

    RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.compute_trust_scores_batch(
    p_since TIMESTAMPTZ DEFAULT NULL,
    p_limit INTEGER DEFAULT 500
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_count INTEGER := 0;
BEGIN
    FOR v_user_id IN
        SELECT DISTINCT ue.user_id
        FROM public.user_events ue
        WHERE p_since IS NULL OR ue.occurred_at >= p_since
        ORDER BY ue.user_id
        LIMIT GREATEST(COALESCE(p_limit, 500), 1)
    LOOP
        PERFORM public.compute_user_trust_score(v_user_id);
        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.compute_user_trust_score(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.compute_trust_scores_batch(TIMESTAMPTZ, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.compute_user_trust_score(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.compute_user_trust_score(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.compute_trust_scores_batch(TIMESTAMPTZ, INTEGER) TO service_role;

ALTER TABLE public.user_trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_trust_scores FORCE ROW LEVEL SECURITY;
GRANT SELECT ON public.user_trust_scores TO authenticated;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_trust_scores' AND policyname = 'user_trust_scores_select_own'
    ) THEN
        CREATE POLICY user_trust_scores_select_own
            ON public.user_trust_scores
            FOR SELECT
            USING (user_id = auth.uid());
    END IF;
END $$;
