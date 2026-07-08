-- ============================================================
--  Fastrack Agile — Supabase schema
--  Run this ONCE in the Supabase SQL editor (Dashboard → SQL → New query).
--  Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE / idempotent policies.
--
--  Timestamps are stored as epoch-milliseconds (bigint) to match the app.
--  Auth is Supabase email OTP; a trigger auto-creates a profile per user.
--  RLS is enabled on every table — the app uses the public anon key only,
--  so these policies are what actually protect your data.
-- ============================================================

-- ---------- helpers ----------
-- epoch-ms default for app timestamps
create or replace function public.now_ms() returns bigint
  language sql stable as $$ select (extract(epoch from now())*1000)::bigint $$;

-- ============================================================
--  TABLES
-- ============================================================

-- ---------- profiles (1 row per auth user) ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text not null default '',
  email      text not null default '',
  phone      text default '',
  role       text not null default 'learner' check (role in ('learner','admin')),
  created_at bigint not null default public.now_ms()
);

-- ---------- courses ----------
create table if not exists public.courses (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  title      text not null,
  subtitle   text default '',
  mode       text default 'Online',
  duration   text default '',
  schedule   text default '',
  summary    text default '',
  is_active  boolean not null default true,
  sort_order int not null default 0,
  created_at bigint not null default public.now_ms()
);

-- ---------- enrollments ----------
create table if not exists public.enrollments (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  course_id      uuid not null references public.courses(id) on delete cascade,
  status         text not null default 'requested' check (status in ('requested','active','completed','cancelled')),
  payment_status text not null default 'pending'   check (payment_status in ('pending','paid')),
  requested_at   bigint not null default public.now_ms(),
  activated_at   bigint
);
create index if not exists enrollments_user_idx   on public.enrollments(user_id);
create index if not exists enrollments_course_idx on public.enrollments(course_id);

-- ---------- materials (per course; unlocked to active learners) ----------
create table if not exists public.materials (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references public.courses(id) on delete cascade,
  title      text not null,
  type       text default 'link',
  url        text default '',
  visible    boolean not null default true,
  sort_order int not null default 0,
  created_at bigint not null default public.now_ms()
);
create index if not exists materials_course_idx on public.materials(course_id);

-- ---------- certificates ----------
create table if not exists public.certificates (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  course_id   uuid references public.courses(id) on delete set null,
  title       text not null,
  file_path   text default '',
  issued_on   date not null default current_date,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at  bigint not null default public.now_ms()
);
create index if not exists certificates_user_idx on public.certificates(user_id);

-- ---------- leads (contact form / manual / bulk / assessment) ----------
create table if not exists public.leads (
  id         uuid primary key default gen_random_uuid(),
  name       text default '',
  email      text default '',
  phone      text default '',
  message    text default '',
  source     text default 'website',
  created_at bigint not null default public.now_ms()
);
create index if not exists leads_created_idx on public.leads(created_at desc);

-- ---------- assessment_access (Open Assessment gate) ----------
create table if not exists public.assessment_access (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  full_name    text default '',
  email        text default '',
  mobile       text default '',
  status       text not null default 'pending' check (status in ('pending','approved','denied')),
  requested_at bigint not null default public.now_ms(),
  decided_at   bigint
);
create index if not exists assessment_access_user_idx on public.assessment_access(user_id);

-- ---------- blog_posts ----------
create table if not exists public.blog_posts (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  title        text not null,
  author       text default '',
  excerpt      text default '',
  cover        text default '',
  body         text default '',
  status       text not null default 'draft' check (status in ('draft','published')),
  publish_at   bigint,
  published_at bigint,
  created_at   bigint not null default public.now_ms()
);
create index if not exists blog_posts_pub_idx on public.blog_posts(published_at desc);

-- ============================================================
--  AUTH → PROFILE TRIGGER
--  Creates a profile row when a user signs up. The admin email is
--  auto-granted the 'admin' role — change it to your admin address.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'phone', ''),
    case when lower(new.email) = lower('info@fastrackagile.com') then 'admin' else 'learner' end
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- is-admin helper (used by policies)
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ============================================================
--  ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles          enable row level security;
alter table public.courses           enable row level security;
alter table public.enrollments       enable row level security;
alter table public.materials         enable row level security;
alter table public.certificates      enable row level security;
alter table public.leads             enable row level security;
alter table public.assessment_access enable row level security;
alter table public.blog_posts        enable row level security;

-- ---- profiles ----
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select
  using (id = auth.uid() or public.is_admin());
drop policy if exists profiles_self_insert on public.profiles;
create policy profiles_self_insert on public.profiles for insert
  with check (id = auth.uid());
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- ---- courses (public read; admin write) ----
drop policy if exists courses_read on public.courses;
create policy courses_read on public.courses for select using (true);
drop policy if exists courses_admin_write on public.courses;
create policy courses_admin_write on public.courses for all
  using (public.is_admin()) with check (public.is_admin());

-- ---- enrollments ----
drop policy if exists enroll_read on public.enrollments;
create policy enroll_read on public.enrollments for select
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists enroll_insert on public.enrollments;
create policy enroll_insert on public.enrollments for insert
  with check (user_id = auth.uid() or public.is_admin());
drop policy if exists enroll_admin_update on public.enrollments;
create policy enroll_admin_update on public.enrollments for update
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists enroll_admin_delete on public.enrollments;
create policy enroll_admin_delete on public.enrollments for delete
  using (public.is_admin());

