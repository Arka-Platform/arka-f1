CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Shared catalog dependency used by wishlist/bookshelf/requests/orders domains.
CREATE TABLE IF NOT EXISTS public.books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    description TEXT,
    genre TEXT,
    category TEXT,
    subcategory TEXT,
    credit_price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (credit_price >= 0),
    image_url TEXT,
    thumbnail_url TEXT,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'AVAILABLE'
);

ALTER TABLE public.books
    ADD COLUMN IF NOT EXISTS image_url TEXT,
    ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

CREATE INDEX IF NOT EXISTS idx_books_title_author ON public.books(title, author);
CREATE INDEX IF NOT EXISTS idx_books_created_at ON public.books(created_at DESC);

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    account_settings JSONB,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    credit_balance NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (credit_balance >= 0),
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
    ALTER COLUMN email SET NOT NULL,
    ALTER COLUMN first_name DROP NOT NULL,
    ALTER COLUMN last_name DROP NOT NULL,
    ALTER COLUMN phone DROP NOT NULL,
    ALTER COLUMN avatar_url DROP NOT NULL,
    ALTER COLUMN account_settings DROP NOT NULL;

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

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'users_credit_balance_non_negative_chk'
    ) THEN
        ALTER TABLE public.users
            ADD CONSTRAINT users_credit_balance_non_negative_chk
            CHECK (credit_balance >= 0);
    END IF;
END $$;

DROP INDEX IF EXISTS public.users_email_unique_idx;
DROP INDEX IF EXISTS public.users_email_unique;
CREATE INDEX IF NOT EXISTS idx_users_email_lookup
    ON public.users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_updated_at
    ON public.users(updated_at DESC);

CREATE OR REPLACE FUNCTION public.handle_auth_user_mirror()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_email TEXT;
BEGIN
    v_email := COALESCE(NEW.email, CONCAT(NEW.id::text, '@placeholder.local'));

    INSERT INTO public.users (id, email, created_at, updated_at)
    VALUES (NEW.id, v_email, COALESCE(NEW.created_at, NOW()), NOW())
    ON CONFLICT (id) DO UPDATE
    SET
        email = EXCLUDED.email,
        updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_or_updated ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_mirrored ON auth.users;

CREATE TRIGGER on_auth_user_mirrored
AFTER INSERT OR UPDATE OF email ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_auth_user_mirror();

CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_row public.users%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    INSERT INTO public.users (id, email)
    SELECT au.id, COALESCE(au.email, CONCAT(au.id::text, '@placeholder.local'))
    FROM auth.users au
    WHERE au.id = v_uid
    ON CONFLICT (id) DO NOTHING;

    SELECT * INTO v_row
    FROM public.users
    WHERE id = v_uid;

    RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_user_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_user_profile() TO authenticated;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'users_insert_auth_internal'
    ) THEN
        CREATE POLICY users_insert_auth_internal
            ON public.users
            FOR INSERT
            WITH CHECK (current_user IN ('supabase_auth_admin', 'postgres', 'service_role'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'users_update_auth_internal'
    ) THEN
        CREATE POLICY users_update_auth_internal
            ON public.users
            FOR UPDATE
            USING (current_user IN ('supabase_auth_admin', 'postgres', 'service_role'))
            WITH CHECK (current_user IN ('supabase_auth_admin', 'postgres', 'service_role'));
    END IF;

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

INSERT INTO public.users (id, email, created_at, updated_at)
SELECT au.id, COALESCE(au.email, CONCAT(au.id::text, '@placeholder.local')), COALESCE(au.created_at, NOW()), NOW()
FROM auth.users au
ON CONFLICT (id) DO NOTHING;
