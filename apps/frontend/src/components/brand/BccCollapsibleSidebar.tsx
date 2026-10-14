"use client";

import React, { useState, useEffect } from "react";
import { useAsyncEffect } from "@/hooks/use-async-effect";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { httpClient } from "@/lib/api/http-client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/lib/auth/auth-context";
import { Permission } from "@/lib/permissions/constants";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Calendar,
  Award,
  Share2,
  Send,
  LifeBuoy,
  TrendingUp,
  FileText,
  BookOpen,
  Database,
  Wand2,
  Brain,
  Bot,
  Users,
  Palette,
  Bell,
  LineChart,
  HardDrive,
  LayoutDashboard,
  Layers,
  Star,
  FileStack,
  Map,
  FlaskConical,
  BarChart3,
  Settings,
  Globe,
} from "lucide-react";

interface BccCollapsibleSidebarProps {
  theme?: "super-admin" | "tenant-admin";
  forcedExpanded?: boolean;
}

const getBaseNavLinks = (tenant?: string) => {
  const prefix = tenant ? `/${tenant}` : "";
  return [
    {
      href: `${prefix}/admin`,
      label: "Genel Bakış",
      icon: "home",
      permission: null,
    },
    {
      href: `${prefix}/admin/events`,
      label: "Etkinlikler",
      icon: "calendar_month",
      permission: Permission.EVENTS_VIEW,
    },
    {
      href: `${prefix}/admin/certificates`,
      label: "Sertifikalar",
      icon: "verified",
      permission: Permission.CERTIFICATES_VIEW,
    },
    {
      href: `${prefix}/admin/social`,
      label: "Sosyal Medya",
      icon: "share",
      permission: Permission.SOCIAL_MEDIA_VIEW,
    },
    ...(tenant
      ? [
          {
            href: `${prefix}/admin/crm`,
            label: "CRM",
            icon: "manage_accounts",
            permission: Permission.CRM_VIEW,
          },
        ]
      : []),
  ];
};

const getEmailMarketingLinks = (tenant?: string) => {
  const prefix = tenant ? `/${tenant}` : "";
  return [
    { href: `${prefix}/admin/email`, label: "Genel Bakış" },
    { href: `${prefix}/admin/email/campaigns`, label: "Kampanyalar" },
    { href: `${prefix}/admin/email/templates`, label: "Şablonlar" },
    { href: `${prefix}/admin/email/subscribers`, label: "Aboneler" },
    { href: `${prefix}/admin/email/analytics`, label: "Analytics" },
    { href: `${prefix}/admin/email/automations`, label: "Otomasyonlar" },
  ];
};

const getSupportLinks = (tenant?: string) => {
  const prefix = tenant ? `/${tenant}` : "";
  return [
    {
      href: `${prefix}/admin/support`,
      label: "Ticket Listesi",
      icon: "confirmation_number",
    },
    {
      href: `${prefix}/admin/support/analytics`,
      label: "Raporlar & Analiz",
      icon: "insights",
    },
    {
      href: `${prefix}/admin/support/templates`,
      label: "Ticket Şablonları",
      icon: "description",
    },
    {
      href: `${prefix}/admin/support/knowledge-base`,
      label: "Bilgi Bankası",
      icon: "menu_book",
    },
    {
      href: `${prefix}/admin/support/knowledge-sources`,
      label: "Knowledge Sources",
      icon: "database",
    },
    {
      href: `${prefix}/admin/support/macros`,
      label: "Makro Yönetimi",
      icon: "magic_button",
    },
    {
      href: `${prefix}/admin/support/ai-insights`,
      label: "AI Insights",
      icon: "psychology",
    },
  ];
};

const getFaqLearningLinks = (tenant?: string) => {
  const prefix = tenant ? `/${tenant}` : "";
  return [
    { href: `${prefix}/admin/support/faq-learning`, label: "Dashboard" },
    {
      href: `${prefix}/admin/support/faq-learning/review`,
      label: "İnceleme Kuyruğu",
    },
    {
      href: `${prefix}/admin/support/faq-learning/providers`,
      label: "AI Sağlayıcılar",
    },
    { href: `${prefix}/admin/support/faq-learning/settings`, label: "Ayarlar" },
  ];
};

const getUserManagementLinks = (tenant?: string) => {
  const prefix = tenant ? `/${tenant}` : "";
  return [
    { href: `${prefix}/admin/organization`, label: "Organizasyon" },
    { href: `${prefix}/admin/users`, label: "Kullanıcı Listesi" },
    { href: `${prefix}/admin/roles`, label: "Roller ve İzinler" },
  ];
};

