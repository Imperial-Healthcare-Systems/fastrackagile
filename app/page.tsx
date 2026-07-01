"use client";

import { useEffect } from "react";
import { MARKUP } from "./markup";

/**
 * The original site is a client-rendered SPA: a tiny static shell (SVG icon
 * defs + #site-header / #app / #site-footer mount points) plus one large
 * ES-module script that renders every page and handles hash routing.
 *
 * We keep that intact — the shell is injected as HTML, then the runtime
 * script (served from /public/app.js) is appended after mount so the mount
 * points exist before it runs.
 */
export default function Page() {
  useEffect(() => {
    if (document.getElementById("fastrack-runtime")) return;
    // Question bank for the Open Assessment (sets window.SCRUM_QA). Loaded as a
    // classic script before the module runtime; the assessment reads it lazily.
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
