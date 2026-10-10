import React from 'react';
import { Event } from '@affexai/shared-types';
import { PublicRsvpForm } from '@/components/events/public-rsvp-form';

export const StrategicTemplate = ({ event }: { event: Event }) => {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-[#00ffd2] selection:text-black">
            <div className="grid grid-cols-12 min-h-screen">
                {/* Information Column */}
                <div className="col-span-12 lg:col-span-7 bg-[#111] p-12 lg:p-24 flex flex-col justify-between border-r border-white/5">
                    <div className="space-y-20">
                        <header className="flex items-center gap-6">
                            <div className="w-12 h-12 bg-[#00ffd2] rounded-full flex items-center justify-center text-black font-bold">SI</div>
                            <div className="h-[1px] w-20 bg-white/10" />
                            <span className="text-[10px] uppercase tracking-[0.5em] text-zinc-500">Strategic Intelligence</span>
                        </header>

                        <div className="space-y-8">
                            <h1 className="text-6xl lg:text-8xl font-medium tracking-tight leading-[1.05]">
                                {event.title}
                            </h1>
                            <p className="text-xl text-zinc-400 font-light leading-relaxed max-w-xl">
                                {event.description}
                            </p>
                        </div>

                        <div className="space-y-12">
                            <h4 className="text-[10px] uppercase tracking-widest text-[#00ffd2]">Operational Briefing</h4>
                            <div className="grid grid-cols-2 gap-8 text-sm">
                                <div className="space-y-1">
                                    <p className="text-zinc-500 text-[10px] uppercase">Venue</p>
                                    <p>{event.location}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-zinc-500 text-[10px] uppercase">Schedule</p>
                                    <p>{new Date(event.startDate).toLocaleDateString()}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-zinc-500 text-[10px] uppercase">Capacity</p>
                                    <p>{event.capacity} Slots</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-zinc-500 text-[10px] uppercase">Status</p>
                                    <p className="text-[#00ffd2]">Active</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <footer className="pt-20 opacity-20">
                        <p className="text-[9px] uppercase tracking-[0.2em]">Confidential Strategic Resource // AffeXAI Foundation</p>
                    </footer>
                </div>

                {/* Interaction Column */}
                <div className="col-span-12 lg:col-span-5 p-12 lg:p-24 flex flex-col items-center justify-center">
                    <div className="w-full max-w-md space-y-12">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold tracking-tight">Request Access</h2>
                            <div className="h-1 w-12 bg-[#00ffd2]" />
                        </div>
                        <PublicRsvpForm event={event} />
                    </div>
                </div>
            </div>
        </div>
    );
};
