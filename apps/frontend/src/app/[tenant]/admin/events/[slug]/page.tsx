"use client";

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { Skeleton } from "@/components/loading/skeleton";
import { BccEditorialWrapper } from "@/components/brand/BccEditorialWrapper";
import { EventModuleNav } from "@/components/admin/events/EventModuleNav";

// Lazy load EventForm
const EventForm = dynamic(
    () => import("@/components/admin/event-form").then(mod => ({ default: mod.EventForm })),
    {
        loading: () => <Skeleton className="h-[800px] w-full" />,
        ssr: false,
    }
);

export default function TenantEditEventPage() {
    const params = useParams();
    const tenant = params?.tenant as string || "default";
    const slug = params?.slug as string;

    return (
        <BccEditorialWrapper
            headerTitle="Modify State"
            headerSubtitle={`Adjusting temporal parameters for node: ${slug}`}
            headerBadge="Admin Portal"
            moduleNav={<EventModuleNav />}
        >
            <div className="max-w-4xl mx-auto animate-in fade-in duration-700">
                <div className="mb-12 border-l-2 border-[#ff8c00] pl-6 py-2">
                    <h1 className="text-3xl font-bold tracking-tight uppercase font-mono">Modify_Existing_Node</h1>
                    <p className="text-white/40 text-[10px] uppercase tracking-widest mt-2">Adjust event telemetry and registry parameters for node identifier: {slug}</p>
                </div>

                <div className="bg-transparent p-0">
                    <EventForm eventId={slug} variant="editorial" />
                </div>
            </div>
        </BccEditorialWrapper>
    );
}
