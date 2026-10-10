"use client";

import React from "react";
import { useParams } from "next/navigation";
import { BccEditorialWrapper } from "@/components/brand/BccEditorialWrapper";
import { EventModuleNav } from "@/components/admin/events/EventModuleNav";
import { BccHudTile } from "@/components/brand/BccHudTile";

export default function EventCommsPage() {
    const params = useParams();
    const slug = params?.slug as string;

    return (
        <BccEditorialWrapper
            headerTitle="Comm-Station"
            headerSubtitle={`Outbound orbital signals for node: ${slug}`}
            headerBadge="Signal Mode"
            moduleNav={<EventModuleNav />}
        >
            <div className="space-y-12 animate-in fade-in duration-1000">
                <BccHudTile
                    title="Broadcast Triggers"
                    subtitle="Mass communication execution station"
                >
                    <div className="p-12 border border-white/5 bg-white/[0.02] text-center">
                        <p className="font-mono text-[10px] text-white/40 uppercase tracking-widest">
                            Email Automation Control Placeholder
                        </p>
                    </div>
                </BccHudTile>
            </div>
        </BccEditorialWrapper>
    );
}
