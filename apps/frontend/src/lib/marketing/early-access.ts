import type { PublicCopy } from "@/lib/i18n/public-copy";
import { fillTemplate } from "@/lib/i18n/public-copy";

/** Field ids are the backend form's block ids (forms/templates/early-access.json). */
export type EarlyAccessField =
  "contactName" | "email" | "companyName" | "message";

export interface EarlyAccessValues {
  contactName: string;
  email: string;
  companyName: string;
  message: string;
  /** Honeypot: hidden from people, never sent to the backend. */
  website: string;
}

export type EarlyAccessErrors = Partial<Record<EarlyAccessField, string>>;

export const EMPTY_EARLY_ACCESS_VALUES: EarlyAccessValues = {
  contactName: "",
  email: "",
  companyName: "",
  message: "",
  website: "",
};

export const EARLY_ACCESS_FIELD_ORDER: readonly EarlyAccessField[] = [
  "contactName",
  "email",
  "companyName",
  "message",
];

/** Backend caps every string at 2000 characters; names stay well below. */
export const EARLY_ACCESS_LIMITS: Readonly<Record<EarlyAccessField, number>> = {
  contactName: 200,
  email: 254,
  companyName: 200,
  message: 2000,
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type ErrorCopy = PublicCopy["earlyAccess"]["form"]["errors"];

function tooLong(field: EarlyAccessField, value: string, errors: ErrorCopy) {
  const max = EARLY_ACCESS_LIMITS[field];
  return value.trim().length > max
    ? fillTemplate(errors.tooLong, { max })
    : undefined;
}

function requiredError(value: string, message: string): string | undefined {
  return value.trim() ? undefined : message;
}

export function validateEarlyAccess(
  values: EarlyAccessValues,
  errors: ErrorCopy,
): EarlyAccessErrors {
  const email = values.email.trim();
  const emailError =
    requiredError(email, errors.emailRequired) ??
    (EMAIL_PATTERN.test(email) ? undefined : errors.emailInvalid) ??
    tooLong("email", email, errors);
  const result: EarlyAccessErrors = {
    contactName:
      requiredError(values.contactName, errors.nameRequired) ??
      tooLong("contactName", values.contactName, errors),
    email: emailError,
    companyName:
      requiredError(values.companyName, errors.companyRequired) ??
      tooLong("companyName", values.companyName, errors),
    message: tooLong("message", values.message, errors),
  };
  return Object.fromEntries(
    Object.entries(result).filter(([, message]) => message !== undefined),
  ) as EarlyAccessErrors;
}

/** Bots fill every field they find; a filled honeypot is answered with a fake success. */
export function isLikelyBot(values: EarlyAccessValues): boolean {
  return values.website.trim().length > 0;
}

export function toSubmissionData(
  values: EarlyAccessValues,
): Record<string, string> {
  const message = values.message.trim();
  return {
    contactName: values.contactName.trim(),
    email: values.email.trim().toLowerCase(),
    companyName: values.companyName.trim(),
    ...(message ? { message } : {}),
  };
}

/** Stable across key order, so a retry of the same data reuses its idempotency key. */
export function payloadSignature(
  data: Readonly<Record<string, string>>,
): string {
  return JSON.stringify(
    Object.keys(data)
      .sort()
      .map((key) => [key, data[key]]),
  );
}

export function newIdempotencyKey(): string {
  return `early-access-${crypto.randomUUID()}`;
}

export interface EarlyAccessFormTarget {
  tenant: string;
  formId: string;
}

const TENANT_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The published form to post to, or null when the deployment has not configured one. */
export function earlyAccessFormTarget(
  tenant: string | undefined,
  formId: string | undefined,
): EarlyAccessFormTarget | null {
  const cleanTenant = tenant?.trim() ?? "";
  const cleanForm = formId?.trim() ?? "";
  if (!TENANT_PATTERN.test(cleanTenant) || !UUID_PATTERN.test(cleanForm)) {
    return null;
  }
  return { tenant: cleanTenant, formId: cleanForm };
}

/** Build-time configuration, like every NEXT_PUBLIC_* value. */
export const EARLY_ACCESS_FORM_TARGET = earlyAccessFormTarget(
  process.env.NEXT_PUBLIC_EARLY_ACCESS_FORM_TENANT,
  process.env.NEXT_PUBLIC_EARLY_ACCESS_FORM_ID,
);
