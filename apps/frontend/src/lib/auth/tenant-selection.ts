import { isReservedTenantSlug } from "@affexai/shared-types";

const TENANT_SLUG = /^[A-Za-z0-9_-]{1,128}$/;
/** A selector only; identity and tenant authority remain verified by the backend. */
export function requireTenantSlug(value: unknown): string {
  if (typeof value !== "string" || !TENANT_SLUG.test(value)) {
    throw new Error("Geçerli bir çalışma alanı kodu girin.");
  }
  return value;
}

export function tenantFromPath(pathname: string): string | undefined {
  const [, candidate, section] = pathname.split("/");
  if (
    !candidate ||
    isReservedTenantSlug(candidate) ||
    !["admin", "portal", "login", "signup", "help"].includes(section) ||
    !TENANT_SLUG.test(candidate)
  )
    return undefined;
  return candidate;
}

export function tenantHeaders(
  tenantId: unknown,
): Record<"x-tenant-id", string> {
  return { "x-tenant-id": requireTenantSlug(tenantId) };
}
