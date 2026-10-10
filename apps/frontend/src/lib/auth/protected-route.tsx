/**
 * Protected Route Component
 * 
 * Wraps components/pages that require authentication.
 * Redirects to login if user is not authenticated.
 */

'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { UserRole } from '@affexai/shared-types';
import { useAuth } from './auth-context';

// ============================================================================
// Types
// ============================================================================

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
  redirectTo?: string;
  fallback?: React.ReactNode;
}

// ============================================================================
// Protected Route Component
// ============================================================================

/**
 * Protected Route
 * 
 * Protects routes that require authentication and/or specific roles.
 * 
 * @example
 * ```tsx
 * // Require authentication only
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 * 
 * // Require specific role
 * <ProtectedRoute requiredRole="ADMIN">
 *   <AdminPanel />
 * </ProtectedRoute>
 * 
 * // Require one of multiple roles
 * <ProtectedRoute requiredRoles={["ADMIN", "EDITOR"]}>
 *   <CMSEditor />
 * </ProtectedRoute>
 * ```
 */
export function ProtectedRoute({
  children,
  requiredRole,
  requiredRoles,
  redirectTo = '/login',
  fallback = null,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, hasRole, hasAnyRole } = useAuth();

  useEffect(() => {
    // Wait for auth state to load
    if (isLoading) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      // Store intended destination for redirect after login
      const returnUrl = encodeURIComponent(pathname || '/');
      router.push(`${redirectTo}?returnUrl=${returnUrl}`);
      return;
    }

    // Check role requirements
    if (requiredRole && !hasRole(requiredRole)) {
      // User doesn't have required role, redirect to unauthorized page
      router.push('/unauthorized');
      return;
    }

    if (requiredRoles && !hasAnyRole(requiredRoles)) {
      // User doesn't have any of the required roles
      router.push('/unauthorized');
      return;
    }
  }, [
    isAuthenticated,
    isLoading,
    requiredRole,
    requiredRoles,
    hasRole,
    hasAnyRole,
    router,
    pathname,
    redirectTo,
  ]);

  // Show loading state
  if (isLoading) {
    return <>{fallback}</>;
  }

  // Show nothing while redirecting
  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  // Check role requirements
  if (requiredRole && !hasRole(requiredRole)) {
    return <>{fallback}</>;
  }

  if (requiredRoles && !hasAnyRole(requiredRoles)) {
    return <>{fallback}</>;
  }

  // User is authenticated and authorized
  return <>{children}</>;
}

// ============================================================================
// Higher-Order Component (HOC) Version
// ============================================================================

/**
 * withAuth HOC
 * 
 * Wraps a component to require authentication.
 * 
 * @example
 * ```tsx
 * const ProtectedDashboard = withAuth(Dashboard);
 * const ProtectedAdminPanel = withAuth(AdminPanel, { requiredRole: "ADMIN" });
 * ```
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ProtectedRouteProps, 'children'>
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

// ============================================================================
// Exports
// ============================================================================

export default ProtectedRoute;
