import type { MetadataRoute } from "next";

const SITE = "https://fastrackagile.com";

const STATIC_PATHS = ["", "courses", "about", "calendar", "stories", "resources", "contact", "privacy", "terms", "refund"];
const COURSE_SLUGS = [
  "practical-scrum-launchpad-weekday",
  "practical-scrum-launchpad-weekend",
  "practical-scrum-interview-mastery",
  "scrum-certification-program",
  "scrum-growth-mentorship",
  "scrum-smartpath",
];

async function publishedPostSlugs(): Promise<string[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  try {
    const r = await fetch(`${url}/rest/v1/blog_posts?select=slug`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 3600 },
    });
    if (!r.ok) return [];
    const j = await r.json();
    return Array.isArray(j) ? j.map((p: { slug: string }) => p.slug).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const posts = await publishedPostSlugs();
  const entries: MetadataRoute.Sitemap = [];

  for (const p of STATIC_PATHS) {
    entries.push({
      url: `${SITE}/${p}`,
      lastModified: now,
      changeFrequency: p === "" ? "weekly" : "monthly",
      priority: p === "" ? 1 : p === "courses" ? 0.9 : 0.7,
    });
  }
  for (const slug of COURSE_SLUGS) {
    entries.push({ url: `${SITE}/course/${slug}`, lastModified: now, changeFrequency: "monthly", priority: 0.8 });
  }
  for (const slug of posts) {
    entries.push({ url: `${SITE}/post/${encodeURIComponent(slug)}`, lastModified: now, changeFrequency: "monthly", priority: 0.6 });
  }
  return entries;
}
