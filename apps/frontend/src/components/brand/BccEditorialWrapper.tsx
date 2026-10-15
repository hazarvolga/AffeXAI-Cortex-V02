"use client";

import React, { ReactNode } from "react";
import { useParams, usePathname } from "next/navigation";
import { Space_Grotesk } from "next/font/google";
import Link from "next/link";
import { DemoDataBadge } from "@/components/patterns/demo-data-badge";
import { BccCollapsibleSidebar } from "./BccCollapsibleSidebar";
import { AiCoPilot } from "./ai/AiCoPilot";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";

// Load Space Grotesk Font
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-space-grotesk",
});

interface BccEditorialWrapperProps {
  children: ReactNode;
  theme?: "super-admin" | "tenant-admin";
  telemetryData?: Array<{
    label: string;
    value: string;
    suffix?: string;
    color?: string;
    /** The value is illustrative, not computed from this workspace's records. */
    demo?: boolean;
  }>;
  headerTitle?: string;
  headerSubtitle?: string;
  headerBadge?: string;
  moduleNav?: React.ReactNode;
  headerAction?: React.ReactNode;
  hideSidebar?: boolean;
}

/**
 * BCC Unified Aesthetic Layout (Editorial Language)
 * Supports Green (#9df425) for Super Admin and Orange (#ff8c00) for Tenant Admin.
 */
