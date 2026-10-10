"use client";

import React from 'react';
import { Route, Activity, RefreshCw } from 'lucide-react';

export const EventOrchestrationTile = () => {
    return (
        <div className="md:col-span-2 md:row-span-2 lg:col-span-2 lg:row-span-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <p className="text-[#13ecec] text-[10px] font-bold tracking-[0.2em] uppercase mb-1">Module 01</p>
                    <h3 className="text-2xl font-bold text-white tracking-tight">Event Orchestration</h3>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-[#13ecec]/10 rounded-full border border-[#13ecec]/20">
                    <div className="size-1.5 rounded-full bg-[#13ecec] shadow-[0_0_8px_#13ecec] animate-pulse"></div>
                    <span className="text-[10px] font-bold text-[#13ecec] tracking-wider uppercase">Live Sync</span>
                </div>
            </div>

            <div className="relative h-[calc(100%-100px)] mt-4">
                {/* Spatial Timeline Background */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <svg className="w-full h-full" viewBox="0 0 500 300">
                        <path d="M0 150 Q 125 50 250 150 T 500 150" fill="none" stroke="url(#line-grad)" strokeWidth="1.5"></path>
                        <path d="M0 180 Q 125 280 250 180 T 500 180" fill="none" stroke="url(#line-grad-2)" strokeWidth="1.5"></path>
                        <defs>
                            <linearGradient id="line-grad" x1="0" x2="1" y1="0" y2="0">
                                <stop offset="0%" stopColor="#13ecec" />
                                <stop offset="100%" stopColor="#a855f7" />
                            </linearGradient>
                            <linearGradient id="line-grad-2" x1="0" x2="1" y1="0" y2="0">
                                <stop offset="0%" stopColor="#3b82f6" />
                                <stop offset="100%" stopColor="#13ecec" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                <div className="grid grid-cols-1 gap-6 relative z-10">
                    <div className="flex items-center gap-4 group/item cursor-pointer">
                        <div className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#13ecec] group-hover/item:bg-[#13ecec]/20 transition-all shadow-[0_0_15px_rgba(19,236,236,0.1)]">
                            <span className="material-symbols-outlined">route</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-white/80">Segment Mapping</p>
                            <p className="text-xs text-white/40 font-mono tracking-tight text-[10px]">Active pathways: 1,402</p>
                        </div>
                        <span className="text-[10px] font-mono text-[#13ecec]/60">0.02ms</span>
                    </div>

                    <div className="flex items-center gap-4 group/item cursor-pointer">
                        <div className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-purple-400 group-hover/item:bg-purple-400/20 transition-all shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                            <span className="material-symbols-outlined">pulse_alert</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-white/80">Stream Integrity</p>
                            <p className="text-xs text-white/40 font-mono tracking-tight text-[10px]">Data flow optimization: 98%</p>
                        </div>
                        <span className="text-[10px] font-mono text-purple-400/60 font-bold">ACTIVE</span>
                    </div>

                    <div className="flex items-center gap-4 group/item cursor-pointer">
                        <div className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-400 group-hover/item:bg-blue-400/20 transition-all shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                            <span className="material-symbols-outlined">cloud_sync</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-white/80">Cross-Platform Sync</p>
                            <p className="text-xs text-white/40 font-mono tracking-tight text-[10px]">Latent node resolution: Minimal</p>
                        </div>
                        <span className="text-[10px] font-mono text-blue-400/60 font-bold">STABLE</span>
                    </div>
                </div>
            </div>

            {/* Ambient Background Glow */}
            <div className="absolute -bottom-12 -right-12 size-48 bg-[#13ecec]/5 rounded-full blur-[60px] pointer-events-none group-hover:bg-[#13ecec]/10 transition-all duration-700"></div>
        </div>
    );
};
