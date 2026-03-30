-- Admin-maintainable NGOs (domain: donations / ngos)

ALTER TABLE public.ngos
    ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::JSONB;

GRANT INSERT, UPDATE, DELETE ON public.ngos TO authenticated;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'ngos'
          AND policyname = 'ngos_insert_admin'
    ) THEN
        CREATE POLICY ngos_insert_admin
            ON public.ngos
            FOR INSERT
            WITH CHECK (public.is_admin_user(auth.uid()));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'ngos'
          AND policyname = 'ngos_update_admin'
    ) THEN
        CREATE POLICY ngos_update_admin
            ON public.ngos
            FOR UPDATE
            USING (public.is_admin_user(auth.uid()))
            WITH CHECK (public.is_admin_user(auth.uid()));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'ngos'
          AND policyname = 'ngos_delete_admin'
    ) THEN
        CREATE POLICY ngos_delete_admin
            ON public.ngos
            FOR DELETE
            USING (public.is_admin_user(auth.uid()));
    END IF;
END $$;
