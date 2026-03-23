CREATE TABLE IF NOT EXISTS public.bookshelf (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.bookshelf
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.bookshelf
    ALTER COLUMN id SET DEFAULT gen_random_uuid(),
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN book_id SET NOT NULL;

WITH ranked AS (
    SELECT ctid,
           ROW_NUMBER() OVER (PARTITION BY user_id, book_id ORDER BY created_at ASC, id ASC) AS rn
    FROM public.bookshelf
)
DELETE FROM public.bookshelf b
USING ranked r
WHERE b.ctid = r.ctid
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_bookshelf_user_book
    ON public.bookshelf(user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_bookshelf_user_created
    ON public.bookshelf(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.add_book_to_bookshelf(
    p_book_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS public.bookshelf
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_row public.bookshelf%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    IF p_book_id IS NULL THEN
        RAISE EXCEPTION 'book_id is required';
    END IF;

    INSERT INTO public.bookshelf (user_id, book_id, notes)
    VALUES (v_uid, p_book_id, p_notes)
    ON CONFLICT (user_id, book_id) DO NOTHING;

    SELECT *
    INTO v_row
    FROM public.bookshelf
    WHERE user_id = v_uid AND book_id = p_book_id;

    RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.add_book_to_bookshelf(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_book_to_bookshelf(UUID, TEXT) TO authenticated;

ALTER TABLE public.bookshelf ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookshelf FORCE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookshelf TO authenticated;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'bookshelf' AND policyname = 'bookshelf_select_own'
    ) THEN
        CREATE POLICY bookshelf_select_own
            ON public.bookshelf
            FOR SELECT
            USING (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'bookshelf' AND policyname = 'bookshelf_insert_own'
    ) THEN
        CREATE POLICY bookshelf_insert_own
            ON public.bookshelf
            FOR INSERT
            WITH CHECK (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'bookshelf' AND policyname = 'bookshelf_update_own'
    ) THEN
        CREATE POLICY bookshelf_update_own
            ON public.bookshelf
            FOR UPDATE
            USING (user_id = auth.uid())
            WITH CHECK (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'bookshelf' AND policyname = 'bookshelf_delete_own'
    ) THEN
        CREATE POLICY bookshelf_delete_own
            ON public.bookshelf
            FOR DELETE
            USING (user_id = auth.uid());
    END IF;
END $$;
