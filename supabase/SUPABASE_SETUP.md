# Fastrack Agile — connecting the Supabase backend

This turns the site from **demo mode** (data saved only in each browser) into a
**real backend**: accounts, enrollments, leads, assessment approvals, blog posts
and certificates are stored in one database and shared across every device.

You'll need ~15 minutes and a free Supabase account.

---

## 1. Create a Supabase project
1. Go to https://supabase.com → **New project**.
2. Pick a name (e.g. `fastrack-agile`), a strong database password, and a region
   close to your users (e.g. **Mumbai / ap-south-1**).
3. Wait for it to finish provisioning.

## 2. Create the database
1. In the project, open **SQL Editor → New query**.
2. Open [`schema.sql`](./schema.sql) from this folder, copy **everything**, paste
   it into the editor, and click **Run**.
3. You should see "Success". This creates all tables, security rules, the
   sign-up trigger, and seeds the 6 courses + 2 sample blog posts.

> The admin email is set inside the schema (`info@fastrackagile.com`). Whoever
> signs up with that address automatically becomes the **admin**. To use a
> different admin address, change it in `schema.sql` **and** in `public/app.js`
> (the `ADMIN_EMAIL` constant) before running.

## 3. Turn on email OTP (6-digit code login)
The site logs users in with a 6-digit email code (no passwords).
1. **Authentication → Providers → Email**: make sure **Email** is enabled and
   "Confirm email" is ON. Enable **Email OTP** if shown.
2. **Authentication → Email Templates → "Magic Link"** (this template is also
   used for OTP): make sure the body contains the code token **`{{ .Token }}`**.
   Add a line like:
   ```
   Your Fastrack Agile login code is: {{ .Token }}
   ```
   (Without `{{ .Token }}` the login screen's 6-digit box won't work.)
3. *(Recommended for production)* **Project Settings → Auth → SMTP**: add your
   own SMTP (e.g. from your domain/email provider). The built-in email is
   rate-limited to a few messages per hour and is only meant for testing.

## 4. Paste your keys into the site
1. In Supabase: **Project Settings → API**. Copy:
   - **Project URL** (looks like `https://xxxxxxxx.supabase.co`)
   - **anon public** key (a long `eyJ...` string — this one is safe to ship)
2. Open `public/app.js` and fill the two constants near the top:
   ```js
   const SUPABASE_URL = "https://xxxxxxxx.supabase.co";
   const SUPABASE_ANON_KEY = "eyJ...your-anon-key...";
   ```
3. Save. That's it — the app auto-detects the keys and switches from demo mode
   to the live database.

## 5. Create the admin account
1. Run the site (`npm run dev`) and open it.
2. Click **Log in / Register**, use your admin email (`info@fastrackagile.com`),
   and enter the 6-digit code from the email.
3. You'll land in the **Admin Console** with all tabs (Enrollments, Assessments,
   Content, Blog, Learners, Leads, Certificates).

---

## What's live after this
- **Accounts & login** (email OTP) — real users, one profile each.
- **Enrollments** — "Register Now" (paid) and "Request enrollment" write to the DB;
  you manage them in Admin → Enrollments; learners see them on their dashboard.
- **Open Assessment access** — student requests + your approve/deny sync across devices.
- **Leads** — contact form, manual add, and Excel/CSV import all save to the DB;
  visible to you in Admin → Leads.
- **Blog** — posts you publish are live for all visitors (drafts/scheduled hidden by RLS).
- **Certificates** — issued certs appear in the learner's dashboard.

## Still to wire (phase 2 — tell me when you want these)
- **Payments made tamper-proof.** Razorpay is currently verified in the browser.
  A Supabase **Edge Function** should create the order and verify the signature
  server-side before unlocking. (Also: paste your Razorpay key to go live.)
- **The "Content" tab** (editing course text, success-story cards, page text)
  still saves to the browser. Blog publishing already uses the DB; the rest of
  the Content tab needs the page-render layer pointed at the DB — a focused
  follow-up.
- **Certificate file uploads** to Supabase Storage (today the field takes a URL).

## Notes
- The **anon key is meant to be public** — your data is protected by the Row
  Level Security policies in `schema.sql`, not by hiding the key.
- Re-running `schema.sql` is safe; it won't duplicate courses/posts or drop data.
- To reset a stuck local demo before switching, clear the site's browser storage.
