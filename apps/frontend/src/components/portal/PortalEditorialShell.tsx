"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  FileKey2,
  GraduationCap,
  Home,
  LifeBuoy,
  LogOut,
  Mail,
  Menu,
  Settings,
  Shield,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { authService, type CurrentUser } from "@/lib/api";
import { isStaffRole } from "@/lib/permissions/constants";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  getPortalNavigation,
  isPortalRouteActive,
  type PortalNavigationItem,
} from "./portal-navigation";

interface PortalEditorialShellProps {
  currentUser: CurrentUser | null;
  children: ReactNode;
}

const iconById = {
  dashboard: Home,
  orders: ShoppingBag,
  licenses: FileKey2,
  support: LifeBuoy,
  knowledge: BookOpen,
  courses: GraduationCap,
  certificates: Award,
  newsletter: Mail,
  events: CalendarDays,
  profile: UserRound,
} as const;

function userRoles(user: CurrentUser | null): string[] {
  if (!user) return [];
  const candidates = [
    ...(Array.isArray(user.roles) ? user.roles.map((role) => role?.name) : []),
    user.primaryRole?.name,
  ];
  return [
    ...new Set(
      candidates
        .filter((role): role is string => Boolean(role))
        .map((role) => role.trim()),
    ),
  ];
}

