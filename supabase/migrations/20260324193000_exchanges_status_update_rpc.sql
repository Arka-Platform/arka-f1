CREATE OR REPLACE FUNCTION public.update_exchange_status(
    p_exchange_id UUID,
    p_new_status TEXT
)
RETURNS public.exchanges
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_row public.exchanges%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF p_new_status NOT IN ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED') THEN
        RAISE EXCEPTION 'Invalid exchange status';
    END IF;

    UPDATE public.exchanges e
    SET
        status = p_new_status,
        completed_at = CASE
            WHEN p_new_status = 'COMPLETED' THEN COALESCE(e.completed_at, NOW())
            ELSE e.completed_at
        END
    WHERE e.id = p_exchange_id
      AND (e.buyer_id = v_uid OR e.seller_id = v_uid)
      AND (
          (e.status = 'PENDING' AND p_new_status IN ('COMPLETED', 'FAILED', 'CANCELLED'))
          OR (e.status = p_new_status)
      )
    RETURNING * INTO v_row;

    IF v_row.id IS NULL THEN
        RAISE EXCEPTION 'Exchange not found, not accessible, or invalid transition';
    END IF;

    RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.update_exchange_status(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_exchange_status(UUID, TEXT) TO authenticated;
