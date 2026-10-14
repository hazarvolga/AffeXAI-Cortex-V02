/**
 * Where public CMS form blocks send their data. A block that is not connected
 * to a real endpoint must say so instead of pretending to submit (UX-CONTRACT:
 * success only on a verified result).
 */

export interface FormTargetProps {
  /** Tenant slug that owns the Forms module form. */
  formTenant?: string;
  /** Published form id in the Forms module. */
  formId?: string;
}

export interface FormTarget {
  tenant: string;
  formId: string;
}

export function resolveFormTarget(props: FormTargetProps): FormTarget | null {
  const tenant = props.formTenant?.trim();
  const formId = props.formId?.trim();
  return tenant && formId ? { tenant, formId } : null;
}

export type NewsletterResult = "sent" | "rateLimited" | "error";

const NEWSLETTER_SUBSCRIBE_URL = "/api/email-marketing/subscription/subscribe";
const HTTP_TOO_MANY_REQUESTS = 429;

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

/** Starts the double opt-in flow; the confirmation e-mail completes it. */
export async function subscribeToNewsletter(
  email: string,
  fetchImpl: FetchLike = fetch,
): Promise<NewsletterResult> {
  try {
    const response = await fetchImpl(NEWSLETTER_SUBSCRIBE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      cache: "no-store",
    });
    if (response.ok) return "sent";
    return response.status === HTTP_TOO_MANY_REQUESTS ? "rateLimited" : "error";
  } catch {
    return "error";
  }
}