const getCmsLinks = (tenant?: string) => {
  const prefix = tenant ? `/${tenant}` : "";
  return [
    { href: `${prefix}/admin/cms/pages`, label: "Sayfalar" },
    { href: `${prefix}/admin/cms/reusable-sections`, label: "Section'lar" },
    { href: `${prefix}/admin/cms/favorites`, label: "Favorilerim" },
    { href: `${prefix}/admin/cms/categories`, label: "Kategoriler" },
    { href: `${prefix}/admin/cms/menus`, label: "Menüler" },
    { href: `${prefix}/admin/cms/editor`, label: "Görsel Editör" },
    { href: `${prefix}/admin/cms/templates`, label: "Şablonlar" },
    { href: `${prefix}/admin/cms/media`, label: "Medya Yönetimi" },
  ];
};

const getFormLinks = (tenant?: string) => {
  const prefix = tenant ? `/${tenant}` : "";
  return [
    {
      href: `${prefix}/admin/forms`,
      label: "Form Listesi",
      permission: Permission.FORMS_VIEW,
    },
    {
      href: `${prefix}/admin/forms/new`,
      label: "Yeni Form",
      permission: Permission.FORMS_MANAGE,
    },
  ];
};

const getBrandLinks = (tenant?: string) => {
  const prefix = tenant ? `/${tenant}` : "";
  return [
    { href: `${prefix}/admin/brand/intelligence`, label: "Intelligence" },
    { href: `${prefix}/admin/brand/strategy`, label: "Strategic Ops" },
    { href: `${prefix}/admin/brand/resonance`, label: "Resonance" },
    { href: `${prefix}/admin/brand/module`, label: "Module Command" },
  ];
};

const StatusDot = ({ intensity }: { intensity: number }) => {
  const color =
    intensity > 0.7
      ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
      : intensity > 0.3
        ? "bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.4)]"
        : "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]";
  return (
    <div
      className={cn(
        "w-1.5 h-1.5 rounded-full transition-all duration-500",
        color,
      )}
    />
  );
};

const getSettingsLinks = (tenant?: string) => {
  const prefix = tenant ? `/${tenant}` : "";
  return [
    {
      href: `${prefix}/admin/settings/subscription`,
      label: "Abonelik ve Kullanım",
      icon: "credit_card",
    },
    {
      href: `${prefix}/admin/settings/site`,
      label: "Site Ayarları",
      icon: "settings",
    },
    {
      href: `${prefix}/admin/settings/theme`,
      label: "Tema Ayarları",
      icon: "palette",
    },
    {
      href: `${prefix}/admin/design`,
      label: "Design",
      icon: "design_services",
    },
    {
      href: `${prefix}/admin/ai-settings`,
      label: "AI Ayarları",
      icon: "smart_toy",
    },
    {
      href: `${prefix}/admin/notifications`,
      label: "Bildirimler",
      icon: "notifications",
    },
    {
      href: `${prefix}/admin/logs`,
      label: "Aktivite Kayıtları",
      icon: "history_edu",
    },
    {
      href: `${prefix}/admin/settings/automation`,
      label: "Otomasyon Merkezi",
      icon: "auto_fix_high",
    },
    {
      href: `${prefix}/admin/settings/backup`,
      label: "Yedekleme",
      icon: "backup",
    },
  ];
};

