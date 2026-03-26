CREATE TABLE IF NOT EXISTS public.waste_paper (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category TEXT,
    weight_kg NUMERIC NOT NULL DEFAULT 0,
    credit_value NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE','SCHEDULED','PICKED_UP','CANCELLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.waste_paper
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS category TEXT,
    ADD COLUMN IF NOT EXISTS weight_kg NUMERIC NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS credit_value NUMERIC NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'AVAILABLE',
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'waste_paper_status_chk'
    ) THEN
        ALTER TABLE public.waste_paper
            ADD CONSTRAINT waste_paper_status_chk
            CHECK (status IN ('AVAILABLE','SCHEDULED','PICKED_UP','CANCELLED'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_waste_paper_created_at_desc
    ON public.waste_paper(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_waste_paper_category
    ON public.waste_paper(category);

ALTER TABLE public.waste_paper ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_paper FORCE ROW LEVEL SECURITY;

GRANT SELECT ON public.waste_paper TO anon;
GRANT SELECT ON public.waste_paper TO authenticated;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'waste_paper' AND policyname = 'waste_paper_public_read'
    ) THEN
        CREATE POLICY waste_paper_public_read
            ON public.waste_paper
            FOR SELECT
            USING (TRUE);
    END IF;
END $$;

