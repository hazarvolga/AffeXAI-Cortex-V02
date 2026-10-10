"use client";

import React from 'react';
import { Search } from 'lucide-react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export const FloatingSlimNav = () => {
    const params = useParams();
    const tenant = params?.tenant ? String(params.tenant) : 'affexai';

    return (
        <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
            <nav className="bg-white/5 backdrop-blur-xl flex items-center justify-between gap-8 px-6 py-2 rounded-full max-w-4xl w-full border border-cyan-500/10 pointer-events-auto">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full bg-[#13c8ec] shadow-[0_0_15px_rgba(19,200,236,0.6)] animate-pulse"></div>
                        <span className="text-sm font-bold tracking-widest text-white uppercase font-mono">BCC</span>
                    </div>
                    <div className="h-4 w-px bg-white/10"></div>
                    <div className="flex gap-6">
                        <Link className="text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-[#13c8ec] transition-colors" href={`/${tenant}/admin/brand/intelligence`}>Intelligence</Link>
                        <Link className="text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-[#13c8ec] transition-colors" href={`/${tenant}/admin/brand/resonance`}>Resonance</Link>
                        <Link className="text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-[#13c8ec] transition-colors" href={`/${tenant}/admin/brand/module`}>Module</Link>
                        <Link className="text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-[#13c8ec] transition-colors" href={`/${tenant}/admin/brand/strategy`}>Strategy</Link>
                    </div>
                </div>

                {/* Brand Pulse Waveform */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 h-6">
                        <div className="w-[2px] h-2 bg-[#13c8ec]/40 rounded-full animate-[bounce_1.2s_infinite]"></div>
                        <div className="w-[2px] h-4 bg-[#13c8ec]/60 rounded-full animate-[bounce_0.8s_infinite]"></div>
                        <div className="w-[2px] h-6 bg-[#13c8ec] rounded-full animate-[bounce_1s_infinite]"></div>
                        <div className="w-[2px] h-3 bg-[#13c8ec]/50 rounded-full animate-[bounce_1.4s_infinite]"></div>
                        <div className="w-[2px] h-5 bg-[#13c8ec]/80 rounded-full animate-[bounce_1.1s_infinite]"></div>
                    </div>

                    <div className="h-8 w-8 rounded-full border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/5 transition-colors">
                        <Search size={14} className="text-[#13c8ec]" />
                    </div>

                    <div className="size-8 rounded-full border border-cyan-500/20 bg-cover bg-center overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-[#13c8ec]/20 to-black/40 flex items-center justify-center text-[10px] font-mono text-white/40">
                            ADM
                        </div>
                    </div>
                </div>
            </nav>
        </div>
    );
};
