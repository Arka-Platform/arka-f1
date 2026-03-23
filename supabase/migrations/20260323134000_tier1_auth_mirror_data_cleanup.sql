-- Tier 1 auth mirror: cleanup legacy profile conflicts before trigger sync.

DELETE FROM public.users u
WHERE NOT EXISTS (
    SELECT 1
    FROM auth.users au
    WHERE au.id = u.id
);

WITH ranked AS (
    SELECT
        ctid,
        ROW_NUMBER() OVER (
            PARTITION BY LOWER(email)
            ORDER BY created_at ASC, id ASC
        ) AS rn
    FROM public.users
    WHERE email IS NOT NULL
)
DELETE FROM public.users u
USING ranked r
WHERE u.ctid = r.ctid
  AND r.rn > 1;

DROP INDEX IF EXISTS public.users_email_unique_idx;
DROP INDEX IF EXISTS public.users_email_unique;

CREATE INDEX IF NOT EXISTS idx_users_email_lookup
    ON public.users (LOWER(email))
    WHERE email IS NOT NULL;

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
