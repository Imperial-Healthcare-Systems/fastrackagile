import type { MetadataRoute } from "next";

const SITE = "https://fastrackagile.com";

// NOTE: the site is currently a single-page hash-router app (#/about, #/courses…),
// so the only distinct, crawlable URL is the homepage. Once the pages are moved to
// real routes (the recommended architecture fix), add each page + course + blog post
// URL here so they can be indexed individually.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
