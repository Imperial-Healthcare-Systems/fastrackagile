-- ============================================================
--  payments — receipts log for every verified Razorpay payment.
--  Run in Supabase → SQL Editor (once). Requires schema.sql first
--  (uses public.now_ms() and public.is_admin()).
--
--  Rows are written ONLY by the server (/api/razorpay/verify) using the
--  service_role key, which bypasses RLS. There is deliberately NO insert
--  policy for anon/authenticated users, so nobody can forge a payment row.
-- ============================================================
create table if not exists public.payments (
  id          bigint generated always as identity primary key,
  order_id    text,
  payment_id  text unique,          -- Razorpay payment id (idempotent)
  kind        text,                 -- 'call' | 'register'
  slug        text,                 -- course slug, when applicable
  amount      integer,              -- paise (e.g. 9900 = ₹99)
  currency    text default 'INR',
  status      text,                 -- 'captured' / 'authorized' etc.
  method      text,                 -- upi / card / netbanking …
  email       text,
  contact     text,
  user_id     uuid,                 -- set when a logged-in learner paid
  created_at  bigint not null default public.now_ms()
);

create index if not exists payments_created_idx on public.payments (created_at desc);

alter table public.payments enable row level security;

-- Admins can read the log in the panel. (Writes happen via service_role only.)
drop policy if exists pay_admin_read on public.payments;
create policy pay_admin_read on public.payments for select using (public.is_admin());
