import type { Metadata } from "next";
import { getPublicCopy, type PublicLocale } from "@/lib/i18n/public-copy";
import {
  languageAlternates,
  marketingPath,
  type MarketingPage,
} from "./routes";

const FALLBACK_SITE_URL = "https://affexai.tr";

/** Canonical origin for links, Open Graph and the sitemap (build-time). */
export const SITE_URL: string = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || FALLBACK_SITE_URL
).replace(/\/+$/, "");

const OG_LOCALE: Readonly<Record<PublicLocale, string>> = {
  tr: "tr_TR",
  en: "en_US",
};

export function marketingMetadata(
  locale: PublicLocale,
  page: MarketingPage,
): Metadata {
  const { title, description } = getPublicCopy(locale).meta[page];
  const path = marketingPath(locale, page);
  const otherLocale: PublicLocale = locale === "tr" ? "en" : "tr";
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: { canonical: path, languages: languageAlternates(page) },
    openGraph: {
      type: "website",
      siteName: getPublicCopy(locale).brand,
      title,
      description,
      url: path,
      locale: OG_LOCALE[locale],
      alternateLocale: [OG_LOCALE[otherLocale]],
    },
    twitter: { card: "summary", title, description },
  };
}
