import React from 'react';
import { Event } from '@affexai/shared-types';
import { PublicRsvpForm } from '@/components/events/public-rsvp-form';
import { Shield, Activity, Lock, FlaskConical } from 'lucide-react';

export const HealthcareBriefingTemplate = ({ event }: { event: Event }) => {
    return (
        <div className="min-h-screen bg-[#ffffff] text-[#121212] font-sans selection:bg-[#0066ff] selection:text-white">
            {/* Clinical Aesthetic Backdrop */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] editorial-grid" />

            <div className="max-w-6xl mx-auto px-6 py-12 relative z-10">
                <header className="flex justify-between items-center mb-24 border-b border-zinc-100 pb-8">
                    <div className="flex items-center space-x-3 text-[#0066ff]">
                        <Activity className="w-5 h-5" />
                        <span className="text-[10px] uppercase tracking-[0.4em] font-bold">Life Systems // Briefing Pack V.2</span>
                    </div>
                    <div className="flex items-center space-x-4 text-zinc-400">
                        <Shield className="w-4 h-4" />
                        <span className="text-[10px] uppercase tracking-widest font-mono">Registry Secure</span>
                    </div>
                </header>

                <main className="grid grid-cols-1 md:grid-cols-12 gap-16">
                    <div className="md:col-span-8">
                        <div className="mb-12">
                            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
                                {event.title}
                            </h1>
                            <div className="flex flex-wrap gap-4 items-center">
                                <span className="bg-[#0066ff]/5 text-[#0066ff] px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border border-[#0066ff]/10">
                                    Healthcare & Life Sciences
                                </span>
                                <span className="text-zinc-300">/</span>
                                <span className="text-zinc-500 text-[10px] uppercase tracking-widest font-medium">Critical Infrastructure Briefing</span>
                            </div>
                        </div>

                        <div className="prose prose-zinc max-w-none mb-20 text-lg text-zinc-600 leading-relaxed font-light">
                            {event.description}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-12 border-t border-zinc-100">
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2 text-[#0066ff]">
                                    <Lock className="w-4 h-4" />
                                    <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold">Security Context</h3>
                                </div>
                                <p className="text-sm font-medium text-zinc-700">All data sessions are encrypted. HIPAA compliance guidelines followed for all briefings.</p>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2 text-[#0066ff]">
                                    <FlaskConical className="w-4 h-4" />
                                    <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold">Environment</h3>
                                </div>
                                <p className="text-sm font-medium text-zinc-700">{event.location}</p>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-4">
                        <div className="sticky top-12 p-8 border border-zinc-100 bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.06)] rounded-sm">
                            <h2 className="text-[11px] uppercase tracking-[0.3em] font-bold mb-8 text-[#0066ff]">Registration Desk</h2>
                            <PublicRsvpForm event={event} />
                            <p className="mt-8 text-[9px] text-zinc-400 leading-relaxed text-center italic">
                                Verification materials will be sent to the provided professional email address.
                            </p>
                        </div>
                    </div>
                </main>

                <footer className="mt-48 pt-12 border-t border-zinc-100 flex flex-col md:row justify-between items-center text-[10px] uppercase tracking-[0.2em] text-zinc-400 space-y-4 md:space-y-0">
                    <div className="flex items-center space-x-4">
                        <span>© Intel Systems 2024</span>
                        <span>/</span>
                        <span>Sector: Biomedical</span>
                    </div>
                    <div className="font-mono opacity-50">Auth_Secure_ID: 884-292</div>
                </footer>
            </div>
        </div>
    );
};
