CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL CHECK (plan IN ('FREE','BASIC','PREMIUM','UNLIMITED')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','CANCELLED','EXPIRED','SUSPENDED','PENDING_PAYMENT')),
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    renewal_date TIMESTAMPTZ,
    monthly_price NUMERIC(10,2),
    auto_renew BOOLEAN NOT NULL DEFAULT true,
    books_per_month INTEGER,
    books_used_this_month INTEGER NOT NULL DEFAULT 0,
    unlimited_access BOOLEAN NOT NULL DEFAULT false,
    priority_support BOOLEAN NOT NULL DEFAULT false,
    ad_free BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.community_circles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    host_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    badge TEXT NOT NULL DEFAULT 'reader',
    streak_days INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.community_circle_members (
    circle_id UUID NOT NULL REFERENCES public.community_circles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (circle_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.community_circle_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    circle_id UUID NOT NULL REFERENCES public.community_circles(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(circle_id, book_id)
);

CREATE TABLE IF NOT EXISTS public.community_chain_stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    circle_id UUID REFERENCES public.community_circles(id) ON DELETE SET NULL,
    book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    chain_badge TEXT NOT NULL DEFAULT 'new',
    cover_label TEXT NOT NULL DEFAULT '',
    streak_days INTEGER NOT NULL DEFAULT 0,
    hops INTEGER NOT NULL DEFAULT 0,
    last_hop TEXT NOT NULL DEFAULT 'Just started',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.community_chain_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain_id UUID NOT NULL REFERENCES public.community_chain_stories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location TEXT NOT NULL DEFAULT '',
    handoff TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lendings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    borrower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expected_return_date TIMESTAMPTZ NOT NULL,
    lending_fee NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (lending_fee >= 0),
    deposit NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (deposit >= 0),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','ACTIVE','RETURNED','REJECTED','CANCELLED','OVERDUE')),
    notes TEXT,
    condition_before TEXT,
    condition_after TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    start_date TIMESTAMPTZ,
    actual_return_date TIMESTAMPTZ
);

CREATE OR REPLACE FUNCTION public.upsert_user_subscription(p_user_id UUID, p_plan TEXT)
RETURNS public.user_subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_price NUMERIC(10,2) := 0;
    v_books INTEGER := 0;
    v_unlimited BOOLEAN := false;
    v_priority BOOLEAN := false;
    v_ad_free BOOLEAN := false;
    v_row public.user_subscriptions%ROWTYPE;
BEGIN
    IF v_uid IS NULL OR p_user_id <> v_uid THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;
    IF p_plan NOT IN ('FREE','BASIC','PREMIUM','UNLIMITED') THEN
        RAISE EXCEPTION 'Invalid plan';
    END IF;

    IF p_plan = 'BASIC' THEN
        v_price := 9.99; v_books := 3;
    ELSIF p_plan = 'PREMIUM' THEN
        v_price := 19.99; v_books := 10; v_priority := true; v_ad_free := true;
    ELSIF p_plan = 'UNLIMITED' THEN
        v_price := 29.99; v_books := NULL; v_unlimited := true; v_priority := true; v_ad_free := true;
    END IF;

    INSERT INTO public.user_subscriptions (
        user_id, plan, status, start_date, renewal_date, monthly_price, auto_renew,
        books_per_month, books_used_this_month, unlimited_access, priority_support, ad_free, updated_at
    )
    VALUES (
        p_user_id, p_plan, 'ACTIVE', NOW(), NOW() + INTERVAL '30 days', v_price, true,
        v_books, 0, v_unlimited, v_priority, v_ad_free, NOW()
    )
    ON CONFLICT (user_id) DO UPDATE
    SET
        plan = EXCLUDED.plan,
        status = 'ACTIVE',
        start_date = NOW(),
        end_date = NULL,
        renewal_date = NOW() + INTERVAL '30 days',
        monthly_price = EXCLUDED.monthly_price,
        auto_renew = true,
        books_per_month = EXCLUDED.books_per_month,
        books_used_this_month = 0,
        unlimited_access = EXCLUDED.unlimited_access,
        priority_support = EXCLUDED.priority_support,
        ad_free = EXCLUDED.ad_free,
        updated_at = NOW()
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.renew_user_subscription(p_user_id UUID)
RETURNS public.user_subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_row public.user_subscriptions%ROWTYPE;
BEGIN
    IF v_uid IS NULL OR p_user_id <> v_uid THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    UPDATE public.user_subscriptions
    SET
        status = 'ACTIVE',
        end_date = NULL,
        renewal_date = NOW() + INTERVAL '30 days',
        books_used_this_month = 0,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_user_subscription(p_user_id UUID)
RETURNS public.user_subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_row public.user_subscriptions%ROWTYPE;
BEGIN
    IF v_uid IS NULL OR p_user_id <> v_uid THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    UPDATE public.user_subscriptions
    SET
        status = 'CANCELLED',
        end_date = NOW(),
        auto_renew = false,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.ping_chain(p_chain_id UUID)
RETURNS public.community_chain_stories
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_row public.community_chain_stories%ROWTYPE;
BEGIN
    UPDATE public.community_chain_stories
    SET
        hops = hops + 1,
        last_hop = 'Pinged now',
        updated_at = NOW()
    WHERE id = p_chain_id
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.keep_chain_alive(p_chain_id UUID)
RETURNS public.community_chain_stories
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_row public.community_chain_stories%ROWTYPE;
BEGIN
    UPDATE public.community_chain_stories
    SET
        streak_days = streak_days + 1,
        last_hop = 'Kept alive',
        updated_at = NOW()
    WHERE id = p_chain_id
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_user_subscription(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.renew_user_subscription(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_user_subscription(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ping_chain(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.keep_chain_alive(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_user_subscription(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.renew_user_subscription(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_user_subscription(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ping_chain(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.keep_chain_alive(UUID) TO authenticated;

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.community_circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_circles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.community_circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_circle_members FORCE ROW LEVEL SECURITY;
ALTER TABLE public.community_circle_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_circle_books FORCE ROW LEVEL SECURITY;
ALTER TABLE public.community_chain_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_chain_stories FORCE ROW LEVEL SECURITY;
ALTER TABLE public.community_chain_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_chain_participants FORCE ROW LEVEL SECURITY;
ALTER TABLE public.lendings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lendings FORCE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.user_subscriptions TO authenticated;
GRANT SELECT ON public.community_circles TO authenticated, anon;
GRANT SELECT ON public.community_circle_members TO authenticated, anon;
GRANT SELECT, INSERT ON public.community_circle_books TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.community_chain_stories TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.community_chain_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.lendings TO authenticated;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_subscriptions' AND policyname = 'user_subscriptions_select_own'
    ) THEN
        CREATE POLICY user_subscriptions_select_own
            ON public.user_subscriptions FOR SELECT USING (user_id = auth.uid());
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_subscriptions' AND policyname = 'user_subscriptions_insert_own'
    ) THEN
        CREATE POLICY user_subscriptions_insert_own
            ON public.user_subscriptions FOR INSERT WITH CHECK (user_id = auth.uid());
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_subscriptions' AND policyname = 'user_subscriptions_update_own'
    ) THEN
        CREATE POLICY user_subscriptions_update_own
            ON public.user_subscriptions FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'community_circles' AND policyname = 'community_circles_select_all'
    ) THEN
        CREATE POLICY community_circles_select_all
            ON public.community_circles FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'community_circle_members' AND policyname = 'community_circle_members_select_all'
    ) THEN
        CREATE POLICY community_circle_members_select_all
            ON public.community_circle_members FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'community_circle_books' AND policyname = 'community_circle_books_select_all'
    ) THEN
        CREATE POLICY community_circle_books_select_all
            ON public.community_circle_books FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'community_circle_books' AND policyname = 'community_circle_books_insert_auth'
    ) THEN
        CREATE POLICY community_circle_books_insert_auth
            ON public.community_circle_books FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'community_chain_stories' AND policyname = 'community_chain_stories_select_all'
    ) THEN
        CREATE POLICY community_chain_stories_select_all
            ON public.community_chain_stories FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'community_chain_stories' AND policyname = 'community_chain_stories_insert_auth'
    ) THEN
        CREATE POLICY community_chain_stories_insert_auth
            ON public.community_chain_stories FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'community_chain_stories' AND policyname = 'community_chain_stories_update_auth'
    ) THEN
        CREATE POLICY community_chain_stories_update_auth
            ON public.community_chain_stories FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'community_chain_participants' AND policyname = 'community_chain_participants_select_all'
    ) THEN
        CREATE POLICY community_chain_participants_select_all
            ON public.community_chain_participants FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'community_chain_participants' AND policyname = 'community_chain_participants_insert_auth'
    ) THEN
        CREATE POLICY community_chain_participants_insert_auth
            ON public.community_chain_participants FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'community_chain_participants' AND policyname = 'community_chain_participants_update_auth'
    ) THEN
        CREATE POLICY community_chain_participants_update_auth
            ON public.community_chain_participants FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'lendings' AND policyname = 'lendings_select_participant'
    ) THEN
        CREATE POLICY lendings_select_participant
            ON public.lendings FOR SELECT USING (owner_id = auth.uid() OR borrower_id = auth.uid());
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'lendings' AND policyname = 'lendings_insert_owner_or_borrower'
    ) THEN
        CREATE POLICY lendings_insert_owner_or_borrower
            ON public.lendings FOR INSERT WITH CHECK (owner_id = auth.uid() OR borrower_id = auth.uid());
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'lendings' AND policyname = 'lendings_update_participant'
    ) THEN
        CREATE POLICY lendings_update_participant
            ON public.lendings FOR UPDATE USING (owner_id = auth.uid() OR borrower_id = auth.uid())
            WITH CHECK (owner_id = auth.uid() OR borrower_id = auth.uid());
    END IF;
END $$;
