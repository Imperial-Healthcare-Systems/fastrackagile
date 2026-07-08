-- ============================================================
--  Fastrack Agile — BACKEND SECURITY FIXES
--  Run once in Supabase → SQL Editor. Safe / idempotent.
--  Addresses the findings from the backend audit.
-- ============================================================

-- ------------------------------------------------------------
-- FIX 1 (CRITICAL): stop learners from making themselves admin.
-- The profiles self-update policy allowed updating ANY column,
-- including `role`. Any logged-in learner could run
--   update profiles set role='admin' where id = auth.uid()
-- from the browser (the anon key is public) and gain full admin.
-- This trigger keeps `role` unchanged unless the caller is already admin.
-- ------------------------------------------------------------
create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    new.role := old.role;   -- silently ignore role changes by non-admins
  end if;
  return new;
end; $$;

drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- ------------------------------------------------------------
-- FIX 2 (MEDIUM): stop learners from self-approving assessment access.
-- The insert policy only checked user_id, so a learner could insert
-- their own row with status='approved' and skip admin approval.
-- Force self-inserted requests to 'pending'. (Admins still update.)
-- ------------------------------------------------------------
drop policy if exists aa_insert on public.assessment_access;
create policy aa_insert on public.assessment_access for insert
  with check (user_id = auth.uid() and status = 'pending');

-- ------------------------------------------------------------
-- FIX 3 (HIGH): stop learners from granting themselves a paid, active
-- enrollment (which unlocks course materials for free).
-- Learners may only create a 'requested' + 'pending' enrollment;
-- only an admin (or the server via the service_role key) may create
-- or move an enrollment to active/paid.
--
-- ⚠️ IMPORTANT: the app currently marks enrollment active+paid from the
-- BROWSER after payment (registerPaid in public/app.js). After this fix
-- that client call will be blocked, so the enrollment must be created
-- SERVER-SIDE in /api/razorpay/verify (using SUPABASE_SERVICE_ROLE_KEY)
-- once the payment signature is verified. Apply this together with that
-- code change — ask Claude to wire it. Until then, leave this commented.
-- ------------------------------------------------------------
-- drop policy if exists enroll_insert on public.enrollments;
-- create policy enroll_insert on public.enrollments for insert
--   with check (
--     public.is_admin() or (
--       user_id = auth.uid() and status = 'requested' and payment_status = 'pending'
--     )
--   );
