"use client";

import React from "react";
import { useParams } from "next/navigation";
import { BccEditorialWrapper } from "@/components/brand/BccEditorialWrapper";
import { EventModuleNav } from "@/components/admin/events/EventModuleNav";
import { BccHudTile } from "@/components/brand/BccHudTile";

export default function EventAnalyticsPage() {
    const params = useParams();
    const slug = params?.slug as string;

    return (
        <BccEditorialWrapper
            headerTitle="Analytics Core"
            headerSubtitle={`Telemetric analysis for node: ${slug}`}
            headerBadge="Data Stream"
            moduleNav={<EventModuleNav />}
        >
            <div className="space-y-12 animate-in fade-in duration-1000">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <BccHudTile title="Conversion Rate" subtitle="Registrant flux" icon="trending_up">
                        <div className="text-3xl font-light text-white tracking-widest uppercase">74.2%</div>
                    </BccHudTile>
                    <BccHudTile title="Engagement" subtitle="Interaction density" icon="touch_app">
                        <div className="text-3xl font-light text-white tracking-widest uppercase">High</div>
                    </BccHudTile>
                    <BccHudTile title="Social Pulse" subtitle="External resonance" icon="share">
                        <div className="text-3xl font-light text-white tracking-widest uppercase">92.4</div>
                    </BccHudTile>
                </div>

                <BccHudTile
                    className="h-96"
                    title="Temporal Flux Analysis"
                    subtitle="Placeholder for high-fidelity interactive chart"
                >
                    <div className="w-full h-full flex items-center justify-center border border-white/5 bg-white/[0.02]">
                        <p className="font-mono text-[10px] text-white/20 uppercase tracking-[0.3em]">
                            Initializing Visual Engine...
                        </p>
                    </div>
                </BccHudTile>
            </div>
        </BccEditorialWrapper>
    );
}
