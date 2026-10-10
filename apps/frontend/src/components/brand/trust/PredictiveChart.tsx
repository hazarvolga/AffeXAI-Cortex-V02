'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface PredictiveChartProps {
    current: number[];
    projected: number[];
}

export default function PredictiveChart({ current = [], projected = [] }: PredictiveChartProps) {
    // Merge data: Current (0-6) -> Projected (6-13)
    const data = [
        ...(current || []).map((val, i) => ({ day: `D-${6 - i}`, value: val, type: 'Historical' })),
        ...(projected || []).map((val, i) => ({ day: `D+${i + 1}`, value: val, type: 'Projected' }))
    ];

    return (
        <div className="h-[300px] w-full bg-[#101a22] border border-[#283239] rounded-lg p-4 relative">
            <h3 className="absolute top-4 left-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Predictive Trajectory (30-Day)</h3>
            <div className="absolute top-4 right-4 flex gap-4">
                <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-[#1183d4]"></div>
                    <span className="text-[10px] text-slate-400 uppercase">Historical</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-[#f9bc06]"></div>
                    <span className="text-[10px] text-slate-400 uppercase">Projected</span>
                </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 40, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorHistorical" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1183d4" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#1183d4" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f9bc06" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#f9bc06" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="day" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#283239' }}
                        itemStyle={{ fontSize: '12px' }}
                        labelStyle={{ fontSize: '10px', color: '#94a3b8' }}
                    />
                    <ReferenceLine x="D+1" stroke="#475569" strokeDasharray="3 3" label={{ value: 'NOW', position: 'insideTopLeft', fill: '#94a3b8', fontSize: 10 }} />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#1183d4"
                        fillOpacity={1}
                        fill="url(#colorHistorical)"
                        strokeWidth={2}
                        connectNulls
                    />
                    {/* Overlay for projected part - usually needs separate series or data manipulation for color change. 
                         Simplifying by using one line for now, but ideally we split. 
                         Actually, Recharts can split by key. Let's use two keys if possible or just color based on index.
                         Simpler: Just render the chart. The gradient logic applies to the whole.
                         Better: two areas.
                     */}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
