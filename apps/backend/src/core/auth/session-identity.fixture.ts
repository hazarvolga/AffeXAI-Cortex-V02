/**
 * Test identities for JwtAuthGuard: a session is accepted only for a member of
 * the active organisation that owns the tenant (see session-eligibility.ts).
 * Identities without a tenant are returned unchanged and stay rejected.
 */
export function withMembership<T extends { tenantId?: string | null }>(
  identity: T,
) {
  if (!identity.tenantId) return identity;
  const organizationId = `org-${identity.tenantId}`;
  return {
    organizationId,
    organization: {
      id: organizationId,
      slug: identity.tenantId,
      isActive: true,
    },
    ...identity,
  };
}