function initials(user: CurrentUser | null): string {
  const value =
    `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.trim();
  return value.toUpperCase() || "AC";
}

function displayName(user: CurrentUser | null): string {
  const value = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  return value || "Cortex kullanıcısı";
}

function PortalNav({
  items,
  pathname,
  collapsed = false,
  onNavigate,
}: {
  items: readonly PortalNavigationItem[];
  pathname: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Portal ana menüsü" className="space-y-1">
      {items.map((item) => {
        const Icon =
          iconById[item.id as keyof typeof iconById] ?? CircleUserRound;
        const active = isPortalRouteActive(pathname, item.href);
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={active ? "page" : undefined}
            aria-label={collapsed ? item.label : undefined}
            title={collapsed ? item.label : undefined}
            onClick={onNavigate}
            className={cn(
              "group flex min-h-11 items-center gap-3 border-l-2 px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cortex-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--cortex-canvas)]",
              active
                ? "border-[var(--cortex-accent)] bg-[var(--cortex-accent-soft)] text-[var(--cortex-text)]"
                : "border-transparent text-[var(--cortex-text-muted)] hover:border-[var(--cortex-line-strong)] hover:bg-[var(--cortex-surface-quiet)] hover:text-[var(--cortex-text)]",
              collapsed && "justify-center px-2",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export function PortalEditorialShell({
  currentUser,
  children,
}: PortalEditorialShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = useMemo(() => getPortalNavigation(currentUser), [currentUser]);
  const roles = useMemo(() => userRoles(currentUser), [currentUser]);
  const hasStaffAccess = roles.some((role) => isStaffRole(role));

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setCollapsed(
        window.localStorage.getItem("portal-editorial-sidebar-collapsed") ===
          "true",
      );
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(
        "portal-editorial-sidebar-collapsed",
        String(next),
      );
      return next;
    });
  };

  return (
    <div className="theme-portal min-h-dvh bg-[var(--cortex-canvas)] text-[var(--cortex-text)]">
      <a
        href="#portal-main-content"
        className="fixed left-4 top-3 z-[100] -translate-y-20 bg-[var(--cortex-accent)] px-4 py-2 text-sm font-semibold text-black transition-transform focus:translate-y-0"
      >
        Ana içeriğe geç
      </a>

      <header className="sticky top-0 z-40 flex h-[var(--cortex-header-height)] items-center border-b border-[var(--cortex-line)] bg-[color:var(--cortex-canvas-translucent)] px-4 backdrop-blur-xl sm:px-6">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Portal menüsünü aç"
              aria-expanded={mobileOpen}
              aria-controls="portal-mobile-navigation"
              className="mr-3 border border-[var(--cortex-line)] text-[var(--cortex-text)] lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent
            id="portal-mobile-navigation"
            side="left"
            className="theme-portal w-[min(88vw,340px)] border-[var(--cortex-line)] bg-[var(--cortex-canvas)] p-0 text-[var(--cortex-text)]"
          >
            <SheetTitle className="border-b border-[var(--cortex-line)] px-6 py-5 text-left font-mono text-xs uppercase tracking-[0.2em]">
              AffeXAI Cortex
            </SheetTitle>
            <SheetDescription className="sr-only">
              Portal bölümlerine geçiş yapın.
            </SheetDescription>
            <div className="px-3 py-5">
              <PortalNav
                items={items}
                pathname={pathname}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>

        <Link
          href="/portal/dashboard"
          className="flex min-w-0 items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cortex-focus)]"
        >
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center bg-[var(--cortex-accent)] text-sm font-black text-black"
            aria-hidden="true"
          >
            A
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold uppercase tracking-[-0.02em]">
              AffeXAI Cortex
            </span>
            <span className="hidden font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--cortex-text-faint)] sm:block">
              Client Intelligence Interface
            </span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <span className="hidden items-center gap-2 border-r border-[var(--cortex-line)] pr-4 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--cortex-text-faint)] md:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--cortex-success)]" />{" "}
            Sistem erişilebilir
          </span>
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="text-[var(--cortex-text-muted)] hover:bg-[var(--cortex-surface-quiet)] hover:text-[var(--cortex-text)]"
          >
            <Link href="/portal/notifications" aria-label="Bildirimler">
              <Bell className="h-4 w-4" />
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-10 gap-3 border border-[var(--cortex-line)] px-2.5 text-[var(--cortex-text)] hover:bg-[var(--cortex-surface-quiet)]"
                aria-label="Hesap menüsünü aç"
              >
                <span className="flex h-6 w-6 items-center justify-center bg-[var(--cortex-accent-soft)] font-mono text-[10px] font-bold text-[var(--cortex-accent-ink)]">
                  {initials(currentUser)}
                </span>
                <span className="hidden max-w-36 truncate text-xs sm:block">
                  {displayName(currentUser)}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="theme-portal w-64 border-[var(--cortex-line)] bg-[var(--cortex-surface-raised)] text-[var(--cortex-text)]"
            >
              <DropdownMenuLabel>
                <span className="block truncate text-sm font-medium">
                  {displayName(currentUser)}
                </span>
                <span className="mt-1 block truncate text-xs font-normal text-[var(--cortex-text-muted)]">
                  {currentUser?.email ?? ""}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[var(--cortex-line)]" />
              <DropdownMenuItem asChild>
                <Link href="/portal/profile">
                  <UserRound />
                  Profilim
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/portal/settings">
                  <Settings />
                  Ayarlar
                </Link>
              </DropdownMenuItem>
              {hasStaffAccess && (
                <DropdownMenuItem asChild>
                  <Link href="/admin">
                    <Shield />
                    Yönetim alanı
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-[var(--cortex-line)]" />
              <DropdownMenuItem
                onSelect={() => authService.logout()}
                className="text-[var(--cortex-danger-text)] focus:text-[var(--cortex-danger-text)]"
              >
                <LogOut />
                Çıkış yap
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex min-h-[calc(100dvh-var(--cortex-header-height))]">
        <aside
          className={cn(
            "sticky top-[var(--cortex-header-height)] hidden h-[calc(100dvh-var(--cortex-header-height))] shrink-0 border-r border-[var(--cortex-line)] bg-[var(--cortex-surface)] transition-[width] duration-200 lg:flex lg:flex-col",
            collapsed ? "w-[72px]" : "w-[264px]",
          )}
        >
          <div className="border-b border-[var(--cortex-line)] px-4 py-5">
            {!collapsed && (
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.24em] text-[var(--cortex-text-faint)]">
                Çalışma alanı
              </p>
            )}
            {!collapsed && (
              <p className="mt-2 truncate text-sm font-medium">
                {currentUser?.tenantId || "AffeXAI"}
              </p>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapsed}
              aria-label={
                collapsed ? "Kenar menüsünü genişlet" : "Kenar menüsünü daralt"
              }
              aria-expanded={!collapsed}
              aria-controls="portal-desktop-navigation"
              className={cn(
                "mt-4 h-8 w-8 border border-[var(--cortex-line)] text-[var(--cortex-text-muted)] hover:bg-[var(--cortex-surface-quiet)] hover:text-[var(--cortex-text)]",
                collapsed && "mt-0",
              )}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div
            id="portal-desktop-navigation"
            className="flex-1 overflow-y-auto px-3 py-5"
          >
            <PortalNav
              items={items}
              pathname={pathname}
              collapsed={collapsed}
            />
          </div>
          <div className="border-t border-[var(--cortex-line)] p-3">
            <Link
              href="/"
              className={cn(
                "flex min-h-10 items-center gap-3 px-3 text-xs text-[var(--cortex-text-faint)] hover:text-[var(--cortex-text)]",
                collapsed && "justify-center px-2",
              )}
              title={collapsed ? "Ana siteye dön" : undefined}
            >
              <span className="font-mono" aria-hidden="true">
                ↗
              </span>
              {!collapsed && "Ana siteye dön"}
            </Link>
          </div>
        </aside>

        <main
          id="portal-main-content"
          tabIndex={-1}
          className="min-w-0 flex-1 bg-[var(--cortex-canvas)] focus:outline-none"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
