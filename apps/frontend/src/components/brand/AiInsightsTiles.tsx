"use client";

import { useState, useEffect } from 'react';
import { Brain, Sparkles, ArrowUpRight, Cpu } from 'lucide-react';
import { httpClient } from '@/lib/api/http-client';
import { AiProviderService } from '@/services/ai-provider.service';

export interface BccInsight {
    title: string;
    narrative: string;
    intensity: number;
    type: "success" | "warning" | "info";
    timestamp: string;
}

/**
 * Neural Pulse Animation Component
 */
const NeuralPulse = () => (
    <div className="relative size-16">
        <div className="absolute inset-0 bg-[#13ecec]/20 rounded-full animate-ping"></div>
        <div className="absolute inset-2 bg-[#13ecec]/40 rounded-full animate-pulse"></div>
        <div className="absolute inset-4 bg-gradient-to-br from-[#13ecec] to-[#a855f7] rounded-full shadow-[0_0_15px_rgba(19,236,236,0.5)]"></div>
        <div className="absolute inset-0 flex items-center justify-center">
            <Brain className="text-white size-6" />
        </div>
    </div>
);

/**
 * BCC AI Insights Tile: Main Strategic Panel
 */
export const BccAiInsightsTile = () => {
    const [insights, setInsights] = useState<BccInsight[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                // Fetch real insights from the BCC controller
                const data = await httpClient.get<BccInsight[]>('/bcc/insights');
                setInsights(data);
            } catch (error) {
                console.error('Failed to fetch BCC insights:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInsights();

        // Polling for real-time brain activity
        const interval = setInterval(fetchInsights, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const processMsgs = [
            "Initializing Neural Core 0x1A...",
            "Analyzing Signal Patterns...",
            "Mapping Active Nodes...",
            "Generating Tactical Narratives...",
            "BCC AI Sync Complete."
        ];

        let i = 0;
        const interval = setInterval(() => {
            setLogs(prev => [...prev.slice(-3), processMsgs[i]]);
            i = (i + 1) % processMsgs.length;
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="md:col-span-2 md:row-span-2 lg:col-span-2 lg:row-span-3 bg-gradient-to-br from-[#0B0F19]/80 to-[#13ecec]/5 backdrop-blur-2xl border border-[#13ecec]/20 rounded-3xl p-8 flex flex-col group relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="flex gap-4 items-center">
                    <NeuralPulse />
                    <div>
                        <p className="text-[#13ecec] text-[10px] font-bold tracking-[0.2em] uppercase mb-1 font-mono italic">Strategic Engine v2.5</p>
                        <h3 className="text-2xl font-bold text-white tracking-tight">AI Strategic Insights</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`size-1.5 rounded-full animate-pulse ${isLoading ? 'bg-orange-500' : 'bg-green-500'}`}></span>
                            <p className="text-[10px] text-white/40 uppercase font-mono tracking-widest">
                                {isLoading ? 'Syncing...' : 'Active Processing'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="hidden md:block">
                    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 font-mono text-[10px] text-[#13ecec]">
                        BCC_NEURAL_STABLE_00
                    </div>
                </div>
            </div>

            {/* Insights Feed */}
            <div className="flex-1 space-y-4 mb-6 overflow-y-auto no-scrollbar relative z-10">
                {insights.length === 0 && !isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-20">
                        <Sparkles className="size-12 mb-4 text-[#13ecec]" />
                        <p className="text-xs font-mono tracking-widest text-[#13ecec]">AWAITING SIGNALS...</p>
                    </div>
                ) : (
                    insights.map((item, idx) => (
                        <div key={idx} className="bg-white/[0.03] border border-white/5 hover:border-[#13ecec]/30 rounded-2xl p-4 transition-all duration-300 group/ins">
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter ${item.type === 'success' ? 'bg-[#13ecec]/10 text-[#13ecec]' :
                                    item.type === 'warning' ? 'bg-orange-500/10 text-orange-400' : 'bg-[#a855f7]/10 text-[#a855f7]'
                                    }`}>
                                    {item.title}
                                </span>
                                <ArrowUpRight className="size-3 text-white/20 group-hover/ins:text-[#13ecec] transition-colors" />
                            </div>
                            <p className="text-sm text-white/80 leading-relaxed font-medium">
                                {item.narrative}
                            </p>
                        </div>
                    ))
                )}
            </div>

            {/* Processing Logs */}
            <div className="pt-4 border-t border-white/5 flex flex-col gap-1 relative z-10">
                {logs.map((log, idx) => (
                    <p key={idx} className="text-[9px] font-mono text-white/20 uppercase tracking-widest">
                        {`> ${log}`}
                    </p>
                ))}
            </div>

            {/* Background Neural Network Graphic (Simulated) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[400px] opacity-[0.03] pointer-events-none group-hover:opacity-[0.06] transition-opacity duration-1000">
                <svg viewBox="0 0 100 100" className="w-full h-full text-[#13ecec]">
                    <circle cx="50" cy="50" r="1" fill="currentColor" />
                    <line x1="50" y1="50" x2="30" y2="30" stroke="currentColor" strokeWidth="0.1" />
                    <line x1="50" y1="50" x2="70" y2="30" stroke="currentColor" strokeWidth="0.1" />
                    <line x1="50" y1="50" x2="30" y2="70" stroke="currentColor" strokeWidth="0.1" />
                    <line x1="50" y1="50" x2="70" y2="70" stroke="currentColor" strokeWidth="0.1" />
                </svg>
            </div>
        </div>
    );
};

/**
 * BCC AI Model Status Tile
 */
export const BccAiStatusTile = () => {
    const [status, setStatus] = useState<{
        provider: string,
        healthy: boolean,
        latency: number
    }>({ provider: 'Anthropic / Claude 3.5', healthy: true, latency: 420 });

    useEffect(() => {
        const checkHealth = async () => {
            try {
                const res = await AiProviderService.getProviderStatus();
                const current = res.providers.find(p => p.name.toLowerCase() === res.currentProvider.toLowerCase());
                if (current) {
                    setStatus({
                        provider: res.currentProvider,
                        healthy: current.available,
                        latency: current.responseTime || 420
                    });
                }
            } catch (e) { /* Fallback to mock */ }
        };
        checkHealth();
    }, []);

    return (
        <div className="md:col-span-1 md:row-span-1 lg:col-span-1 lg:row-span-1 bg-[#0B0F19]/40 backdrop-blur-xl border border-[#a855f7]/20 rounded-3xl p-6 flex flex-col justify-between group overflow-hidden">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-[#a855f7] text-[10px] font-bold tracking-widest uppercase mb-1 font-mono">Neural Integrity</p>
                    <h3 className="text-sm font-bold text-white tracking-tight">AI Engine Health</h3>
                </div>
                <Cpu className="text-[#a855f7] size-4" />
            </div>

            <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/40 font-mono">CORE MODEL</span>
                    <span className="text-[11px] font-bold text-white tracking-tighter truncate max-w-[100px]">{status.provider}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/40 font-mono">LATENCY</span>
                    <span className="text-[11px] font-bold text-[#13ecec] font-mono">{status.latency}ms</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#13ecec] to-[#a855f7] w-full shadow-[0_0_10px_rgba(19,236,236,0.3)]"></div>
                </div>
            </div>
        </div>
    );
};
