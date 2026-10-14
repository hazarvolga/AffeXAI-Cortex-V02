/** `/<tenant>/admin<path>`; the platform admin tree when no workspace is known. */
export function tenantAdminHref(
  tenant: string | undefined,
  path: string,
): string {
  return tenant
    ? `/${encodeURIComponent(tenant)}/admin${path}`
    : `/admin${path}`;
}
