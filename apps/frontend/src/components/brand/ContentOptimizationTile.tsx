"use client";

import React from 'react';
import { Edit3, CheckCircle2 } from 'lucide-react';

export const ContentOptimizationTile = () => {
    return (
        <div className="col-span-12 lg:col-span-3 row-span-5 bg-white/5 backdrop-blur-xl border border-cyan-500/10 p-6 flex flex-col rounded-xl overflow-hidden relative">
            <div className="flex items-center justify-between mb-4 relative z-10">
                <h2 className="text-lg font-bold text-white/90 tracking-tight">Optimization</h2>
                <div className="p-1 bg-cyan-500/10 rounded-lg text-cyan-400">
                    <Edit3 size={16} />
                </div>
            </div>

            <div className="flex-1 bg-black/40 border border-white/5 p-4 rounded-lg font-mono text-[10px] leading-relaxed overflow-hidden relative group">
                <div className="mb-3">
                    <span className="text-white/20 uppercase tracking-widest block mb-1">Subject Preview</span>
                    <span className="text-white/80 font-medium">Reimagining Enterprise Intelligence...</span>
                </div>

                <div className="text-white/50 space-y-2">
                    <p>
                        The current market demands a
                        <span className="bg-cyan-500/20 text-cyan-400 border-b border-cyan-500/50 px-1 mx-1 shadow-[0_0_15px_rgba(19,200,236,0.1)]">proactive</span>
                        approach to brand communications.
                    </p>
                    <p>
                        By leveraging
                        <span className="bg-cyan-500/20 text-cyan-400 border-b border-cyan-500/50 px-1 mx-1 shadow-[0_0_15px_rgba(19,200,236,0.1)]">multi-modal datasets</span>,
                        enterprises can predict shifts.
                    </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center relative z-10">
                    <div className="flex flex-col">
                        <span className="text-[8px] text-white/20 uppercase tracking-widest">Confidence</span>
                        <span className="text-[#13c8ec] font-bold">94.8%</span>
                    </div>
                    <button className="flex items-center gap-2 text-[#13c8ec] text-[9px] font-bold uppercase tracking-[0.2em] hover:text-white transition-colors group">
                        <CheckCircle2 size={12} className="group-hover:scale-110 transition-transform" />
                        Apply All
                    </button>
                </div>

                {/* Decorative scanning line */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-cyan-500/20 shadow-[0_0_8px_rgba(19,200,236,0.5)] animate-[scan_3s_linear_infinite] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
        </div>
    );
};
