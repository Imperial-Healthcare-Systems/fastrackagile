import type { MetadataRoute } from "next";

const SITE = "https://fastrackagile.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // The admin/dashboard/login areas are private app UI, not content pages.
        disallow: ["/admin", "/admin-login", "/dashboard"],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
