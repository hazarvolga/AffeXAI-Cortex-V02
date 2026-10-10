/**
 * usePermissions Hook
 *
 * Provides permission checking capabilities based on current user's role.
 * Works with the authentication context to determine access rights.
 */

'use client';

import { useMemo } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import {
  Permission,
  UserRole,
  getRolePermissions,
  roleHasPermission,
  roleHasAnyPermission,
  roleHasAllPermissions,
  canAccessRoute,
} from '@/lib/permissions/constants';

export interface UsePermissionsReturn {
  // Current user's role and permissions
  userRole: UserRole | null;
  permissions: Permission[];

  // Permission checking
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;

  // Route access
  canAccessRoute: (route: string) => boolean;

  // Role checking
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isViewer: boolean;
  isCustomer: boolean;
  isSupportManager: boolean;
  isSupportAgent: boolean;

  // Loading state
  isLoading: boolean;
}

/**
 * Hook to check user permissions based on their role
 *
 * @example
 * ```tsx
 * function AdminButton() {
 *   const { hasPermission, isAdmin } = usePermissions();
 *
 *   if (!hasPermission(Permission.USERS_CREATE)) {
 *     return null;
 *   }
 *
 *   return <Button>Create User</Button>;
 * }
 * ```
 */
export function usePermissions(): UsePermissionsReturn {
  const { user, isSuperAdmin, isLoading } = useAuth();



  // Get user's PRIMARY role (for role shortcuts like isAdmin)
  const userRole = useMemo(() => {
    // NEW: Try primaryRole first (from multi-role system)
    if (user?.primaryRole?.name) {
      const roleName = user.primaryRole.name;
      const matchingRole = Object.values(UserRole).find(
        role => role === roleName || role.toLowerCase() === roleName.toLowerCase()
      );
      if (matchingRole) return matchingRole;
    }

    // FALLBACK: Use legacy roleId for backward compatibility
    if (user?.roleId) {
      const roleValue = user.roleId as string;
      const matchingRole = Object.values(UserRole).find(
        role => role === roleValue || role.toLowerCase() === roleValue.toLowerCase()
      );
      return matchingRole || null;
    }

    return null;
  }, [user?.primaryRole, user?.roleId]);

  // Get COMBINED permissions from ALL user roles (multi-role support)
  // FIXED: Use backend permissions directly instead of frontend mapping
  const permissions = useMemo(() => {
    const allPermissions = new Set<string>();

    // NEW: Get permissions directly from backend role data
    if (user?.roles && user.roles.length > 0) {
      user.roles.forEach(role => {
        // Use backend permissions if available
        if (role.permissions && Array.isArray(role.permissions)) {
          role.permissions.forEach(perm => allPermissions.add(perm));
        }
      });

      const finalPermissions = Array.from(allPermissions) as Permission[];
      return finalPermissions;
    }

    // FALLBACK: Try primaryRole.permissions
    if (user?.primaryRole?.permissions && Array.isArray(user.primaryRole.permissions)) {
      return user.primaryRole.permissions as Permission[];
    }

    // LAST RESORT: Use frontend mapping (backward compatibility)
    if (userRole) {
      const rolePerms = getRolePermissions(userRole);
      return rolePerms;
    }

    return [];
  }, [user?.roles, user?.primaryRole, userRole]);

  // Permission checking functions - now check against COMBINED permissions
  const hasPermission = useMemo(
    () => (permission: Permission): boolean => {
      return permissions.includes(permission);
    },
    [permissions]
  );

  const hasAnyPermission = useMemo(
    () => (requiredPermissions: Permission[]): boolean => {
      return requiredPermissions.some(perm => permissions.includes(perm));
    },
    [permissions]
  );

  const hasAllPermissions = useMemo(
    () => (requiredPermissions: Permission[]): boolean => {
      return requiredPermissions.every(perm => permissions.includes(perm));
    },
    [permissions]
  );

  const canAccess = useMemo(
    () => (route: string): boolean => {
      // Admin has access to everything
      if ([UserRole.ADMIN, UserRole.ORGANIZATION_OWNER, UserRole.ORGANIZATION_ADMIN].includes(userRole as UserRole)) return true;

      // Check if user has any role that can access this route
      if (user?.roles && user.roles.length > 0) {
        return user.roles.some(role => {
          const roleName = role.name;
          const matchingRole = Object.values(UserRole).find(
            r => r === roleName || r.toLowerCase() === roleName.toLowerCase()
          );
          return matchingRole ? canAccessRoute(matchingRole, route) : false;
        });
      }

      // Fallback to primary role
      if (!userRole) return false;
      return canAccessRoute(userRole, route);
    },
    [userRole, user?.roles]
  );

  // Role shortcuts
  const isAdmin = [UserRole.ADMIN, UserRole.ORGANIZATION_OWNER, UserRole.ORGANIZATION_ADMIN].includes(userRole as UserRole) || !!isSuperAdmin;
  const isEditor = userRole === UserRole.EDITOR;
  const isViewer = userRole === UserRole.VIEWER;
  const isCustomer = userRole === UserRole.CUSTOMER;
  const isSupportManager = userRole === UserRole.SUPPORT_MANAGER;
  const isSupportAgent = userRole === UserRole.SUPPORT_AGENT;

  return {
    userRole,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessRoute: canAccess,
    isSuperAdmin: !!isSuperAdmin, // Explicitly from useAuth
    isAdmin,
    isEditor,
    isViewer,
    isCustomer,
    isSupportManager,
    isSupportAgent,
    isLoading,
  };
}

/**
 * Helper hook to check if user can perform specific action
 *
 * @example
 * ```tsx
 * function DeleteButton() {
 *   const canDelete = useCanPerform(Permission.USERS_DELETE);
 *
 *   if (!canDelete) return null;
 *
 *   return <Button variant="destructive">Delete</Button>;
 * }
 * ```
 */
export function useCanPerform(permission: Permission): boolean {
  const { hasPermission } = usePermissions();
  return hasPermission(permission);
}

/**
 * Helper hook to check if user can access a route
 *
 * @example
 * ```tsx
 * function AdminLink() {
 *   const canAccess = useCanAccessRoute('/admin/users');
 *
 *   if (!canAccess) return null;
 *
 *   return <Link href="/admin/users">Users</Link>;
 * }
 * ```
 */
export function useCanAccessRoute(route: string): boolean {
  const { canAccessRoute } = usePermissions();
  return canAccessRoute(route);
}
