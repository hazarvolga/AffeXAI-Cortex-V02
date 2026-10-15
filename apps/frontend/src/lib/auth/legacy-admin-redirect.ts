import { isReservedTenantSlug } from "@affexai/shared-types";

/** Legacy pages that stay at /admin: sign-in flows and pages with no workspace equivalent. */
const SIGN_IN_PAGES: ReadonlySet<string> = new Set([
  "login",
  "signup",
  "forgot-password",
  "unauthorized",
]);
const NO_WORKSPACE_EQUIVALENT: ReadonlySet<string> = new Set([
  "settings/billing",
  "events/email-templates",
  "users/email-templates",
]);

/** Legacy paths whose workspace page has a different shape (slug instead of id, renamed module). */
const PATH_RULES: ReadonlyArray<readonly [RegExp, (rest: string) => string]> = [
  [
    /^email-marketing(\/.*)?$/,
    (rest) => rest.replace(/^email-marketing/, "email"),
  ],
  // Roles are listed, created and edited on the workspace roles page.
  [/^users\/roles(\/.*)?$/, () => "roles"],
  [/^users\/(?!new$|roles$)[^/]+$/, () => "users"],
  [/^events\/(?!new$)[^/]+$/, () => "events"],
];

/**
 * Where a signed-in user's request for the legacy /admin tree belongs in their
 * workspace (`/<tenant>/admin…`), or null when it stays put.
 */
export function legacyAdminTarget(
  pathname: string,
  tenant: string | null,
): string | null {
  if (!tenant) return null;
  const match = pathname.match(/^\/admin(?:\/(.*))?$/);
  if (!match) return null;
  const rest = (match[1] ?? "").replace(/\/+$/, "");
  if (
    SIGN_IN_PAGES.has(rest.split("/")[0]) ||
    NO_WORKSPACE_EQUIVALENT.has(rest)
  )
    return null;
  const rule = PATH_RULES.find(([pattern]) => pattern.test(rest));
  const target = rule ? rule[1](rest) : rest;
  return `/${encodeURIComponent(tenant)}/admin${target ? `/${target}` : ""}`;
}

/**
 * The tenantId claim of a token the backend has already validated. Used only to
 * pick a redirect target; the workspace pages and API still authorise every request.
 */
export function tokenTenant(token: string): string | null {
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    const base64 = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(payload.length / 4) * 4, "=");
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    const claims: unknown = JSON.parse(new TextDecoder().decode(bytes));
    const tenant =
      typeof claims === "object" && claims !== null
        ? (claims as { tenantId?: unknown }).tenantId
        : null;
    return typeof tenant === "string" && tenant && !isReservedTenantSlug(tenant)
      ? tenant
      : null;
  } catch {
    return null;
  }
}
