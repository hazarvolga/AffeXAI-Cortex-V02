"use client";

import React, { useEffect, useState } from 'react';
import { DistributionFlowTile } from '@/components/brand/DistributionIntelligenceTiles';
import { ModuleSmallMetrics } from '@/components/brand/ModuleMetricTiles';

import { UserEcosystemTile, RoleDistributionTile } from '@/components/brand/OverviewIntegrationTiles';
import { BccEventsTrendTile, BccSocialEngagementTile, BccSupportPerformanceTile, BccContentAssetTile } from '@/components/brand/OrchestratedAnalyticsTiles';
import { BccAiInsightsTile, BccAiStatusTile } from '@/components/brand/AiInsightsTiles';

export default function ModuleIntelligencePage() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[80vh] flex-1">
                <div className="relative">
                    <div className="animate-spin size-12 rounded-full border-t-2 border-l-2 border-[#13ecec] mb-6"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#13ecec] animate-pulse">BCC</div>
                    <div className="text-xs tracking-[0.3em] font-mono text-white/40 uppercase">Linking Modules...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-0 flex flex-col flex-1 max-w-[1600px] mx-auto w-full">
            {/* Main Bento Grid: Strategic Command Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[180px]">
                {/* Primary Intelligence: AI Strategic Anchor */}
                <BccAiInsightsTile />

                {/* Infrastructure Overview */}
                <UserEcosystemTile total={1247} subscribers={856} />
                <BccAiStatusTile />

                {/* Performance Metrics */}
                <BccEventsTrendTile />

                {/* Channel Throughput */}
                <DistributionFlowTile type="Email" value="4.2M" />
                <RoleDistributionTile />

                <BccSupportPerformanceTile />

                {/* Security & Content Inventory */}
                <ModuleSmallMetrics />
                <BccContentAssetTile />

                {/* Global Outreach */}
                <BccSocialEngagementTile />
                <DistributionFlowTile type="Social" value="1.2M" />
            </div>

            {/* Command Footer Metrics */}
            <footer className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 px-4 py-8 border-t border-white/5 relative items-center">
                <div className="flex flex-col gap-1 group">
                    <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-mono">System Health</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white group-hover:text-[#13ecec] transition-colors">99.98%</span>
                        <span className="text-[10px] text-[#13ecec] font-bold">UPTIME</span>
                    </div>
                </div>
                <div className="flex flex-col gap-1 group">
                    <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-mono">Network Load</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white group-hover:text-purple-400 transition-colors">12.4TB</span>
                        <span className="text-[10px] text-purple-400 font-bold">OPTIMIZED</span>
                    </div>
                </div>
                <div className="flex flex-col gap-1 group">
                    <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-mono">Active Agents</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">4,192</span>
                        <span className="text-[10px] text-blue-400 font-bold">NODES</span>
                    </div>
                </div>
                <div className="flex flex-col gap-1 group">
                    <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-mono">Security</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white group-hover:text-[#13ecec] transition-colors uppercase">Legacy-X</span>
                        <span className="text-[10px] text-[#13ecec] font-bold uppercase">AES-256</span>
                    </div>
                </div>
            </footer>

            {/* Marginalia Note */}
            <div className="fixed bottom-12 right-12 opacity-10 rotate-90 origin-right text-[8px] tracking-[0.5em] uppercase font-mono whitespace-nowrap pointer-events-none">
                BCC_COMMAND_CENTER_AUTH_LAYER_04_ACTIVE
            </div>
        </div>
    );
}
