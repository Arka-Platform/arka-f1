-- Seed active inventory + book_listings so marketplace /circulation can show listings.
--
-- Why this exists: 20260325192000_seed_books_from_csv only inserts into public.books.
-- listingsApi.listActive() reads book_listings (status = 'active'), which requires:
--   auth.users + inventory_books + book_listings.
--
-- Idempotent: skips if inventory/book_listings already exist for the same (user, book).
-- Requires: at least one row in auth.users (sign up once in the app, or seed auth separately).

DO $$
DECLARE
  uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users ORDER BY created_at ASC LIMIT 1;

  IF uid IS NULL THEN
    RAISE NOTICE 'seed_book_listings_inventory: no auth.users (register a user first). Skipping.';
    RETURN;
  END IF;

  -- 1) Inventory rows for up to 15 catalog books not yet in this user's shelf.
  INSERT INTO public.inventory_books (user_id, book_id, condition, status)
  SELECT uid, b.id, 'good', 'listed'
  FROM public.books b
  WHERE b.id IN (
    SELECT id FROM public.books ORDER BY created_at DESC NULLS LAST LIMIT 15
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.inventory_books ib
    WHERE ib.user_id = uid
      AND ib.book_id = b.id
  );

  -- 2) Active listings for inventory rows that do not yet have a listing.
  INSERT INTO public.book_listings (
    owner_id,
    inventory_book_id,
    condition,
    tags,
    image_cover_url,
    status
  )
  SELECT
    uid,
    ib.id,
    ib.condition,
    CASE
      WHEN b.genre IS NOT NULL AND btrim(b.genre) <> '' THEN ARRAY[b.genre::text]
      ELSE ARRAY['General']::text[]
    END,
    COALESCE(b.image_url, b.thumbnail_url),
    'active'
  FROM public.inventory_books ib
  JOIN public.books b ON b.id = ib.book_id
  WHERE ib.user_id = uid
    AND NOT EXISTS (
      SELECT 1 FROM public.book_listings bl WHERE bl.inventory_book_id = ib.id
    );

  -- 3) Optional: trust row so circulation star rating maps to a sensible number
  INSERT INTO public.user_trust_scores (user_id, trust_score, events_considered, completion_rate)
  VALUES (uid, 72.00, 5, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE 'seed_book_listings_inventory: seeded listings for user %', uid;
END $$;
