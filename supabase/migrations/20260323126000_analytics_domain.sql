CREATE TABLE IF NOT EXISTS public.analytics_job_watermarks (
    job_name TEXT PRIMARY KEY,
    last_event_at TIMESTAMPTZ NOT NULL DEFAULT '1970-01-01 00:00:00+00'::timestamptz,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.analytics_user_daily (
    day DATE NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_events BIGINT NOT NULL DEFAULT 0,
    completed_events BIGINT NOT NULL DEFAULT 0,
    cancelled_events BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (day, user_id)
);

CREATE TABLE IF NOT EXISTS public.analytics_book_daily (
    day DATE NOT NULL,
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    total_events BIGINT NOT NULL DEFAULT 0,
    wishlist_adds BIGINT NOT NULL DEFAULT 0,
    bookshelf_adds BIGINT NOT NULL DEFAULT 0,
    request_opens BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (day, book_id)
);

CREATE TABLE IF NOT EXISTS public.recommendation_features (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    affinity_genre JSONB NOT NULL DEFAULT '{}'::jsonb,
    affinity_category JSONB NOT NULL DEFAULT '{}'::jsonb,
    total_events BIGINT NOT NULL DEFAULT 0,
    last_event_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_user_daily_user_day
    ON public.analytics_user_daily(user_id, day DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_book_daily_book_day
    ON public.analytics_book_daily(book_id, day DESC);

CREATE OR REPLACE VIEW public.v_analytics_user_summary AS
SELECT
    aud.user_id,
    SUM(aud.total_events) AS total_events,
    SUM(aud.completed_events) AS completed_events,
    SUM(aud.cancelled_events) AS cancelled_events,
    MAX(aud.day) AS last_active_day
FROM public.analytics_user_daily aud
GROUP BY aud.user_id;

CREATE OR REPLACE FUNCTION public.refresh_analytics_from_events(
    p_job_name TEXT DEFAULT 'default',
    p_to TIMESTAMPTZ DEFAULT NOW()
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_from TIMESTAMPTZ;
    v_to TIMESTAMPTZ := COALESCE(p_to, NOW());
    v_processed INTEGER := 0;
BEGIN
    IF p_job_name IS NULL OR LENGTH(TRIM(p_job_name)) = 0 THEN
        RAISE EXCEPTION 'job_name is required';
    END IF;

    INSERT INTO public.analytics_job_watermarks (job_name)
    VALUES (p_job_name)
    ON CONFLICT (job_name) DO NOTHING;

    SELECT last_event_at INTO v_from
    FROM public.analytics_job_watermarks
    WHERE job_name = p_job_name
    FOR UPDATE;

    WITH src AS (
        SELECT *
        FROM public.user_events
        WHERE occurred_at > v_from
          AND occurred_at <= v_to
    ),
    user_daily AS (
        SELECT
            DATE(occurred_at) AS day,
            user_id,
            COUNT(*) AS total_events,
            COUNT(*) FILTER (
                WHERE event_type IN ('EXCHANGE_COMPLETED','ORDER_DELIVERED','REQUEST_FULFILLED','DONATION_COMPLETED')
            ) AS completed_events,
            COUNT(*) FILTER (
                WHERE event_type IN ('EXCHANGE_CANCELLED','ORDER_CANCELLED','REQUEST_CANCELLED','DONATION_CANCELLED')
            ) AS cancelled_events
        FROM src
        GROUP BY DATE(occurred_at), user_id
    )
    INSERT INTO public.analytics_user_daily (
        day, user_id, total_events, completed_events, cancelled_events, updated_at
    )
    SELECT
        ud.day, ud.user_id, ud.total_events, ud.completed_events, ud.cancelled_events, NOW()
    FROM user_daily ud
    ON CONFLICT (day, user_id) DO UPDATE
    SET
        total_events = public.analytics_user_daily.total_events + EXCLUDED.total_events,
        completed_events = public.analytics_user_daily.completed_events + EXCLUDED.completed_events,
        cancelled_events = public.analytics_user_daily.cancelled_events + EXCLUDED.cancelled_events,
        updated_at = NOW();

    WITH src AS (
        SELECT *
        FROM public.user_events
        WHERE occurred_at > v_from
          AND occurred_at <= v_to
    ),
    book_daily AS (
        SELECT
            DATE(src.occurred_at) AS day,
            NULLIF(src.metadata->>'book_id', '')::UUID AS book_id,
            COUNT(*) AS total_events,
            COUNT(*) FILTER (WHERE src.event_type = 'WISHLIST_ADDED') AS wishlist_adds,
            COUNT(*) FILTER (WHERE src.event_type = 'BOOKSHELF_ADDED') AS bookshelf_adds,
            COUNT(*) FILTER (WHERE src.event_type = 'REQUEST_OPENED') AS request_opens
        FROM src
        WHERE src.metadata ? 'book_id'
          AND NULLIF(src.metadata->>'book_id', '') IS NOT NULL
        GROUP BY DATE(src.occurred_at), NULLIF(src.metadata->>'book_id', '')::UUID
    )
    INSERT INTO public.analytics_book_daily (
        day, book_id, total_events, wishlist_adds, bookshelf_adds, request_opens, updated_at
    )
    SELECT
        bd.day, bd.book_id, bd.total_events, bd.wishlist_adds, bd.bookshelf_adds, bd.request_opens, NOW()
    FROM book_daily bd
    ON CONFLICT (day, book_id) DO UPDATE
    SET
        total_events = public.analytics_book_daily.total_events + EXCLUDED.total_events,
        wishlist_adds = public.analytics_book_daily.wishlist_adds + EXCLUDED.wishlist_adds,
        bookshelf_adds = public.analytics_book_daily.bookshelf_adds + EXCLUDED.bookshelf_adds,
        request_opens = public.analytics_book_daily.request_opens + EXCLUDED.request_opens,
        updated_at = NOW();

    WITH src AS (
        SELECT user_id, occurred_at
        FROM public.user_events
        WHERE occurred_at > v_from
          AND occurred_at <= v_to
    ),
    rec AS (
        SELECT
            s.user_id,
            COUNT(*) AS total_events,
            MAX(s.occurred_at) AS last_event_at
        FROM src s
        GROUP BY s.user_id
    )
    INSERT INTO public.recommendation_features (
        user_id, total_events, last_event_at, updated_at
    )
    SELECT
        r.user_id, r.total_events, r.last_event_at, NOW()
    FROM rec r
    ON CONFLICT (user_id) DO UPDATE
    SET
        total_events = public.recommendation_features.total_events + EXCLUDED.total_events,
        last_event_at = GREATEST(public.recommendation_features.last_event_at, EXCLUDED.last_event_at),
        updated_at = NOW();

    SELECT COUNT(*) INTO v_processed
    FROM public.user_events
    WHERE occurred_at > v_from
      AND occurred_at <= v_to;

    UPDATE public.analytics_job_watermarks
    SET
        last_event_at = v_to,
        updated_at = NOW()
    WHERE job_name = p_job_name;

    RETURN v_processed;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_analytics_from_events(TEXT, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_analytics_from_events(TEXT, TIMESTAMPTZ) TO service_role;

ALTER TABLE public.analytics_job_watermarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_job_watermarks FORCE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_user_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_user_daily FORCE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_book_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_book_daily FORCE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_features FORCE ROW LEVEL SECURITY;

GRANT SELECT ON public.analytics_user_daily TO authenticated;
GRANT SELECT ON public.analytics_book_daily TO authenticated;
GRANT SELECT ON public.recommendation_features TO authenticated;
GRANT SELECT ON public.v_analytics_user_summary TO authenticated;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'analytics_user_daily' AND policyname = 'analytics_user_daily_select_own'
    ) THEN
        CREATE POLICY analytics_user_daily_select_own
            ON public.analytics_user_daily
            FOR SELECT
            USING (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'analytics_book_daily' AND policyname = 'analytics_book_daily_select_all'
    ) THEN
        CREATE POLICY analytics_book_daily_select_all
            ON public.analytics_book_daily
            FOR SELECT
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'recommendation_features' AND policyname = 'recommendation_features_select_own'
    ) THEN
        CREATE POLICY recommendation_features_select_own
            ON public.recommendation_features
            FOR SELECT
            USING (user_id = auth.uid());
    END IF;
END $$;