export const BccCollapsibleSidebar = ({
  theme = "tenant-admin",
  forcedExpanded = false,
}: BccCollapsibleSidebarProps) => {
  const pathname = usePathname();
  const { hasPermission, hasAnyPermission } = usePermissions();
  const { isSuperAdmin } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [signals, setSignals] = useState<Record<string, { intensity: number }>>(
    {},
  );

  // Dynamic Tenant Extraction
  // Logic: If pathname starts with /[tenant]/admin, extract [tenant]
  const pathParts = pathname.split("/");
  const tenant = pathParts[1] !== "admin" ? pathParts[1] : undefined;

  // Regenerate links based on current tenant
  const navLinks = getBaseNavLinks(tenant);
  const emailMarketingLinks = getEmailMarketingLinks(tenant);
  const brandLinks = getBrandLinks(tenant);
  const supportLinks = getSupportLinks(tenant);
  const faqLearningLinks = getFaqLearningLinks(tenant);
  const userManagementLinks = getUserManagementLinks(tenant);
  const cmsLinks = getCmsLinks(tenant);
  const formLinks = getFormLinks(tenant);
  const settingsLinks = getSettingsLinks(tenant);

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const data =
          await httpClient.get<Record<string, { intensity: number }>>(
            "/bcc/status",
          );
        setSignals(data);
      } catch (err) {
        console.error("Fetch signals failed:", err);
      }
    };

    fetchSignals();
    const interval = setInterval(fetchSignals, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  // Read the saved preference after the first commit so server and client markup match.
  useAsyncEffect(() => {
    if (forcedExpanded) return;
    const stored = localStorage.getItem("bcc-sidebar-collapsed");
    if (stored !== null) setIsCollapsed(stored === "true");
  }, [forcedExpanded]);

  const collapsed = forcedExpanded ? false : isCollapsed;

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("bcc-sidebar-collapsed", String(newState));
  };

  const isTenant = theme === "tenant-admin";
  const accentColor = isTenant ? "#ff8c00" : "#9df425";

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside
      className={cn(
        "relative h-full flex flex-col bg-[#080808] border-r border-white/5 transition-all duration-500 ease-in-out z-30",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Collapse Toggle */}
      {!forcedExpanded && (
        <button
          type="button"
          aria-label={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
          aria-expanded={!collapsed}
          onClick={toggleCollapse}
          className="absolute -right-3 top-6 size-6 rounded-full bg-[#080808] border border-white/10 flex items-center justify-center text-white/75 hover:text-white transition-colors z-40 shadow-lg"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      )}

      {/* Content Container */}
      <div className="flex-grow overflow-y-auto overflow-x-hidden no-scrollbar py-12 flex flex-col">
        <nav className="px-3 space-y-1">
          {/* 1. TOP TIER LINKS */}
          {navLinks.map((link) => {
            if (
              link.permission &&
              !isSuperAdmin &&
              !hasPermission(link.permission)
            )
              return null;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "group flex items-center rounded-lg p-3 transition-all duration-300",
                  active
                    ? "bg-white/5 text-white"
                    : "text-white/75 hover:text-white hover:bg-white/[0.04]",
                  collapsed && "justify-center",
                )}
                title={collapsed ? link.label : undefined}
              >
                {collapsed ? (
                  <span
                    className="material-icons text-xl flex-none transition-colors duration-500"
                    style={{ color: active ? accentColor : "inherit" }}
                  >
                    {link.icon}
                  </span>
                ) : (
                  <span
                    className={cn(
                      "text-[11px] font-bold uppercase tracking-[0.2em] truncate text-left w-full transition-colors duration-500",
                      active ? "" : "group-hover:text-white",
                    )}
                    style={{ color: active ? accentColor : "inherit" }}
                  >
                    {link.label}
                  </span>
                )}
              </Link>
            );
          })}

          {/* 2. ACCORDIONS (Only when expanded) */}
          {!collapsed && (
            <Accordion
              type="multiple"
              className="w-full space-y-1"
              defaultValue={
                pathname.includes("/admin/organization") ? ["users"] : []
              }
            >
              {/* BRAND COMMUNICATION CENTER */}
              {(isSuperAdmin ||
                hasAnyPermission([
                  Permission.FORMS_VIEW,
                  Permission.FORMS_MANAGE,
                ])) && (
                <AccordionItem value="brand" className="border-none">
                  <AccordionTrigger className="flex items-center px-3 py-3 rounded-lg hover:bg-white/[0.02] hover:no-underline group">
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/75 group-hover:text-white text-left w-full">
                      Brand Center
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pl-6 space-y-0.5">
                    {brandLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          "block py-2 px-3 text-[10px] uppercase tracking-widest font-medium transition-colors border-l border-white/5",
                          pathname === link.href
                            ? "text-white border-white/20"
                            : "text-white/70 hover:text-white hover:border-white/30",
                        )}
                        style={{
                          color:
                            pathname === link.href ? accentColor : "inherit",
                        }}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* EMAIL MARKETING */}
              {true && (
                <AccordionItem value="email" className="border-none">
                  <AccordionTrigger className="flex items-center px-3 py-3 rounded-lg hover:bg-white/[0.02] hover:no-underline group">
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/75 group-hover:text-white text-left w-full">
                      Email Marketing
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pl-6 space-y-0.5">
                    {emailMarketingLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          "block py-2 px-3 text-[10px] uppercase tracking-widest font-medium transition-colors border-l border-white/5",
                          pathname === link.href
                            ? "text-white border-white/20"
                            : "text-white/70 hover:text-white hover:border-white/30",
                        )}
                        style={{
                          color:
                            pathname === link.href ? accentColor : "inherit",
                        }}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* DESTEK MERKEZI */}
              {true && (
                <AccordionItem value="support" className="border-none">
                  <AccordionTrigger className="flex items-center px-3 py-3 rounded-lg hover:bg-white/[0.02] hover:no-underline group">
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/75 group-hover:text-white text-left w-full">
                      Destek Merkezi
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pl-6 space-y-0.5">
                    {supportLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          "block py-2 px-3 text-[10px] uppercase tracking-widest font-medium transition-colors border-l border-white/5",
                          pathname === link.href
                            ? "text-white border-white/20"
                            : "text-white/70 hover:text-white hover:border-white/30",
                        )}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* FAQ LEARNING */}
              {true && (
                <AccordionItem value="faq" className="border-none">
                  <AccordionTrigger className="flex items-center px-3 py-3 rounded-lg hover:bg-white/[0.02] hover:no-underline group">
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/75 group-hover:text-white text-left w-full">
                      FAQ Öğrenme
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pl-6 space-y-0.5">
                    {faqLearningLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          "block py-2 px-3 text-[10px] uppercase tracking-widest font-medium transition-colors border-l border-white/5",
                          pathname === link.href
                            ? "text-white border-white/20"
                            : "text-white/70 hover:text-white hover:border-white/30",
                        )}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* CMS MANAGEMENT */}
              {true && (
                <AccordionItem value="cms" className="border-none">
                  <AccordionTrigger className="flex items-center px-3 py-3 rounded-lg hover:bg-white/[0.02] hover:no-underline group">
                    <div className="flex items-center justify-between w-full pr-4">
                      <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/75 group-hover:text-white text-left">
                        CMS Yönetimi
                      </span>
                      <StatusDot intensity={signals["CMS"]?.intensity || 0} />
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-6 space-y-0.5">
                    {cmsLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          "block py-2 px-3 text-[10px] uppercase tracking-widest font-medium transition-colors border-l border-white/5",
                          pathname === link.href
                            ? "text-white border-white/20"
                            : "text-white/70 hover:text-white hover:border-white/30",
                        )}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* FORM MANAGEMENT */}
              {true && (
                <AccordionItem value="forms" className="border-none">
                  <AccordionTrigger className="flex items-center px-3 py-3 rounded-lg hover:bg-white/[0.02] hover:no-underline group">
                    <div className="flex items-center justify-between w-full pr-4">
                      <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/75 group-hover:text-white text-left">
                        Form Yönetimi
                      </span>
                      <StatusDot intensity={signals["FORM"]?.intensity || 0} />
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-6 space-y-0.5">
                    {formLinks
                      .filter(
                        (link) =>
                          isSuperAdmin || hasPermission(link.permission),
                      )
                      .map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={cn(
                            "block py-2 px-3 text-[10px] uppercase tracking-widest font-medium transition-colors border-l border-white/5",
                            pathname === link.href
                              ? "text-white border-white/20"
                              : "text-white/70 hover:text-white hover:border-white/30",
                          )}
                          style={{
                            color:
                              pathname === link.href ? accentColor : "inherit",
                          }}
                        >
                          {link.label}
                        </Link>
                      ))}
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* USER MANAGEMENT */}
              {true && (
                <AccordionItem value="users" className="border-none">
                  <AccordionTrigger className="flex items-center px-3 py-3 rounded-lg hover:bg-white/[0.02] hover:no-underline group">
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/75 group-hover:text-white text-left w-full">
                      Kullanıcılar
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pl-6 space-y-0.5">
                    {userManagementLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          "block py-2 px-3 text-[10px] uppercase tracking-widest font-medium transition-colors border-l border-white/5",
                          pathname === link.href
                            ? "text-white border-white/20"
                            : "text-white/70 hover:text-white hover:border-white/30",
                        )}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* CONFIGURATION / AYARLAR */}
              {true && (
                <AccordionItem value="settings" className="border-none">
                  <AccordionTrigger className="flex items-center px-3 py-3 rounded-lg hover:bg-white/[0.02] hover:no-underline group">
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/75 group-hover:text-white text-left w-full">
                      Konfigürasyon
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pl-6 space-y-0.5">
                    {settingsLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          "block py-2 px-3 text-[10px] uppercase tracking-widest font-medium transition-colors border-l border-white/5",
                          pathname === link.href
                            ? "text-white border-white/20"
                            : "text-white/70 hover:text-white hover:border-white/30",
                        )}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          )}

          {/* 3. COLLAPSED ICONS (Only when collapsed) */}
          {collapsed && (
            <div className="pt-4 border-t border-white/5 space-y-4 flex flex-col items-center">
              <Link
                href={`${tenant ? `/${tenant}` : ""}/admin/brand/intelligence`}
                title="Brand Center"
                aria-label="Brand Center"
                className="inline-flex h-11 w-11 items-center justify-center"
              >
                <span
                  aria-hidden="true"
                  className="material-icons text-xl text-white/70 hover:text-white transition-colors"
                >
                  analytics
                </span>
              </Link>
              <Link
                href={`${tenant ? `/${tenant}` : ""}/admin/email`}
                title="Email Marketing"
                aria-label="Email Marketing"
                className="inline-flex h-11 w-11 items-center justify-center"
              >
                <span
                  aria-hidden="true"
                  className="material-icons text-xl text-white/70 hover:text-white transition-colors"
                >
                  send
                </span>
              </Link>
              <Link
                href={`${tenant ? `/${tenant}` : ""}/admin/support`}
                title="Destek Merkezi"
                aria-label="Destek Merkezi"
                className="inline-flex h-11 w-11 items-center justify-center"
              >
                <span
                  aria-hidden="true"
                  className="material-icons text-xl text-white/70 hover:text-white transition-colors"
                >
                  support_agent
                </span>
              </Link>
              <Link
                href={`${tenant ? `/${tenant}` : ""}/admin/cms`}
                title="CMS Yönetimi"
                aria-label="CMS Yönetimi"
                className="inline-flex h-11 w-11 items-center justify-center"
              >
                <span
                  aria-hidden="true"
                  className="material-icons text-xl text-white/70 hover:text-white transition-colors"
                >
                  dashboard_customize
                </span>
              </Link>
              {(isSuperAdmin ||
                hasAnyPermission([
                  Permission.FORMS_VIEW,
                  Permission.FORMS_MANAGE,
                ])) && (
                <Link
                  href={`${tenant ? `/${tenant}` : ""}/admin/forms`}
                  title="Form Yönetimi"
                  aria-label="Form Yönetimi"
                  className="inline-flex h-11 w-11 items-center justify-center"
                >
                  <span
                    aria-hidden="true"
                    className="material-icons text-xl text-white/70 hover:text-white transition-colors"
                  >
                    dynamic_form
                  </span>
                </Link>
              )}
              {tenant &&
                (isSuperAdmin || hasPermission(Permission.CRM_VIEW)) && (
                  <Link
                    href={`/${tenant}/admin/crm`}
                    title="CRM"
                    aria-label="CRM"
                    className="inline-flex h-11 w-11 items-center justify-center"
                  >
                    <span
                      aria-hidden="true"
                      className="material-icons text-xl text-white/70 hover:text-white transition-colors"
                    >
                      manage_accounts
                    </span>
                  </Link>
                )}
              <Link
                href={`${tenant ? `/${tenant}` : ""}/admin/users`}
                title="Kullanıcı Yönetimi"
                aria-label="Kullanıcı Yönetimi"
                className="inline-flex h-11 w-11 items-center justify-center"
              >
                <span
                  aria-hidden="true"
                  className="material-icons text-xl text-white/70 hover:text-white transition-colors"
                >
                  group
                </span>
              </Link>
              <Link
                href={`${tenant ? `/${tenant}` : ""}/admin/settings/site`}
                title="Ayarlar"
                aria-label="Ayarlar"
                className="inline-flex h-11 w-11 items-center justify-center"
              >
                <span
                  aria-hidden="true"
                  className="material-icons text-xl text-white/70 hover:text-white transition-colors"
                >
                  settings
                </span>
              </Link>
            </div>
          )}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-4 border-t border-white/5 bg-white/[0.01]">
        <Link
          href="/admin"
          className={cn(
            "flex items-center p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-all group",
            collapsed && "justify-center",
          )}
        >
          {collapsed ? (
            <span
              className="material-icons text-lg"
              style={{ color: accentColor }}
            >
              admin_panel_settings
            </span>
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/75 group-hover:text-white truncate text-left w-full transition-colors">
              Admin Exit.
            </span>
          )}
        </Link>
      </div>
    </aside>
  );
};
