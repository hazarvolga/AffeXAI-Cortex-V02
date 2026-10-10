"use client";

import React, { useEffect, useState } from 'react';
import { GlobalHeatmapTile } from '@/components/brand/GlobalHeatmapTile';
import { ContentRefinementTile } from '@/components/brand/ContentRefinementTile';
import { EquityTimeline } from '@/components/brand/EquityTimeline';
import { brandService, BrandIntelligence } from '@/lib/api/brandService';

export default function BrandResonancePage() {
    const [data, setData] = useState<BrandIntelligence | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const result = await brandService.getBrandIntelligence();
                setData(result);
            } catch (error) {
                console.error("Failed to load brand intelligence:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[80vh] flex-1 max-w-[1600px] mx-auto w-full">
                <div className="animate-pulse text-xs tracking-[0.3em] font-mono text-[#13ecda]/40 text-center">
                    CALIBRATING RESONANCE FREQUENCIES...<br />
                    <span className="text-[8px] mt-2 block opacity-40">Accessing Global Signal Mesh</span>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-0 flex flex-col flex-1 max-w-[1600px] mx-auto w-full">
            <div className="mb-12 flex items-end justify-between">
                <div>
                    {/* Header managed by layout */}
                </div>
                <div className="hidden md:flex gap-4">
                    <div className="px-6 py-2 border border-[#13ecda]/20 text-[10px] font-bold uppercase tracking-widest text-[#13ecda]/80 font-mono">
                        STATUS: SYNCHRONIZED
                    </div>
                </div>
            </div>

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-12 gap-6">
                {/* TOP ROW: Heatmap & Content Refinement */}
                <GlobalHeatmapTile data={data} />
                <ContentRefinementTile />

                {/* BOTTOM ROW: Strategic Timeline */}
                <EquityTimeline />

                {/* STAT CARDS - Ported from reference style */}
                <div className="col-span-12 lg:col-span-3 bg-white/[0.02] border border-white/5 p-6 rounded-xl">
                    <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest font-mono mb-2">Sentiment Velocity</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">{data?.resonance?.value || '-'}</span>
                        <span className={`text-[10px] font-bold ${data?.resonance?.status === 'Critical' ? 'text-red-500' : 'text-[#13ecda]'}`}>
                            {data?.resonance?.status || 'Unknown'}
                        </span>
                    </div>
                </div>
                <div className="col-span-12 lg:col-span-3 bg-white/[0.02] border border-white/5 p-6 rounded-xl">
                    <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest font-mono mb-2">Trend Quality</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">
                            {data?.convergence?.title?.includes('High') ? 'A+' : 'B-'}
                        </span>
                        <span className="text-white/20 text-[10px]">Index</span>
                    </div>
                </div>
                <div className="col-span-12 lg:col-span-3 bg-white/[0.02] border border-white/5 p-6 rounded-xl">
                    <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest font-mono mb-2">Friction Level</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">{data?.friction?.openTickets ?? 0}</span>
                        <span className="text-[10px] font-bold" style={{ color: data?.friction?.indicatorColor }}>
                            {data?.friction?.status || 'N/A'}
                        </span>
                    </div>
                </div>
                <div className="col-span-12 lg:col-span-3 bg-white/[0.02] border border-white/5 p-6 rounded-xl">
                    <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest font-mono mb-2">AI Forecasting</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">Active</span>
                        <span className="text-emerald-400 text-[10px] font-bold">Safe</span>
                    </div>
                </div>
            </div>

            <footer className="mt-24 pt-8 border-t border-white/5 flex justify-between items-end opacity-40">
                <div className="text-[8px] tracking-[0.3em] uppercase max-w-[300px] font-mono leading-relaxed">
                    Brand Communication Center // Resonance deep-dive // Internal Analysis Only
                </div>
                <div className="text-xl font-bold leading-none tracking-widest font-mono">
                    LAYER_06_RESONANCE_ESTABLISHED
                </div>
            </footer>
        </div>
    );
}
