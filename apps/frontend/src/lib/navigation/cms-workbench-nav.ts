import { tenantAdminHref } from "./tenant-admin-href";

export interface CmsNavItem {
  label: string;
  href: string;
}

const CMS_SECTIONS: ReadonlyArray<readonly [label: string, path: string]> = [
  ["Genel bakış", ""],
  ["Sayfalar", "/pages"],
  ["Görsel editör", "/editor"],
  ["Şablonlar", "/templates"],
  ["Menüler", "/menus"],
  ["Kategoriler", "/categories"],
  ["Medya", "/media"],
  ["Bileşenler", "/components"],
  ["Bölümler", "/reusable-sections"],
  ["Analitik", "/analytics"],
];

const trimSlash = (path: string): string =>
  path.length > 1 ? path.replace(/\/+$/, "") : path;

export function cmsNavItems(tenant: string): CmsNavItem[] {
  return CMS_SECTIONS.map(([label, path]) => ({
    label,
    href: tenantAdminHref(tenant, `/cms${path}`),
  }));
}

/** The item whose href is the longest prefix of the path; the overview matches only itself. */
export function activeCmsItem(
  items: readonly CmsNavItem[],
  pathname: string,
): CmsNavItem | undefined {
  const path = trimSlash(pathname);
  return items
    .filter((item) => path === item.href || path.startsWith(`${item.href}/`))
    .reduce<CmsNavItem | undefined>(
      (best, item) =>
        !best || item.href.length > best.href.length ? item : best,
      undefined,
    );
}

/** The CMS overview renders the tenant admin shell itself. */
export function isCmsOverview(pathname: string, tenant: string): boolean {
  return trimSlash(pathname) === tenantAdminHref(tenant, "/cms");
}
