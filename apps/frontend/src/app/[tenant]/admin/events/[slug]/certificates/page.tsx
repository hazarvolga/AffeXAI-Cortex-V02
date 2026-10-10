"use client";

import React from "react";
import { useParams } from "next/navigation";
import { BccEditorialWrapper } from "@/components/brand/BccEditorialWrapper";
import { EventModuleNav } from "@/components/admin/events/EventModuleNav";
import { BccHudTile } from "@/components/brand/BccHudTile";

export default function EventCertificatesPage() {
    const params = useParams();
    const slug = params?.slug as string;

    return (
        <BccEditorialWrapper
            headerTitle="Certification"
            headerSubtitle={`Achievement parameters for node: ${slug}`}
            headerBadge="Credential Mode"
            moduleNav={<EventModuleNav />}
        >
            <div className="space-y-12 animate-in fade-in duration-1000">
                <BccHudTile
                    title="Template Config"
                    subtitle="Visual asset definition for certificates"
                >
                    <div className="p-12 border border-white/5 bg-white/[0.02] text-center">
                        <p className="font-mono text-[10px] text-white/40 uppercase tracking-widest">
                            Certificate Editor Interface Placeholder
                        </p>
                    </div>
                </BccHudTile>
            </div>
        </BccEditorialWrapper>
    );
}
