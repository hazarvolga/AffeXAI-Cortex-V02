export type PortalRole =
  | "admin"
  | "customer"
  | "student"
  | "subscriber"
  | "viewer";

export type PortalNavigationAccess = "all" | PortalRole | readonly PortalRole[];

export interface PortalNavigationItem {
  readonly id: string;
  readonly href: `/portal/${string}`;
  readonly label: string;
  readonly access: PortalNavigationAccess;
}

type UnknownRecord = Readonly<Record<string, unknown>>;

const EDUCATION_ROLES = Object.freeze([
  "customer",
  "student",
] as const satisfies readonly PortalRole[]);

/**
 * Canonical portal navigation shared by every viewport.
 *
 * Icons and presentation intentionally live in the shell. Keeping this model
 * free of React and browser APIs makes authorization behavior deterministic and
 * prevents desktop and mobile navigation from drifting apart.
 */
export const PORTAL_NAVIGATION_ITEMS: readonly PortalNavigationItem[] =
  Object.freeze([
    Object.freeze({
      id: "dashboard",
      href: "/portal/dashboard",
      label: "Genel Bakış",
      access: "all",
    }),
    Object.freeze({
      id: "orders",
      href: "/portal/orders",
      label: "Siparişlerim",
      access: "customer",
    }),
    Object.freeze({
      id: "licenses",
      href: "/portal/licenses",
      label: "Lisanslarım",
      access: "customer",
    }),
    Object.freeze({
      id: "support",
      href: "/portal/support",
      label: "Destek Taleplerim",
      access: "customer",
    }),
    Object.freeze({
      id: "knowledge",
      href: "/portal/kb",
      label: "Bilgi Bankası",
      access: "customer",
    }),
    Object.freeze({
      id: "courses",
      href: "/portal/courses",
      label: "Eğitimlerim",
      access: EDUCATION_ROLES,
    }),
    Object.freeze({
      id: "certificates",
      href: "/portal/certificates",
      label: "Sertifikalarım",
      access: EDUCATION_ROLES,
    }),
    Object.freeze({
      id: "newsletter",
      href: "/portal/newsletter",
      label: "Bülten Arşivi",
      access: "all",
    }),
    Object.freeze({
      id: "events",
      href: "/portal/events",
      label: "Etkinlikler",
      access: "all",
    }),
    Object.freeze({
      id: "profile",
      href: "/portal/profile",
      label: "Profilim",
      access: "all",
    }),
  ] satisfies readonly PortalNavigationItem[]);

const asRecord = (value: unknown): UnknownRecord | null =>
  typeof value === "object" && value !== null ? (value as UnknownRecord) : null;

const normalizedRoleName = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
};

const roleNameFrom = (value: unknown): string | null =>
  normalizedRoleName(asRecord(value)?.name);

/** Returns every recognized role source without mutating the user payload. */
export const normalizePortalRoles = (user: unknown): readonly string[] => {
  const userRecord = asRecord(user);
  if (!userRecord) return Object.freeze([]);

  const roleNames: string[] = [];
  const roles = userRecord.roles;

  if (Array.isArray(roles)) {
    roles.forEach((role) => {
      const roleName = roleNameFrom(role);
      if (roleName) roleNames.push(roleName);
    });
  }

  const primaryRoleName = roleNameFrom(userRecord.primaryRole);
  if (primaryRoleName) roleNames.push(primaryRoleName);

  const legacyRoleName = roleNameFrom(userRecord.roleEntity);
  if (legacyRoleName) roleNames.push(legacyRoleName);

  return Object.freeze([...new Set(roleNames)]);
};

export const hasPortalRole = (user: unknown, roleName: string): boolean => {
  const normalizedTarget = normalizedRoleName(roleName);
  return (
    normalizedTarget !== null &&
    normalizePortalRoles(user).includes(normalizedTarget)
  );
};

const hasAnyPortalRole = (
  user: unknown,
  roleNames: readonly PortalRole[],
): boolean => roleNames.some((roleName) => hasPortalRole(user, roleName));

const hasRoleAccess = (
  user: unknown,
  access: PortalNavigationAccess,
): boolean => {
  if (access === "all") return true;
  if (Array.isArray(access)) return hasAnyPortalRole(user, access);
  return hasPortalRole(user, access as PortalRole);
};

const newsletterPreferencesFor = (user: unknown): UnknownRecord | null => {
  const metadata = asRecord(asRecord(user)?.metadata);
  return asRecord(metadata?.newsletterPreferences);
};

const hasNewsletterAccess = (
  user: unknown,
  item: PortalNavigationItem,
): boolean => {
  if (hasPortalRole(user, "customer")) return true;
  if (!hasPortalRole(user, "viewer")) return true;

  const preferences = newsletterPreferencesFor(user);

  if (item.href === "/portal/events") {
    return preferences?.events === true;
  }

  if (item.href === "/portal/newsletter") {
    return (
      preferences?.productUpdates === true ||
      preferences?.events === true ||
      preferences?.promotions === true
    );
  }

  return true;
};

export const canAccessPortalNavigationItem = (
  user: unknown,
  item: PortalNavigationItem,
): boolean =>
  hasRoleAccess(user, item.access) && hasNewsletterAccess(user, item);

/** Produces the single navigation list consumed by desktop and mobile shells. */
export const getPortalNavigation = (
  user: unknown,
): readonly PortalNavigationItem[] =>
  Object.freeze(
    PORTAL_NAVIGATION_ITEMS.filter((item) =>
      canAccessPortalNavigationItem(user, item),
    ),
  );

const normalizedRoutePath = (value: string): string | null => {
  const path = value.split(/[?#]/, 1)[0];
  if (!path.startsWith("/") || path === "/") return path === "/" ? path : null;
  return path.replace(/\/+$/, "");
};

/** Matches an exact route or one of its child routes without prefix collisions. */
export const isPortalRouteActive = (
  pathname: string | null | undefined,
  href: string,
): boolean => {
  if (!pathname || href === "#") return false;

  const currentPath = normalizedRoutePath(pathname);
  const targetPath = normalizedRoutePath(href);
  if (!currentPath || !targetPath) return false;

  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
};
