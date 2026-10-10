"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { Skeleton } from "@/components/loading/skeleton";
import { BccEditorialWrapper } from "@/components/brand/BccEditorialWrapper";
import { EventModuleNav } from "@/components/admin/events/EventModuleNav";
import { EventPreviewCard } from "@/components/admin/events/EventPreviewCard";
import { AiCoPilot } from "@/components/brand/ai/AiCoPilot";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Lazy load EventForm
const EventForm = dynamic(
    () => import("@/components/admin/event-form").then(mod => ({ default: mod.EventForm })),
    {
        loading: () => <Skeleton className="h-[800px] w-full" />,
        ssr: false,
    }
);

export default function TenantNewEventPage() {
    const params = useParams();
    const tenant = params?.tenant as string || "default";
    const [previewData, setPreviewData] = React.useState<any>(null);

    const handleStateChange = React.useCallback((state: any) => {
        setPreviewData(state);
    }, []);

    return (
        <BccEditorialWrapper
            headerTitle="Node Deployment"
            headerSubtitle="Initializing new temporal nexus in registry."
            headerBadge="Config Mode"
            moduleNav={<EventModuleNav />}
            headerAction={<AiCoPilot context="event_node_creator" variant="inline" data={{ templateId: previewData?.templateId }} />}
        >
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_450px] gap-0 min-h-[calc(100vh-200px)] -m-12">
                {/* Left Side: Configuration Deck */}
                <div className="p-8 lg:p-12 border-r border-white/5 animate-in slide-in-from-left duration-700 overflow-y-auto no-scrollbar">
                    <div className="mb-12 border-l-2 border-[#ff8c00] pl-6 py-2">
                        <h1 className="text-3xl font-bold tracking-tight uppercase font-mono text-white">Create_New_Node</h1>
                        <p className="text-white/40 text-[10px] uppercase tracking-widest mt-2 font-mono">Initialize event telemetry and registry parameters.</p>
                    </div>

                    <div className="bg-transparent p-0 max-w-4xl">
                        <EventForm
                            variant="editorial"
                            onStateChange={handleStateChange}
                        />
                    </div>
                </div>

                {/* Right Side: Visual HUD (Integrated Preview) */}
                <div className="hidden lg:block bg-[#0a0a0a] sticky top-0 h-[calc(100vh-72px)] overflow-hidden border-l border-white/5 z-30">
                    <div className="h-full w-full flex flex-col p-8 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[#ff8c00]/5 via-transparent to-transparent">
                        <div className="mb-8 flex items-center justify-between">
                            <div className="text-[10px] font-mono tracking-[0.3em] text-white/40 uppercase font-bold">
                                Visual_Locus_Preview
                            </div>
                            <div className="px-2 py-0.5 bg-[#9df425]/10 border border-[#9df425]/20 text-[#9df425] text-[7px] font-mono tracking-widest uppercase">
                                Realtime_Sync
                            </div>
                        </div>

                        {/* Mockup Frame (Mobile Viewport) */}
                        <div className="flex-grow flex items-center justify-center relative">
                            <div className="w-[280px] h-[560px] bg-[#0d0d0d] border-[8px] border-[#1a1a1a] rounded-[32px] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative group">
                                {/* Lens / Notch */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-[#1a1a1a] rounded-b-xl z-20"></div>

                                {/* Live Content Stream */}
                                <EventPreviewCard data={previewData} />
                            </div>
                        </div>

                        {/* Ambient Glow */}
                        <div className="absolute inset-0 bg-[#ff8c00]/5 blur-[80px] -z-10 rounded-full"></div>
                    </div>

                    {/* Telemetry Footer */}
                    <div className="mt-8 pt-8 border-t border-white/5">
                        <div className="flex justify-between items-center text-[8px] font-mono tracking-widest text-white/20 uppercase">
                            <span>Template: {previewData?.templateId || "DEFAULT"}</span>
                            <span>Units: {previewData?.metadata?.ticketTypes?.length || 0} Sets</span>
                        </div>
                    </div>
                </div>
            </div>
        </BccEditorialWrapper>
    );
}
