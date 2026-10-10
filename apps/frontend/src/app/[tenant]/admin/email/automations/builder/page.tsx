'use client';

import { WorkflowBuilder } from '@/modules/email-marketing/components/automation/workflow-builder';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import { EmailModuleNav } from '@/components/admin/email/EmailModuleNav';
import { useParams } from 'next/navigation';

export default function WorkflowBuilderPage() {
  const params = useParams();
  const tenant = params?.tenant as string || 'default';

  return (
    <BccEditorialWrapper
      headerTitle="Lattice_Synthesizer"
      headerBadge="Builder"
      moduleNav={<EmailModuleNav />}
      telemetryData={[
        { label: "CANVAS_SYNC", value: "ACTIVE" },
        { label: "NODE_INTEGRITY", value: "VERIFIED" },
        { label: "LOGIC_STREAM", value: "STABLE" },
        { label: "COMPILER_STATE", value: "READY" }
      ]}
    >
      <div className="h-[calc(100vh-220px)] w-full">
        <WorkflowBuilder tenant={tenant} />
      </div>
    </BccEditorialWrapper>
  );
}
