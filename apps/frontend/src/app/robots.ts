import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/marketing/metadata";

/** Product and account surfaces are private; only the public site is crawlable. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/portal",
        "/api",
        "/login",
        "/signup",
        "/editorial-console",
        "/preview",
        "/*/admin",
        "/*/portal",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
