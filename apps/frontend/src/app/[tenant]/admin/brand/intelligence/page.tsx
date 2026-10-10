"use client";

import React, { useEffect, useState } from 'react';
import { brandService, BrandIntelligence } from '@/lib/api/brandService';
import { BccHudTile } from '@/components/brand/BccHudTile';
import {
    Activity,
    TrendingUp,
    Twitter,
    Linkedin,
    Instagram,
    Facebook
} from 'lucide-react';

export default function BrandIntelligencePage() {
    const [data, setData] = useState<BrandIntelligence | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch real brand health data
                const healthData = await brandService.getBrandIntelligence();
                setData(healthData);
            } catch (err) {
                console.error("Failed to fetch brand health", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const getIcon = (provider: string) => {
        switch (provider) {
            case 'twitter': return <Twitter className="w-4 h-4 text-blue-400" />;
            case 'linkedin': return <Linkedin className="w-4 h-4 text-blue-600" />;
            case 'instagram': return <Instagram className="w-4 h-4 text-pink-500" />;
            case 'facebook': return <Facebook className="w-4 h-4 text-blue-500" />;
            default: return <Activity className="w-4 h-4 text-white" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-white/10 border-t-[#ff8c00] rounded-full animate-spin"></div>
                    <div className="text-xs uppercase tracking-[0.2em] text-white/40 font-mono animate-pulse">
                        Aggregating Global Signals...
                    </div>
                </div>
            </div>
        );
    }

    // Placeholder for platforms until backend DTO is updated to include breakdown
    const platforms: any[] = [];

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20 p-8">
            {/* 1. Global KPI Header */}
            <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <BccHudTile title="Resonance" subtitle="Engagement Rate" icon="activity">
                    <div className="text-3xl font-light tracking-tighter text-white">
                        {data?.resonance?.value || '-'}
                    </div>
                    <div className="text-[10px] text-[#9df425] font-mono mt-1 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>{data?.resonance?.status || 'Analyzing'}</span>
                    </div>
                </BccHudTile>

                <BccHudTile title="Trajectory" subtitle="Projected Growth" icon="eye">
                    <div className="text-3xl font-light tracking-tighter text-white">
                        {/* Taking last projected value */}
                        {data?.trajectory?.projected?.data ? (data.trajectory.projected.data[data.trajectory.projected.data.length - 1] * 100).toFixed(1) : '0.0'}%
                    </div>
                    <div className="text-[10px] text-white/40 font-mono mt-1">
                        AI Confidence: High
                    </div>
                </BccHudTile>

                <BccHudTile title="Friction" subtitle="Active Issues" icon="shield">
                    <div className="text-3xl font-light tracking-tighter text-white">
                        {data?.friction?.openTickets || 0}
                    </div>
                    <div className="text-[10px] text-white/40 font-mono mt-1" style={{ color: data?.friction?.indicatorColor }}>
                        {data?.friction?.status || 'Stable'}
                    </div>
                </BccHudTile>

                <BccHudTile title="Convergence" subtitle="Campaign Health" icon="users">
                    <div className="text-lg font-light tracking-tighter text-white leading-tight">
                        {data?.convergence?.title || 'Calculating...'}
                    </div>
                    <div className="text-[10px] text-white/40 font-mono mt-1">
                        {data?.convergence?.subtitle || 'Waiting for signals'}
                    </div>
                </BccHudTile>
            </section>

            {/* Visualizations will go here */}
            {/* 2. Platform Breakdown */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Connectors */}
                <BccHudTile title="Channel Performance" subtitle="Real-time Metrics" className="min-h-[300px]">
                    <div className="space-y-4 pt-2">
                        {platforms.length === 0 && (
                            <div className="text-center py-10 text-white/20 text-xs font-mono uppercase">
                                No Active Data Streams
                            </div>
                        )}

                        {platforms.map((p: any, i: number) => (
                            <div key={i} className="bg-white/[0.02] border border-white/5 p-4 hover:border-white/10 transition-colors group">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-black/40 rounded-full border border-white/10 group-hover:border-white/30 transition-colors">
                                            {getIcon(p.provider)}
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold uppercase tracking-wider text-white">
                                                {p.provider}
                                            </div>
                                            <div className="text-[9px] font-mono text-white/40">
                                                SYNCED
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-white">{p.followers.toLocaleString()}</div>
                                        <div className="text-[8px] text-white/30 uppercase tracking-widest">Followers</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                    <div>
                                        <div className="text-[10px] text-white/40 uppercase mb-1">Impressions</div>
                                        <div className="text-xs font-mono text-white">{p.impressions.toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-white/40 uppercase mb-1">Engagement</div>
                                        <div className="text-xs font-mono text-[#9df425]">{p.engagements.toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </BccHudTile>

                {/* Top Performing Content */}
                <BccHudTile title="High Resonance Signals" subtitle="Top Performing Content" className="min-h-[300px]">
                    <div className="space-y-3 pt-2">
                        {platforms.flatMap((p: any) => p.topPosts.map((post: any) => ({ ...post, provider: p.provider })))
                            .sort((a: any, b: any) => b.engagement - a.engagement)
                            .slice(0, 5)
                            .map((post: any, i: number) => (
                                <div key={i} className="flex items-start gap-4 p-3 bg-white/[0.02] border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group">
                                    <div className="mt-1">
                                        {getIcon(post.provider)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-white/80 line-clamp-2 mb-2 font-light">
                                            "{post.content || 'Media Content'}"
                                        </p>
                                        <div className="flex items-center gap-4 text-[9px] font-mono text-white/40 uppercase tracking-wider">
                                            <span className="flex items-center gap-1">
                                                <TrendingUp className="w-2 h-2 text-[#ff8c00]" />
                                                {post.engagement} Eng
                                            </span>
                                            <span>
                                                {new Date(post.publishedAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-bold text-[#9df425]">
                                            #{i + 1}
                                        </div>
                                    </div>
                                </div>
                            ))
                        }
                        {platforms.length > 0 && platforms.every((p: any) => p.topPosts.length === 0) && (
                            <div className="text-center py-10 text-white/20 text-xs font-mono uppercase">
                                No Signal Data Available
                            </div>
                        )}
                        {platforms.length === 0 && (
                            <div className="text-center py-10 text-white/20 text-xs font-mono uppercase">
                                No Signal Data Available
                            </div>
                        )}
                    </div>
                </BccHudTile>
            </section>
        </div>
    );
}
