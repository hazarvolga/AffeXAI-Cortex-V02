import React from 'react';
import { Event } from '@affexai/shared-types';
import { PublicRsvpForm } from '@/components/events/public-rsvp-form';

export const CinematicTemplate = ({ event }: { event: Event }) => {
    return (
        <div className="min-h-screen bg-black text-white font-sans overflow-hidden">
            {/* Background Image / Gradient Placeholder */}
            <div className="fixed inset-0 bg-gradient-to-b from-blue-900/20 via-black to-black -z-10" />
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent -z-10" />

            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 text-center py-20">
                <div className="max-w-4xl space-y-12">
                    <div className="inline-block px-4 py-1 border border-white/20 rounded-full text-[10px] uppercase tracking-[0.4em] font-medium backdrop-blur-md">
                        Global Premiere
                    </div>

                    <h1 className="text-7xl lg:text-[120px] font-bold tracking-tighter leading-[0.85] italic uppercase">
                        {event.title}
                    </h1>

                    <p className="text-xl lg:text-3xl font-light text-zinc-400 leading-relaxed max-w-2xl mx-auto italic">
                        "{event.description}"
                    </p>

                    <div className="flex flex-wrap justify-center gap-12 pt-10">
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-[10px] uppercase tracking-widest text-[#f9bc06]">Location</span>
                            <span className="text-lg font-medium">{event.location}</span>
                        </div>
                        <div className="w-[1px] h-12 bg-white/10 hidden md:block" />
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-[10px] uppercase tracking-widest text-[#f9bc06]">Date</span>
                            <span className="text-lg font-medium">{new Date(event.startDate).toLocaleDateString()}</span>
                        </div>
                        <div className="w-[1px] h-12 bg-white/10 hidden md:block" />
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-[10px] uppercase tracking-widest text-[#f9bc06]">Limit</span>
                            <span className="text-lg font-medium">{event.capacity} Assets</span>
                        </div>
                    </div>

                    <div className="pt-20 max-w-md mx-auto">
                        <div className="bg-white/5 border border-white/10 p-10 backdrop-blur-2xl rounded-3xl">
                            <h2 className="text-xl font-bold uppercase tracking-widest mb-8">Claim Your Access</h2>
                            <PublicRsvpForm event={event} />
                        </div>
                    </div>
                </div>
            </div>

            <footer className="fixed bottom-10 left-10 right-10 flex justify-between items-center opacity-30">
                <div className="text-[10px] flex items-center gap-4">
                    <span>CINEMATIC_INTERFACE_01</span>
                    <div className="w-10 h-[1px] bg-white" />
                </div>
                <span className="text-[10px]">© 2024 PRODUCTIONS</span>
            </footer>
        </div>
    );
};
