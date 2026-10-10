"use client";

import React from 'react';
import { ShieldCheck, Eraser, Globe } from 'lucide-react';

export const ModuleSmallMetrics = () => {
    return (
        <>
            {/* Trust Authority */}
            <div className="md:col-span-1 md:row-span-1 lg:col-span-1 lg:row-span-1 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-5 flex flex-col justify-between group hover:border-[#13ecec]/40 transition-colors">
                <div className="flex justify-between items-center">
                    <ShieldCheck className="text-[#13ecec] size={20}" />
                    <div className="px-1.5 py-0.5 rounded-sm bg-[#13ecec]/10 border border-[#13ecec]/30 text-[8px] font-bold text-[#13ecec] tracking-tighter uppercase">Verified</div>
                </div>
                <div>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold font-mono">Trust Authority</p>
                    <h4 className="text-sm font-bold text-white mt-1">SSL Level 4 Active</h4>
                </div>
            </div>

            {/* Email Hygiene */}
            <div className="md:col-span-1 md:row-span-1 lg:col-span-1 lg:row-span-1 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-5 flex flex-col justify-between group hover:border-purple-400/40 transition-colors">
                <div className="flex justify-between items-center">
                    <Eraser className="text-purple-400 size={20}" />
                    <div className="text-[10px] font-mono text-white/40">BATCH #A88</div>
                </div>
                <div>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold font-mono">Propensity</p>
                    <div className="flex items-center gap-2 mt-1">
                        <h4 className="text-sm font-bold text-white">99.9% Clean</h4>
                        <div className="size-1 rounded-full bg-purple-400 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.5)]"></div>
                    </div>
                </div>
            </div>

            {/* IP Reputation */}
            <div className="md:col-span-1 md:row-span-1 lg:col-span-1 lg:row-span-1 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-5 border-l-2 border-l-[#13ecec]/50 overflow-hidden relative group">
                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold font-mono">Reputation</p>
                        <h4 className="text-2xl font-bold text-white mt-1 leading-none tracking-tighter">98<span className="text-sm text-[#13ecec]">/100</span></h4>
                    </div>
                    <div className="size-10 rounded-full border-2 border-[#13ecec]/20 flex items-center justify-center relative shadow-[0_0_15px_rgba(19,236,236,0.05)]">
                        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(19,236,236,0.1)" strokeWidth="2" />
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#13ecec" strokeDasharray="98, 100" strokeWidth="2.5" />
                        </svg>
                        <span className="text-[10px] font-bold text-[#13ecec] font-mono">A+</span>
                    </div>
                </div>
                <div className="absolute -bottom-4 -right-4 size-20 bg-[#13ecec]/5 rounded-full blur-xl pointer-events-none group-hover:bg-[#13ecec]/10 transition-all duration-700"></div>
            </div>

            {/* Social Distribution - Long Span */}
            <div className="md:col-span-2 md:row-span-1 lg:col-span-1 lg:row-span-1 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-5 flex items-center gap-6 group">
                <div className="size-12 rounded-2xl bg-gradient-to-tr from-purple-600/20 to-blue-600/20 flex items-center justify-center flex-shrink-0 border border-white/5 shadow-xl group-hover:scale-105 transition-transform duration-500">
                    <Globe className="text-white/60 size={20}" />
                </div>
                <div className="flex-1">
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1 font-mono">Social Dist.</p>
                    <div className="flex justify-between items-end">
                        <h4 className="text-sm font-medium text-white tracking-tight uppercase">Stability Map</h4>
                        <div className="flex items-center gap-0.5 mb-1 text-[#13ecec]">
                            <span className="text-[10px] font-bold">+12%</span>
                            <span className="material-symbols-outlined text-[12px]">trending_up</span>
                        </div>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full mt-2 overflow-hidden flex gap-0.5">
                        <div className="h-full bg-blue-500 w-1/3 opacity-80"></div>
                        <div className="h-full bg-purple-500 w-1/4 opacity-80"></div>
                        <div className="h-full bg-[#13ecec] w-1/5 opacity-80"></div>
                        <div className="h-full bg-white/10 flex-1"></div>
                    </div>
                </div>
            </div>
        </>
    );
};
