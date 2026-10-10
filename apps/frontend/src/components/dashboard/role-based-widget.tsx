'use client';

import { useAuth } from '@/lib/auth/auth-context';
import { ReactNode } from 'react';

interface RoleBasedWidgetProps {
  /** Roles that can see this widget */
  roles: string[];
  /** Widget content */
  children: ReactNode;
  /** Optional: Show widget to users with ANY of the roles (default: true) */
  requireAll?: boolean;
}

/**
 * RoleBasedWidget - Conditionally renders widgets based on user roles
 * 
 * Examples:
 * - <RoleBasedWidget roles={['customer']}><CustomerWidget /></RoleBasedWidget>
 * - <RoleBasedWidget roles={['customer', 'student']}><SharedWidget /></RoleBasedWidget>
 * - <RoleBasedWidget roles={['admin', 'editor']} requireAll={true}><AdminOnlyWidget /></RoleBasedWidget>
 */
export function RoleBasedWidget({ roles, children, requireAll = false }: RoleBasedWidgetProps) {
  const { user, isSuperAdmin } = useAuth();

  // DEBUG: Log user and role checking
  console.log('🎨 RoleBasedWidget check:', {
    requiredRoles: roles,
    user: user?.email,
    hasUser: !!user,
    isSuperAdmin,
    userRoles: user?.roles,
    userRolesCount: user?.roles?.length || 0,
  });

  if (!user) {
    console.log('❌ RoleBasedWidget: No user');
    return null;
  }

  // Super Admin bypass
  if (isSuperAdmin) {
    console.log('✅ RoleBasedWidget: Super Admin bypass granted');
    return <>{children}</>;
  }

  if (!user.roles || user.roles.length === 0) {
    console.log('❌ RoleBasedWidget: No roles found');
    return null;
  }

  const userRoleNames = user.roles.map((r: any) => r.name.toLowerCase());

  const hasAccess = requireAll
    ? roles.every(role => userRoleNames.includes(role.toLowerCase()))
    : roles.some(role => userRoleNames.includes(role.toLowerCase()));

  console.log('🎨 RoleBasedWidget access check:', {
    requiredRoles: roles,
    userRoleNames,
    requireAll,
    hasAccess,
  });

  if (!hasAccess) {
    console.log('❌ RoleBasedWidget: Access denied');
    return null;
  }

  console.log('✅ RoleBasedWidget: Access granted, rendering children');

  return <>{children}</>;
}
