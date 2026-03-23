CREATE TABLE IF NOT EXISTS public.exchanges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
    request_id UUID REFERENCES public.book_requests(id) ON DELETE SET NULL,
    gross_amount NUMERIC(12,2) NOT NULL CHECK (gross_amount > 0),
    platform_fee NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (platform_fee >= 0),
    net_amount NUMERIC(12,2) GENERATED ALWAYS AS (gross_amount - platform_fee) STORED,
    status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('PENDING','COMPLETED','FAILED','CANCELLED')),
    idempotency_key TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'exchanges_buyer_seller_distinct_chk'
    ) THEN
        ALTER TABLE public.exchanges
            ADD CONSTRAINT exchanges_buyer_seller_distinct_chk
            CHECK (buyer_id <> seller_id);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'exchanges_idempotency_key_not_blank_chk'
    ) THEN
        ALTER TABLE public.exchanges
            ADD CONSTRAINT exchanges_idempotency_key_not_blank_chk
            CHECK (LENGTH(TRIM(idempotency_key)) > 0);
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_exchanges_buyer_idempotency
    ON public.exchanges (buyer_id, idempotency_key);
CREATE INDEX IF NOT EXISTS idx_exchanges_buyer_created
    ON public.exchanges(buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exchanges_seller_created
    ON public.exchanges(seller_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exchange_id UUID REFERENCES public.exchanges(id) ON DELETE SET NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    reference_type TEXT NOT NULL CHECK (reference_type IN ('EXCHANGE','ORDER','ADJUSTMENT','DONATION','REFUND')),
    direction TEXT NOT NULL CHECK (direction IN ('CREDIT','DEBIT')),
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_created
    ON public.credit_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_exchange
    ON public.credit_transactions(exchange_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_order
    ON public.credit_transactions(order_id);

CREATE OR REPLACE FUNCTION public.guard_credit_balance_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.credit_balance IS DISTINCT FROM OLD.credit_balance
       AND COALESCE(current_setting('app.allow_balance_update', true), '') <> 'on' THEN
        RAISE EXCEPTION 'Direct credit_balance update is not allowed';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_credit_balance_update ON public.users;
CREATE TRIGGER trg_guard_credit_balance_update
BEFORE UPDATE OF credit_balance
ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.guard_credit_balance_update();

CREATE OR REPLACE FUNCTION public.enforce_append_only_credit_transactions()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'credit_transactions is append-only';
END;
$$;

DROP TRIGGER IF EXISTS trg_credit_transactions_no_update_delete ON public.credit_transactions;
CREATE TRIGGER trg_credit_transactions_no_update_delete
BEFORE UPDATE OR DELETE
ON public.credit_transactions
FOR EACH ROW
EXECUTE FUNCTION public.enforce_append_only_credit_transactions();

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
    v_buyer_balance NUMERIC(12,2);
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

    SELECT credit_balance INTO v_buyer_balance
    FROM public.users
    WHERE id = v_buyer_id
    FOR UPDATE;

    IF v_buyer_balance < p_gross_amount THEN
        RAISE EXCEPTION 'Insufficient credits';
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

    INSERT INTO public.credit_transactions (
        user_id, exchange_id, reference_type, direction, amount, description
    )
    VALUES
      (v_buyer_id, v_exchange.id, 'EXCHANGE', 'DEBIT', p_gross_amount, 'Exchange debit'),
      (p_seller_id, v_exchange.id, 'EXCHANGE', 'CREDIT', (p_gross_amount - p_platform_fee), 'Exchange credit');

    PERFORM set_config('app.allow_balance_update', 'on', true);
    UPDATE public.users SET credit_balance = credit_balance - p_gross_amount WHERE id = v_buyer_id;
    UPDATE public.users SET credit_balance = credit_balance + (p_gross_amount - p_platform_fee) WHERE id = p_seller_id;

    IF p_request_id IS NOT NULL THEN
        UPDATE public.book_requests
        SET status = 'FULFILLED'
        WHERE id = p_request_id
          AND status IN ('OPEN','MATCH_PENDING','MATCHED');
    END IF;

    RETURN v_exchange;
END;
$$;

REVOKE ALL ON FUNCTION public.perform_exchange(UUID, UUID, UUID, NUMERIC, NUMERIC, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.perform_exchange(UUID, UUID, UUID, NUMERIC, NUMERIC, TEXT) TO authenticated;

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchanges FORCE ROW LEVEL SECURITY;

GRANT SELECT ON public.credit_transactions TO authenticated;
GRANT SELECT ON public.exchanges TO authenticated;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'credit_transactions' AND policyname = 'credit_transactions_select_own'
    ) THEN
        CREATE POLICY credit_transactions_select_own
            ON public.credit_transactions
            FOR SELECT
            USING (user_id = auth.uid());
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'exchanges' AND policyname = 'exchanges_select_participant'
    ) THEN
        CREATE POLICY exchanges_select_participant
            ON public.exchanges
            FOR SELECT
            USING (buyer_id = auth.uid() OR seller_id = auth.uid());
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'users_balance_update_internal'
    ) THEN
        CREATE POLICY users_balance_update_internal
            ON public.users
            FOR UPDATE
            USING (
                auth.uid() IS NOT NULL
                AND COALESCE(current_setting('app.allow_balance_update', true), '') = 'on'
            )
            WITH CHECK (
                COALESCE(current_setting('app.allow_balance_update', true), '') = 'on'
            );
    END IF;
END $$;
