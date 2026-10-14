import { hasPlatformAuthority } from "./platform-authority";
import {
  safePostLoginRedirect,
  tenantAwareAdminFallback,
} from "./admin-login-routing";
import {
  getDefaultRedirectForRole,
  isStaffRole,
  type UserRole,
} from "@/lib/permissions/constants";

export interface LoggedInUser {
  tenantId?: string | null;
  isPlatformAdmin?: unknown;
  roleId?: string | null;
  roles?: ReadonlyArray<{ name?: string | null }> | null;
  primaryRole?: { name?: string | null } | null;
  metadata?: {
    isCustomer?: boolean;
    isStudent?: boolean;
    customerNumber?: string | null;
    companyName?: string | null;
    schoolName?: string | null;
    studentId?: string | null;
  } | null;
}

const PORTAL_HOME = "/portal/dashboard";
const PLATFORM_HOME = "/editorial-console";
const COMPLETE_PROFILE = "/complete-profile";

function roleNames(user: LoggedInUser): string[] {
  return [
    user.roleId,
    user.primaryRole?.name,
    ...(user.roles ?? []).map((r) => r.name),
  ].filter(
    (name): name is string => typeof name === "string" && name.length > 0,
  );
}

export function isStaffUser(user: LoggedInUser): boolean {
  return roleNames(user).some(isStaffRole);
}

function needsProfileCompletion(user: LoggedInUser): boolean {
  const meta = user.metadata;
  if (!meta) return false;
  const customerIncomplete =
    meta.isCustomer && (!meta.customerNumber || !meta.companyName);
  const studentIncomplete =
    meta.isStudent && (!meta.schoolName || !meta.studentId);
  return Boolean(customerIncomplete || studentIncomplete);
}

function staffHome(user: LoggedInUser): string {
  const byRole = user.roleId
    ? getDefaultRedirectForRole(user.roleId as UserRole)
    : "/admin";
  const adminPath = byRole.startsWith("/admin") ? byRole : "/admin";
  return tenantAwareAdminFallback(adminPath, user.tenantId ?? undefined);
}

/** Sign-in pages are never a destination: returning there would loop back to /login. */
function isLoginPath(path: string): boolean {
  const pathname = path.split(/[?#]/)[0];
  return /(^|\/)login\/?$/.test(pathname);
}

function withoutLoginTarget(
  requested: string | null | undefined,
): string | null {
  return requested && !isLoginPath(requested) ? requested : null;
}

function portalRedirect(requested: string | null | undefined): string | null {
  const safe = safePostLoginRedirect(withoutLoginTarget(requested), "");
  return safe === "/portal" || safe.startsWith("/portal/") ? safe : null;
}

/**
 * Where a successful login lands. The role decides the shell; a requested
 * `redirect` is honoured only inside that shell (and inside the user's own
 * tenant for staff), so a crafted link cannot move anyone across workspaces.
 */
export function postLoginDestination(
  user: LoggedInUser,
  requestedRedirect?: string | null,
): string {
  if (hasPlatformAuthority(user)) {
    return safePostLoginRedirect(
      withoutLoginTarget(requestedRedirect),
      PLATFORM_HOME,
    );
  }
  if (isStaffUser(user)) {
    return safePostLoginRedirect(
      withoutLoginTarget(requestedRedirect),
      staffHome(user),
      user.tenantId ?? undefined,
    );
  }
  if (needsProfileCompletion(user)) return COMPLETE_PROFILE;
  return portalRedirect(requestedRedirect) ?? PORTAL_HOME;
}
