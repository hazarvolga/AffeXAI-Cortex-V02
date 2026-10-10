import React from 'react';
import { Event } from '@affexai/shared-types';
import { PublicRsvpForm } from '@/components/events/public-rsvp-form';

export const CoreNexusTemplate = ({ event }: { event: Event }) => {
    return (
        <div className="min-h-screen bg-[#050505] text-[#00ff41] font-mono selection:bg-[#00ff41] selection:text-black">
            <header className="px-8 py-6 border-b border-[#00ff41]/20 flex justify-between items-center bg-[#070707]">
                <div className="flex items-center gap-4">
                    <span className="text-xs blink">_</span>
                    <span className="text-xs uppercase tracking-widest">Core Nexus Interface</span>
                </div>
                <div className="text-[10px] text-[#00ff41]/50">
                    SECURE_LINK: {event.id.slice(0, 16)}
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-8 py-20 space-y-20">
                <section className="space-y-6">
                    <div className="inline-block px-2 py-1 border border-[#00ff41]/30 text-[10px] uppercase">
                        System Observation Active
                    </div>
                    <h1 className="text-6xl md:text-8xl font-bold tracking-tighter uppercase">
                        {event.title}
                    </h1>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div className="md:col-span-2 space-y-12">
                        <div className="bg-[#0a0a0a] border border-[#00ff41]/10 p-8 space-y-6">
                            <h3 className="text-xs uppercase border-b border-[#00ff41]/20 pb-4">Extraction Matrix</h3>
                            <p className="text-lg leading-relaxed opacity-80">
                                {event.description}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-[#0a0a0a] border border-[#00ff41]/10 p-6">
                                <span className="text-[10px] block opacity-50 mb-2">Location_Index</span>
                                <span className="text-sm">{event.location}</span>
                            </div>
                            <div className="bg-[#0a0a0a] border border-[#00ff41]/10 p-6">
                                <span className="text-[10px] block opacity-50 mb-2">Temporal_Stamp</span>
                                <span className="text-sm">{new Date(event.startDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-[#00ff41]/5 border border-[#00ff41]/20 p-8 space-y-8">
                            <div className="space-y-1">
                                <h2 className="text-lg font-bold uppercase uppercase">Node Access</h2>
                                <p className="text-[9px] opacity-50">VERIFICATION_PROTOCOL_01</p>
                            </div>
                            <PublicRsvpForm event={event} />
                        </div>

                        <div className="bg-[#0a0a0a] border border-[#00ff41]/10 p-6 text-[9px] space-y-2 opacity-30">
                            <p>// SYSTEM_ID: AFFEX_AI_CORE</p>
                            <p>// STATUS: STABLE</p>
                            <p>// ENCRYPTION: AES-256</p>
                        </div>
                    </div>
                </div>
            </main>

            <style jsx>{`
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
                .blink {
                    animation: blink 1s infinite step-end;
                }
            `}</style>
        </div>
    );
};
