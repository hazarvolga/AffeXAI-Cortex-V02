import type { MetadataRoute } from "next";
import { PUBLIC_LOCALES } from "@/lib/i18n/public-copy";
import { SITE_URL } from "@/lib/marketing/metadata";
import {
  MARKETING_PAGES,
  languageAlternates,
  marketingPath,
} from "@/lib/marketing/routes";

const absolute = (path: string): string =>
  `${SITE_URL}${path === "/" ? "" : path}`;

/** Public marketing pages in both languages; draft legal pages stay out (noindex). */
export default function sitemap(): MetadataRoute.Sitemap {
  return MARKETING_PAGES.flatMap((page) => {
    const alternates = languageAlternates(page);
    return PUBLIC_LOCALES.map((locale) => ({
      url: absolute(marketingPath(locale, page)),
      changeFrequency: "monthly" as const,
      priority: page === "home" ? 1 : 0.7,
      alternates: {
        languages: { tr: absolute(alternates.tr), en: absolute(alternates.en) },
      },
    }));
  });
}
