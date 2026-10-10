/**
 * Email Marketing Automations Page
 * Main page for viewing and managing marketing automations
 */

'use client';

import { AutomationList } from '@/modules/email-marketing/components/automation/automation-list';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import { EmailModuleNav } from '@/components/admin/email/EmailModuleNav';
import { useParams } from 'next/navigation';

export default function AutomationsPage() {
  const params = useParams();
  const tenant = params?.tenant as string || 'default';

  return (
    <BccEditorialWrapper
      headerTitle="Automation_Lattices"
      headerBadge="Nodes"
      moduleNav={<EmailModuleNav />}
      telemetryData={[
        { label: "NEURAL_PATHS", value: "ACTIVE" },
        { label: "EXECUTION_SYNC", value: "STABLE" },
        { label: "TRIGGER_READY", value: "NOMINAL" },
        { label: "QUEUE_LOAD", value: "0.04%" }
      ]}
    >
      <AutomationList tenant={tenant} />
    </BccEditorialWrapper>
  );
}
