-- Add image fields back to public.books for UI covers.
-- Kept idempotent to allow safe re-runs and drifted environments.

ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Optional: keep thumbnails sane if provided.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'books_image_url_not_blank_chk'
  ) THEN
    ALTER TABLE public.books
      ADD CONSTRAINT books_image_url_not_blank_chk
      CHECK (image_url IS NULL OR LENGTH(TRIM(image_url)) > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'books_thumbnail_url_not_blank_chk'
  ) THEN
    ALTER TABLE public.books
      ADD CONSTRAINT books_thumbnail_url_not_blank_chk
      CHECK (thumbnail_url IS NULL OR LENGTH(TRIM(thumbnail_url)) > 0);
  END IF;
END $$;

