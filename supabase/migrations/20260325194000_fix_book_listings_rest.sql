-- Ensure `public.book_listings` exists and is exposed via PostgREST.
-- Idempotent and safe: creates table if missing; adds missing columns/indexes/policies if needed.
-- Does NOT drop data or relax existing constraints.

create extension if not exists pgcrypto;

-- 1) Create table if it does not exist (minimal required shape for the frontend query)
create table if not exists public.book_listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  inventory_book_id uuid null,
  title_override text null,
  condition text null,
  tags text[] null,
  image_cover_url text null,
  asking_notes text null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

-- 2) If table already exists, add any missing columns safely
alter table public.book_listings
  add column if not exists owner_id uuid,
  add column if not exists inventory_book_id uuid,
  add column if not exists title_override text,
  add column if not exists condition text,
  add column if not exists tags text[],
  add column if not exists image_cover_url text,
  add column if not exists asking_notes text,
  add column if not exists status text,
  add column if not exists created_at timestamptz;

-- Ensure defaults exist (safe to re-run)
alter table public.book_listings
  alter column status set default 'active',
  alter column created_at set default now();

-- Ensure required columns are NOT NULL when possible (only if currently nullable and table is empty-safe)
-- We avoid forcing NOT NULL on owner_id/status/created_at if there is existing data that would violate it.
do $$
begin
  -- owner_id
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'book_listings'
      and column_name = 'owner_id'
      and is_nullable = 'YES'
  ) then
    -- Only enforce if no nulls exist
    if not exists (select 1 from public.book_listings where owner_id is null) then
      alter table public.book_listings alter column owner_id set not null;
    end if;
  end if;

  -- status
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'book_listings'
      and column_name = 'status'
      and is_nullable = 'YES'
  ) then
    if not exists (select 1 from public.book_listings where status is null) then
      alter table public.book_listings alter column status set not null;
    end if;
  end if;

  -- created_at
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'book_listings'
      and column_name = 'created_at'
      and is_nullable = 'YES'
  ) then
    if not exists (select 1 from public.book_listings where created_at is null) then
      alter table public.book_listings alter column created_at set not null;
    end if;
  end if;
end $$;

-- 3) Enable RLS
alter table public.book_listings enable row level security;
alter table public.book_listings force row level security;

-- 4) Grants (required for PostgREST exposure)
grant select on public.book_listings to anon, authenticated;
grant insert, update, delete on public.book_listings to authenticated;

-- 5) Policies (idempotent)
do $$
begin
  -- Public read access: only active listings
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'book_listings'
      and policyname = 'book_listings_select_active_public'
  ) then
    create policy book_listings_select_active_public
      on public.book_listings
      for select
      to anon, authenticated
      using (status = 'active');
  end if;

  -- Owner insert
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'book_listings'
      and policyname = 'book_listings_owner_insert'
  ) then
    create policy book_listings_owner_insert
      on public.book_listings
      for insert
      to authenticated
      with check (owner_id = auth.uid());
  end if;

  -- Owner update
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'book_listings'
      and policyname = 'book_listings_owner_update'
  ) then
    create policy book_listings_owner_update
      on public.book_listings
      for update
      to authenticated
      using (owner_id = auth.uid())
      with check (owner_id = auth.uid());
  end if;

  -- Owner delete
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'book_listings'
      and policyname = 'book_listings_owner_delete'
  ) then
    create policy book_listings_owner_delete
      on public.book_listings
      for delete
      to authenticated
      using (owner_id = auth.uid());
  end if;
end $$;

-- 6) Indexes
create index if not exists idx_book_listings_status on public.book_listings(status);
create index if not exists idx_book_listings_created_at_desc on public.book_listings(created_at desc);

