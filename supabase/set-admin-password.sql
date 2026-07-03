-- ============================================================
--  Set / reset the ADMIN password (for the /admin-login page)
--  Run in Supabase → SQL Editor. Change the password below first!
-- ============================================================

-- 1) Set the password on the admin auth user and confirm the email.
update auth.users
set encrypted_password = extensions.crypt('Admin@Fastrackagile', extensions.gen_salt('bf')),
    email_confirmed_at  = coalesce(email_confirmed_at, now()),
    updated_at          = now()
where email = 'info@fastrackagile.com';
-- If this reports "UPDATE 0", the admin user doesn't exist yet — create it in
-- Dashboard → Authentication → Users → Add user (email + password + Auto Confirm),
-- then you can skip step 1.

-- 2) Make sure that account's profile is an admin.
update public.profiles set role = 'admin'
where lower(email) = 'info@fastrackagile.com';

-- (If step 2 reports "UPDATE 0", the profile row will be created automatically
--  on first login by the signup trigger with the admin role.)

-- ------------------------------------------------------------
-- Note: crypt()/gen_salt() come from the pgcrypto extension. If the
-- "extensions." prefix errors on your project, try them unqualified:
--   encrypted_password = crypt('YourPassword', gen_salt('bf'))
-- ============================================================
