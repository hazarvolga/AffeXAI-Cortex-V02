import React from 'react';
import { Event } from '@affexai/shared-types';
import { PublicRsvpForm } from '@/components/events/public-rsvp-form';

export const NarrativeTemplate = ({ event }: { event: Event }) => {
    return (
        <div className="min-h-screen bg-white text-zinc-900 font-serif selection:bg-zinc-900 selection:text-white">
            <header className="px-10 py-12 flex justify-between items-center border-b border-zinc-100">
                <span className="text-xs uppercase tracking-[0.3em] font-bold">The Narrative Hub</span>
                <span className="text-[10px] text-zinc-400 font-mono">{new Date().toISOString()}</span>
            </header>

            <main className="max-w-4xl mx-auto px-10 py-24 space-y-32">
                <section className="space-y-12">
                    <h1 className="text-6xl md:text-8xl font-light tracking-tight leading-none text-balance">
                        {event.title}
                    </h1>
                    <div className="w-24 h-[1px] bg-zinc-200" />
                    <p className="text-2xl md:text-3xl text-zinc-500 leading-relaxed max-w-2xl font-light italic">
                        {event.description}
                    </p>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-start">
                    <div className="space-y-16">
                        <div className="space-y-4">
                            <h4 className="text-xs uppercase tracking-widest font-bold text-zinc-400">Context</h4>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] text-zinc-400 uppercase mb-1">Location</p>
                                    <p className="text-lg">{event.location}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-zinc-400 uppercase mb-1">Commencement</p>
                                    <p className="text-lg">{new Date(event.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-zinc-50 border border-zinc-100 p-12 space-y-10">
                        <h2 className="text-3xl font-light tracking-tight">Express Interest</h2>
                        <PublicRsvpForm event={event} />
                    </div>
                </div>
            </main>

            <footer className="px-10 py-24 bg-zinc-50 border-t border-zinc-100 mt-40">
                <div className="max-w-4xl mx-auto flex flex-col items-center gap-8 text-center">
                    <div className="space-y-2">
                        <p className="text-xs uppercase tracking-widest text-zinc-400">Authorized Presence Only</p>
                        <p className="text-zinc-600 max-w-xs text-sm leading-relaxed">
                            This communication is part of a restricted information exchange.
                        </p>
                    </div>
                    <div className="w-1 w-1 bg-zinc-200 rounded-full" />
                </div>
            </footer>
        </div>
    );
};
