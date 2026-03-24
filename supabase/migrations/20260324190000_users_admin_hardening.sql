-- Prevent privilege escalation via self-updates on public.users.is_admin.
-- Only service/internal roles may change this field.

CREATE OR REPLACE FUNCTION public.guard_users_is_admin_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_is_service BOOLEAN := COALESCE(auth.jwt()->>'role', '') = 'service_role';
BEGIN
    IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
        IF NOT v_is_service AND current_user NOT IN ('service_role', 'postgres') THEN
            RAISE EXCEPTION 'Direct is_admin update is not allowed';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_users_is_admin_update ON public.users;
CREATE TRIGGER trg_guard_users_is_admin_update
BEFORE UPDATE OF is_admin
ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.guard_users_is_admin_update();
