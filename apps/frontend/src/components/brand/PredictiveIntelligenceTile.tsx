"use client";

import React from 'react';

interface PredictiveIntelligenceTileProps {
    forecast?: {
        current: number[];
        projected: number[];
    };
}

export const PredictiveIntelligenceTile = ({ forecast }: PredictiveIntelligenceTileProps) => {
    // Fallback data if forecast is missing
    const current = forecast?.current ?? [70, 71, 72, 73, 74, 75, 76];
    const projected = forecast?.projected ?? [77, 78, 79, 80, 81, 82, 83];

    return (
        <div className="col-span-12 lg:col-span-5 row-span-5 bg-white/5 backdrop-blur-xl border border-cyan-500/10 p-6 flex flex-col rounded-xl overflow-hidden relative">
            <div className="flex justify-between items-center mb-6 relative z-10">
                <h2 className="text-lg font-bold text-white/90 tracking-tight">Predictive Intelligence</h2>
                <span className="text-[10px] text-cyan-500/40 uppercase tracking-[0.2em] font-mono">Forecast: 30 Days</span>
            </div>

            <div className="flex-1 relative flex items-center overflow-hidden">
                <div className="w-full h-24 flex items-end gap-1 relative">
                    {/* Past Data (Current Array) */}
                    {current.slice(-7).map((val, idx) => (
                        <div
                            key={`curr-${idx}`}
                            style={{ height: `${(val / 100) * 100}%` }}
                            className="flex-1 bg-white/10 border-t border-white/20 transition-all duration-500"
                        ></div>
                    ))}

                    {/* Present Marker */}
                    <div className="absolute left-[50%] top-0 bottom-0 w-px bg-cyan-500/60 z-10">
                        <div className="absolute -top-1 -left-1 size-2 rounded-full bg-cyan-500 shadow-[0_0_15px_rgba(19,200,236,0.6)] animate-pulse"></div>
                    </div>

                    {/* Hazy Future (Projected Array) */}
                    {projected.slice(0, 7).map((val, idx) => (
                        <div
                            key={`proj-${idx}`}
                            style={{ height: `${(val / 100) * 100}%` }}
                            className="flex-1 bg-cyan-500/20 border-t border-cyan-500/40 opacity-40 blur-[1px]"
                        ></div>
                    ))}
                </div>

                <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[8px] text-white/20 uppercase font-mono tracking-widest px-2">
                    <span>Past 15d</span>
                    <span className="text-cyan-500/60">Present</span>
                    <span>Next 15d</span>
                </div>
            </div>

            {/* Background Decoration */}
            <div className="absolute -right-12 -bottom-12 size-48 bg-cyan-500/5 rounded-full blur-[60px] pointer-events-none"></div>
        </div>
    );
};
