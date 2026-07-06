-- ============================================================
--  Adds an "author" column to blog_posts so posts can carry a byline.
--  Run once in Supabase → SQL Editor. Safe to run more than once.
--  Until this runs, the blog still works — the app just saves posts
--  without an author (it retries without the field on a missing column).
-- ============================================================
alter table public.blog_posts
  add column if not exists author text default '';
