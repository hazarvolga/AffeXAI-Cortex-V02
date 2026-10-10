'use client';

import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface TrustRadarProps {
    metrics: {
        resonance: number;
        convergence: number;
        friction: number;
    };
}

export default function TrustRadar({ metrics }: TrustRadarProps) {
    const data = [
        { subject: 'Resonance', A: metrics?.resonance ?? 0, fullMark: 100 },
        { subject: 'Convergence', A: metrics?.convergence ?? 0, fullMark: 100 },
        { subject: 'Safety', A: 100 - (metrics?.friction ?? 0), fullMark: 100 }, // Inverted Friction = Safety
    ];

    return (
        <div className="h-[300px] w-full bg-[#101a22] border border-[#283239] rounded-lg p-4 relative">
            <h3 className="absolute top-4 left-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Trust Composition</h3>
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid gridType="polygon" stroke="#283239" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                    <Radar
                        name="Trust"
                        dataKey="A"
                        stroke="#f9bc06"
                        strokeWidth={2}
                        fill="#f9bc06"
                        fillOpacity={0.2}
                    />
                </RadarChart>
            </ResponsiveContainer>
            <div className="absolute bottom-4 right-4 flex flex-col items-end">
                <span className="text-[10px] text-slate-500 uppercase">Balance</span>
                <span className="text-xl font-mono text-[#f9bc06]">OPTIMAL</span>
            </div>
        </div>
    );
}
