'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/loading/skeleton";

// Lazy load EventForm - heavy form component
const EventForm = dynamic(
  () => import("@/components/admin/event-form").then(mod => ({ default: mod.EventForm })),
  {
    loading: () => <Skeleton className="h-[800px] w-full" />,
    ssr: false,
  }
);

export default function NewEventPage() {
    return (
        <div>
             <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Yeni Etkinlik Oluştur</h1>
                <p className="text-muted-foreground">Etkinliğinizin tüm detaylarını bu form üzerinden yapılandırın.</p>
            </div>
            <EventForm />
        </div>
    );
}
