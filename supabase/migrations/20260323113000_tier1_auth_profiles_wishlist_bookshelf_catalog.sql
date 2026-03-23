-- Tier 1 Supabase foundation (production-safe, idempotent)
-- Features:
-- 1) auth mirror: auth.users -> public.users
-- 2) profile/account table: public.users
-- 3) wishlist + bookshelf ownership model with anti-duplication
-- 4) catalog reads via view + RPC

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- users profile table (auth.users is identity source of truth)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    account_settings JSONB,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    credit_balance NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS first_name TEXT,
    ADD COLUMN IF NOT EXISTS last_name TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS account_settings JSONB,
    ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS credit_balance NUMERIC(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.users
    DROP COLUMN IF EXISTS password_hash;

ALTER TABLE public.users
    ALTER COLUMN email DROP NOT NULL,
    ALTER COLUMN first_name DROP NOT NULL,
    ALTER COLUMN last_name DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_updated_at ON public.users(updated_at DESC);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'users'
          AND indexname = 'users_email_unique_idx'
    ) THEN
        CREATE UNIQUE INDEX users_email_unique_idx
            ON public.users (LOWER(email))
            WHERE email IS NOT NULL;
    END IF;
END $$;

-- Ensure users FK targets auth.users (for legacy drift resilience).
DO $$
DECLARE
    v_fk_name TEXT;
BEGIN
    SELECT con.conname
    INTO v_fk_name
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'users'
      AND con.contype = 'f'
    LIMIT 1;

    IF v_fk_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.users DROP CONSTRAINT %I', v_fk_name);
    END IF;

    ALTER TABLE public.users
      ADD CONSTRAINT users_id_auth_fkey
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Mirror trigger: auth.users -> public.users (idempotent upsert)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_auth_user_upsert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (
        id,
        email,
        first_name,
        last_name,
        phone,
        avatar_url,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'first_name', '')), ''),
        NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'last_name', '')), ''),
        NEW.phone,
        COALESCE(
            NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')), ''),
            NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'avatar', '')), '')
        ),
        COALESCE(NEW.created_at, NOW()),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET
        email = EXCLUDED.email,
        first_name = COALESCE(EXCLUDED.first_name, public.users.first_name),
        last_name = COALESCE(EXCLUDED.last_name, public.users.last_name),
        phone = COALESCE(EXCLUDED.phone, public.users.phone),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
        updated_at = NOW();

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_or_updated ON auth.users;
CREATE TRIGGER on_auth_user_created_or_updated
AFTER INSERT OR UPDATE OF email, phone, raw_user_meta_data
ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_auth_user_upsert();

-- Backfill existing auth users safely.
INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    phone,
    avatar_url,
    created_at,
    updated_at
)
SELECT
    au.id,
    au.email,
    NULLIF(TRIM(COALESCE(au.raw_user_meta_data->>'first_name', '')), ''),
    NULLIF(TRIM(COALESCE(au.raw_user_meta_data->>'last_name', '')), ''),
    au.phone,
    COALESCE(
        NULLIF(TRIM(COALESCE(au.raw_user_meta_data->>'avatar_url', '')), ''),
        NULLIF(TRIM(COALESCE(au.raw_user_meta_data->>'avatar', '')), '')
    ),
    COALESCE(au.created_at, NOW()),
    NOW()
FROM auth.users au
ON CONFLICT (id) DO UPDATE
SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, public.users.first_name),
    last_name = COALESCE(EXCLUDED.last_name, public.users.last_name),
    phone = COALESCE(EXCLUDED.phone, public.users.phone),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
    updated_at = NOW();

