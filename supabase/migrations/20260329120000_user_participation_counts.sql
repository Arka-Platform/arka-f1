-- Balance-based participation: offer_count vs take_count on public.users.
-- Triggers keep counts aligned with confirmed offers (listed books) and takes (orders).

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS offer_count INTEGER NOT NULL DEFAULT 0 CHECK (offer_count >= 0),
    ADD COLUMN IF NOT EXISTS take_count INTEGER NOT NULL DEFAULT 0 CHECK (take_count >= 0);

CREATE OR REPLACE FUNCTION public.books_bump_offer_count_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.owner_id IS NOT NULL THEN
        UPDATE public.users
        SET offer_count = offer_count + 1,
            updated_at = NOW()
        WHERE id = NEW.owner_id;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_books_bump_offer_count ON public.books;
CREATE TRIGGER trg_books_bump_offer_count
    AFTER INSERT ON public.books
    FOR EACH ROW
    EXECUTE FUNCTION public.books_bump_offer_count_after_insert();

CREATE OR REPLACE FUNCTION public.orders_bump_take_count_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.user_id IS NOT NULL THEN
        UPDATE public.users
        SET take_count = take_count + 1,
            updated_at = NOW()
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_bump_take_count ON public.orders;
CREATE TRIGGER trg_orders_bump_take_count
    AFTER INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.orders_bump_take_count_after_insert();
