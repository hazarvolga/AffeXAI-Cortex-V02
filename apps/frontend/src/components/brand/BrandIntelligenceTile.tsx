"use client";

import React from 'react';
import { TrendingUp } from 'lucide-react';

interface BrandIntelligenceTileProps {
    resonance?: {
        status?: string;
        value?: string;
    };
}

export const BrandIntelligenceTile = ({ resonance }: BrandIntelligenceTileProps) => {
    return (
        <div className="col-span-12 lg:col-span-8 row-span-7 bg-white/5 backdrop-blur-xl border border-cyan-500/10 flex flex-col p-6 overflow-hidden rounded-xl relative group">
            {/* Background Grain/Noise simulation */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-white/90">Brand Intelligence</h2>
                    <p className="text-[10px] text-cyan-500/50 uppercase tracking-[0.2em] font-mono">Network Node Graph: Social, Support, & Email signals</p>
                </div>
                <div className="text-right">
                    <p className="text-[#13c8ec] text-[10px] font-bold uppercase tracking-[0.2em] font-mono mb-1">Resonance Score</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold tracking-tighter text-white">{resonance?.value ?? '84.2'}</span>
                        <span className="text-emerald-400 text-xs font-medium flex items-center gap-1">
                            <TrendingUp size={12} />
                            +12.4%
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex-1 relative flex items-center justify-center min-h-[240px]">
                {/* Network Node Graph Mockup SVG */}
                <svg className="w-full h-full opacity-30" viewBox="0 0 800 400">
                    <defs>
                        <radialGradient id="glow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                            <stop offset="0%" stopColor="#13c8ec" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#13c8ec" stopOpacity="0" />
                        </radialGradient>
                    </defs>

                    {/* Connections */}
                    <path d="M400 200 L250 120 M400 200 L550 150 M400 200 L300 300 M400 200 L500 280 M250 120 L550 150 M300 300 L500 280"
                        stroke="rgba(19, 200, 236, 0.2)" strokeWidth="1" fill="none" />

                    {/* Trendline */}
                    <path d="M0 350 Q 100 300, 200 320 T 400 200 T 600 240 T 800 150"
                        fill="none" stroke="#13c8ec" strokeLinecap="round" strokeWidth="2" className="drop-shadow-[0_0_8px_rgba(19,200,236,0.5)]" />

                    {/* Nodes */}
                    <circle cx="400" cy="200" r="4" fill="#13c8ec" className="animate-pulse" />
                    <circle cx="250" cy="120" r="3" fill="#13c8ec" />
                    <circle cx="550" cy="150" r="3" fill="#13c8ec" />
                    <circle cx="300" cy="300" r="3" fill="#13c8ec" />
                    <circle cx="500" cy="280" r="3" fill="#13c8ec" />
                </svg>

                <div className="absolute bottom-4 left-4 flex gap-6 relative z-10">
                    <div className="flex items-center gap-2">
                        <div className="size-1.5 rounded-full bg-[#13c8ec] shadow-[0_0_8px_rgba(19,200,236,0.6)]"></div>
                        <span className="text-[9px] text-white/40 uppercase tracking-[0.2em] font-mono">Social Signals</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="size-1.5 rounded-full bg-white/20"></div>
                        <span className="text-[9px] text-white/40 uppercase tracking-[0.2em] font-mono">Support Logs</span>
                    </div>
                </div>
            </div>

            {/* Corner Accent */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-cyan-500/5 to-transparent pointer-events-none"></div>
        </div>
    );
};
