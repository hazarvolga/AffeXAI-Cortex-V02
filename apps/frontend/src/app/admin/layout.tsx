'use client';

import React, { ReactNode, useEffect, useCallback } from "react";
import { CollapsibleDashboardSidebar } from "@/components/admin/collapsible-sidebar";
import { DashboardHeader } from "@/components/admin/dashboard-header";
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useDesignTokens } from '@/providers/DesignTokensProvider';
import { useUserSync } from '@/hooks/useUserSync';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/hooks/use-toast';
import { User } from '@affexai/shared-types';
import { isStaffRole, isPortalRole } from '@/lib/permissions/constants';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { setContext, setMode } = useDesignTokens();
  const { user: authUser, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // Don't show sidebar and header on login page
  const isLoginPage = pathname === '/admin/login' || pathname === '/admin/login/';

  /**
   * CRITICAL: Profile completion check for non-staff roles
   * NOTE: Authentication is handled by middleware - this ONLY checks profile completion
   * Don't redirect if authUser is null - middleware already handles auth, just wait for user data
   */
  useEffect(() => {
    if (isLoginPage) return; // Skip check on login page

    // Wait for AuthContext to load, or if loading is done but no user, just skip
    // Middleware has already validated JWT, so if we're here, user IS authenticated
    if (authLoading || !authUser) return;

    const metadata = authUser?.metadata;

    // CRITICAL: Staff roles (Admin, Editor, Support, etc.) should NEVER be redirected to profile completion
    // They have admin panel access and don't need customer/student profile data
    // CRITICAL: Staff roles (Admin, Editor, Support, etc.) should NEVER be redirected to profile completion
    // They have admin panel access and don't need customer/student profile data
    // Check if user has any staff role from metadata or role objects

    // CRITICAL: Super Admin check (highest priority)
    const isSuperAdmin =
      authUser?.roleNames?.includes('SuperAdmin') ||
      authUser?.roleNames?.includes('super_admin') ||
      authUser?.primaryRole?.name?.toLowerCase() === 'superadmin' ||
      authUser?.roles?.some((r: any) => r.name?.toLowerCase() === 'superadmin');

    const hasStaffRole =
      isSuperAdmin || // Super Admin always has staff access
      authUser?.roles?.some((r: any) => isStaffRole(r.name));

    // CRITICAL SECURITY FIX: Redirect non-staff users to portal
    if (!hasStaffRole) {
      console.warn('⛔ Admin Layout: Non-staff user attempted access. Redirecting to portal.');
      router.push('/portal/dashboard');
      return;
    }

    if (hasStaffRole) {
      console.log('✅ Admin Layout: Staff role detected, skipping profile completion check');
      return; // Staff users bypass profile completion entirely
    }

    // ONLY check profile if user selected customer or student role during signup
    // If user selected ONLY subscriber or nothing, no profile completion needed
    const isCustomer = metadata?.isCustomer;
    const isStudent = metadata?.isStudent;

    // Only redirect if they ARE customer/student but profile is incomplete
    const customerIncomplete = isCustomer && !metadata?.customerNumber;
    const studentIncomplete = isStudent && (!metadata?.schoolName || !metadata?.studentId);

    if (customerIncomplete || studentIncomplete) {
      console.log('⚠️ Admin Layout: Profile incomplete, redirecting to /complete-profile');
      toast({
        title: 'Profil Tamamlama Gerekli',
        description: 'Admin paneline erişmek için önce profilinizi tamamlamalısınız',
        variant: 'destructive',
      });
      router.push('/complete-profile');
    }
  }, [isLoginPage, authUser, authLoading, router, toast]);

  /**
   * Handle role changes in admin panel
   */
  const handleRoleChange = useCallback((newUser: User, oldUser: User) => {
    console.log('🔄 Admin panel - Role change detected', {
      old: oldUser.roleNames,
      new: newUser.roleNames,
    });

    // Check if user lost all staff roles and only has customer roles
    const hasStaffRole = newUser.roles?.some((r: any) => isStaffRole(r.name));
    const hasPortalRole = newUser.roles?.some((r: any) => isPortalRole(r.name));

    // SCENARIO: Demoted from staff to customer-only → redirect to portal
    if (!hasStaffRole && hasPortalRole) {
      console.log('📉 User demoted to customer-only → redirecting to portal');
      toast({
        title: "Rolünüz Değişti",
        description: "Kullanıcı rolüne geçtiniz. Portal'a yönlendiriliyorsunuz...",
        variant: "roleChange",
        duration: 3000,
      });

      setTimeout(() => {
        router.push('/portal/dashboard');
      }, 1500);
    } else {
      // Show toast and refresh to update sidebar permissions
      console.log('🔄 Showing role change toast before reload');
      toast({
        title: "Rolünüz Güncellendi",
        description: `Yeni rolünüz: ${newUser.roleNames?.join(', ')}. Sayfa yenileniyor...`,
        variant: "roleChange",
        duration: 2000,
      });

      // Wait for toast to be visible before reload
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }, [toast, router]);

  /**
   * Handle sync errors
   */
  const handleSyncError = useCallback((error: Error) => {
    console.error('❌ Admin panel - User sync error:', error);
    // Silently handle errors in admin panel
  }, []);

  /**
   * Setup user sync (only when authenticated)
   */
  useUserSync({
    enabled: !isLoginPage,
    onRoleChange: handleRoleChange,
    onError: handleSyncError,
    pollInterval: 10 * 1000, // 10 seconds for testing (change to 3 * 60 * 1000 for production)
  });

  // Set admin context and dark mode as default
  useEffect(() => {
    setContext('admin');

    // Only set dark mode if user hasn't made a choice (theme is still 'system')
    if (theme === 'system') {
      setTheme('dark');
      setMode('dark');
    }
  }, []); // Empty dependency - only run once on mount

  // Don't show sidebar and header on login page or BCC pages
  const isBccPage = pathname.startsWith('/admin/brand');

  if (isLoginPage) {
    return children;
  }

  if (isBccPage) {
    return (
      <div className="theme-admin min-h-screen w-full">
        {children}
      </div>
    );
  }

  return (
    <div className="theme-admin flex min-h-screen w-full">
      <CollapsibleDashboardSidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <DashboardHeader />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/40">
          {children}
        </main>
      </div>
    </div>
  );
}