import { tenantFromPath, tenantHeaders } from '@/lib/auth/tenant-selection';

export function helpTenantId(): string | undefined {
  return typeof window === 'undefined' ? undefined : tenantFromPath(window.location.pathname);
}

export function helpRequestHeaders(): Record<'x-tenant-id', string> {
  return tenantHeaders(helpTenantId());
}

export function helpHref(path: string): string {
  const tenantId = helpTenantId();
  return tenantId ? `/${tenantId}${path}` : path;
}