export const BccEditorialWrapper = ({
  children,
  theme = "tenant-admin",
  telemetryData = [],
  headerTitle = "AffeXAI Cortex",
  headerSubtitle = "Çalışma alanı yönetimi.",
  headerBadge = "Yönetim",
  moduleNav,
  headerAction,
  hideSidebar = false,
}: BccEditorialWrapperProps) => {
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  const isTenant = theme === "tenant-admin";
  const accentColor = isTenant ? "#ff8c00" : "#9df425";

  // Route params are the same on server and client, so the header links hydrate cleanly.
  const params = useParams<{ tenant?: string }>();
  const tenant = typeof params?.tenant === "string" ? params.tenant : undefined;
  const pathParts = (usePathname() ?? "").split("/");

  const generateTenantLink = (path: string) => {
    if (!tenant) return path;
    // If path already starts with tenant, return as is
    if (path.startsWith(`/${tenant}`)) return path;
    return `/${tenant}${path}`;
  };

  // [NEURAL GRID] Context Detection
  const isTicketPage = pathParts.includes("tickets") && pathParts.length > 3; // admin/tickets/[id]
  const ticketId = isTicketPage ? pathParts[pathParts.length - 1] : undefined;

  return (
    // `dark` switches the design tokens too, so cards, inputs and outline buttons match the dark shell.
    <div
      lang="tr"
      className={`dark min-h-screen bg-[#080808] text-white font-sans ${spaceGrotesk.variable} overflow-hidden relative`}
    >
      <a
        href="#tenant-main-content"
        className="fixed left-4 top-3 z-[100] -translate-y-24 bg-white px-4 py-2 text-sm font-semibold text-black transition-transform focus:translate-y-0"
      >
        Ana içeriğe geç
      </a>
      {/* 1. GLOBAL STYLES & FONTS */}
      <link
        href="https://fonts.googleapis.com/icon?family=Material+Icons"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />

      <style jsx global>{`
        .vertical-text {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
        .editorial-grid {
          background-size: 40px 40px;
          background-image: radial-gradient(
            circle,
            #1a1a1a 1px,
            transparent 1px
          );
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        @keyframes orbit {
          from {
            transform: rotate(0deg) translateX(100px) rotate(0deg);
          }
          to {
            transform: rotate(360deg) translateX(100px) rotate(-360deg);
          }
        }
      `}</style>

      {/* 2. TOP EDITORIAL HEADER */}
      <header className="fixed top-0 left-0 w-full z-50 border-b border-white/10 bg-[#080808]/80 backdrop-blur-md px-4 md:px-8 py-4 flex justify-between items-center">
        <div className="flex min-w-0 items-center space-x-4 lg:space-x-12">
          <div className="flex items-center space-x-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-500"
              style={{ backgroundColor: accentColor }}
            >
              <span
                aria-hidden="true"
                className="material-icons text-black text-sm"
              >
                analytics
              </span>
            </div>
            <span className="truncate text-sm font-bold tracking-tighter uppercase font-mono sm:text-xl">
              AffeXAI Cortex
            </span>
          </div>
          {/* Dynamic Tenant-Aware Header Links */}
          <nav
            aria-label="BCC"
            className="hidden md:flex space-x-8 text-[11px] tracking-[0.2em] font-medium uppercase text-white/75"
          >
            <Link
              href={generateTenantLink("/admin/brand/intelligence")}
              className="hover:text-white transition-colors"
            >
              Intelligence
            </Link>
            <Link
              href={generateTenantLink("/admin/brand/resonance")}
              className="hover:text-white transition-colors"
            >
              Resonance
            </Link>
            <Link
              href={generateTenantLink("/admin/brand/module")}
              className="hover:text-white transition-colors tracking-tight"
            >
              Module Command
            </Link>
            <Link
              href={generateTenantLink("/admin/brand/strategy")}
              className="transition-colors font-bold"
              style={{ color: accentColor }}
            >
              Strategic Ops
            </Link>
          </nav>
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex space-x-4">
            {!hideSidebar && (
              <button
                type="button"
                aria-label={mobileNavOpen ? "Menüyü kapat" : "Menüyü aç"}
                aria-expanded={mobileNavOpen}
                onClick={() => setMobileNavOpen((open) => !open)}
                className="inline-flex h-11 w-11 items-center justify-center text-white/75 hover:text-white lg:hidden"
              >
                <span aria-hidden="true" className="material-icons text-base">
                  {mobileNavOpen ? "close" : "menu"}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="relative h-screen w-full flex overflow-hidden pt-[72px]">
        {/* 3. COLLAPSIBLE SIDEBAR */}
        {!hideSidebar && (
          <div className="hidden h-full lg:block">
            <BccCollapsibleSidebar theme={theme} />
          </div>
        )}
        {!hideSidebar && (
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetContent
              side="left"
              className="w-64 border-white/10 bg-[#080808] p-0 text-white lg:hidden"
              aria-label="Yönetim menüsü"
            >
              <SheetTitle className="sr-only">Yönetim menüsü</SheetTitle>
              <SheetDescription className="sr-only">
                Tenant yönetim modüllerine geçiş yapın.
              </SheetDescription>
              <BccCollapsibleSidebar theme={theme} forcedExpanded />
            </SheetContent>
          </Sheet>
        )}

        {/* 4. CENTRAL VIEWPORT HANDLER */}
        <main
          id="tenant-main-content"
          tabIndex={-1}
          className="flex-grow h-full overflow-hidden relative editorial-grid flex flex-col focus:outline-none"
        >
          {/* FIXED TOP TELEMETRY SECTION */}
          <div className="flex-none px-4 pt-8 pb-4 z-20 bg-[#080808]/90 backdrop-blur-sm border-b border-white/5 md:px-8 lg:px-12 lg:pt-12">
            <div className="w-full flex items-center justify-between gap-4 pb-6 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="hidden items-center space-x-12 md:flex">
                {telemetryData.some((item) => item.demo) && (
                  <DemoDataBadge
                    label="Önizleme"
                    reason="Bu üst bilgideki işaretli değerler gerçek kayıtlardan hesaplanmıyor."
                  />
                )}
                {telemetryData.map((item, idx) => (
                  <React.Fragment key={idx}>
                    <div className="flex items-center space-x-3">
                      <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                        {item.label}
                      </span>
                      <div
                        className={`text-xl font-light tabular-nums text-white ${item.demo ? "underline decoration-dashed decoration-white/40 underline-offset-4" : ""}`}
                      >
                        {item.value}
                        <span className="text-xs text-white/40 ml-0.5">
                          {item.suffix}
                        </span>
                      </div>
                    </div>
                    {idx < telemetryData.length - 1 && (
                      <div className="h-4 w-px bg-white/10"></div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              <div className="flex items-center space-x-3">{headerAction}</div>
            </div>

            <div className="flex justify-between items-end w-full">
              <div className="max-w-3xl">
                <h1 className="text-[clamp(2rem,9vw,4rem)] leading-[0.9] font-bold uppercase tracking-tighter mb-2 text-white font-mono break-words">
                  {headerTitle}
                </h1>
                <div className="flex items-center space-x-4">
                  <span
                    className="text-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest transition-colors duration-500"
                    style={{ backgroundColor: accentColor }}
                  >
                    {headerBadge}
                  </span>
                  {moduleNav ? (
                    <div className="flex items-center">{moduleNav}</div>
                  ) : (
                    <p className="text-white/70 text-xs max-w-sm font-light leading-relaxed uppercase tracking-widest font-mono">
                      {headerSubtitle}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SCROLLABLE CONTENT (focusable so keyboard users can scroll it) */}
          <div
            tabIndex={0}
            aria-label="Sayfa içeriği"
            className="flex-grow overflow-y-auto overflow-x-hidden relative z-10 p-4 md:p-8 lg:p-12 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/40"
          >
            {children}
          </div>
        </main>
      </div>

      {/* [NEURAL GRID] GLOBAL SYNAPSE */}
      <AiCoPilot
        context={isTicketPage ? "Ticket Resolution" : "General Strategy"}
        data={{
          contextType: isTicketPage ? "ticket" : "general",
          contextId: ticketId,
        }}
        variant="floating"
      />
    </div>
  );
};
