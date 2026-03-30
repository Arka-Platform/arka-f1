-- Record exchanges without debiting internal wallet credits (domain: exchanges / credits)

CREATE OR REPLACE FUNCTION public.perform_exchange(
    p_seller_id UUID,
    p_book_id UUID DEFAULT NULL,
    p_request_id UUID DEFAULT NULL,
    p_gross_amount NUMERIC(12,2) DEFAULT NULL,
    p_platform_fee NUMERIC(12,2) DEFAULT 0,
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS public.exchanges
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_buyer_id UUID := auth.uid();
    v_existing public.exchanges%ROWTYPE;
    v_exchange public.exchanges%ROWTYPE;
    v_lock_first UUID;
    v_lock_second UUID;
    v_locked_count INT;
BEGIN
    IF v_buyer_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    IF p_seller_id IS NULL OR p_seller_id = v_buyer_id THEN
        RAISE EXCEPTION 'Invalid seller';
    END IF;
    IF p_idempotency_key IS NULL OR LENGTH(TRIM(p_idempotency_key)) = 0 THEN
        RAISE EXCEPTION 'idempotency_key is required';
    END IF;
    IF p_gross_amount IS NULL OR p_gross_amount <= 0 THEN
        RAISE EXCEPTION 'gross_amount must be > 0';
    END IF;
    IF p_platform_fee < 0 OR p_platform_fee > p_gross_amount THEN
        RAISE EXCEPTION 'Invalid platform_fee';
    END IF;

    SELECT * INTO v_existing
    FROM public.exchanges
    WHERE buyer_id = v_buyer_id
      AND idempotency_key = p_idempotency_key
    LIMIT 1;

    IF v_existing.id IS NOT NULL THEN
        IF v_existing.seller_id <> p_seller_id
           OR COALESCE(v_existing.book_id, '00000000-0000-0000-0000-000000000000'::UUID) <> COALESCE(p_book_id, '00000000-0000-0000-0000-000000000000'::UUID)
           OR COALESCE(v_existing.request_id, '00000000-0000-0000-0000-000000000000'::UUID) <> COALESCE(p_request_id, '00000000-0000-0000-0000-000000000000'::UUID)
           OR v_existing.gross_amount <> p_gross_amount
           OR v_existing.platform_fee <> p_platform_fee THEN
            RAISE EXCEPTION 'Idempotency key reused with different payload';
        END IF;
        RETURN v_existing;
    END IF;

    v_lock_first := LEAST(v_buyer_id, p_seller_id);
    v_lock_second := GREATEST(v_buyer_id, p_seller_id);

    PERFORM 1 FROM public.users WHERE id = v_lock_first FOR UPDATE;
    PERFORM 1 FROM public.users WHERE id = v_lock_second FOR UPDATE;

    SELECT COUNT(*) INTO v_locked_count
    FROM public.users
    WHERE id IN (v_buyer_id, p_seller_id);
    IF v_locked_count <> 2 THEN
        RAISE EXCEPTION 'Buyer/seller profile missing';
    END IF;

    INSERT INTO public.exchanges (
        buyer_id, seller_id, book_id, request_id,
        gross_amount, platform_fee, status, idempotency_key, completed_at
    )
    VALUES (
        v_buyer_id, p_seller_id, p_book_id, p_request_id,
        p_gross_amount, p_platform_fee, 'COMPLETED', p_idempotency_key, NOW()
    )
    RETURNING * INTO v_exchange;

    IF p_request_id IS NOT NULL THEN
        UPDATE public.book_requests
        SET status = 'FULFILLED'
        WHERE id = p_request_id
          AND status IN ('OPEN','MATCH_PENDING','MATCHED');
    END IF;

    RETURN v_exchange;
END;
$$;
