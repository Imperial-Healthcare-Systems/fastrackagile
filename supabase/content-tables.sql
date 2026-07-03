-- ============================================================
--  site_content — stores admin-editable Success Stories + Page Text
--  Run in Supabase → SQL Editor (once). Requires schema.sql to have run first
--  (it uses public.now_ms() and public.is_admin()).
--  Courses are edited directly in the `courses` table, so they need nothing here.
-- ============================================================
create table if not exists public.site_content (
  key        text primary key,          -- e.g. 'stories' (JSON) or 'home_hero_title'
  value      text,
  updated_at bigint not null default public.now_ms()
);

alter table public.site_content enable row level security;

-- public can read (the site renders this content for everyone)
drop policy if exists sc_read on public.site_content;
create policy sc_read on public.site_content for select using (true);

-- only admins can write
drop policy if exists sc_admin_write on public.site_content;
create policy sc_admin_write on public.site_content for all
  using (public.is_admin()) with check (public.is_admin());
