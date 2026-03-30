-- Allow signed-in users to create reading circles (as host) and add themselves as members.

GRANT INSERT, UPDATE, DELETE ON public.community_circles TO authenticated;
GRANT INSERT ON public.community_circle_members TO authenticated;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'community_circles' AND policyname = 'community_circles_insert_authenticated_host'
    ) THEN
        CREATE POLICY community_circles_insert_authenticated_host
            ON public.community_circles FOR INSERT
            WITH CHECK (auth.uid() IS NOT NULL AND host_user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'community_circles' AND policyname = 'community_circles_update_host'
    ) THEN
        CREATE POLICY community_circles_update_host
            ON public.community_circles FOR UPDATE
            USING (host_user_id = auth.uid())
            WITH CHECK (host_user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'community_circle_members' AND policyname = 'community_circle_members_insert_self'
    ) THEN
        CREATE POLICY community_circle_members_insert_self
            ON public.community_circle_members FOR INSERT
            WITH CHECK (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'community_circles' AND policyname = 'community_circles_delete_host'
    ) THEN
        CREATE POLICY community_circles_delete_host
            ON public.community_circles FOR DELETE
            USING (host_user_id = auth.uid());
    END IF;
END $$;
