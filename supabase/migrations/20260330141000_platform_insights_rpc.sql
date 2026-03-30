-- Aggregated platform metrics for authenticated clients (domain: analytics)

CREATE OR REPLACE FUNCTION public.get_platform_insights_snapshot()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_books_by_genre JSONB;
    v_books_by_category JSONB;
    v_now TIMESTAMPTZ := NOW();
    v_month_start TIMESTAMPTZ := date_trunc('month', v_now);
    v_week_start TIMESTAMPTZ := v_now - INTERVAL '7 days';
BEGIN
    SELECT COALESCE(
        jsonb_object_agg(COALESCE(NULLIF(trim(gk), ''), 'Unknown'), cnt),
        '{}'::JSONB
    )
    INTO v_books_by_genre
    FROM (
        SELECT COALESCE(NULLIF(trim(genre), ''), 'Unknown') AS gk, COUNT(*)::BIGINT AS cnt
        FROM public.books
        GROUP BY 1
    ) g;

    SELECT COALESCE(
        jsonb_object_agg(COALESCE(NULLIF(trim(ck), ''), 'Unknown'), cnt),
        '{}'::JSONB
    )
    INTO v_books_by_category
    FROM (
        SELECT COALESCE(NULLIF(trim(category), ''), 'Unknown') AS ck, COUNT(*)::BIGINT AS cnt
        FROM public.books
        GROUP BY 1
    ) c;

    RETURN jsonb_build_object(
        'totalUsers', (SELECT COUNT(*)::BIGINT FROM public.users),
        'activeUsers', (SELECT COUNT(DISTINCT user_id)::BIGINT FROM public.analytics_user_daily WHERE day >= v_week_start::DATE),
        'totalBooks', (SELECT COUNT(*)::BIGINT FROM public.books),
        'availableBooks', (SELECT COUNT(*)::BIGINT FROM public.books WHERE status = 'AVAILABLE'),
        'totalExchanges', (SELECT COUNT(*)::BIGINT FROM public.exchanges),
        'totalLendings', (SELECT COUNT(*)::BIGINT FROM public.lendings),
        'totalRevenue', (SELECT COALESCE(SUM(total_amount), 0)::NUMERIC FROM public.orders WHERE status IN ('DELIVERED', 'SHIPPED', 'PROCESSING', 'CONFIRMED')),
        'averageBookPrice', (SELECT COALESCE(AVG(credit_price), 0)::NUMERIC FROM public.books WHERE status = 'AVAILABLE'),
        'booksByGenre', v_books_by_genre,
        'booksByCategory', v_books_by_category,
        'monthlyStats', jsonb_build_object(
            'newUsers', (SELECT COUNT(*)::BIGINT FROM public.users WHERE created_at >= v_month_start),
            'newBooks', (SELECT COUNT(*)::BIGINT FROM public.books WHERE created_at >= v_month_start),
            'exchanges', (SELECT COUNT(*)::BIGINT FROM public.exchanges WHERE created_at >= v_month_start),
            'lendings', (SELECT COUNT(*)::BIGINT FROM public.lendings WHERE requested_at >= v_month_start),
            'revenue', (SELECT COALESCE(SUM(total_amount), 0)::NUMERIC FROM public.orders WHERE created_at >= v_month_start)
        ),
        'weeklyStats', jsonb_build_object(
            'newUsers', (SELECT COUNT(*)::BIGINT FROM public.users WHERE created_at >= v_week_start),
            'newBooks', (SELECT COUNT(*)::BIGINT FROM public.books WHERE created_at >= v_week_start),
            'exchanges', (SELECT COUNT(*)::BIGINT FROM public.exchanges WHERE created_at >= v_week_start),
            'lendings', (SELECT COUNT(*)::BIGINT FROM public.lendings WHERE requested_at >= v_week_start),
            'revenue', (SELECT COALESCE(SUM(total_amount), 0)::NUMERIC FROM public.orders WHERE created_at >= v_week_start)
        )
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_platform_insights_snapshot() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_platform_insights_snapshot() TO authenticated;
