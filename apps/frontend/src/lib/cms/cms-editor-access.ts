const CMS_EDIT_PERMISSION = "cms.edit";

interface RoleLike {
  permissions?: readonly string[] | null;
}

export interface CmsEditorCandidate {
  tenantId?: string | null;
  roles?: readonly RoleLike[] | null;
  primaryRole?: RoleLike | null;
  roleEntity?: RoleLike | null;
}

/**
 * Whether the public site may offer a shortcut into content management.
 * Only a UI hint: the admin routes and the backend still enforce authorization.
 */
export function canEditCms(
  user: CmsEditorCandidate | null | undefined,
  isSuperAdmin: boolean,
): boolean {
  if (!user) return false;
  if (isSuperAdmin) return true;
  const roles = [...(user.roles ?? []), user.primaryRole, user.roleEntity];
  return roles.some(
    (role) => role?.permissions?.includes(CMS_EDIT_PERMISSION) ?? false,
  );
}

/** Tenant-scoped CMS page list; legacy `/admin` only for users without a tenant. */
export function cmsPagesPath(user: CmsEditorCandidate): string {
  const tenant = user.tenantId?.trim();
  return tenant
    ? `/${encodeURIComponent(tenant)}/admin/cms/pages`
    : "/admin/cms/pages";
}
