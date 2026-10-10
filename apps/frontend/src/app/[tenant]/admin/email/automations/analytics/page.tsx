'use client';

import { AutomationAnalytics } from '@/modules/email-marketing/components/automation/automation-analytics';

export default function AutomationAnalyticsPage() {
  // In production, get automationId from URL params
  const automationId = 'demo-automation-1';

  return (
    <div className="container mx-auto py-6">
      <AutomationAnalytics automationId={automationId} />
    </div>
  );
}
