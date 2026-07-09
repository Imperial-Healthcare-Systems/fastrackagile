import type { Metadata } from "next";
import SiteShell from "../site-shell";

const SITE = "https://fastrackagile.com";

const COURSE_TITLES: Record<string, string> = {
  "practical-scrum-launchpad-weekday": "Practical Scrum Launchpad (Weekday)",
  "practical-scrum-launchpad-weekend": "Practical Scrum Launchpad (Weekend)",
  "practical-scrum-interview-mastery": "Practical Scrum Interview Mastery",
  "scrum-certification-program": "Scrum Certification Program",
  "scrum-growth-mentorship": "Scrum Growth Mentorship (On Job Support)",
  "scrum-smartpath": "Scrum SmartPath",
};

const PAGES: Record<string, { title: string; description: string }> = {
  courses: { title: "Scrum Master Programs & Courses in Hyderabad", description: "Explore Fastrack Agile's practical Scrum Master, Product Owner and Agile programs for non-IT professionals — weekday, weekend, certification, mentorship and self-paced tracks." },
  about: { title: "About Fastrack Agile — Meet Ram Choudry", description: "The story of Fastrack Agile (formerly Easy Agile Learning) and founder Balaram (Ram) Choudry, and how non-IT professionals switch into Scrum Master roles." },
  calendar: { title: "Training Calendar — Upcoming Scrum Master Batches", description: "Upcoming live online and in-person Scrum Master training batches in Hyderabad. Reserve your seat." },
  stories: { title: "Success Stories — Real Scrum Master Placements", description: "Real Fastrack Agile learners who switched from non-IT careers into Scrum Master roles across India." },
  resources: { title: "Blog & Resources — Scrum Master Career Guides", description: "Practical guides on switching into IT as a Scrum Master, interview prep, certifications and learning Agile from scratch." },
  blog: { title: "Blog — Scrum Master Career Guides", description: "Practical guides on switching into IT as a Scrum Master, interview prep, certifications and learning Agile from scratch." },
  contact: { title: "Contact Fastrack Agile — Gachibowli, Hyderabad", description: "Get in touch with Fastrack Agile for Scrum Master training in Hyderabad. Call, WhatsApp or email us." },
  privacy: { title: "Privacy Policy", description: "Fastrack Agile privacy policy." },
  terms: { title: "Terms & Conditions", description: "Fastrack Agile terms and conditions." },
  refund: { title: "Refund Policy", description: "Fastrack Agile refund policy." },
};

const NOINDEX = new Set(["admin", "admin-login", "dashboard", "assessment", "login"]);

function titleCase(s: string) {
  return s.replace(/[-/]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

async function fetchPostTitle(slug: string): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const r = await fetch(
      `${url}/rest/v1/blog_posts?slug=eq.${encodeURIComponent(slug)}&select=title&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, next: { revalidate: 300 } },
    );
    if (!r.ok) return null;
    const j = await r.json();
    return Array.isArray(j) && j[0] ? (j[0].title as string) : null;
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string[] }> },
): Promise<Metadata> {
  const { slug = [] } = await params;
  const seg0 = slug[0] || "";
  const canonical = "/" + slug.join("/");
  let title = "Fastrack Agile";
  let description = "Practical, mentor-led Scrum Master and Agile training in Hyderabad for non-IT professionals.";
  let index = true;

  if (NOINDEX.has(seg0)) {
    index = false;
    title = titleCase(seg0);
  } else if (seg0 === "course" && slug[1]) {
    const name = COURSE_TITLES[slug[1]] || titleCase(slug[1]);
    title = `${name} — Scrum Master Program`;
    description = `Join the ${name} program at Fastrack Agile — practical, mentor-led Scrum Master training in Hyderabad for non-IT professionals.`;
  } else if (seg0 === "post" && slug[1]) {
    title = (await fetchPostTitle(slug[1])) || titleCase(slug[1]);
    description = "Read this article on the Fastrack Agile blog — Scrum Master career guidance for non-IT professionals.";
  } else if (PAGES[seg0]) {
    title = PAGES[seg0].title;
    description = PAGES[seg0].description;
  }

  return {
    title,
    description,
    alternates: { canonical },
    robots: index ? undefined : { index: false, follow: false },
    openGraph: { title, description, url: SITE + canonical, type: "website" },
    twitter: { title, description },
  };
}

export default function Page() {
  return <SiteShell />;
}
