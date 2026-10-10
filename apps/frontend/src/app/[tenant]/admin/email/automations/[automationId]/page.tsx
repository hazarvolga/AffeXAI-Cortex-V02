'use client';

import { AutomationBuilder } from '@/modules/email-marketing/components/automation/automation-builder';
import { useParams } from 'next/navigation';

export default function EditAutomationPage() {
    const params = useParams();
    const automationId = params?.automationId as string;

    return (
        <div className="container mx-auto py-6">
            <AutomationBuilder
                mode="edit"
                automationId={automationId}
            />
        </div>
    );
}
