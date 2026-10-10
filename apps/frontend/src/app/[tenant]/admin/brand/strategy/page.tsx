"use client";

import React from 'react';
import { TrendingUp, Target, Zap, ShieldCheck } from 'lucide-react';

/**
 * BCC Strategy Page: Visualized using the 'Editorial' language.
 */
export default function BccStrategyPage() {
    return (
        <div className="relative w-full h-[150vh] flex flex-col pt-12">
            {/* 1. GEOMETRIC STRATEGY LANDSCAPE */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                <div className="relative w-[80%] h-[80%]">
                    {/* Strategic Plane 1: Campaign Trajectory */}
                    <div className="absolute top-1/4 left-1/4 w-[700px] h-[500px] border border-[#ff8c00]/20 transform -rotate-12 skew-x-12 transition-all duration-1000 hover:border-[#ff8c00]/40"></div>

                    {/* Strategic Plane 2: Resource Allocation */}
                    <div className="absolute top-1/3 left-1/3 w-[600px] h-[400px] border border-white/5 transform rotate-6 skew-y-6"></div>

                    {/* Trajectory Vectors */}
                    <svg className="absolute inset-0 w-full h-full">
                        <defs>
                            <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#ff8c00" stopOpacity="0.2" />
                                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.1" />
                            </linearGradient>
                        </defs>
                        <line stroke="rgba(255,140,0,0.1)" strokeWidth="1" x1="10%" x2="90%" y1="90%" y2="10%"></line>
                        <line stroke="rgba(255,255,255,0.03)" strokeWidth="1" x1="0%" x2="100%" y1="60%" y2="60%"></line>

                        {/* Strategic Strike Point */}
                        <circle className="animate-pulse" cx="70%" cy="30%" fill="#ff8c00" r="4" style={{ filter: 'drop-shadow(0 0 8px #ff8c00)' }}></circle>
                        <circle cx="70%" cy="30%" fill="none" r="12" stroke="#ff8c00" strokeWidth="0.5" strokeOpacity="0.3"></circle>
                        <line stroke="#ff8c00" strokeDasharray="4 4" strokeWidth="1.5" x1="70%" x2="85%" y1="30%" y2="10%"></line>
                    </svg>
                </div>
            </div>

            {/* 2. TACTICAL CONTENT NODES */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 pt-12">
                {/* Node 01: Adaptive Budgeting */}
                <div className="group border border-white/5 bg-white/[0.02] backdrop-blur-xl p-8 rounded-3xl hover:border-[#ff8c00]/30 transition-all duration-500">
                    <div className="flex justify-between items-start mb-6">
                        <div className="size-10 rounded-xl bg-[#ff8c00]/10 flex items-center justify-center text-[#ff8c00]">
                            <Target size={20} />
                        </div>
                        <span className="text-[10px] font-mono text-[#ff8c00] opacity-50 uppercase tracking-widest">Active Pulse</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tighter">Adaptive Budgeting</h3>
                    <p className="text-sm text-white/40 leading-relaxed font-light mb-6">
                        Redistributing resources based on real-time event resonance. Fluid allocation mode engaged.
                    </p>
                    <div className="h-px w-full bg-gradient-to-r from-[#ff8c00]/40 to-transparent"></div>
                </div>

                {/* Node 02: Predictive Scaling */}
                <div className="group border border-white/5 bg-white/[0.02] backdrop-blur-xl p-8 rounded-3xl hover:border-[#ff8c00]/30 transition-all duration-500">
                    <div className="flex justify-between items-start mb-6">
                        <div className="size-10 rounded-xl bg-[#a855f7]/10 flex items-center justify-center text-[#a855f7]">
                            <TrendingUp size={20} />
                        </div>
                        <span className="text-[10px] font-mono text-[#a855f7] opacity-50 uppercase tracking-widest">Neural Sync</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tighter">Predictive Scaling</h3>
                    <p className="text-sm text-white/40 leading-relaxed font-light mb-6">
                        Scaling ad spend by 15.4% for peak ROI. Analyzing 450 participant flows in real-time.
                    </p>
                    <div className="h-px w-full bg-gradient-to-r from-[#a855f7]/40 to-transparent"></div>
                </div>

                {/* Node 03: Resonance Pivot */}
                <div className="group border border-white/5 bg-white/[0.02] backdrop-blur-xl p-8 rounded-3xl hover:border-[#ff8c00]/30 transition-all duration-500">
                    <div className="flex justify-between items-start mb-6">
                        <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-white">
                            <ShieldCheck size={20} />
                        </div>
                        <span className="text-[10px] font-mono text-white opacity-20 uppercase tracking-widest">Integrity Locked</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tighter">Resonance Pivot</h3>
                    <p className="text-sm text-white/40 leading-relaxed font-light mb-6">
                        Optimizing content rollout windows. Peak engagement window confirmed: 18:00 - 20:00.
                    </p>
                    <div className="h-px w-full bg-gradient-to-r from-white/20 to-transparent"></div>
                </div>
            </div>

            {/* 3. INTERACTIVE HORIZON NODES */}
            <div className="absolute top-[600px] left-[15%] flex flex-col items-center pointer-events-none group">
                <div className="size-2 rounded-full bg-[#ff8c00] shadow-[0_0_15px_rgba(255,140,0,0.5)] group-hover:scale-150 transition-transform"></div>
                <div className="h-20 w-px bg-gradient-to-b from-[#ff8c00]/50 to-transparent"></div>
                <div className="text-[9px] uppercase tracking-widest text-[#ff8c00]/80 mt-2 font-bold font-mono">Pivot Point Omega</div>
            </div>

            <div className="absolute top-[800px] right-[25%] flex flex-col items-center pointer-events-none group">
                <div className="size-2 rounded-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                <div className="h-32 w-px bg-gradient-to-b from-blue-500/50 to-transparent"></div>
                <div className="text-[9px] uppercase tracking-widest text-blue-500/80 mt-2 font-bold font-mono">Stabilization Core</div>
            </div>

            <div className="mt-96 text-center text-white/5 font-mono text-xs uppercase tracking-[1em] relative z-10">
                Strategic Horizon Mapping Complete
            </div>
        </div>
    );
}
