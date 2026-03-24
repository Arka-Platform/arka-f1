-- Explicitly secure books access with RLS policies.
-- Keeps current behavior: public read, authenticated owner writes.

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books FORCE ROW LEVEL SECURITY;

GRANT SELECT ON public.books TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.books TO authenticated;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'books' AND policyname = 'books_select_all'
    ) THEN
        CREATE POLICY books_select_all
            ON public.books
            FOR SELECT
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'books' AND policyname = 'books_insert_owner'
    ) THEN
        CREATE POLICY books_insert_owner
            ON public.books
            FOR INSERT
            TO authenticated
            WITH CHECK (owner_id = auth.uid() OR owner_id IS NULL);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'books' AND policyname = 'books_update_owner'
    ) THEN
        CREATE POLICY books_update_owner
            ON public.books
            FOR UPDATE
            TO authenticated
            USING (owner_id = auth.uid())
            WITH CHECK (owner_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'books' AND policyname = 'books_delete_owner'
    ) THEN
        CREATE POLICY books_delete_owner
            ON public.books
            FOR DELETE
            TO authenticated
            USING (owner_id = auth.uid());
    END IF;
END $$;
