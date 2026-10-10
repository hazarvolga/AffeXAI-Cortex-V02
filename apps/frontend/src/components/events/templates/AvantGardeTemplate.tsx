import React from 'react';
import { Event } from '@affexai/shared-types';
import { eventsService } from '@/lib/api/eventsService';
import { PublicRsvpForm } from '@/components/events/public-rsvp-form';

export const AvantGardeTemplate = ({ event }: { event: Event }) => {
    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#f9f906] selection:text-black">
            {/* Background pattern */}
            <div className="fixed inset-0 pointer-events-none opacity-20">
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#1a1a1a 1px, transparent 0)', backgroundSize: '40px 40px' }} />
            </div>

            <main className="relative z-10 max-w-7xl mx-auto px-6 py-12 lg:py-24">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32 items-center">
                    {/* Hero Text */}
                    <div className="space-y-12">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-[#f9f906]" />
                                <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-zinc-500">Protocol: {event.id.slice(0, 8)}</span>
                            </div>
                            <h1 className="text-5xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.9]">
                                {event.title}
                            </h1>
                        </div>

                        <div className="space-y-8">
                            <p className="text-zinc-400 text-xl font-light leading-relaxed max-w-xl">
                                {event.description}
                            </p>

                            <div className="grid grid-cols-2 gap-10 border-t border-zinc-800 pt-10">
                                <div>
                                    <h4 className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Location Index</h4>
                                    <p className="font-mono text-sm">{event.location}</p>
                                </div>
                                <div>
                                    <h4 className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Temporal Point</h4>
                                    <p className="font-mono text-sm">{new Date(event.startDate).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Registration Card */}
                    <div className="bg-zinc-900/50 border border-zinc-800 backdrop-blur-xl p-8 lg:p-12 space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold uppercase tracking-tight">Access Authorization</h2>
                            <p className="text-zinc-500 text-sm mt-2">Request institutional entry to this temporal asset.</p>
                        </div>
                        <PublicRsvpForm event={event} />
                    </div>
                </div>
            </main>

            <footer className="relative z-10 px-6 py-12 border-t border-zinc-900 mt-20">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <span className="text-[10px] text-zinc-600 uppercase tracking-widest italic">AffeXAI Intelligence Surface</span>
                    <span className="text-[10px] text-zinc-600 font-mono">STATUS: OPERATIONAL</span>
                </div>
            </footer>
        </div>
    );
};