-- Login hydration safety RPC.
CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_row public.users%ROWTYPE;
    v_auth auth.users%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT *
    INTO v_auth
    FROM auth.users
    WHERE id = v_uid;

    INSERT INTO public.users (
        id,
        email,
        first_name,
        last_name,
        phone,
        avatar_url,
        created_at,
        updated_at
    )
    VALUES (
        v_uid,
        v_auth.email,
        NULLIF(TRIM(COALESCE(v_auth.raw_user_meta_data->>'first_name', '')), ''),
        NULLIF(TRIM(COALESCE(v_auth.raw_user_meta_data->>'last_name', '')), ''),
        v_auth.phone,
        COALESCE(
            NULLIF(TRIM(COALESCE(v_auth.raw_user_meta_data->>'avatar_url', '')), ''),
            NULLIF(TRIM(COALESCE(v_auth.raw_user_meta_data->>'avatar', '')), '')
        ),
        COALESCE(v_auth.created_at, NOW()),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET
        email = EXCLUDED.email,
        first_name = COALESCE(EXCLUDED.first_name, public.users.first_name),
        last_name = COALESCE(EXCLUDED.last_name, public.users.last_name),
        phone = COALESCE(EXCLUDED.phone, public.users.phone),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
        updated_at = NOW();

    SELECT * INTO v_row
    FROM public.users
    WHERE id = v_uid;

    RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_user_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_user_profile() TO authenticated;

-- Protect privileged fields from client-side privilege escalation.
CREATE OR REPLACE FUNCTION public.protect_user_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_service BOOLEAN := COALESCE(auth.jwt()->>'role', '') = 'service_role';
    v_uid UUID := auth.uid();
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF v_uid IS NOT NULL AND NEW.id <> v_uid THEN
            RAISE EXCEPTION 'Cannot create profile for another user';
        END IF;

        IF v_uid IS NOT NULL AND NOT v_is_service THEN
            NEW.is_admin := false;
            NEW.credit_balance := COALESCE(NEW.credit_balance, 0);
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.id <> OLD.id THEN
            RAISE EXCEPTION 'Profile id is immutable';
        END IF;

        IF v_uid IS NOT NULL AND NOT v_is_service THEN
            NEW.is_admin := OLD.is_admin;
            NEW.credit_balance := OLD.credit_balance;
            NEW.email := OLD.email;
        END IF;
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_user_profile_fields ON public.users;
CREATE TRIGGER trg_protect_user_profile_fields
BEFORE INSERT OR UPDATE
ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.protect_user_profile_fields();

-- ---------------------------------------------------------------------------
-- wishlist and bookshelf tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bookshelf (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.wishlists
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.bookshelf
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.wishlists
    ALTER COLUMN id SET DEFAULT gen_random_uuid(),
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN book_id SET NOT NULL;

ALTER TABLE public.bookshelf
    ALTER COLUMN id SET DEFAULT gen_random_uuid(),
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN book_id SET NOT NULL;

-- Remove historical duplicates before enforcing unique index.
WITH ranked AS (
    SELECT ctid,
           ROW_NUMBER() OVER (PARTITION BY user_id, book_id ORDER BY created_at ASC, id ASC) AS rn
    FROM public.wishlists
)
DELETE FROM public.wishlists w
USING ranked r
WHERE w.ctid = r.ctid AND r.rn > 1;

WITH ranked AS (
    SELECT ctid,
           ROW_NUMBER() OVER (PARTITION BY user_id, book_id ORDER BY created_at ASC, id ASC) AS rn
    FROM public.bookshelf
)
DELETE FROM public.bookshelf b
USING ranked r
WHERE b.ctid = r.ctid AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_wishlists_user_book ON public.wishlists(user_id, book_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_bookshelf_user_book ON public.bookshelf(user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_bookshelf_user_id ON public.bookshelf(user_id);

-- Retry-safe idempotent write RPCs.
CREATE OR REPLACE FUNCTION public.add_book_to_wishlist(
    p_book_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS public.wishlists
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_row public.wishlists%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    IF p_book_id IS NULL THEN
        RAISE EXCEPTION 'book_id is required';
    END IF;

    INSERT INTO public.wishlists (user_id, book_id, notes)
    VALUES (v_uid, p_book_id, p_notes)
    ON CONFLICT (user_id, book_id) DO NOTHING;

    SELECT * INTO v_row
    FROM public.wishlists
    WHERE user_id = v_uid AND book_id = p_book_id;

    RETURN v_row;
END;
$$;

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

    SELECT * INTO v_row
    FROM public.bookshelf
    WHERE user_id = v_uid AND book_id = p_book_id;

    RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.add_book_to_wishlist(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.add_book_to_bookshelf(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_book_to_wishlist(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_book_to_bookshelf(UUID, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- catalog reads (browse/search/filter)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_catalog_books AS
SELECT
    b.id,
    b.title,
    b.author,
    b.description,
    b.genre,
    b.category,
    b.subcategory,
    b.credit_price,
    b.status,
    b.created_at
FROM public.books b;

CREATE OR REPLACE FUNCTION public.search_catalog_books(
    p_query TEXT DEFAULT NULL,
    p_genre TEXT DEFAULT NULL,
    p_category TEXT DEFAULT NULL,
    p_subcategory TEXT DEFAULT NULL,
    p_limit INT DEFAULT 30,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    author VARCHAR,
    description TEXT,
    genre VARCHAR,
    category VARCHAR,
    subcategory VARCHAR,
    credit_price NUMERIC,
    status VARCHAR,
    created_at TIMESTAMP
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        b.id,
        b.title,
        b.author,
        b.description,
        b.genre,
        b.category,
        b.subcategory,
        b.credit_price,
        b.status,
        b.created_at
    FROM public.books b
    WHERE
        (p_query IS NULL OR p_query = '' OR (
            b.title ILIKE '%' || p_query || '%'
            OR b.author ILIKE '%' || p_query || '%'
            OR COALESCE(b.description, '') ILIKE '%' || p_query || '%'
        ))
        AND (p_genre IS NULL OR b.genre = p_genre)
        AND (p_category IS NULL OR b.category = p_category)
        AND (p_subcategory IS NULL OR b.subcategory = p_subcategory)
    ORDER BY b.created_at DESC
    LIMIT GREATEST(COALESCE(p_limit, 30), 1)
    OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;

REVOKE ALL ON FUNCTION public.search_catalog_books(TEXT, TEXT, TEXT, TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_catalog_books(TEXT, TEXT, TEXT, TEXT, INT, INT) TO authenticated, anon;
GRANT SELECT ON public.v_catalog_books TO authenticated, anon;

-- ---------------------------------------------------------------------------
-- RLS (strict ownership)
-- ---------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookshelf ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.users FORCE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists FORCE ROW LEVEL SECURITY;
ALTER TABLE public.bookshelf FORCE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wishlists TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookshelf TO authenticated;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'users_select_own'
    ) THEN
        CREATE POLICY users_select_own
            ON public.users
            FOR SELECT
            USING (id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'users_insert_own'
    ) THEN
        CREATE POLICY users_insert_own
            ON public.users
            FOR INSERT
            WITH CHECK (id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'users_update_own'
    ) THEN
        CREATE POLICY users_update_own
            ON public.users
            FOR UPDATE
            USING (id = auth.uid())
            WITH CHECK (id = auth.uid());
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'wishlists' AND policyname = 'wishlists_select_own'
    ) THEN
        CREATE POLICY wishlists_select_own
            ON public.wishlists
            FOR SELECT
            USING (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'wishlists' AND policyname = 'wishlists_insert_own'
    ) THEN
        CREATE POLICY wishlists_insert_own
            ON public.wishlists
            FOR INSERT
            WITH CHECK (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'wishlists' AND policyname = 'wishlists_update_own'
    ) THEN
        CREATE POLICY wishlists_update_own
            ON public.wishlists
            FOR UPDATE
            USING (user_id = auth.uid())
            WITH CHECK (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'wishlists' AND policyname = 'wishlists_delete_own'
    ) THEN
        CREATE POLICY wishlists_delete_own
            ON public.wishlists
            FOR DELETE
            USING (user_id = auth.uid());
    END IF;
END $$;

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
