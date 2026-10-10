import React from 'react';
import { Event } from '@affexai/shared-types';
import { PublicRsvpForm } from '@/components/events/public-rsvp-form';
import { ShieldCheck, Database, Server, Fingerprint } from 'lucide-react';

export const SecurityBriefingTemplate = ({ event }: { event: Event }) => {
    return (
        <div className="min-h-screen bg-[#000000] text-[#f0f0f0] font-mono selection:bg-white selection:text-black">
            {/* Security Grid */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.1] bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] bg-[size:20px_20px]" />
            <div className="fixed bottom-0 left-0 w-full h-[100px] bg-gradient-to-t from-white/[0.02] to-transparent" />

            <div className="max-w-5xl mx-auto px-8 py-20 relative z-10">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-32 border-l-2 border-white/20 pl-6 py-2">
                    <div className="flex items-center space-x-3 mb-4 md:mb-0">
                        <Fingerprint className="w-5 h-5 text-white" />
                        <span className="text-[11px] uppercase tracking-[0.5em] font-bold">Security Briefing // Protocol SVE-8</span>
                    </div>
                    <div className="text-[10px] text-white/30 uppercase tracking-widest">
                        Status: <span className="text-white">Encrypted Session</span> // Verified: <span className="text-white font-bold">{new Date().toISOString().split('T')[0]}</span>
                    </div>
                </header>

                <main className="space-y-24">
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3 opacity-30">
                            <span className="text-[10px]">OBJECTIVE:</span>
                            <div className="h-px flex-grow bg-white/20" />
                        </div>
                        <h1 className="text-4xl md:text-7xl font-medium tracking-tighter leading-[0.9] text-white">
                            {event.title}
                        </h1>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
                        <div className="lg:col-span-7 space-y-12">
                            <div className="flex items-center space-x-4">
                                <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-xs text-[10px] uppercase tracking-widest text-white font-bold">Strategic Briefing</span>
                                <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-xs text-[10px] uppercase tracking-widest text-[#aaaaaa]">Access Level 1</span>
                            </div>

                            <div className="text-xl text-white/50 leading-relaxed font-light whitespace-pre-line">
                                {event.description}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 pt-16 border-t border-white/5">
                                <div className="flex space-x-4">
                                    <ShieldCheck className="w-6 h-6 shrink-0 text-white/40" />
                                    <div>
                                        <h4 className="text-[10px] uppercase tracking-widest font-bold mb-2">Zero Trust</h4>
                                        <p className="text-xs text-white/40 leading-relaxed">Framework integration strategies for {event.location}.</p>
                                    </div>
                                </div>
                                <div className="flex space-x-4">
                                    <Database className="w-6 h-6 shrink-0 text-white/40" />
                                    <div>
                                        <h4 className="text-[10px] uppercase tracking-widest font-bold mb-2">Data Integrity</h4>
                                        <p className="text-xs text-white/40 leading-relaxed">Resilience planning and disaster recovery protocols.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-5 bg-white/[0.03] border border-white/10 p-10 space-y-10">
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Server className="w-4 h-4 text-white" />
                                    <h2 className="text-xs font-bold uppercase tracking-[0.2em]">Briefing Enrollment</h2>
                                </div>
                                <p className="text-white/20 text-[9px] uppercase tracking-widest">Connection Point: AffeX Security Node</p>
                            </div>
                            <PublicRsvpForm event={event} />
                        </div>
                    </div>
                </main>

                <footer className="mt-48 pt-10 border-t border-white/5 flex flex-col md:row justify-between items-center text-[10px] uppercase tracking-[0.3em] text-white/20 gap-4">
                    <div className="flex items-center space-x-8">
                        <span>© Security Arch 2024</span>
                        <span>[ NODE_RECOVERY_PROTOCOL ]</span>
                    </div>
                    <div className="font-mono text-[9px] opacity-40">
                        HASH: 0x8a92b7c-f3e1
                    </div>
                </footer>
            </div>
        </div>
    );
};
