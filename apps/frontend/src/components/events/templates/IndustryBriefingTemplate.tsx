import React from 'react';
import { Event } from '@affexai/shared-types';
import { PublicRsvpForm } from '@/components/events/public-rsvp-form';
import { Factory, Cpu, Zap, Activity } from 'lucide-react';

export const Industry4BriefingTemplate = ({ event }: { event: Event }) => {
    return (
        <div className="min-h-screen bg-[#0a0a0c] text-[#e0e0e0] font-sans selection:bg-[#ff8c00] selection:text-black">
            {/* Industrial Mesh Backdrop */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.05] editorial-grid" />
            <div className="fixed top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#ff8c00] to-transparent opacity-50" />

            <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
                <header className="flex justify-between items-end mb-32 border-b border-white/5 pb-6">
                    <div className="flex items-center space-x-4 text-[#ff8c00]">
                        <Factory className="w-6 h-6" />
                        <div className="flex flex-col">
                            <span className="text-[12px] uppercase tracking-[0.45em] font-black">Industrial Console</span>
                            <span className="text-[9px] text-[#ff8c00]/50 tracking-[0.2em] uppercase">Sertified Production Node</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-8 text-white/30 text-[10px] uppercase tracking-widest font-mono">
                        <div className="flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span>System Normal</span>
                        </div>
                        <span>Uptime: 99.999%</span>
                    </div>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    <div className="lg:col-span-12 mb-12">
                        <div className="flex items-center space-x-3 mb-6">
                            <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-xs text-[9px] uppercase tracking-widest text-[#ff8c00]">Production Set v.04</span>
                            <div className="h-px w-12 bg-[#ff8c00]/30" />
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-12 leading-[0.85] uppercase max-w-5xl">
                            {event.title}
                        </h1>
                    </div>

                    <div className="lg:col-span-7 space-y-16">
                        <div className="prose prose-invert max-w-none text-xl text-white/60 leading-relaxed font-light">
                            {event.description}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 py-12 border-y border-white/5">
                            <div className="space-y-4">
                                <Cpu className="w-5 h-5 text-[#ff8c00]" />
                                <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-white/40">OT Integration</h3>
                                <p className="text-xs font-mono">Full Industrial protocol support (Modbus/OPC UA).</p>
                            </div>
                            <div className="space-y-4">
                                <Zap className="w-5 h-5 text-[#ff8c00]" />
                                <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-white/40">Resilience</h3>
                                <p className="text-xs font-mono">High-availability architecture deployment.</p>
                            </div>
                            <div className="space-y-4">
                                <Activity className="w-5 h-5 text-[#ff8c00]" />
                                <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-white/40">Latency</h3>
                                <p className="text-xs font-mono">Deterministic performance {event.location}.</p>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-5">
                        <div className="border border-white/5 bg-white/[0.02] backdrop-blur-3xl p-10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff8c00]/5 blur-[64px] group-hover:bg-[#ff8c00]/10 transition-colors" />
                            <div className="relative z-10">
                                <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Registry Access</h2>
                                <p className="text-white/30 text-[10px] uppercase tracking-widest mb-10">Authorized Personnel Only</p>
                                <PublicRsvpForm event={event} />
                            </div>
                        </div>
                    </div>
                </main>

                <footer className="mt-48 pt-10 border-t border-white/5 flex justify-between items-center text-[10px] uppercase tracking-[0.4em] text-white/20">
                    <div className="flex items-center space-x-6">
                        <span>Factory Node: 0x92-Alpha</span>
                        <span>/</span>
                        <span>© Industrial Arch 2024</span>
                    </div>
                    <div className="flex space-x-4 font-mono">
                        <span className="text-[#ff8c00]">44% LOAD</span>
                        <span>SYS_READY</span>
                    </div>
                </footer>
            </div>
        </div>
    );
};
