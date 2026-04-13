-- Supabase Storage: product images bucket + RLS policies
--
-- How to use:
-- 1) Open Supabase Dashboard → SQL Editor
-- 2) Paste and run this file (or run it via your migration process)
--
-- This creates a bucket named 'product-images' and configures:
-- - Public read access for images in that bucket
-- - Admin-only insert/update/delete (uses public.is_admin())
--
-- Notes:
-- - Make sure your app has public.is_admin() defined (it is in database/schema.sql).
-- - If you prefer a private bucket, set public=false and remove the public read policy.

begin;

-- NOTE:
-- On Supabase, `storage.objects` is owned/managed by the platform and RLS is normally already enabled.
-- If you run this SQL as a restricted DB role (not the owner), `ALTER TABLE storage.objects ...` will fail with:
--   "must be owner of table objects"
-- So we intentionally do NOT run any ALTER TABLE here.

-- Create (or update) bucket
do $$
begin
  insert into storage.buckets (id, name, public)
  values ('product-images', 'product-images', true)
  on conflict (id) do update
  set name = excluded.name,
      public = excluded.public;
exception
  when insufficient_privilege then
    raise notice 'No privilege to insert/update storage.buckets. Create the bucket in Dashboard → Storage → New bucket (name: product-images, public: true), then re-run the policy section as an owner/postgres role.';
end $$;

-- Policies (idempotent)

do $$
begin
  drop policy if exists "Public read product images" on storage.objects;
  create policy "Public read product images"
  on storage.objects
  for select
  using (bucket_id = 'product-images');
exception
  when insufficient_privilege then
    raise notice 'No privilege to create policies on storage.objects. Run this script in Supabase SQL Editor as the postgres/owner role.';
end $$;

-- Admin-only write access

do $$
begin
  drop policy if exists "Admin insert product images" on storage.objects;
  create policy "Admin insert product images"
  on storage.objects
  for insert
  with check (
    bucket_id = 'product-images'
    and public.is_admin()
  );
exception
  when insufficient_privilege then
    raise notice 'No privilege to create insert policy on storage.objects. Run in Supabase SQL Editor as postgres/owner.';
end $$;

do $$
begin
  drop policy if exists "Admin update product images" on storage.objects;
  create policy "Admin update product images"
  on storage.objects
  for update
  using (
    bucket_id = 'product-images'
    and public.is_admin()
  )
  with check (
    bucket_id = 'product-images'
    and public.is_admin()
  );
exception
  when insufficient_privilege then
    raise notice 'No privilege to create update policy on storage.objects. Run in Supabase SQL Editor as postgres/owner.';
end $$;

do $$
begin
  drop policy if exists "Admin delete product images" on storage.objects;
  create policy "Admin delete product images"
  on storage.objects
  for delete
  using (
    bucket_id = 'product-images'
    and public.is_admin()
  );
exception
  when insufficient_privilege then
    raise notice 'No privilege to create delete policy on storage.objects. Run in Supabase SQL Editor as postgres/owner.';
end $$;

commit;
