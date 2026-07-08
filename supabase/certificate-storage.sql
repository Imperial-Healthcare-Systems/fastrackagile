-- ============================================================
--  Certificate files — Supabase Storage bucket + policies.
--  Run once in Supabase → SQL Editor. Admins upload a learner's
--  certificate file; the learner (and anyone with the link) can view it.
--  (Requires schema.sql to have created public.is_admin().)
-- ============================================================

-- Public bucket that holds issued certificate files (PDF / images).
insert into storage.buckets (id, name, public)
values ('certificates', 'certificates', true)
on conflict (id) do update set public = true;

-- Anyone with the link can view a certificate (learners share these).
drop policy if exists "certificates_public_read" on storage.objects;
create policy "certificates_public_read" on storage.objects
  for select using (bucket_id = 'certificates');

-- Only admins can upload / replace / delete certificate files.
drop policy if exists "certificates_admin_insert" on storage.objects;
create policy "certificates_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'certificates' and public.is_admin());

drop policy if exists "certificates_admin_update" on storage.objects;
create policy "certificates_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'certificates' and public.is_admin());

drop policy if exists "certificates_admin_delete" on storage.objects;
create policy "certificates_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'certificates' and public.is_admin());
