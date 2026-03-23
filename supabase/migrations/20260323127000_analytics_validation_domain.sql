-- Analytics domain validation helpers (non-destructive).
-- Use this to verify pipeline consistency on real data.

CREATE OR REPLACE FUNCTION public.run_analytics_consistency_checks(
    p_raise_on_failure BOOLEAN DEFAULT false
)
RETURNS TABLE (
    check_name TEXT,
    ok BOOLEAN,
    details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_failed INT := 0;
    v_mismatch_count BIGINT := 0;
    v_trust_invalid BIGINT := 0;
    v_negative_daily BIGINT := 0;
    v_missing_users BIGINT := 0;
BEGIN
    -- Check 1: analytics_user_daily matches raw events by (day, user_id).
    SELECT COUNT(*)
    INTO v_mismatch_count
    FROM (
        SELECT
            DATE(ue.occurred_at) AS day,
            ue.user_id,
            COUNT(*) AS raw_total
        FROM public.user_events ue
        GROUP BY DATE(ue.occurred_at), ue.user_id
    ) raw
    FULL OUTER JOIN public.analytics_user_daily aud
      ON aud.day = raw.day
     AND aud.user_id = raw.user_id
    WHERE COALESCE(raw.raw_total, 0) <> COALESCE(aud.total_events, 0);

    IF v_mismatch_count > 0 THEN v_failed := v_failed + 1; END IF;
    RETURN QUERY SELECT
      'analytics_user_daily_matches_raw_events'::TEXT,
      (v_mismatch_count = 0),
      format('mismatched rows=%s', v_mismatch_count);

    -- Check 2: trust score events_considered must not exceed raw user events.
    SELECT COUNT(*)
    INTO v_trust_invalid
    FROM public.user_trust_scores uts
    LEFT JOIN (
        SELECT user_id, COUNT(*) AS total_events
        FROM public.user_events
        GROUP BY user_id
    ) raw ON raw.user_id = uts.user_id
    WHERE uts.events_considered > COALESCE(raw.total_events, 0);

    IF v_trust_invalid > 0 THEN v_failed := v_failed + 1; END IF;
    RETURN QUERY SELECT
      'trust_score_events_considered_not_greater_than_raw'::TEXT,
      (v_trust_invalid = 0),
      format('invalid rows=%s', v_trust_invalid);

    -- Check 3: no negative aggregates in analytics_user_daily.
    SELECT COUNT(*)
    INTO v_negative_daily
    FROM public.analytics_user_daily
    WHERE total_events < 0 OR completed_events < 0 OR cancelled_events < 0;

    IF v_negative_daily > 0 THEN v_failed := v_failed + 1; END IF;
    RETURN QUERY SELECT
      'analytics_user_daily_non_negative'::TEXT,
      (v_negative_daily = 0),
      format('negative rows=%s', v_negative_daily);

    -- Check 4: recommendation features should reference existing users.
    SELECT COUNT(*)
    INTO v_missing_users
    FROM public.recommendation_features rf
    LEFT JOIN auth.users au ON au.id = rf.user_id
    WHERE au.id IS NULL;

    IF v_missing_users > 0 THEN v_failed := v_failed + 1; END IF;
    RETURN QUERY SELECT
      'recommendation_features_user_fk_integrity'::TEXT,
      (v_missing_users = 0),
      format('orphan rows=%s', v_missing_users);

    IF p_raise_on_failure AND v_failed > 0 THEN
        RAISE EXCEPTION 'analytics consistency checks failed: % failed checks', v_failed;
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.run_analytics_consistency_checks(BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.run_analytics_consistency_checks(BOOLEAN) TO authenticated, service_role;
