"use client";

import React from 'react';
import { Eye, CheckCircle2 } from 'lucide-react';

export const ContentRefinementTile = () => {
    return (
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-6 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-6 min-h-[400px] relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#13ecda]/10 rounded-lg text-[#13ecda]">
                        <Eye size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-white/90">AI Narrative Refinement</h3>
                        <p className="text-[10px] text-white/40 uppercase font-mono tracking-widest">Real-time Diff Analysis</p>
                    </div>
                </div>
                <span className="text-[8px] font-mono border border-[#13ecda]/20 px-2 py-0.5 rounded text-[#13ecda]/60">v2.4-STABLE</span>
            </div>

            <div className="flex-1 bg-black/40 border border-white/5 p-6 rounded-lg font-mono text-[11px] leading-[1.8] overflow-hidden relative">
                {/* Diff View Rows - Ported logic from reference */}
                <div className="space-y-4">
                    <div className="flex gap-4">
                        <span className="text-white/10 select-none w-4">01</span>
                        <p className="text-white/80">Our legacy campaign <span className="bg-red-500/10 text-red-400 px-1 border-b border-red-500/30 line-through">aims to maximize market reach</span></p>
                    </div>
                    <div className="flex gap-4">
                        <span className="text-white/10 select-none w-4">02</span>
                        <p className="text-white/80"><span className="bg-[#13ecda]/10 text-[#13ecda] px-1 border-b border-[#13ecda]/30 italic">cultivates deep atmospheric resonance</span> across</p>
                    </div>
                    <div className="flex gap-4">
                        <span className="text-white/10 select-none w-4">03</span>
                        <p className="text-white/80">the entire ecosystem, ensuring <span className="bg-[#13ecda]/10 text-[#13ecda] px-1 border-b border-[#13ecda]/30">empathetic synchronization.</span></p>
                    </div>
                    <div className="flex gap-4">
                        <span className="text-white/10 select-none w-4">04</span>
                        <p className="text-white/80">The result is a <span className="bg-[#13ecda]/10 text-[#13ecda] px-1 border-b border-[#13ecda]/30">unified brand frequency</span> that</p>
                    </div>
                    <div className="flex gap-4">
                        <span className="text-white/10 select-none w-4">05</span>
                        <p className="text-white/80">surpasses standard transactional metrics.</p>
                    </div>
                </div>

                {/* Decorative scanning line */}
                <div className="absolute top-0 left-0 right-0 h-[100px] bg-gradient-to-b from-[#13ecda]/5 to-transparent pointer-events-none animate-pulse"></div>
            </div>

            <div className="mt-2 flex justify-between items-center relative z-10">
                <div className="flex flex-col">
                    <span className="text-[8px] text-white/20 uppercase tracking-widest">Resonance Lift</span>
                    <span className="text-[#13ecda] font-bold">+18.4%</span>
                </div>
                <button className="flex items-center gap-2 text-[#13ecda] text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-2 border border-[#13ecda]/20 hover:bg-[#13ecda]/10 transition-all rounded">
                    <CheckCircle2 size={12} />
                    Approve Sync
                </button>
            </div>

            {/* Background Mesh Overlay */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0 10 L100 10 M0 30 L100 30 M0 50 L100 50 M0 70 L100 70 M0 90 L100 90 M10 0 L10 100 M30 0 L30 100 M50 0 L50 100 M70 0 L70 100 M90 0 L90 100" stroke="#13ecda" strokeWidth="0.1" fill="none" />
                </svg>
            </div>
        </div>
    );
};
