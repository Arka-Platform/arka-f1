-- Contact form persistence (domain: support / inquiries)

CREATE TABLE IF NOT EXISTS public.contact_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_contact_inquiries_created
    ON public.contact_inquiries(created_at DESC);

ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_inquiries FORCE ROW LEVEL SECURITY;

GRANT INSERT ON public.contact_inquiries TO anon, authenticated;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'contact_inquiries'
          AND policyname = 'contact_inquiries_insert_public'
    ) THEN
        CREATE POLICY contact_inquiries_insert_public
            ON public.contact_inquiries
            FOR INSERT
            WITH CHECK (
                (user_id IS NULL)
                OR (user_id = auth.uid())
            );
    END IF;
END $$;
