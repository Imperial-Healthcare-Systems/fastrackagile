"use client";

import { useEffect } from "react";
import { MARKUP } from "./markup";

/**
 * The site is a client-rendered app: a small static shell (icon defs + mount
 * points) plus one runtime script (public/app.js) that renders every view and
 * handles client-side navigation via the History API (clean URLs).
 *
 * This shell is rendered by every route (app/page.tsx for "/", and the catch-all
 * app/[...slug]/page.tsx for every other path) so any URL loads the app, and
 * app.js reads location.pathname to render the right page.
 */
export default function SiteShell() {
  useEffect(() => {
    if (document.getElementById("fastrack-runtime")) return;
    // Expose env config to the runtime script (app.js can't read process.env).
    (window as unknown as { __FA_ENV?: Record<string, string> }).__FA_ENV = {
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
      ADMIN_EMAIL: process.env.NEXT_PUBLIC_ADMIN_EMAIL || "",
      WHATSAPP: process.env.NEXT_PUBLIC_WHATSAPP || "",
      CALENDLY_URL: process.env.NEXT_PUBLIC_CALENDLY_URL || "",
      CALL_FEE: process.env.NEXT_PUBLIC_CALL_FEE || "",
      REGISTER_FEE: process.env.NEXT_PUBLIC_REGISTER_FEE || "",
    };
    if (!document.getElementById("fastrack-questions")) {
      const q = document.createElement("script");
      q.id = "fastrack-questions";
      q.src = "/questions.js";
      document.body.appendChild(q);
    }
    const s = document.createElement("script");
    s.id = "fastrack-runtime";
    s.type = "module";
    s.src = "/app.js";
    document.body.appendChild(s);
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: MARKUP }} />;
}
