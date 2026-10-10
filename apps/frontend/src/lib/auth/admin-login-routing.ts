export function protectedLoginPath(
  isAdminRoute: boolean,
  tenantSlug?: string,
): string {
  if (!isAdminRoute) return "/login";
  return tenantSlug
    ? `/${encodeURIComponent(tenantSlug)}/admin/login`
    : "/admin/login";
}

export function tenantAwareAdminFallback(
  roleRedirect: string,
  tenantSlug?: string,
): string {
  if (
    !tenantSlug ||
    (roleRedirect !== "/admin" && !roleRedirect.startsWith("/admin/"))
  ) {
    return roleRedirect;
  }
  return `/${encodeURIComponent(tenantSlug)}${roleRedirect}`;
}

export function safePostLoginRedirect(
  rawRedirect: string | null | undefined,
  fallback: string,
  tenantSlug?: string,
): string {
  if (
    !rawRedirect ||
    !rawRedirect.startsWith("/") ||
    rawRedirect.startsWith("//") ||
    rawRedirect.includes("\\")
  ) {
    return fallback;
  }

  try {
    const target = new URL(rawRedirect, "http://affexai.local");
    if (target.origin !== "http://affexai.local") return fallback;
    if (tenantSlug) {
      const tenantAdminPrefix = `/${encodeURIComponent(tenantSlug)}/admin`;
      const isCurrentTenantAdmin =
        target.pathname === tenantAdminPrefix ||
        target.pathname.startsWith(`${tenantAdminPrefix}/`);
      if (!isCurrentTenantAdmin) return fallback;
    }
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return fallback;
  }
}
