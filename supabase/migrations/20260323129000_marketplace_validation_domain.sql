-- Marketplace domain validation helpers (non-destructive).

CREATE OR REPLACE FUNCTION public.run_marketplace_consistency_checks(
    p_raise_on_failure BOOLEAN DEFAULT false
)
RETURNS TABLE (
    check_name TEXT,
    ok BOOLEAN,
    details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_failed INT := 0;
    v_bad_accepted BIGINT := 0;
    v_orphan_listing BIGINT := 0;
    v_invalid_geo BIGINT := 0;
    v_bad_owner BIGINT := 0;
    v_bad_state BIGINT := 0;
BEGIN
    -- Check 1: At most one accepted/completed request per listing.
    SELECT COUNT(*)
    INTO v_bad_accepted
    FROM (
        SELECT listing_id, COUNT(*) AS c
        FROM public.swap_requests
        WHERE status IN ('accepted','completed')
        GROUP BY listing_id
        HAVING COUNT(*) > 1
    ) x;

    IF v_bad_accepted > 0 THEN v_failed := v_failed + 1; END IF;
    RETURN QUERY SELECT
      'single_accepted_or_completed_request_per_listing'::TEXT,
      (v_bad_accepted = 0),
      format('violating listings=%s', v_bad_accepted);

    -- Check 2: listing owner must match inventory owner.
    SELECT COUNT(*)
    INTO v_bad_owner
    FROM public.book_listings bl
    JOIN public.inventory_books ib ON ib.id = bl.inventory_book_id
    WHERE bl.owner_id <> ib.user_id;

    IF v_bad_owner > 0 THEN v_failed := v_failed + 1; END IF;
    RETURN QUERY SELECT
      'listing_owner_matches_inventory_owner'::TEXT,
      (v_bad_owner = 0),
      format('mismatched rows=%s', v_bad_owner);

    -- Check 3: no listing without inventory row.
    SELECT COUNT(*)
    INTO v_orphan_listing
    FROM public.book_listings bl
    LEFT JOIN public.inventory_books ib ON ib.id = bl.inventory_book_id
    WHERE ib.id IS NULL;

    IF v_orphan_listing > 0 THEN v_failed := v_failed + 1; END IF;
    RETURN QUERY SELECT
      'listing_inventory_fk_integrity'::TEXT,
      (v_orphan_listing = 0),
      format('orphan listings=%s', v_orphan_listing);

    -- Check 4: geolocation consistency for listings.
    SELECT COUNT(*)
    INTO v_invalid_geo
    FROM public.book_listings bl
    WHERE
      (bl.latitude IS NULL AND bl.longitude IS NOT NULL)
      OR (bl.latitude IS NOT NULL AND bl.longitude IS NULL)
      OR (bl.latitude IS NOT NULL AND (bl.latitude < -90 OR bl.latitude > 90))
      OR (bl.longitude IS NOT NULL AND (bl.longitude < -180 OR bl.longitude > 180))
      OR (
          bl.latitude IS NOT NULL
          AND bl.longitude IS NOT NULL
          AND bl.geo_point IS NULL
      );

    IF v_invalid_geo > 0 THEN v_failed := v_failed + 1; END IF;
    RETURN QUERY SELECT
      'listing_geo_consistency'::TEXT,
      (v_invalid_geo = 0),
      format('invalid geo rows=%s', v_invalid_geo);

    -- Check 5: listing/inventory state consistency for swapped listings.
    SELECT COUNT(*)
    INTO v_bad_state
    FROM public.book_listings bl
    JOIN public.inventory_books ib ON ib.id = bl.inventory_book_id
    WHERE bl.status = 'swapped'
      AND ib.status <> 'swapped';

    IF v_bad_state > 0 THEN v_failed := v_failed + 1; END IF;
    RETURN QUERY SELECT
      'swapped_listing_requires_swapped_inventory'::TEXT,
      (v_bad_state = 0),
      format('invalid state rows=%s', v_bad_state);

    IF p_raise_on_failure AND v_failed > 0 THEN
        RAISE EXCEPTION 'marketplace consistency checks failed: % failed checks', v_failed;
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.run_marketplace_consistency_checks(BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.run_marketplace_consistency_checks(BOOLEAN) TO authenticated, service_role;
