-- Create public bucket + RLS policies for book images (production-safe, idempotent).

-- 1) Bucket creation (idempotent)
insert into storage.buckets (id, name, public)
values ('books-images', 'books-images', true)
on conflict (id) do nothing;

-- 2) Policies (idempotent)
do $$
begin
  -- Public read access (only this bucket)
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'books_images_public_read'
  ) then
    create policy books_images_public_read
      on storage.objects
      for select
      using (bucket_id = 'books-images');
  end if;

  -- Authenticated upload (only this bucket)
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'books_images_authenticated_upload'
  ) then
    create policy books_images_authenticated_upload
      on storage.objects
      for insert
      to authenticated
      with check (bucket_id = 'books-images');
  end if;

  -- Owner can update their own files (only this bucket)
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'books_images_owner_update'
  ) then
    create policy books_images_owner_update
      on storage.objects
      for update
      to authenticated
      using (bucket_id = 'books-images' and owner = auth.uid())
      with check (bucket_id = 'books-images' and owner = auth.uid());
  end if;

  -- Owner can delete their own files (only this bucket)
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'books_images_owner_delete'
  ) then
    create policy books_images_owner_delete
      on storage.objects
      for delete
      to authenticated
      using (bucket_id = 'books-images' and owner = auth.uid());
  end if;
end $$;

