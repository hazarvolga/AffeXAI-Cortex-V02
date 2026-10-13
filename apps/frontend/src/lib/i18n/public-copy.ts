/**
 * Copy for the public surface (marketing, legal, CMS fallbacks, 404).
 *
 * Turkish lives at the site root, English under `/en` (decision D1). Both
 * dictionaries implement the same interface, so a missing translation is a
 * type error rather than a blank on the page.
 */
import { en } from "./copy/en";
import { tr } from "./copy/tr";

export type PublicLocale = "tr" | "en";

export const PUBLIC_LOCALES: readonly PublicLocale[] = ["tr", "en"];

export const DEFAULT_PUBLIC_LOCALE: PublicLocale = "tr";

export type PublicModuleStatus = "early-access" | "in-development" | "roadmap";

export type CmsPageKey = "about" | "support" | "contact" | "products";

export type MarketingMetaKey =
  "home" | "modules" | "howItWorks" | "earlyAccess" | "contact";

export interface PageMeta {
  title: string;
  description: string;
}

export interface TitledText {
  title: string;
  body: string;
}

export interface PublicCopy {
  brand: string;
  language: {
    name: string;
    switchTo: string;
    switchLabel: string;
  };
  nav: {
    label: string;
    modules: string;
    howItWorks: string;
    earlyAccess: string;
    contact: string;
    login: string;
    openMenu: string;
    closeMenu: string;
    menuTitle: string;
    skipToContent: string;
  };
  requestAccess: string;
  productPhase: string;
  moduleStatus: Record<PublicModuleStatus, string>;
  moduleStatusNote: string;
  footer: {
    tagline: string;
    siteLabel: string;
    legalLabel: string;
    privacy: string;
    terms: string;
    rights: string;
  };
  meta: Record<MarketingMetaKey, PageMeta>;
  cmsMeta: Record<CmsPageKey, PageMeta>;
  home: {
    title: string;
    lead: string;
    secondaryCta: string;
    problem: { title: string; items: readonly TitledText[] };
    loop: {
      title: string;
      intro: string;
      steps: readonly TitledText[];
      link: string;
    };
    status: { title: string; body: string; link: string };
    principles: { title: string; items: readonly TitledText[] };
    finalCta: TitledText;
  };
  modules: {
    title: string;
    lead: string;
    legendTitle: string;
    legend: Record<PublicModuleStatus, string>;
    summary: string;
    cta: TitledText;
  };
  howItWorks: {
    title: string;
    lead: string;
    layersTitle: string;
    layers: readonly TitledText[];
    loopTitle: string;
    safeguards: { title: string; items: readonly string[] };
    notYet: { title: string; body: string; link: string };
    cta: TitledText;
  };
  earlyAccess: {
    eyebrow: string;
    title: string;
    lead: string;
    pricingNote: string;
    stepsTitle: string;
    steps: readonly string[];
    cta: string;
    ctaHint: string;
    form: {
      title: string;
      intro: string;
      name: string;
      email: string;
      company: string;
      message: string;
      messageHint: string;
      optional: string;
      honeypot: string;
      privacyNote: string;
      privacyLink: string;
      submit: string;
      submitting: string;
      successTitle: string;
      successBody: string;
      errorTitle: string;
      errorBody: string;
      rateLimited: string;
      unavailable: string;
      errorSummary: string;
      errors: {
        nameRequired: string;
        emailRequired: string;
        emailInvalid: string;
        companyRequired: string;
        tooLong: string;
      };
    };
  };
  contact: {
    title: string;
    lead: string;
    emailLabel: string;
    earlyAccess: TitledText & { link: string };
    existing: TitledText & { help: string; login: string };
  };
  cmsPage: {
    pendingTitle: string;
    pendingBody: string;
    errorTitle: string;
    errorBody: string;
    backHome: string;
    editorLink: string;
  };
  legalDraft: TitledText;
  notFound: {
    code: string;
    title: string;
    body: string;
    backHome: string;
    contact: string;
  };
  help: {
    emptyTitle: string;
    emptyBody: string;
    errorTitle: string;
    errorBody: string;
    retry: string;
    noResultsTitle: string;
    noResultsBody: string;
    clearSearch: string;
    contactSupport: string;
  };
}

const PUBLIC_COPY: Readonly<Record<PublicLocale, PublicCopy>> = { tr, en };

export function getPublicCopy(
  locale: PublicLocale = DEFAULT_PUBLIC_LOCALE,
): PublicCopy {
  return PUBLIC_COPY[locale];
}

/** Replaces `{name}` placeholders; unknown names stay visible on purpose. */
export function fillTemplate(
  template: string,
  values: Readonly<Record<string, string | number>>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match,
  );
}
