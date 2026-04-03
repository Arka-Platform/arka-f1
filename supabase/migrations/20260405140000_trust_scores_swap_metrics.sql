-- Trust scores: swap-driven metrics + realtime recompute on swap lifecycle.
-- Extends public.user_trust_scores and public.compute_user_trust_score (trust_scores domain).

ALTER TABLE public.user_trust_scores
  ADD COLUMN IF NOT EXISTS books_shared_count BIGINT NOT NULL DEFAULT 0 CHECK (books_shared_count >= 0),
  ADD COLUMN IF NOT EXISTS avg_response_hours NUMERIC(12, 6),
  ADD COLUMN IF NOT EXISTS response_samples BIGINT NOT NULL DEFAULT 0 CHECK (response_samples >= 0),
  ADD COLUMN IF NOT EXISTS return_rate_percent NUMERIC(6, 2) NOT NULL DEFAULT 0 CHECK (return_rate_percent >= 0);

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
    v_completion_rate NUMERIC(6, 2) := 0;
    v_reliability NUMERIC(6, 2) := 0;
    v_responsiveness NUMERIC(6, 2) := 0;
    v_trust_score NUMERIC(6, 2) := 0;
    v_activity_component NUMERIC(6, 2) := 0;
    v_row public.user_trust_scores%ROWTYPE;

    v_sw_completed BIGINT := 0;
    v_sw_terminal_incomplete BIGINT := 0;
    v_avg_response_hours NUMERIC(12, 6);
    v_response_samples BIGINT := 0;
    v_return_rate NUMERIC(6, 2) := 0;
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
      AND event_type IN ('EXCHANGE_COMPLETED', 'ORDER_DELIVERED', 'REQUEST_FULFILLED', 'DONATION_COMPLETED');

    SELECT COUNT(*) INTO v_cancelled
    FROM public.user_events
    WHERE user_id = p_user_id
      AND event_type IN ('EXCHANGE_CANCELLED', 'ORDER_CANCELLED', 'REQUEST_CANCELLED', 'DONATION_CANCELLED');

    SELECT COUNT(*) INTO v_response_events
    FROM public.user_events
    WHERE user_id = p_user_id
      AND event_type IN ('REQUEST_OPENED', 'REQUEST_RESPONDED');

    IF (v_completed + v_cancelled) > 0 THEN
        v_completion_rate := ROUND((v_completed::NUMERIC / (v_completed + v_cancelled)) * 100, 2);
    END IF;

    SELECT COUNT(*) INTO v_sw_completed
    FROM public.swap_requests
    WHERE owner_id = p_user_id AND status = 'completed';

    SELECT COUNT(*) INTO v_sw_terminal_incomplete
    FROM public.swap_requests
    WHERE owner_id = p_user_id AND status IN ('rejected', 'cancelled');

    SELECT
        AVG(EXTRACT(EPOCH FROM (decided_at - created_at)) / 3600.0),
        COUNT(*)
    INTO v_avg_response_hours, v_response_samples
    FROM public.swap_requests
    WHERE owner_id = p_user_id AND decided_at IS NOT NULL;

    IF (v_sw_completed + v_sw_terminal_incomplete) > 0 THEN
        v_return_rate := ROUND(
            (v_sw_completed::NUMERIC / (v_sw_completed + v_sw_terminal_incomplete)) * 100,
            2
        );
    ELSE
        v_return_rate := v_completion_rate;
    END IF;

    IF (v_sw_completed + v_sw_terminal_incomplete) > 0 THEN
        v_reliability := LEAST(100, GREATEST(0, v_return_rate));
    ELSE
        v_reliability := LEAST(100, GREATEST(0, v_completion_rate));
    END IF;

    IF v_response_samples > 0 AND v_avg_response_hours IS NOT NULL THEN
        v_responsiveness := CASE
            WHEN v_avg_response_hours <= 1 THEN 100::NUMERIC
            WHEN v_avg_response_hours <= 6 THEN 85::NUMERIC
            WHEN v_avg_response_hours <= 24 THEN 70::NUMERIC
            WHEN v_avg_response_hours <= 48 THEN 55::NUMERIC
            ELSE 40::NUMERIC
        END;
    ELSE
        v_responsiveness := LEAST(
            100,
            GREATEST(0, CASE WHEN v_response_events > 0 THEN 70::NUMERIC ELSE 40::NUMERIC END)
        );
    END IF;

    v_activity_component := LEAST(
        100,
        (LN(GREATEST(v_total_events, 0) + 1) * 12)
        + (LN(GREATEST(v_sw_completed, 0) + 1) * 18)
    );

    v_trust_score := ROUND(
        (v_reliability * 0.65)
        + (v_responsiveness * 0.25)
        + (v_activity_component * 0.10),
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
        updated_at,
        books_shared_count,
        avg_response_hours,
        response_samples,
        return_rate_percent
    )
    VALUES (
        p_user_id,
        v_trust_score,
        v_total_events,
        v_completion_rate,
        v_reliability,
        v_responsiveness,
        NOW(),
        NOW(),
        v_sw_completed,
        v_avg_response_hours,
        v_response_samples,
        v_return_rate
    )
    ON CONFLICT (user_id) DO UPDATE
    SET
        trust_score = EXCLUDED.trust_score,
        events_considered = EXCLUDED.events_considered,
        completion_rate = EXCLUDED.completion_rate,
        reliability_score = EXCLUDED.reliability_score,
        responsiveness_score = EXCLUDED.responsiveness_score,
        computed_at = NOW(),
        updated_at = NOW(),
        books_shared_count = EXCLUDED.books_shared_count,
        avg_response_hours = EXCLUDED.avg_response_hours,
        response_samples = EXCLUDED.response_samples,
        return_rate_percent = EXCLUDED.return_rate_percent;

    SELECT * INTO v_row
    FROM public.user_trust_scores
    WHERE user_id = p_user_id;

    RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.recompute_trust_on_swap_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.owner_id IS NOT NULL THEN
        PERFORM public.compute_user_trust_score(NEW.owner_id);
    END IF;
    IF NEW.requester_id IS NOT NULL THEN
        PERFORM public.compute_user_trust_score(NEW.requester_id);
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_swap_recompute_trust ON public.swap_requests;
CREATE TRIGGER trg_swap_recompute_trust
    AFTER UPDATE OF status ON public.swap_requests
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION public.recompute_trust_on_swap_request();

REVOKE ALL ON FUNCTION public.recompute_trust_on_swap_request() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.recompute_trust_on_swap_request() TO service_role;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'user_trust_scores'
          AND policyname = 'user_trust_scores_select_authenticated'
    ) THEN
        CREATE POLICY user_trust_scores_select_authenticated
            ON public.user_trust_scores
            FOR SELECT
            TO authenticated
            USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'user_trust_scores'
          AND policyname = 'user_trust_scores_select_anon'
    ) THEN
        CREATE POLICY user_trust_scores_select_anon
            ON public.user_trust_scores
            FOR SELECT
            TO anon
            USING (true);
    END IF;
END $$;

GRANT SELECT ON public.user_trust_scores TO anon;

-- For live UI updates via Supabase Realtime, enable replication for public.user_trust_scores
-- (Dashboard: Database → Publications, or ALTER PUBLICATION supabase_realtime ADD TABLE ...).
