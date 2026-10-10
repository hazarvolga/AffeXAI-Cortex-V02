'use client';

import React, { ReactNode, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Space_Grotesk } from 'next/font/google';
import Link from 'next/link';

// Load Space Grotesk Font
const spaceGrotesk = Space_Grotesk({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700'],
    variable: '--font-space-grotesk',
});

export default function EditorialLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const { isSuperAdmin, isLoading: authLoading } = useAuth();

    // --- Auth Logic ---
    useEffect(() => {
        console.log('🔍 Editorial Layout: Auth Check', {
            authLoading,
            isSuperAdmin,
            timestamp: new Date().toISOString()
        });

        if (authLoading) return;

        if (!isSuperAdmin) {
            console.warn('⚠️ Editorial Layout: Not Super Admin, redirecting to /admin');
            router.push('/admin'); // Redirect to Admin Dashboard if not Super Admin
        } else {
            console.log('✅ Editorial Layout: Super Admin confirmed, staying on editorial console');
        }
    }, [isSuperAdmin, authLoading, router]);

    if (authLoading) return <div className="h-screen bg-[#080808] flex items-center justify-center text-[#9df425] font-mono tracking-widest">INITIALIZING...</div>;

    return (
        <div className={`min-h-screen bg-[#080808] text-white font-sans ${spaceGrotesk.variable} relative`}>
            {/* Load Material Icons */}
            <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
            <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

            {/* Global Styles for specific layout needs */}
            <style jsx global>{`
                .vertical-text {
                    writing-mode: vertical-rl;
                    text-orientation: mixed;
                }
                .material-icons {
                    font-family: 'Material Icons';
                    font-weight: normal;
                    font-style: normal;
                    font-size: 24px;  /* Preferred icon size */
                    display: inline-block;
                    line-height: 1;
                    text-transform: none;
                    letter-spacing: normal;
                    word-wrap: normal;
                    white-space: nowrap;
                    direction: ltr;
                }
                /* Hide scrollbar for Chrome, Safari and Opera */
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                /* Hide scrollbar for IE, Edge and Firefox */
                .no-scrollbar {
                    -ms-overflow-style: none;  /* IE and Edge */
                    scrollbar-width: none;  /* Firefox */
                }
            `}</style>

            {/* Top Editorial Header */}
            <header className="fixed top-0 left-0 w-full z-50 border-b border-white/10 bg-[#080808]/80 backdrop-blur-md px-8 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-12">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-[#9df425] rounded-full flex items-center justify-center">
                            <span className="material-icons text-black text-sm">analytics</span>
                        </div>
                        <span className="text-xl font-bold tracking-tighter uppercase">AffeXAI</span>
                    </div>
                    <nav className="hidden md:flex space-x-8 text-[10px] tracking-[0.2em] font-medium uppercase text-white/40">
                        <Link className="hover:text-[#9df425] transition-colors" href="/editorial-console/intelligence">Intelligence</Link>
                        <Link className="hover:text-[#9df425] transition-colors" href="/editorial-console">Market Landscape / V3</Link>
                        <Link className="hover:text-[#9df425] transition-colors" href="/editorial-console/auditor">Strategic Ops</Link>
                        <Link className="hover:text-[#9df425] transition-colors" href="#">Archive</Link>
                    </nav>
                </div>
                <div className="flex items-center space-x-6">
                    <div className="text-[10px] tracking-widest text-white/60">
                        UTC <span className="text-white font-bold">{new Date().toLocaleTimeString('en-GB', { hour12: false })}</span>
                    </div>
                    <div className="h-4 w-px bg-white/20"></div>
                    <div className="flex space-x-4">
                        <span className="material-icons text-sm cursor-pointer hover:text-[#9df425]">search</span>
                        <span className="material-icons text-sm cursor-pointer hover:text-[#9df425]">menu</span>
                    </div>
                </div>
            </header>

            {/* Main Editorial Spread */}
            <main className="relative min-h-screen w-full flex pt-[72px]">
                {/* Left Intelligence Gutter */}
                <div className="w-16 border-r border-white/5 flex flex-col items-center py-24 space-y-8 text-white/30 z-20 bg-[#080808]">
                    <Link href="/editorial-console/intelligence" title="Market Intelligence">
                        <span className="material-icons text-lg hover:text-[#9df425] transition-colors cursor-pointer">psychology</span>
                    </Link>
                    <Link href="/editorial-console/auditor" title="Auditor (Financial)">
                        <span className="material-icons text-lg hover:text-[#9df425] transition-colors cursor-pointer">adjust</span>
                    </Link>
                    <Link href="/editorial-console" title="Constellation (Tenants)">
                        <span className="material-icons text-lg hover:text-[#9df425] transition-colors cursor-pointer">radar</span>
                    </Link>
                    <Link href="/editorial-console/overseer" title="Overseer (Technical)">
                        <span className="material-icons text-lg hover:text-[#9df425] transition-colors cursor-pointer">stream</span>
                    </Link>
                    <Link href="/editorial-console/modules" title="Module Gateway">
                        <span className="material-icons text-lg hover:text-[#9df425] transition-colors cursor-pointer">hub</span>
                    </Link>
                    <Link href="/editorial-console/products" title="Product Catalog">
                        <span className="material-icons text-lg hover:text-[#9df425] transition-colors cursor-pointer">inventory_2</span>
                    </Link>
                    <Link href="/editorial-console/commerce" title="Commerce & Billing">
                        <span className="material-icons text-lg hover:text-[#9df425] transition-colors cursor-pointer">payments</span>
                    </Link>
                    <Link href="/editorial-console/security" title="Security Center">
                        <span className="material-icons text-lg hover:text-[#9df425] transition-colors cursor-pointer">security</span>
                    </Link>
                    <Link href="/affexai/admin/brand" title="Tenant Admin (AffexAI)">
                        <span className="material-icons text-lg hover:text-[#9df425] transition-colors cursor-pointer">admin_panel_settings</span>
                    </Link>
                </div>

                {/* Central Content - Fixed Viewport (Page handles scroll) */}
                <div className="flex-grow h-full relative">
                    {children}
                </div>

                {/* Ambient System Signal Rail (Right) */}
                <aside className="w-24 border-l border-white/5 bg-[#080808]/50 flex flex-col items-center py-20 relative z-20">
                    <div className="absolute top-0 left-0 w-full h-1 bg-[#9df425]/20"></div>
                    <div className="vertical-text flex flex-col items-center space-y-8 uppercase tracking-[0.4em] text-[10px] text-white/30 font-medium h-2/3 justify-center">
                        <span>Signal Strength 0.98</span>
                        <span className="text-[#9df425] font-bold">System Online</span>
                        <span>Buffer Status: Optimal</span>
                    </div>

                    <div className="mt-auto flex flex-col items-center space-y-6 pb-8">
                        {/* Live Pulse */}
                        <div className="relative flex items-center justify-center">
                            <div className="absolute w-8 h-8 rounded-full border border-[#9df425]/20 animate-ping"></div>
                            <div className="w-2 h-2 rounded-full bg-[#9df425]"></div>
                        </div>
                        <div className="space-y-4">
                            <div className="w-1 h-8 bg-white/5 rounded-full overflow-hidden">
                                <div className="w-full h-1/2 bg-[#9df425]"></div>
                            </div>
                            <div className="w-1 h-8 bg-white/5 rounded-full overflow-hidden">
                                {/* Deep Crimson using hex directly to ensure color match */}
                                <div className="w-full h-3/4 bg-[#ff1a1a]"></div>
                            </div>
                            <div className="w-1 h-8 bg-white/5 rounded-full overflow-hidden">
                                <div className="w-full h-1/4 bg-white/40"></div>
                            </div>
                        </div>
                        <span className="material-icons text-white/20 text-sm">settings_input_component</span>
                    </div>
                </aside>
            </main>

            {/* Decorative Elements (Fixed at bottom) */}
            <div className="fixed bottom-8 left-8 z-50 flex items-center space-x-4 pointer-events-none">
                <div className="text-[9px] text-white/20 uppercase tracking-[0.3em] vertical-text transform rotate-180">
                    AETHER INTEL SYSTEMS // CORE_V3.01
                </div>
                <div className="w-px h-24 bg-gradient-to-t from-[#9df425]/30 to-transparent"></div>
            </div>

        </div>
    );
}
