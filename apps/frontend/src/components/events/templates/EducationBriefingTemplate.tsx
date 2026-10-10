import React from 'react';
import { Event } from '@affexai/shared-types';
import { PublicRsvpForm } from '@/components/events/public-rsvp-form';
import { BookOpen, Globe, Users, Award } from 'lucide-react';

export const EducationBriefingTemplate = ({ event }: { event: Event }) => {
    return (
        <div className="min-h-screen bg-[#f3f4f6] text-[#1f2937] font-sans selection:bg-[#4f46e5] selection:text-white">
            {/* Academic Clarity Backdrop */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.02] editorial-grid" />

            <div className="max-w-6xl mx-auto px-6 py-16 relative z-10">
                <header className="flex justify-between items-center mb-24 border-b border-zinc-200 pb-10">
                    <div className="flex items-center space-x-4 text-[#4f46e5]">
                        <BookOpen className="w-6 h-6" />
                        <span className="text-[11px] uppercase tracking-[0.3em] font-bold">Educational Intelligence // Session 04</span>
                    </div>
                    <div className="flex items-center space-x-4 text-zinc-400">
                        <Globe className="w-4 h-4" />
                        <span className="text-[10px] uppercase tracking-widest font-medium">Digital Literacy Standard</span>
                    </div>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    <div className="lg:col-span-8">
                        <div className="mb-16">
                            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 text-[#111827]">
                                {event.title}
                            </h1>
                            <div className="flex items-center space-x-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#4f46e5] bg-[#4f46e5]/10 px-3 py-1 rounded-sm">
                                    Learning Systems
                                </span>
                                <div className="h-px w-8 bg-zinc-300" />
                                <span className="text-zinc-500 text-[10px] uppercase tracking-widest">Open Session Policy</span>
                            </div>
                        </div>

                        <div className="max-w-3xl mb-24">
                            <p className="text-xl leading-relaxed text-zinc-600 font-light italic border-l-4 border-[#4f46e5]/20 pl-8 py-2">
                                {event.description}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 pt-12 border-t border-zinc-200">
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2 text-[#4f46e5]">
                                    <Users className="w-5 h-5" />
                                    <h3 className="text-xs uppercase tracking-widest font-bold">Collaborative Hub</h3>
                                </div>
                                <p className="text-sm text-zinc-500 leading-relaxed font-medium">Designed for inter-disciplinary collaboration at {event.location}.</p>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2 text-[#4f46e5]">
                                    <Award className="w-5 h-5" />
                                    <h3 className="text-xs uppercase tracking-widest font-bold">Accreditation</h3>
                                </div>
                                <p className="text-sm text-zinc-500 leading-relaxed font-medium">Participants may receive digital credentials upon completion of the strategic session.</p>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-4">
                        <div className="bg-white p-10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] rounded-lg">
                            <h2 className="text-lg font-bold mb-8 flex items-center gap-2">
                                Enrollment <span className="h-px flex-grow bg-zinc-100" />
                            </h2>
                            <PublicRsvpForm event={event} />
                            <div className="mt-8 pt-8 border-t border-zinc-100 text-center">
                                <span className="text-[10px] text-zinc-400 uppercase tracking-widest">Faculty Verified System</span>
                            </div>
                        </div>
                    </div>
                </main>

                <footer className="mt-48 pt-12 border-t border-zinc-200 flex justify-between items-center text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                    <div>© Academic Collective 2024</div>
                    <div className="font-mono opacity-50">NODE_ED_REF: 42-X</div>
                </footer>
            </div>
        </div>
    );
};