-- ---- materials (admin, or active-enrolled learner, sees visible) ----
drop policy if exists materials_read on public.materials;
create policy materials_read on public.materials for select using (
  public.is_admin() or (
    visible and exists (
      select 1 from public.enrollments e
      where e.course_id = materials.course_id and e.user_id = auth.uid() and e.status = 'active'
    )
  )
);
drop policy if exists materials_admin_write on public.materials;
create policy materials_admin_write on public.materials for all
  using (public.is_admin()) with check (public.is_admin());

-- ---- certificates ----
drop policy if exists certs_read on public.certificates;
create policy certs_read on public.certificates for select
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists certs_admin_write on public.certificates;
create policy certs_admin_write on public.certificates for all
  using (public.is_admin()) with check (public.is_admin());

-- ---- leads (anyone can submit; only admin can read/manage) ----
drop policy if exists leads_insert on public.leads;
create policy leads_insert on public.leads for insert with check (true);
drop policy if exists leads_admin_read on public.leads;
create policy leads_admin_read on public.leads for select using (public.is_admin());
drop policy if exists leads_admin_write on public.leads;
create policy leads_admin_write on public.leads for all
  using (public.is_admin()) with check (public.is_admin());

-- ---- assessment_access ----
drop policy if exists aa_read on public.assessment_access;
create policy aa_read on public.assessment_access for select
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists aa_insert on public.assessment_access;
create policy aa_insert on public.assessment_access for insert
  with check (user_id = auth.uid());
drop policy if exists aa_admin_update on public.assessment_access;
create policy aa_admin_update on public.assessment_access for update
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists aa_admin_delete on public.assessment_access;
create policy aa_admin_delete on public.assessment_access for delete
  using (public.is_admin());

-- ---- blog_posts (public sees live posts; admin sees all + writes) ----
drop policy if exists blog_read on public.blog_posts;
create policy blog_read on public.blog_posts for select using (
  public.is_admin() or (
    status = 'published' and (publish_at is null or publish_at <= public.now_ms())
  )
);
drop policy if exists blog_admin_write on public.blog_posts;
create policy blog_admin_write on public.blog_posts for all
  using (public.is_admin()) with check (public.is_admin());

-- ============================================================
--  SEED — the 6 courses (slugs must match the app) + 2 sample posts
--  Idempotent via ON CONFLICT (slug).
-- ============================================================
insert into public.courses (slug,title,subtitle,mode,duration,schedule,summary,sort_order) values
 ('practical-scrum-launchpad-weekday','Practical Scrum Launchpad (Weekday)','Deep Diving into Scrum','Online','1 Month','Mon–Fri · 6:45–8:15 AM IST (90 min)','Go beyond theory with real-world Scrum Master skills. A 4-phase model takes you from learning to a 2-week Jira sprint simulation to mock interviews and placement readiness.',1),
 ('practical-scrum-launchpad-weekend','Practical Scrum Launchpad (Weekend)','Weekend Classes','Online','1 Month','Sat & Sun · 8:30–10:30 AM IST','The full Launchpad program for working professionals who can only train on weekends — same practical, hands-on Scrum Master path.',2),
 ('practical-scrum-interview-mastery','Practical Scrum Interview Mastery','Mock Practice Bootcamp','Online','1 Week','Mon–Fri · 10:15–11:30 AM IST','A focused bootcamp for trained professionals who know the theory but freeze in interviews. Real-time Scrum Master interview simulation with daily live practice, situational and behavioural questions, and structured feedback — so you walk in confident and convert interviews into offers.',3),
 ('scrum-certification-program','Scrum Certification Program','Global Certification from ScrumStudy','Offline','2 Days','2 Days · 10 AM–6 PM IST','An offline, instructor-led program leading to a globally recognised ScrumStudy certification, backed by practical training.',4),
 ('scrum-growth-mentorship','Scrum Growth Mentorship','For pre-qualified professionals','Online','30 Days','Flexible timings','A personal mentorship program for pre-qualified professionals — one-on-one guidance from Ram to grow into and beyond the Scrum Master role.',5),
 ('scrum-smartpath','Scrum SmartPath','Self-Learning Module','Online','365 Days','Self-paced','A self-paced learning module with a full year of access — learn Scrum on your own schedule with structured materials.',6)
on conflict (slug) do nothing;

insert into public.blog_posts (slug,title,excerpt,status,publish_at,published_at,body) values
 ('how-to-become-a-scrum-master-without-it-background','How to become a Scrum Master without an IT background','You don''t need to code. Here''s the exact path non-IT professionals take to land a Scrum Master role — and where most people get stuck.','published',public.now_ms(),public.now_ms(),
  E'The biggest myth about breaking into IT is that you need to write code. You don''t.\n\n## Scrum Master is a people role\n\nAt its core, the Scrum Master role is about facilitation, communication and helping a team deliver. Your experience coordinating people transfers directly.\n\n## Where people get stuck\n\nMost self-learners stop at theory. The fix is **doing** — a real sprint simulation and rehearsed interviews.'),
 ('csm-vs-psm-which-scrum-certification-is-worth-it','CSM vs PSM: which Scrum certification is actually worth it?','A quick, honest comparison of the two most common Scrum Master certifications — and what recruiters in India really look for.','published',public.now_ms(),public.now_ms(),
  E'Both CSM and PSM are respected. Here''s the short version.\n\n## CSM\n\nInstructor-led, two-day course, then an exam.\n\n## PSM\n\nSelf-study, tougher exam, no mandatory course.\n\n## What actually matters\n\nRecruiters care far more about whether you can **do the job** than which badge you hold.')
on conflict (slug) do nothing;

-- ============================================================
--  DONE. Next: create a Storage bucket named "certificates" (public)
--  from Dashboard → Storage if/when you wire certificate file uploads.
-- ============================================================
