const TENANT_SLUG = /^[A-Za-z0-9_-]{1,128}$/;
const RESERVED_ROUTES = new Set([
  'architecture', 'features', 'manifesto', 'modules', 'pricing', 'chat', 'case-studies',
  'downloads', 'education', 'privacy', 'solutions', 'terms', 'about', 'admin', 'api', 'auth', 'backup-downloads', 'backup-home', 'backup-products',
  'backup-solutions', 'cms', 'cms-component-test', 'cms-demo', 'cms-demo-enhanced',
  'cms-drag-drop-demo', 'cms-responsive-demo', 'complete-profile', 'contact',
  'editorial-console', 'email', 'forgot-password', 'help', 'login', 'media', 'portal',
  'preferences', 'preview', 'products', 'resubscribe', 'signup', 'static', 'support',
  'survey', 'test-dynamic-blocks', 'test-editor', 'test-list', 'test-move',
  'unsubscribe', 'verify-email', 'reset-password', 'accept-invitation',
]);

/** A selector only; identity and tenant authority remain verified by the backend. */
export function requireTenantSlug(value: unknown): string {
  if (typeof value !== 'string' || !TENANT_SLUG.test(value)) {
    throw new Error('Geçerli bir çalışma alanı kodu girin.');
  }
  return value;
}

export function tenantFromPath(pathname: string): string | undefined {
  const [, candidate, section] = pathname.split('/');
  if (!candidate || RESERVED_ROUTES.has(candidate.toLowerCase()) ||
      !['admin', 'portal', 'login', 'signup', 'help'].includes(section) || !TENANT_SLUG.test(candidate)) return undefined;
  return candidate;
}

export function tenantHeaders(tenantId: unknown): Record<'x-tenant-id', string> {
  return { 'x-tenant-id': requireTenantSlug(tenantId) };
}
