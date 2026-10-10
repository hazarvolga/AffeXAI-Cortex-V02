'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Event } from '@affexai/shared-types';
import { eventsService } from '@/lib/api/eventsService';
import { AvantGardeTemplate } from '@/components/events/templates/AvantGardeTemplate';
import { NarrativeTemplate } from '@/components/events/templates/NarrativeTemplate';
import { InstitutionalTemplate } from '@/components/events/templates/InstitutionalTemplate';
import { CinematicTemplate } from '@/components/events/templates/CinematicTemplate';
import { StrategicTemplate } from '@/components/events/templates/StrategicTemplate';
import { CoreNexusTemplate } from '@/components/events/templates/CoreNexusTemplate';
import { HealthcareBriefingTemplate } from '@/components/events/templates/HealthcareBriefingTemplate';
import { Industry4BriefingTemplate } from '@/components/events/templates/IndustryBriefingTemplate';
import { SecurityBriefingTemplate } from '@/components/events/templates/SecurityBriefingTemplate';
import { EducationBriefingTemplate } from '@/components/events/templates/EducationBriefingTemplate';
import { Loader2 } from 'lucide-react';

export default function PublicEventPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchEvent() {
            try {
                const data = await eventsService.findOne(slug);
                setEvent(data);
            } catch (err) {
                console.error('Failed to fetch event:', err);
                setError('Event not found or connection error');
            } finally {
                setLoading(false);
            }
        }
        if (slug) fetchEvent();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono uppercase tracking-widest px-4 text-center">
                <div>
                    <h1 className="text-4xl mb-4 font-bold">404 // NODE_NOT_FOUND</h1>
                    <p className="text-zinc-500">The requested temporal asset does not exist in our registry.</p>
                </div>
            </div>
        );
    }

    // Template Mapping
    const templateId = event.templateId || 'avant-garde';

    switch (templateId) {
        case 'narrative':
            return <NarrativeTemplate event={event} />;
        case 'institutional':
            return <InstitutionalTemplate event={event} />;
        case 'cinematic':
            return <CinematicTemplate event={event} />;
        case 'strategic':
            return <StrategicTemplate event={event} />;
        case 'core-nexus':
            return <CoreNexusTemplate event={event} />;
        case 'healthcare':
            return <HealthcareBriefingTemplate event={event} />;
        case 'industry':
            return <Industry4BriefingTemplate event={event} />;
        case 'security':
            return <SecurityBriefingTemplate event={event} />;
        case 'education':
            return <EducationBriefingTemplate event={event} />;
        case 'avant-garde':
        default:
            return <AvantGardeTemplate event={event} />;
    }
}
