"use client";

import React, { ReactNode, useEffect } from "react";
import { Space_Grotesk } from 'next/font/google';
import Link from 'next/link';
import { BccCollapsibleSidebar } from "./BccCollapsibleSidebar";
import { AiCoPilot } from "./ai/AiCoPilot";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';


// Load Space Grotesk Font
const spaceGrotesk = Space_Grotesk({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700'],
    variable: '--font-space-grotesk',
});

interface BccEditorialWrapperProps {
    children: ReactNode;
    theme?: 'super-admin' | 'tenant-admin';
    telemetryData?: Array<{ label: string, value: string, suffix?: string, color?: string }>;
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
    theme = 'tenant-admin',
    telemetryData = [],
    headerTitle = "AffeXAI Cortex",
    headerSubtitle = "Çalışma alanı yönetimi.",
    headerBadge = "Yönetim",
    moduleNav,
    headerAction,
    hideSidebar = false
}: BccEditorialWrapperProps) => {

    const [mounted, setMounted] = React.useState(false);
    const [currentTime, setCurrentTime] = React.useState("");
    const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

    useEffect(() => {
        setMounted(true);
        const updateTick = () => {
            setCurrentTime(new Date().toLocaleTimeString('en-GB', { hour12: false, timeZone: 'UTC' }));
        };
        updateTick();
        const interval = setInterval(updateTick, 1000);
        return () => clearInterval(interval);
    }, []);

    const isTenant = theme === 'tenant-admin';
    const accentColor = isTenant ? '#ff8c00' : '#9df425';

    // Dynamic Tenant Extraction for Header
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const pathParts = pathname.split('/');
    const tenant = pathParts[1] !== 'admin' && pathParts[1] !== '' ? pathParts[1] : undefined;

    const generateTenantLink = (path: string) => {
        if (!tenant) return path;
        // If path already starts with tenant, return as is
        if (path.startsWith(`/${tenant}`)) return path;
        return `/${tenant}${path}`;
    };

    // [NEURAL GRID] Context Detection
    const isTicketPage = pathParts.includes('tickets') && pathParts.length > 3; // admin/tickets/[id]
    const ticketId = isTicketPage ? pathParts[pathParts.length - 1] : undefined;


    return (
        <div lang="tr" className={`min-h-screen bg-[#080808] text-white font-sans ${spaceGrotesk.variable} overflow-hidden select-none relative`}>
            {/* 1. GLOBAL STYLES & FONTS */}
            <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
            <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

            <style jsx global>{`
                .vertical-text {
                    writing-mode: vertical-rl;
                    text-orientation: mixed;
                }
                .editorial-grid {
                    background-size: 40px 40px;
                    background-image: radial-gradient(circle, #1a1a1a 1px, transparent 1px);
                }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                
                @keyframes orbit {
                    from { transform: rotate(0deg) translateX(100px) rotate(0deg); }
                    to { transform: rotate(360deg) translateX(100px) rotate(-360deg); }
                }
            `}</style>

            {/* 2. TOP EDITORIAL HEADER */}
            <header className="fixed top-0 left-0 w-full z-50 border-b border-white/10 bg-[#080808]/80 backdrop-blur-md px-4 md:px-8 py-4 flex justify-between items-center">
                <div className="flex min-w-0 items-center space-x-4 lg:space-x-12">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-500" style={{ backgroundColor: accentColor }}>
                            <span className="material-icons text-black text-sm">analytics</span>
                        </div>
                        <span className="truncate text-sm font-bold tracking-tighter uppercase font-mono sm:text-xl">AffeXAI Cortex</span>
                    </div>
                    {/* Dynamic Tenant-Aware Header Links */}
                    <nav className="hidden md:flex space-x-8 text-[10px] tracking-[0.2em] font-medium uppercase text-white/40">
                        {mounted ? (
                            <>
                                <Link href={generateTenantLink("/admin/brand/intelligence")} className="hover:text-white transition-colors">Intelligence</Link>
                                <Link href={generateTenantLink("/admin/brand/resonance")} className="hover:text-white transition-colors">Resonance</Link>
                                <Link href={generateTenantLink("/admin/brand/module")} className="hover:text-white transition-colors tracking-tight">Module Command</Link>
                                <Link href={generateTenantLink("/admin/brand/strategy")} className="transition-colors font-bold" style={{ color: accentColor }}>Strategic Ops</Link>
                            </>
                        ) : (
                            <>
                                <span className="opacity-0">Intelligence</span>
                                <span className="opacity-0">Resonance</span>
                                <span className="opacity-0">Module Command</span>
                                <span className="opacity-0">Strategic Ops</span>
                            </>
                        )}
                    </nav>
                </div>
                <div className="flex items-center space-x-6">
                    <div className="hidden text-[10px] tracking-widest text-white/60 font-mono sm:block">
                        UTC <span className="text-white font-bold">{mounted ? currentTime : "--:--:--"}</span>
                    </div>
                    <div className="h-4 w-px bg-white/20"></div>
                    <div className="flex space-x-4">
                        <span className="material-icons text-sm cursor-pointer hover:opacity-70 transition-opacity" style={{ color: accentColor }}>search</span>
                        {!hideSidebar && (
                            <button
                                type="button"
                                aria-label={mobileNavOpen ? 'Menüyü kapat' : 'Menüyü aç'}
                                aria-expanded={mobileNavOpen}
                                onClick={() => setMobileNavOpen(open => !open)}
                                className="inline-flex text-white/50 hover:text-white lg:hidden"
                            >
                                <span className="material-icons text-sm">{mobileNavOpen ? 'close' : 'menu'}</span>
                            </button>
                        )}
                        <span className="material-icons hidden text-sm cursor-pointer hover:text-white transition-colors text-white/40 lg:inline">menu</span>
                    </div>
                </div>
            </header>

            <main className="relative h-screen w-full flex overflow-hidden pt-[72px]">
                {/* 3. COLLAPSIBLE SIDEBAR */}
                {!hideSidebar && <div className="hidden h-full lg:block"><BccCollapsibleSidebar theme={theme} /></div>}
                {!hideSidebar && (
                    <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                        <SheetContent side="left" className="w-64 border-white/10 bg-[#080808] p-0 text-white lg:hidden" aria-label="Yönetim menüsü">
                            <SheetTitle className="sr-only">Yönetim menüsü</SheetTitle>
                            <SheetDescription className="sr-only">Tenant yönetim modüllerine geçiş yapın.</SheetDescription>
                            <BccCollapsibleSidebar theme={theme} forcedExpanded />
                        </SheetContent>
                    </Sheet>
                )}

                {/* 4. CENTRAL VIEWPORT HANDLER */}
                <div className="flex-grow h-full overflow-hidden relative editorial-grid flex flex-col">

                    {/* FIXED TOP TELEMETRY SECTION */}
                    <div className="flex-none px-4 pt-8 pb-4 z-20 bg-[#080808]/90 backdrop-blur-sm border-b border-white/5 md:px-8 lg:px-12 lg:pr-36 lg:pt-12">
                        <div className="w-full flex items-center justify-between gap-4 pb-6 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="hidden space-x-12 md:flex">
                                {telemetryData.map((item, idx) => (
                                    <React.Fragment key={idx}>
                                        <div className="flex items-center space-x-3">
                                            <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{item.label}</span>
                                            <div className="text-xl font-light tabular-nums text-white">
                                                {item.value}<span className="text-xs text-white/40 ml-0.5">{item.suffix}</span>
                                            </div>
                                        </div>
                                        {idx < telemetryData.length - 1 && <div className="h-4 w-px bg-white/10"></div>}
                                    </React.Fragment>
                                ))}

                            </div>

                            <div className="flex items-center space-x-3">
                                {headerAction}
                            </div>
                        </div>

                        <div className="flex justify-between items-end w-full">
                            <div className="max-w-3xl">
                                <h1 className="text-[clamp(2rem,9vw,4rem)] leading-[0.9] font-bold uppercase tracking-tighter mb-2 text-white font-mono">
                                    {headerTitle.split(' ').map((word, i) => i === 1 ? <React.Fragment key={i}><br />{word}.</React.Fragment> : word)}
                                </h1>
                                <div className="flex items-center space-x-4">
                                    <span className="text-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest transition-colors duration-500" style={{ backgroundColor: accentColor }}>
                                        {headerBadge}
                                    </span>
                                    {moduleNav ? (
                                        <div className="flex items-center">
                                            {moduleNav}
                                        </div>
                                    ) : (
                                        <p className="text-white/40 text-xs max-w-sm font-light leading-relaxed truncate uppercase tracking-widest font-mono">
                                            {headerSubtitle}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SCROLLABLE CONTENT */}
                    <div className="flex-grow overflow-y-auto overflow-x-hidden no-scrollbar relative z-10 p-4 md:p-8 lg:p-12 lg:pr-36">
                        {children}
                    </div>

                    {/* AMBIENT SIGNAL RAIL (RIGHT) */}
                    <aside className="fixed right-0 top-[72px] w-24 h-full border-l border-white/5 bg-[#080808]/50 hidden flex-col items-center py-20 z-20 xl:flex">
                        <div className="absolute top-0 left-0 w-full h-1 transition-colors duration-500" style={{ backgroundColor: `${accentColor}33` }}></div>
                        <div className="vertical-text flex flex-col items-center space-y-8 uppercase tracking-[0.4em] text-[10px] text-white/30 font-medium h-2/3 justify-center">
                            <span>AffeXAI Cortex</span>
                            <span style={{ color: accentColor }}>{isTenant ? 'Çalışma alanı' : 'Platform yönetimi'}</span>
                        </div>


                    </aside>
                </div>
            </main>

            {/* DECORATIVE ELEMENTS */}
            <div className="fixed bottom-8 left-8 z-50 hidden items-center space-x-4 pointer-events-none lg:flex">
                <div className="text-[9px] text-white/20 uppercase tracking-[0.3em] vertical-text transform rotate-180 font-mono">
                    AFFEXAI CORTEX
                </div>
                <div className="w-px h-24 bg-gradient-to-t from-white/10 to-transparent"></div>
            </div>

            {/* [NEURAL GRID] GLOBAL SYNAPSE */}
            <AiCoPilot
                context={isTicketPage ? "Ticket Resolution" : "General Strategy"}
                data={{
                    contextType: isTicketPage ? 'ticket' : 'general',
                    contextId: ticketId
                }}
                variant="floating"
            />
        </div>
    );
};
