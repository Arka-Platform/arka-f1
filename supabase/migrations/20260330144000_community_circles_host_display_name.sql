-- Public label for circle cards ("Hosted by …"). Stored on the row so the client
-- does not need to read other users' profiles (RLS on public.users is own-row only).

ALTER TABLE public.community_circles
ADD COLUMN IF NOT EXISTS host_display_name TEXT NOT NULL DEFAULT 'ARKA';

COMMENT ON COLUMN public.community_circles.host_display_name IS 'UI label for host; curated per circle (platform or ops).';
