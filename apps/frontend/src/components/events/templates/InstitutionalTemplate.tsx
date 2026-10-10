import React from 'react';
import { Event } from '@affexai/shared-types';
import { PublicRsvpForm } from '@/components/events/public-rsvp-form';

export const InstitutionalTemplate = ({ event }: { event: Event }) => {
    return (
        <div className="min-h-screen bg-[#f8f8f5] text-[#050505] font-sans selection:bg-[#050505] selection:text-white">
            <div className="absolute top-0 right-0 w-1/3 h-screen bg-[#050505]/5 -z-10" />

            <div className="max-w-7xl mx-auto px-10 min-h-screen flex flex-col">
                <header className="py-10 flex justify-between items-center border-b border-black/5">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-black" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Institutional Anchor</span>
                    </div>
                </header>

                <main className="flex-1 grid grid-cols-12 gap-10 py-24">
                    <div className="col-span-12 lg:col-span-8 space-y-20">
                        <div className="space-y-8">
                            <span className="text-[10px] uppercase tracking-[0.5em] text-zinc-400">Event Registry // 04.11</span>
                            <h1 className="text-7xl lg:text-9xl font-black tracking-tighter leading-none">
                                {event.title.split(' ').map((word: string, i: number) => (
                                    <span key={i} className={i % 2 === 0 ? 'block' : 'block text-zinc-300'}>{word}</span>
                                ))}
                            </h1>
                        </div>

                        <div className="max-w-xl">
                            <p className="text-xl leading-relaxed text-zinc-600">
                                {event.description}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-12 border-t border-black/10 pt-12 max-w-2xl">
                            <div>
                                <h4 className="text-[10px] uppercase tracking-widest font-bold mb-4">Spatial Coordinates</h4>
                                <p className="text-sm font-medium">{event.location}</p>
                            </div>
                            <div>
                                <h4 className="text-[10px] uppercase tracking-widest font-bold mb-4">Temporal Index</h4>
                                <p className="text-sm font-medium">{new Date(event.startDate).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="col-span-12 lg:col-span-4 mt-20 lg:mt-0">
                        <div className="sticky top-10 bg-white border border-black/5 p-10 space-y-10 shadow-2xl">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold uppercase tracking-tight">Authorization</h2>
                                <p className="text-zinc-400 text-[10px] uppercase tracking-widest">Entry Verification Required</p>
                            </div>
                            <PublicRsvpForm event={event} />
                        </div>
                    </div>
                </main>

                <footer className="py-12 border-t border-black/5 flex justify-between items-center">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-widest">© 2024 Institutional Intelligence</span>
                    <span className="text-[10px] text-zinc-400 font-mono tracking-tighter">PROTO_SVE_7</span>
                </footer>
            </div>
        </div>
    );
};
