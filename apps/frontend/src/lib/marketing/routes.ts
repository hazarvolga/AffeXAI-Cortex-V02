import type { PublicLocale } from "@/lib/i18n/public-copy";

export type MarketingPage =
  "home" | "modules" | "howItWorks" | "earlyAccess" | "contact";

/**
 * Turkish lives at the root; English under `/en` (decision D1). `en` is a
 * reserved tenant slug so the prefix never collides with `[tenant]`.
 */
const PATHS: Readonly<Record<PublicLocale, Record<MarketingPage, string>>> = {
  tr: {
    home: "/",
    modules: "/moduller",
    howItWorks: "/nasil-calisir",
    earlyAccess: "/erken-erisim",
    contact: "/iletisim",
  },
  en: {
    home: "/en",
    modules: "/en/modules",
    howItWorks: "/en/how-it-works",
    earlyAccess: "/en/early-access",
    contact: "/en/contact",
  },
};

export const MARKETING_PAGES = Object.keys(PATHS.tr) as MarketingPage[];

export const EARLY_ACCESS_FORM_ANCHOR = "basvuru";

export function marketingPath(
  locale: PublicLocale,
  page: MarketingPage,
): string {
  return PATHS[locale][page];
}

/** hreflang map for a page; Turkish is the x-default. */
export function languageAlternates(
  page: MarketingPage,
): Record<"tr" | "en" | "x-default", string> {
  return {
    tr: PATHS.tr[page],
    en: PATHS.en[page],
    "x-default": PATHS.tr[page],
  };
}

export function earlyAccessFormPath(locale: PublicLocale): string {
  return `${PATHS[locale].earlyAccess}#${EARLY_ACCESS_FORM_ANCHOR}`;
}
