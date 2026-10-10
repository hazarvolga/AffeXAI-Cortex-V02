'use client';

import React, { useState } from 'react';
import { ServerNode } from '@/components/bcc/overseer/ServerNode';
import { RoutingControl } from '@/components/bcc/overseer/RoutingControl';

export default function OverseerPage() {
    const [activeTab, setActiveTab] = useState<'health' | 'traffic' | 'events'>('health');

    // Data for Server Health (Mock for now, will connect to backend later)
    const servers = [
        {
            name: 'Oracle-1 (Core)',
            role: 'Application Master',
            status: 'online' as const,
            cpuLoad: 42,
            ramUsage: 58,
            services: [
                { name: 'NestJS', status: 'ok' as const },
                { name: 'Postgres', status: 'ok' as const },
                { name: 'Redis', status: 'ok' as const },
            ],
            isLocalBrain: false,
        },
        {
            name: 'Oracle-2 (Brain)',
            role: 'AI Inference Node',
            status: 'online' as const,
            cpuLoad: 12,
            ramUsage: 8,
            services: [
                { name: 'Qdrant', status: 'ok' as const },
                { name: 'Ollama', status: 'error' as const }, // Not deployed yet
                { name: 'Workers', status: 'ok' as const },
            ],
            isLocalBrain: true,
        },
    ];

    // Generate 100+ dummy logs for scrolling demo (kept from original)
    const logs = Array.from({ length: 50 }).map((_, i) => {
        const types = ['INFO', 'WARN', 'SEC', 'ERR'] as const;
        const type = types[Math.floor(Math.random() * types.length)];
        const colors = {
            INFO: 'text-white/60',
            WARN: 'text-orange-400',
            SEC: 'text-purple-400',
            ERR: 'text-[#ff1a1a]'
        };
        const msgs = [
            'Worker-04 autoscaled successfully (+2 nodes)',
            'Database connection pool reached 85% capacity',
            'Routing Strategy switched to [AUTO]',
            'WAF blocked suspicious request from 192.168.1.10',
            'Token Meter: Reached 80% of daily cloud budget',
            'Cron job [analytics_aggregation] started',
            'AI Routnig: Delegated task to Local Llama-3',
            'High memory usage on Node-02 (82%)',
            'New tenant provisioned: [Sector-7 Logistics]',
            'Health check passed (All systems green)',
        ];
        return {
            time: `22:${String(59 - (i % 60)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
            type,
            msg: msgs[Math.floor(Math.random() * msgs.length)],
            color: colors[type]
        };
    });

    return (
        <section className="relative w-full h-full bg-[#080808] editorial-grid flex flex-col overflow-hidden">
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

                {/* 1. TOP TELEMETRY BAR (Fixed) */}
                <div className="w-full flex items-center justify-between pb-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex space-x-12">
                        <div className="flex items-center space-x-3">
                            <span className="text-[10px] uppercase tracking-widest text-[#00f0ff] font-bold">API Latency</span>
                            <div className="text-xl font-light tabular-nums text-white">42<span className="text-xs text-white/40 ml-0.5">ms</span></div>
                        </div>
                        <div className="h-4 w-px bg-white/10"></div>
                        <div className="flex items-center space-x-3">
                            <span className="text-[10px] uppercase tracking-widest text-[#ff1a1a] font-bold">Error Rate</span>
                            <div className="text-xl font-light tabular-nums text-white">0.01<span className="text-xs text-white/40 ml-0.5">%</span></div>
                        </div>
                        <div className="h-4 w-px bg-white/10"></div>
                        <div className="flex items-center space-x-3">
                            <span className="text-[10px] uppercase tracking-widest text-white/60 font-bold">CPU Load</span>
                            <div className="text-xl font-light tabular-nums text-white">34<span className="text-xs text-white/40 ml-0.5">%</span></div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 opacity-50">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-pulse"></div>
                        <span className="text-[9px] uppercase tracking-widest text-white/40">Live Stream</span>
                    </div>
                </div>

                {/* 2. HEADER & TABS (Fixed) */}
                <div className="flex justify-between items-end w-full">
                    <div className="max-w-3xl">
                        <h1 className="text-[clamp(2.5rem,5vw,4rem)] leading-[0.9] font-bold uppercase tracking-tighter mb-2 text-white">
                            System Overseer
                        </h1>
                        <div className="flex items-center space-x-4">
                            <p className="text-white/40 text-xs max-w-sm font-light leading-relaxed truncate">
                                Aggregate telemetry from all distributed nodes.
                            </p>
                        </div>
                    </div>

                    {/* Tab Navigation - Right Aligned */}
                    <div className="flex space-x-1 bg-white/5 p-1 rounded-lg border border-white/10 backdrop-blur-md">
                        {(['health', 'traffic', 'events'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-5 py-2 text-[10px] uppercase tracking-widest font-bold transition-all rounded ${activeTab === tab
                                    ? 'bg-[#00f0ff] text-black shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                                    : 'text-white/40 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* SCROLLABLE CONTENT AREA (Flex-Grow) */}
            <div className="flex-grow overflow-y-auto relative no-scrollbar px-12 py-8">

                {/* TAB: HEALTH */}
                {activeTab === 'health' && (
                    <div className="w-full max-w-full space-y-8 animate-in fade-in zoom-in-95 duration-300 pb-20">

                        {/* Hybrid Infrastructure Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {servers.map((server) => (
                                <ServerNode key={server.name} {...server} />
                            ))}
                        </div>

                        {/* Routing Engine Control */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                                <RoutingControl />
                            </div>

                            {/* Simple Anomaly Log Box */}
                            <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
                                <div className="text-[10px] text-white/40 uppercase tracking-widest mb-4">Latest Anomalies</div>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3 opacity-60">
                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1"></div>
                                        <div>
                                            <p className="text-xs text-white">Ollama API Timeout</p>
                                            <p className="text-[10px] text-white/30 font-mono">10:42 AM - Node 2</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 opacity-60">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1"></div>
                                        <div>
                                            <p className="text-xs text-white">Auto-Switch to Cloud</p>
                                            <p className="text-[10px] text-white/30 font-mono">10:42 AM - Routing</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: TRAFFIC (Placeholder - Preserved) */}
                {activeTab === 'traffic' && (
                    <div className="w-full max-w-full space-y-8 animate-in fade-in zoom-in-95 duration-300 pb-20">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="col-span-2 bg-white/5 border border-white/10 rounded h-96 flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#00f0ff]/10 via-transparent to-transparent"></div>
                                <div className="text-white/20 text-xs uppercase tracking-widest">Global Traffic Distribution Map (Simulated)</div>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 bg-white/5 border border-white/10 rounded">
                                    <div className="text-[10px] text-[#00f0ff] uppercase tracking-widest mb-1">Current RPS</div>
                                    <div className="text-3xl text-white font-light tabular-nums">4,280</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: EVENTS */}
                {activeTab === 'events' && (
                    <div className="w-full max-w-full animate-in fade-in zoom-in-95 duration-300 pb-20">
                        <div className="font-mono text-xs space-y-1">
                            {logs.map((log, i) => (
                                <div key={i} className="flex space-x-4 p-2 hover:bg-white/5 border-b border-white/5 border-dashed">
                                    <span className="text-white/30 shrink-0 w-20">{log.time}</span>
                                    <span className={`font-bold w-12 shrink-0 ${log.color}`}>{log.type}</span>
                                    <span className="text-white/80">{log.msg}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
