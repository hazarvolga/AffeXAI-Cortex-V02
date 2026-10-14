import { isConfiguredPlatformAdmin } from "./platform-admin.policy";

interface MembershipShape {
  id: string;
  tenantId?: string | null;
  organizationId?: string | null;
  organization?: { id: string; slug: string; isActive: boolean } | null;
}

/**
 * Whether a session for this account would be accepted by JwtAuthGuard: the
 * account must belong to the active organisation that owns its tenant, unless
 * it is a configured platform admin. Login uses the same rule so it never
 * issues a token the next request rejects.
 */
export function hasUsableMembership(user: MembershipShape): boolean {
  if (isConfiguredPlatformAdmin(user.id)) return true;
  return Boolean(
    user.organizationId &&
    user.organization &&
    user.organization.id === user.organizationId &&
    user.organization.isActive === true &&
    user.organization.slug === user.tenantId,
  );
}
