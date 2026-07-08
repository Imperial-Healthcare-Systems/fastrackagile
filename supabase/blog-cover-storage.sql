-- ============================================================
--  Blog cover images — Supabase Storage bucket + policies.
--  Run once in Supabase → SQL Editor. Lets admins upload a cover
--  image for a blog post; everyone can view them.
--  (Requires schema.sql to have created public.is_admin().)
-- ============================================================

-- Public bucket that holds blog cover images.
insert into storage.buckets (id, name, public)
values ('blog-covers', 'blog-covers', true)
on conflict (id) do update set public = true;

-- Anyone can view cover images (the blog is public).
drop policy if exists "blog_covers_public_read" on storage.objects;
create policy "blog_covers_public_read" on storage.objects
  for select using (bucket_id = 'blog-covers');

-- Only admins can upload / replace / delete cover images.
drop policy if exists "blog_covers_admin_insert" on storage.objects;
create policy "blog_covers_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'blog-covers' and public.is_admin());

drop policy if exists "blog_covers_admin_update" on storage.objects;
create policy "blog_covers_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'blog-covers' and public.is_admin());

drop policy if exists "blog_covers_admin_delete" on storage.objects;
create policy "blog_covers_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'blog-covers' and public.is_admin());
