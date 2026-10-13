const FALLBACK_CONTACT_EMAIL = "info@affexai.tr";

const EARLY_ACCESS_SUBJECT = "Erken erişim talebi";

/** Public contact inbox; overridable per deployment, build-time like every NEXT_PUBLIC_* value. */
export const CONTACT_EMAIL: string =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || FALLBACK_CONTACT_EMAIL;

export function earlyAccessMailto(email: string = CONTACT_EMAIL): string {
  return `mailto:${email}?subject=${encodeURIComponent(EARLY_ACCESS_SUBJECT)}`;
}
