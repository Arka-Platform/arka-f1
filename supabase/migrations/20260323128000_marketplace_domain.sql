CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;

-- ---------------------------------------------------------------------------
-- Inventory: user's owned copies (separate from global catalog books)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inventory_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE RESTRICT,
    condition TEXT NOT NULL CHECK (condition IN ('new','like_new','good','fair','poor')),
    notes TEXT,
    acquired_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'owned' CHECK (status IN ('owned','listed','swapped','borrowed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_books_user_status
    ON public.inventory_books(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_books_book
    ON public.inventory_books(book_id);

-- ---------------------------------------------------------------------------
-- Swap Listings (marketplace card surface)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.book_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    inventory_book_id UUID NOT NULL UNIQUE REFERENCES public.inventory_books(id) ON DELETE CASCADE,
    title_override TEXT,
    condition TEXT NOT NULL CHECK (condition IN ('new','like_new','good','fair','poor')),
    tags TEXT[] NOT NULL DEFAULT '{}',
    image_cover_url TEXT,
    asking_notes TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','swapped','archived')),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    geo_point geography(POINT, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- If a prior attempt created the table without these columns, repair it idempotently.
ALTER TABLE public.book_listings
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;

ALTER TABLE public.book_listings
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

ALTER TABLE public.book_listings
  ADD COLUMN IF NOT EXISTS geo_point geography(POINT, 4326);

CREATE INDEX IF NOT EXISTS idx_book_listings_owner_status
    ON public.book_listings(owner_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_book_listings_status_created
    ON public.book_listings(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_book_listings_tags_gin
    ON public.book_listings USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_book_listings_geo_gist
    ON public.book_listings USING GIST(geo_point);

CREATE TABLE IF NOT EXISTS public.listing_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.book_listings(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(listing_id, image_url)
);

CREATE INDEX IF NOT EXISTS idx_listing_images_listing_sort
    ON public.listing_images(listing_id, sort_order, created_at DESC);

-- ---------------------------------------------------------------------------
-- Swap Requests (transaction workflow)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.swap_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.book_listings(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','cancelled','completed')),
    message TEXT,
    idempotency_key TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    decided_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_swap_requests_listing_status
    ON public.swap_requests(listing_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_swap_requests_requester_status
    ON public.swap_requests(requester_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_swap_requests_owner_status
    ON public.swap_requests(owner_id, status, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_swap_requests_listing_requester_open
    ON public.swap_requests(listing_id, requester_id)
    WHERE status IN ('pending','accepted');

CREATE UNIQUE INDEX IF NOT EXISTS uq_swap_requests_requester_idempotency
    ON public.swap_requests(requester_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_swap_requests_single_accepted_per_listing
    ON public.swap_requests(listing_id)
    WHERE status IN ('accepted','completed');

-- ---------------------------------------------------------------------------
-- User locations for "Nearby Finds"
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_locations (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    geo_point geography(POINT, 4326) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (latitude >= -90 AND latitude <= 90),
    CHECK (longitude >= -180 AND longitude <= 180)
);

-- If a prior attempt created the table without geo_point, repair it idempotently.
ALTER TABLE public.user_locations
  ADD COLUMN IF NOT EXISTS geo_point geography(POINT, 4326);

CREATE INDEX IF NOT EXISTS idx_user_locations_geo_gist
    ON public.user_locations USING GIST(geo_point);

-- ---------------------------------------------------------------------------
-- Derived read model for "My Library"
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_my_library AS
SELECT
    ib.id AS inventory_id,
    ib.user_id,
    ib.book_id,
    ib.condition,
    ib.notes,
    ib.status AS library_status,
    bl.id AS listing_id,
    bl.status AS listing_status,
    ib.created_at
FROM public.inventory_books ib
LEFT JOIN public.book_listings bl
  ON bl.inventory_book_id = ib.id;

-- ---------------------------------------------------------------------------
-- Triggers / workflow guards
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_listing_geo_point()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.latitude IS NULL OR NEW.longitude IS NULL THEN
        NEW.geo_point := NULL;
    ELSE
        NEW.geo_point := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_listing_geo_point ON public.book_listings;
CREATE TRIGGER trg_set_listing_geo_point
BEFORE INSERT OR UPDATE OF latitude, longitude
ON public.book_listings
FOR EACH ROW
EXECUTE FUNCTION public.set_listing_geo_point();

CREATE OR REPLACE FUNCTION public.set_user_geo_point()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.geo_point := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_user_geo_point ON public.user_locations;
CREATE TRIGGER trg_set_user_geo_point
BEFORE INSERT OR UPDATE OF latitude, longitude
ON public.user_locations
FOR EACH ROW
EXECUTE FUNCTION public.set_user_geo_point();

-- Ensure books.owner_id is authored by Supabase auth (auth.uid()).
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.books
      ALTER COLUMN owner_id SET DEFAULT auth.uid();
  EXCEPTION
    WHEN undefined_table THEN
      NULL;
  END;
END $$;

CREATE OR REPLACE FUNCTION public.set_books_owner_id_from_auth()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.owner_id IS NULL THEN
    NEW.owner_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.books') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_set_books_owner_id_from_auth ON public.books;
    CREATE TRIGGER trg_set_books_owner_id_from_auth
      BEFORE INSERT ON public.books
      FOR EACH ROW
      EXECUTE FUNCTION public.set_books_owner_id_from_auth();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.enforce_swap_request_updates()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_uid UUID := auth.uid();
BEGIN
    IF NEW.listing_id <> OLD.listing_id
       OR NEW.requester_id <> OLD.requester_id
       OR NEW.owner_id <> OLD.owner_id THEN
        RAISE EXCEPTION 'Swap request linkage fields are immutable';
    END IF;

    IF NEW.status <> OLD.status THEN
        IF v_uid = OLD.requester_id THEN
            IF NOT (
                (OLD.status = 'pending' AND NEW.status = 'cancelled')
                OR (OLD.status = 'accepted' AND NEW.status = 'completed')
            ) THEN
                RAISE EXCEPTION 'Requester cannot perform this status transition';
            END IF;
        ELSIF v_uid = OLD.owner_id THEN
            IF NOT (
                (OLD.status = 'pending' AND NEW.status IN ('accepted','rejected'))
            ) THEN
                RAISE EXCEPTION 'Owner cannot perform this status transition';
            END IF;
            NEW.decided_at := NOW();
        ELSE
            RAISE EXCEPTION 'Not allowed to update this swap request';
        END IF;

        IF NEW.status = 'completed' THEN
            NEW.completed_at := NOW();
        END IF;
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_swap_request_updates ON public.swap_requests;
CREATE TRIGGER trg_enforce_swap_request_updates
BEFORE UPDATE
ON public.swap_requests
FOR EACH ROW
EXECUTE FUNCTION public.enforce_swap_request_updates();

CREATE OR REPLACE FUNCTION public.sync_listing_inventory_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.status = 'accepted' THEN
        UPDATE public.book_listings
        SET status = 'paused', updated_at = NOW()
        WHERE id = NEW.listing_id;
    ELSIF NEW.status = 'completed' THEN
        UPDATE public.book_listings
        SET status = 'swapped', updated_at = NOW()
        WHERE id = NEW.listing_id;

        UPDATE public.inventory_books
        SET status = 'swapped', updated_at = NOW()
        WHERE id = (
            SELECT inventory_book_id FROM public.book_listings WHERE id = NEW.listing_id
        );
    ELSIF NEW.status IN ('rejected','cancelled') THEN
        UPDATE public.book_listings
        SET status = CASE
            WHEN status = 'paused' THEN 'active'
            ELSE status
        END,
        updated_at = NOW()
        WHERE id = NEW.listing_id;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_listing_inventory_status ON public.swap_requests;
CREATE TRIGGER trg_sync_listing_inventory_status
AFTER UPDATE OF status
ON public.swap_requests
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.sync_listing_inventory_status();

-- ---------------------------------------------------------------------------
-- RPC functions (API surface)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_swap_listing(
    p_inventory_book_id UUID,
    p_condition TEXT,
    p_tags TEXT[] DEFAULT '{}'::text[],
    p_image_cover_url TEXT DEFAULT NULL,
    p_asking_notes TEXT DEFAULT NULL,
    p_latitude DOUBLE PRECISION DEFAULT NULL,
    p_longitude DOUBLE PRECISION DEFAULT NULL
)
RETURNS public.book_listings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_inventory public.inventory_books%ROWTYPE;
    v_listing public.book_listings%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    IF p_inventory_book_id IS NULL THEN
        RAISE EXCEPTION 'inventory_book_id is required';
    END IF;

    SELECT * INTO v_inventory
    FROM public.inventory_books
    WHERE id = p_inventory_book_id
      AND user_id = v_uid
    FOR UPDATE;

    IF v_inventory.id IS NULL THEN
        RAISE EXCEPTION 'Inventory book not found or not owned by user';
    END IF;

    INSERT INTO public.book_listings (
        owner_id, inventory_book_id, condition, tags, image_cover_url, asking_notes, status, latitude, longitude
    )
    VALUES (
        v_uid, p_inventory_book_id, p_condition, COALESCE(p_tags, '{}'::text[]), p_image_cover_url, p_asking_notes, 'active', p_latitude, p_longitude
    )
    ON CONFLICT (inventory_book_id) DO UPDATE
    SET
        condition = EXCLUDED.condition,
        tags = EXCLUDED.tags,
        image_cover_url = EXCLUDED.image_cover_url,
        asking_notes = EXCLUDED.asking_notes,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        status = 'active',
        updated_at = NOW()
    RETURNING * INTO v_listing;

    UPDATE public.inventory_books
    SET status = 'listed', updated_at = NOW()
    WHERE id = p_inventory_book_id;

    RETURN v_listing;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_swap_request(
    p_listing_id UUID,
    p_message TEXT DEFAULT NULL,
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS public.swap_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_listing public.book_listings%ROWTYPE;
    v_existing public.swap_requests%ROWTYPE;
    v_req public.swap_requests%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT * INTO v_listing
    FROM public.book_listings
    WHERE id = p_listing_id
    FOR UPDATE;

    IF v_listing.id IS NULL THEN
        RAISE EXCEPTION 'Listing not found';
    END IF;
    IF v_listing.owner_id = v_uid THEN
        RAISE EXCEPTION 'Cannot request your own listing';
    END IF;
    IF v_listing.status <> 'active' THEN
        RAISE EXCEPTION 'Listing is not available for swap';
    END IF;

    IF p_idempotency_key IS NOT NULL THEN
        SELECT * INTO v_existing
        FROM public.swap_requests
        WHERE requester_id = v_uid
          AND idempotency_key = p_idempotency_key
        LIMIT 1;

        IF v_existing.id IS NOT NULL THEN
            IF v_existing.listing_id <> p_listing_id THEN
                RAISE EXCEPTION 'Idempotency key reused with different listing';
            END IF;
            RETURN v_existing;
        END IF;
    END IF;

    INSERT INTO public.swap_requests (
        listing_id, requester_id, owner_id, status, message, idempotency_key
    )
    VALUES (
        p_listing_id, v_uid, v_listing.owner_id, 'pending', p_message, p_idempotency_key
    )
    RETURNING * INTO v_req;

    RETURN v_req;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_swap_request_status(
    p_request_id UUID,
    p_new_status TEXT
)
RETURNS public.swap_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_req public.swap_requests%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    IF p_new_status NOT IN ('accepted','rejected','cancelled','completed') THEN
        RAISE EXCEPTION 'Invalid status transition target';
    END IF;

    UPDATE public.swap_requests
    SET status = p_new_status
    WHERE id = p_request_id
      AND (requester_id = v_uid OR owner_id = v_uid)
    RETURNING * INTO v_req;

    IF v_req.id IS NULL THEN
        RAISE EXCEPTION 'Swap request not found or not accessible';
    END IF;

    RETURN v_req;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_user_location(
    p_latitude DOUBLE PRECISION,
    p_longitude DOUBLE PRECISION
)
RETURNS public.user_locations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_row public.user_locations%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    INSERT INTO public.user_locations (user_id, latitude, longitude, geo_point, updated_at)
    VALUES (
        v_uid,
        p_latitude,
        p_longitude,
        ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE
    SET
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        geo_point = EXCLUDED.geo_point,
        updated_at = NOW()
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.search_nearby_listings(
    p_radius_km DOUBLE PRECISION DEFAULT 10,
    p_limit INTEGER DEFAULT 30,
    p_offset INTEGER DEFAULT 0,
    p_query TEXT DEFAULT NULL,
    p_condition TEXT DEFAULT NULL
)
RETURNS TABLE (
    listing_id UUID,
    owner_id UUID,
    inventory_book_id UUID,
    book_id UUID,
    title TEXT,
    author TEXT,
    condition TEXT,
    tags TEXT[],
    image_cover_url TEXT,
    distance_meters DOUBLE PRECISION,
    created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
AS $$
    WITH me AS (
        SELECT ul.geo_point
        FROM public.user_locations ul
        WHERE ul.user_id = auth.uid()
    )
    SELECT
        bl.id AS listing_id,
        bl.owner_id,
        bl.inventory_book_id,
        ib.book_id,
        COALESCE(bl.title_override, b.title)::TEXT AS title,
        b.author::TEXT AS author,
        bl.condition,
        bl.tags,
        bl.image_cover_url,
        ST_Distance(bl.geo_point, me.geo_point) AS distance_meters,
        bl.created_at
    FROM me
    JOIN public.book_listings bl
      ON bl.status = 'active'
     AND bl.geo_point IS NOT NULL
     AND ST_DWithin(bl.geo_point, me.geo_point, GREATEST(COALESCE(p_radius_km, 10), 0.1) * 1000.0)
    JOIN public.inventory_books ib
      ON ib.id = bl.inventory_book_id
    JOIN public.books b
      ON b.id = ib.book_id
    WHERE
      (p_query IS NULL OR p_query = '' OR (
          b.title ILIKE '%' || p_query || '%'
          OR b.author ILIKE '%' || p_query || '%'
          OR COALESCE(b.genre, '') ILIKE '%' || p_query || '%'
      ))
      AND (p_condition IS NULL OR bl.condition = p_condition)
      AND bl.owner_id <> auth.uid()
    ORDER BY distance_meters ASC, bl.created_at DESC
    LIMIT GREATEST(COALESCE(p_limit, 30), 1)
    OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;

CREATE OR REPLACE FUNCTION public.get_my_library(
    p_category TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    inventory_id UUID,
    book_id UUID,
    title TEXT,
    author TEXT,
    condition TEXT,
    library_status TEXT,
    listing_id UUID,
    listing_status TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        v.inventory_id,
        v.book_id,
        b.title::TEXT,
        b.author::TEXT,
        v.condition,
        v.library_status,
        v.listing_id,
        v.listing_status,
        v.created_at
    FROM public.v_my_library v
    JOIN public.books b ON b.id = v.book_id
    WHERE v.user_id = auth.uid()
      AND (
        p_category IS NULL
        OR p_category = ''
        OR v.library_status = p_category
        OR (p_category = 'listed' AND v.listing_status = 'active')
        OR (p_category = 'swapped' AND v.library_status = 'swapped')
        OR (p_category = 'borrowed' AND v.library_status = 'borrowed')
        OR (p_category = 'owned' AND v.library_status = 'owned')
      )
    ORDER BY v.created_at DESC
    LIMIT GREATEST(COALESCE(p_limit, 50), 1)
    OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;

REVOKE ALL ON FUNCTION public.create_swap_listing(UUID, TEXT, TEXT[], TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_swap_request(UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_swap_request_status(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upsert_user_location(DOUBLE PRECISION, DOUBLE PRECISION) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.search_nearby_listings(DOUBLE PRECISION, INTEGER, INTEGER, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_my_library(TEXT, INTEGER, INTEGER) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_swap_listing(UUID, TEXT, TEXT[], TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_swap_request(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_swap_request_status(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_user_location(DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_nearby_listings(DOUBLE PRECISION, INTEGER, INTEGER, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_library(TEXT, INTEGER, INTEGER) TO authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.inventory_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_books FORCE ROW LEVEL SECURITY;
ALTER TABLE public.book_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_listings FORCE ROW LEVEL SECURITY;
ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_images FORCE ROW LEVEL SECURITY;
ALTER TABLE public.swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swap_requests FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_locations FORCE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_books TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.book_listings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_images TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.swap_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_locations TO authenticated;
GRANT SELECT ON public.v_my_library TO authenticated;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'inventory_books' AND policyname = 'inventory_books_select_own'
    ) THEN
        CREATE POLICY inventory_books_select_own
            ON public.inventory_books
            FOR SELECT
            USING (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'inventory_books' AND policyname = 'inventory_books_insert_own'
    ) THEN
        CREATE POLICY inventory_books_insert_own
            ON public.inventory_books
            FOR INSERT
            WITH CHECK (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'inventory_books' AND policyname = 'inventory_books_update_own'
    ) THEN
        CREATE POLICY inventory_books_update_own
            ON public.inventory_books
            FOR UPDATE
            USING (user_id = auth.uid())
            WITH CHECK (user_id = auth.uid());
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'book_listings' AND policyname = 'book_listings_select_visible'
    ) THEN
        CREATE POLICY book_listings_select_visible
            ON public.book_listings
            FOR SELECT
            USING (status = 'active' OR owner_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'book_listings' AND policyname = 'book_listings_insert_own'
    ) THEN
        CREATE POLICY book_listings_insert_own
            ON public.book_listings
            FOR INSERT
            WITH CHECK (owner_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'book_listings' AND policyname = 'book_listings_update_own'
    ) THEN
        CREATE POLICY book_listings_update_own
            ON public.book_listings
            FOR UPDATE
            USING (owner_id = auth.uid())
            WITH CHECK (owner_id = auth.uid());
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'listing_images' AND policyname = 'listing_images_select_visible'
    ) THEN
        CREATE POLICY listing_images_select_visible
            ON public.listing_images
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.book_listings bl
                    WHERE bl.id = listing_images.listing_id
                      AND (bl.status = 'active' OR bl.owner_id = auth.uid())
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'listing_images' AND policyname = 'listing_images_mutate_owner'
    ) THEN
        CREATE POLICY listing_images_mutate_owner
            ON public.listing_images
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.book_listings bl
                    WHERE bl.id = listing_images.listing_id
                      AND bl.owner_id = auth.uid()
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.book_listings bl
                    WHERE bl.id = listing_images.listing_id
                      AND bl.owner_id = auth.uid()
                )
            );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'swap_requests' AND policyname = 'swap_requests_select_participants'
    ) THEN
        CREATE POLICY swap_requests_select_participants
            ON public.swap_requests
            FOR SELECT
            USING (requester_id = auth.uid() OR owner_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'swap_requests' AND policyname = 'swap_requests_insert_requester'
    ) THEN
        CREATE POLICY swap_requests_insert_requester
            ON public.swap_requests
            FOR INSERT
            WITH CHECK (requester_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'swap_requests' AND policyname = 'swap_requests_update_participants'
    ) THEN
        CREATE POLICY swap_requests_update_participants
            ON public.swap_requests
            FOR UPDATE
            USING (requester_id = auth.uid() OR owner_id = auth.uid())
            WITH CHECK (requester_id = auth.uid() OR owner_id = auth.uid());
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_locations' AND policyname = 'user_locations_select_own'
    ) THEN
        CREATE POLICY user_locations_select_own
            ON public.user_locations
            FOR SELECT
            USING (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_locations' AND policyname = 'user_locations_insert_own'
    ) THEN
        CREATE POLICY user_locations_insert_own
            ON public.user_locations
            FOR INSERT
            WITH CHECK (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_locations' AND policyname = 'user_locations_update_own'
    ) THEN
        CREATE POLICY user_locations_update_own
            ON public.user_locations
            FOR UPDATE
            USING (user_id = auth.uid())
            WITH CHECK (user_id = auth.uid());
    END IF;
END $$;
