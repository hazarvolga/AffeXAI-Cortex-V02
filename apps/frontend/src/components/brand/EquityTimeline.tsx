"use client";

import React from 'react';

export const EquityTimeline = () => {
    const months = [
        { name: 'JAN', status: 'PAST', score: 68 },
        { name: 'FEB', status: 'PAST', score: 72 },
        { name: 'MAR', status: 'PAST', score: 70 },
        { name: 'APR', status: 'PAST', score: 75 },
        { name: 'MAY', status: 'PAST', score: 79 },
        { name: 'JUN', status: 'CURRENT', score: 84 },
        { name: 'JUL', status: 'PROJECTED', score: 88, event: 'Product Launch' },
        { name: 'AUG', status: 'PROJECTED', score: 86 },
        { name: 'SEP', status: 'PROJECTED', score: 89 },
        { name: 'OCT', status: 'PEAK', score: 94, event: 'Campaign Alpha' },
        { name: 'NOV', status: 'PROJECTED', score: 91 },
        { name: 'DEC', status: 'PROJECTED', score: 93 },
    ];

    return (
        <div className="col-span-12 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-8 relative overflow-hidden group">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 relative z-10">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-white/90">Strategic Equity Forecast</h2>
                    <p className="text-white/40 text-sm uppercase font-mono tracking-widest">Long-term Brand Trajectory: 12 Month View</p>
                </div>
                <div className="flex items-center gap-8 mt-4 md:mt-0">
                    <div className="text-right">
                        <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest font-mono">Projected Peak</p>
                        <p className="text-[#13ecda] font-bold text-lg">94.2% (OCT)</p>
                    </div>
                    <div className="h-8 w-px bg-white/10"></div>
                    <div className="text-right">
                        <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest font-mono">Confidence</p>
                        <p className="text-white font-bold text-lg">92%</p>
                    </div>
                </div>
            </div>

            <div className="relative h-48 w-full mt-8 flex items-center">
                {/* Horizontal Guide Line */}
                <div className="absolute top-1/2 left-0 right-0 h-px bg-white/5 z-0"></div>

                {/* Months Track */}
                <div className="flex-1 flex justify-between items-center relative z-10 px-4">
                    {months.map((m, idx) => (
                        <div key={idx} className="flex flex-col items-center group/item relative">
                            {/* Connector Line to guide line */}
                            <div className={`w-px h-12 absolute bottom-full mb-2 ${m.status === 'PAST' ? 'bg-white/10' : 'bg-[#13ecda]/20'}`}></div>

                            {/* Data Point */}
                            <div
                                className={`size-3 rounded-full mb-4 transition-all duration-500 cursor-pointer 
                                    ${m.status === 'PAST' ? 'bg-white/20' :
                                        m.status === 'CURRENT' ? 'bg-[#13ecda] orb-glow size-4' :
                                            m.status === 'PEAK' ? 'bg-[#13ecda] orb-glow size-5 animate-pulse' :
                                                'bg-[#13ecda]/40 border border-[#13ecda]/30'}`}
                            >
                                {/* Tooltip */}
                                {m.event && (
                                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white/5 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded text-[10px] whitespace-nowrap opacity-0 group-hover/item:opacity-100 transition-all pointer-events-none translate-y-2 group-hover/item:translate-y-0">
                                        <span className="text-[#13ecda] font-bold block">{m.event}</span>
                                        <span className="text-white/40">Equity Score: {m.score}%</span>
                                    </div>
                                )}
                            </div>

                            <span className={`text-[10px] font-bold font-mono tracking-widest 
                                ${m.status === 'PAST' ? 'text-white/20' :
                                    m.status === 'CURRENT' ? 'text-[#13ecda]' :
                                        m.status === 'PEAK' ? 'text-[#13ecda]' : 'text-white/40'}`}>
                                {m.name}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Background Peak Gradient Area */}
                <div className="absolute bottom-1/2 left-[50%] right-[10%] h-32 bg-gradient-to-t from-[#13ecda]/5 to-transparent blur-3xl rounded-[100%] pointer-events-none"></div>
            </div>

            {/* Background Mesh */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                        <pattern id="grid-dots" width="4" height="4" patternUnits="userSpaceOnUse">
                            <circle cx="1" cy="1" r="0.5" fill="#13ecda" />
                        </pattern>
                    </defs>
                    <rect width="100" height="100" fill="url(#grid-dots)" />
                </svg>
            </div>
        </div>
    );
};
