-- Tier 1 auth mirror: make trigger non-blocking for OAuth/signup reliability.

CREATE OR REPLACE FUNCTION public.handle_auth_user_upsert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
    EXCEPTION
        WHEN OTHERS THEN
            RAISE WARNING 'handle_auth_user_upsert failed for user %: %', NEW.id, SQLERRM;
    END;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_or_updated ON auth.users;
CREATE TRIGGER on_auth_user_created_or_updated
AFTER INSERT OR UPDATE OF email, phone, raw_user_meta_data
ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_auth_user_upsert();
