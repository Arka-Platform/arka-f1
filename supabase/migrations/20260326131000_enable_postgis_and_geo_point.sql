-- Enables PostGIS (required for geography(Point,4326))
-- and ensures geo_point exists for marketplace proximity features.
--
-- NOTE: This migration exists because version 20260323127000 was already
-- present in supabase_migrations.schema_migrations in the target DB.

CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geo_point columns if the tables already exist in the target DB.
-- (If tables don't exist yet, the later marketplace migration will create them with geo_point.)
ALTER TABLE IF EXISTS public.book_listings
  ADD COLUMN IF NOT EXISTS geo_point geography(POINT, 4326);

ALTER TABLE IF EXISTS public.user_locations
  ADD COLUMN IF NOT EXISTS geo_point geography(POINT, 4326);

-- Create GIST indexes only when the target tables exist.
DO $$
BEGIN
  IF to_regclass('public.book_listings') IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_book_listings_geo_gist ON public.book_listings USING GIST(geo_point)';
  END IF;

  IF to_regclass('public.user_locations') IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_user_locations_geo_gist ON public.user_locations USING GIST(geo_point)';
  END IF;
END $$;

