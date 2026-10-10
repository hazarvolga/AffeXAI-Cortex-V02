"use client";

import React from 'react';

export const DistributionFlowTile = ({ type = 'Email', value = '4.2M' }: { type?: 'Email' | 'Social', value?: string }) => {
    const isEmail = type === 'Email';

    return (
        <div className="md:col-span-1 md:row-span-2 lg:col-span-1 lg:row-span-2 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col justify-between overflow-hidden">
            <div>
                <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase mb-1">{isEmail ? 'Flow' : 'Global'}</p>
                <h3 className="text-lg font-bold text-white tracking-tight">{type} Distribution</h3>
            </div>

            <div className="flex-1 flex flex-col justify-center py-4 relative group">
                <div className="w-full aspect-square relative flex items-center justify-center">
                    <svg className="w-full h-full opacity-60 absolute inset-0 -rotate-90 group-hover:scale-110 transition-transform duration-700" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" fill="none" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                        <path d="M50 10 A 40 40 0 0 1 90 50" fill="none" stroke={isEmail ? '#13ecec' : '#3b82f6'} strokeLinecap="round" strokeWidth="2.5" />
                        <path d="M50 90 A 40 40 0 0 1 10 50" fill="none" stroke="#a855f7" strokeLinecap="round" strokeWidth="2.5" />
                        <circle cx="90" cy="50" fill={isEmail ? '#13ecec' : '#3b82f6'} r="2.5" />
                        <circle cx="10" cy="50" fill="#a855f7" r="2.5" />
                    </svg>

                    <div className="relative z-10 flex flex-col items-center justify-center">
                        <p className="text-3xl font-light text-white tracking-tighter">{value}</p>
                        <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-mono">Throughput</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-white/5 font-mono text-[10px]">
                <span className="text-white/40 uppercase tracking-widest">Stability Index</span>
                <span className="font-bold text-[#13ecec]">0.998</span>
            </div>
        </div>
    );
};

export const SupportIntelTile = () => {
    return (
        <div className="md:col-span-1 md:row-span-2 lg:col-span-1 lg:row-span-2 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col justify-between overflow-hidden">
            <div>
                <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase mb-1">Sentiment</p>
                <h3 className="text-lg font-bold text-white tracking-tight">Support Intelligence</h3>
            </div>

            <div className="flex-1 py-4">
                <div className="w-full h-full bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-2xl border border-white/5 relative flex items-center justify-center overflow-hidden group">
                    <div className="absolute inset-0 overflow-hidden opacity-30">
                        <div className="absolute top-1/4 left-1/4 size-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="absolute top-3/4 left-1/2 size-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
                        <div className="absolute top-1/2 left-3/4 size-3 bg-[#13ecec] rounded-full animate-bounce"></div>
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <line x1="25" y1="25" x2="50" y2="75" stroke="white" strokeWidth="0.2" />
                            <line x1="50" y1="75" x2="75" y2="50" stroke="white" strokeWidth="0.2" />
                            <line x1="25" y1="25" x2="75" y2="50" stroke="white" strokeWidth="0.2" />
                        </svg>
                    </div>
                    <div className="text-center z-10">
                        <p className="text-[10px] text-white/60 mb-1 uppercase tracking-widest font-mono">Positive Signal</p>
                        <p className="text-3xl font-bold tracking-tighter text-white">84.2%</p>
                    </div>
                </div>
            </div>

            <div className="pt-2">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">Elasticity</span>
                    <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-400 via-purple-400 to-[#13ecec] w-4/5 animate-pulse"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
