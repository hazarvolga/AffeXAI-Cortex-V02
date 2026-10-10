'use client';

import React from 'react';

export default function EditorialPage() {
    return (
        <section className="relative w-full h-full bg-[#080808] editorial-grid flex flex-col">
            {/* CSS for Grid Background (Scoped) */}
            <style jsx>{`
                .editorial-grid {
                    background-size: 40px 40px;
                    background-image: radial-gradient(circle, #1a1a1a 1px, transparent 1px);
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>

            {/* FIXED TOP SECTION (Flex-None) */}
            <div className="flex-none px-12 pt-12 pb-4 z-20 bg-[#080808]/90 backdrop-blur-sm border-b border-white/5">

                {/* 1. TOP TELEMETRY BAR (Relocated from Bottom HUD) */}
                <div className="w-full flex items-center justify-between pb-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex space-x-12">
                        <div className="flex items-center space-x-3">
                            <span className="text-[10px] uppercase tracking-widest text-[#9df425] font-bold">Sentiment Node</span>
                            <div className="text-xl font-light tabular-nums text-white">84.2<span className="text-xs text-white/40 ml-0.5">%</span></div>
                        </div>
                        <div className="h-4 w-px bg-white/10"></div>
                        <div className="flex items-center space-x-3">
                            <span className="text-[10px] uppercase tracking-widest text-[#ff1a1a] font-bold">Volatility</span>
                            <div className="text-xl font-light tabular-nums text-white">12.1<span className="text-xs text-white/40 ml-0.5">%</span></div>
                        </div>
                        <div className="h-4 w-px bg-white/10"></div>
                        <div className="flex items-center space-x-3">
                            <span className="text-[10px] uppercase tracking-widest text-white/60 font-bold">Dominance</span>
                            <div className="text-xl font-light tabular-nums text-white">0.65<span className="text-xs text-white/40 ml-0.5">IDX</span></div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 opacity-50">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#9df425] animate-pulse"></div>
                        <span className="text-[9px] uppercase tracking-widest text-white/40">Market Live</span>
                    </div>
                </div>

                {/* 2. HEADER (Fixed) */}
                <div className="flex justify-between items-end w-full">
                    <div className="max-w-3xl">
                        <h1 className="text-[clamp(2.5rem,5vw,4rem)] leading-[0.9] font-bold uppercase tracking-tighter mb-2 text-white">
                            System <br /> Velocity.
                        </h1>
                        <div className="flex items-center space-x-4">
                            <span className="bg-[#9df425] text-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">Live Shift</span>
                            <p className="text-white/40 text-xs max-w-sm font-light leading-relaxed truncate">
                                Observing neural-compute demand vs legacy decline. Correlation: 0.82.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* SCROLLABLE CONTENT AREA (Flex-Grow) */}
            <div className="flex-grow overflow-y-auto relative no-scrollbar bg-[#080808]">

                {/* Abstract Geometric Landscape (Preserved as content background) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 h-[150vh]">
                    <div className="relative w-[80%] h-[80%]">
                        {/* Geometric Plane 1 */}
                        <div className="absolute top-1/4 left-1/4 w-[600px] h-[400px] border border-[#9df425]/20 transform -rotate-12 skew-x-12"></div>
                        {/* Geometric Plane 2 */}
                        <div className="absolute top-1/3 left-1/3 w-[500px] h-[300px] border border-white/10 transform rotate-6 skew-y-6"></div>

                        {/* Risk Vectors */}
                        <svg className="absolute inset-0 w-full h-full">
                            <line stroke="rgba(255,255,255,0.05)" strokeWidth="1" x1="10%" x2="90%" y1="90%" y2="10%"></line>
                            <line stroke="rgba(255,255,255,0.05)" strokeWidth="1" x1="0%" x2="100%" y1="50%" y2="50%"></line>
                            {/* Deep Crimson Risk Indicator */}
                            <circle className="animate-pulse" cx="65%" cy="35%" fill="#ff1a1a" r="4"></circle>
                            <line stroke="#ff1a1a" strokeDasharray="4 2" strokeWidth="2" x1="65%" x2="80%" y1="35%" y2="15%"></line>
                        </svg>
                    </div>
                </div>

                {/* Foreground Content - Added dummy content to demonstrate scroll if needed, 
                    but main purpose is structure matching Overseer */}
                <div className="relative z-10 p-12 space-y-24 min-h-[120vh]">
                    {/* Just spacing to allow scroll to work if content existed, relies on landscape h-[150vh] */}
                    <div className="text-white/10 font-mono text-xs uppercase tracking-[0.5em] text-center pt-96">
                        Scroll Horizon Detected
                    </div>
                </div>

                {/* Ambient Interactive Nodes (Preserved but relative to content now) */}
                <div className="absolute top-[300px] right-1/3 flex flex-col items-center pointer-events-none z-0">
                    <div className="w-2 h-2 rounded-full bg-[#9df425] shadow-[0_0_15px_rgba(157,244,37,0.5)]"></div>
                    <div className="h-20 w-px bg-gradient-to-b from-[#9df425]/50 to-transparent"></div>
                    <div className="text-[9px] uppercase tracking-widest text-[#9df425]/80 mt-2 font-bold">Nexus Point A</div>
                </div>
                <div className="absolute top-[500px] left-1/2 flex flex-col items-center pointer-events-none z-0">
                    <div className="w-2 h-2 rounded-full bg-[#ff1a1a] shadow-[0_0_15px_rgba(255,26,26,0.5)]"></div>
                    <div className="h-32 w-px bg-gradient-to-b from-[#ff1a1a]/50 to-transparent"></div>
                    <div className="text-[9px] uppercase tracking-widest text-[#ff1a1a]/80 mt-2 font-bold">Anomaly Detected</div>
                </div>
            </div>

        </section>
    );
}
