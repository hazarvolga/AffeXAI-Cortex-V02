'use client';

import React, { useState, useEffect } from 'react';
import { BrainCircuit, Globe, TrendingUp, AlertTriangle, Zap, Shield, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { neuralGridService } from '@/lib/api/neuralGridService'; // I need to check if this exists or create it

export default function IntelligencePage() {
    const [signals, setSignals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Mock data for initial UI build
    useEffect(() => {
        const timer = setTimeout(() => {
            setSignals([
                {
                    id: '1',
                    source: 'crawler',
                    type: 'COMPETITOR_UPDATE',
                    context: 'Rakip X, yeni bir "AI-First" fiyatlandırma modeli duyurdu. Pazar konumlandırmamızda risk oluşabilir.',
                    successScore: -5,
                    timestamp: new Date()
                },
                {
                    id: '2',
                    source: 'system',
                    type: 'AUTONOMOUS_REPORT',
                    context: 'Gece taranan 50 sektör haberi ve 12 destek bileti korele edildi: Kullanıcılar entegrasyon kolaylığına odaklanıyor.',
                    successScore: 20,
                    timestamp: new Date()
                },
                {
                    id: '3',
                    source: 'crawler',
                    type: 'REPUTATION_ALERT',
                    context: 'Sosyal medyada "AffeXAI Hızı" hakkında pozitif trend (%12 artış) saptandı.',
                    successScore: 8,
                    timestamp: new Date()
                }
            ]);
            setLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <section className="relative w-full h-full bg-[#080808] p-12 overflow-y-auto custom-scrollbar">
            {/* Header Area */}
            <div className="flex justify-between items-end mb-12">
                <div>
                    <h2 className="text-4xl font-bold tracking-tighter uppercase mb-2">Market Intelligence</h2>
                    <p className="text-white/40 font-mono text-[10px] uppercase tracking-[0.2em]">Neural Grid / Autonomous Observation Feed</p>
                </div>
                <div className="flex gap-4">
                    <div className="px-4 py-2 border border-white/10 bg-white/5 rounded-sm flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#9df425] animate-pulse shadow-[0_0_8px_#9df425]" />
                        <span className="font-mono text-[10px] uppercase text-white/60">Node: CORTEX-01 ACTIVE</span>
                    </div>
                </div>
            </div>

            {/* Intelligence Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Real-time Feed */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.4em] mb-4">Autonomous Signal Stream</h3>

                    {loading ? (
                        <div className="h-64 flex items-center justify-center border border-white/5 bg-white/[0.02]">
                            <BrainCircuit className="h-8 w-8 animate-pulse text-[#9df425]/40" />
                        </div>
                    ) : (
                        signals.map((signal) => (
                            <div
                                key={signal.id}
                                className={cn(
                                    "group relative p-6 border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300",
                                    signal.type === 'AUTONOMOUS_REPORT' ? "border-l-2 border-l-[#9df425]" : "border-l-2 border-l-white/10"
                                )}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center",
                                            signal.source === 'crawler' ? "bg-blue-500/10 text-blue-400" : "bg-[#9df425]/10 text-[#9df425]"
                                        )}>
                                            {signal.source === 'crawler' ? <Globe className="h-5 w-5" /> : <BrainCircuit className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-white/90">{signal.type}</h4>
                                            <p className="text-[10px] font-mono text-white/30 uppercase">{new Date(signal.timestamp).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "px-2 py-1 rounded text-[9px] font-bold font-mono",
                                        signal.successScore > 0 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                                    )}>
                                        {signal.successScore > 0 ? '+' : ''}{signal.successScore} IMPACT
                                    </div>
                                </div>
                                <p className="text-sm text-white/70 leading-relaxed max-w-2xl">
                                    {signal.context}
                                </p>

                                {signal.type === 'AUTONOMOUS_REPORT' && (
                                    <div className="mt-4 pt-4 border-t border-white/5 flex gap-4">
                                        <button className="text-[10px] font-bold uppercase tracking-widest text-[#9df425] hover:underline">Draft Strategy</button>
                                        <button className="text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white transition-colors">Archive</button>
                                    </div>
                                )}

                                {/* Hover Glow */}
                                <div className="absolute inset-0 bg-gradient-to-r from-[#9df425]/0 via-[#9df425]/0 to-[#9df425]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            </div>
                        ))
                    )}
                </div>

                {/* Right Column: Aggregated Stats */}
                <div className="space-y-8">
                    {/* Market Velocity */}
                    <div className="p-6 border border-white/10 bg-white/[0.03] backdrop-blur-sm">
                        <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <TrendingUp className="h-3 w-3" /> Market Velocity
                        </h3>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-mono">
                                    <span className="text-white/40 uppercase">Competitor Activity</span>
                                    <span className="text-red-400">HIGH (+24%)</span>
                                </div>
                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div className="w-[84%] h-full bg-red-400/50" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-mono">
                                    <span className="text-white/40 uppercase">Brand Resonance</span>
                                    <span className="text-[#9df425]">STABLE (+2%)</span>
                                </div>
                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div className="w-[62%] h-full bg-[#9df425]/50" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Threat Vectors */}
                    <div className="p-6 border border-red-500/10 bg-red-500/[0.02]">
                        <h3 className="text-[10px] font-bold text-red-400/60 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <AlertTriangle className="h-3 w-3" /> Threat Detection
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/5">
                                <Target className="h-4 w-4 text-orange-400" />
                                <span className="text-[10px] text-white/60 uppercase tracking-wider">Pricing War: High Probability</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/5">
                                <Shield className="h-4 w-4 text-blue-400" />
                                <span className="text-[10px] text-white/60 uppercase tracking-wider">Feature Gap: Minimized</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <button className="w-full py-4 border border-[#9df425]/20 bg-[#9df425]/5 text-[#9df425] font-mono text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-[#9df425]/10 transition-colors flex items-center justify-center gap-3">
                        <Zap className="h-3 w-3" /> Trigger Deep Scan
                    </button>
                </div>
            </div>
        </section>
    );
}
