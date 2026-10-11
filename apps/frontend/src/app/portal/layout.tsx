"use client";

import { useCallback, useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@affexai/shared-types";
import { PortalEditorialShell } from "@/components/portal/PortalEditorialShell";
import { normalizePortalRoles } from "@/components/portal/portal-navigation";
import { normalizeSyncedUser } from "@/components/portal/portal-user-normalization";
import { useAuth } from "@/lib/auth/auth-context";
import { useUserSync } from "@/hooks/useUserSync";
import { useToast } from "@/hooks/use-toast";
import { isStaffRole } from "@/lib/permissions/constants";

function isStaffUser(user: unknown): boolean {
  const roles = normalizePortalRoles(user);
  return roles.some(
    (role) =>
      isStaffRole(role) || role === "superadmin" || role === "super_admin",
  );
}

export default function PortalLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { user: authUser, updateUser, isLoading: authLoading } = useAuth();
  const isLoginPage = pathname === "/portal/login";
  const shouldRedirectToLogin = !isLoginPage && !authLoading && !authUser;
  const shouldRedirectToAdmin =
    !isLoginPage &&
    !authLoading &&
    Boolean(authUser) &&
    isStaffUser(authUser) &&
    pathname === "/portal/dashboard";

  const handleRoleChange = useCallback(
    (newUser: User, oldUser: User) => {
      toast({
        title: "Yetkiniz güncellendi",
        description:
          "Portal erişiminiz yeni rol ve izinlerinize göre yenilendi.",
        variant: "roleChange",
        duration: 5000,
      });

      if (isStaffUser(newUser) && !isStaffUser(oldUser)) {
        toast({
          title: "Yönetim erişimi açıldı",
          description: "Yönetim alanına yönlendiriliyorsunuz.",
          variant: "roleChange",
          duration: 3000,
        });
        window.setTimeout(() => router.push("/admin"), 1500);
      }
    },
    [router, toast],
  );

  const handleUserUpdate = useCallback(
    (newUser: User) => {
      updateUser(normalizeSyncedUser(newUser));
    },
    [updateUser],
  );

  const handleSyncError = useCallback(
    (error: Error) => {
      if (
        !error.message.includes("Network") &&
        !error.message.includes("fetch")
      ) {
        toast({
          title: "Erişim bilgileri güncellenemedi",
          description:
            "Mevcut oturumunuzla devam edebilirsiniz. Sistem yeniden deneyecek.",
          variant: "destructive",
          duration: 3000,
        });
      }
    },
    [toast],
  );

  useUserSync({
    enabled: !isLoginPage && !authLoading && Boolean(authUser),
    onUserUpdate: handleUserUpdate,
    onRoleChange: handleRoleChange,
    onError: handleSyncError,
  });

  useEffect(() => {
    if (shouldRedirectToLogin) {
      router.replace("/login");
      return;
    }
    if (shouldRedirectToAdmin) {
      const timeout = window.setTimeout(() => router.replace("/admin"), 1000);
      return () => window.clearTimeout(timeout);
    }
  }, [router, shouldRedirectToAdmin, shouldRedirectToLogin]);

  if (authLoading || shouldRedirectToLogin || shouldRedirectToAdmin) {
    return (
      <div
        className="theme-portal flex min-h-dvh items-center justify-center bg-[var(--cortex-canvas)] text-[var(--cortex-text)]"
        role="status"
      >
        <div className="text-center">
          <div
            className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--cortex-line-strong)] border-t-[var(--cortex-accent)]"
            aria-hidden="true"
          />
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--cortex-text-muted)]">
            Erişim doğrulanıyor
          </p>
        </div>
      </div>
    );
  }

  if (isLoginPage) {
    return <div className="theme-portal min-h-dvh w-full">{children}</div>;
  }

  return (
    <PortalEditorialShell currentUser={authUser}>
      {children}
    </PortalEditorialShell>
  );
}
