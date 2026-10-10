'use client';

import { useParams } from 'next/navigation';
import { FormEditor } from '@/components/forms/FormEditor';
import { FormsPermissionGate } from '@/components/forms/FormsPermissionGate';
import { Permission } from '@/lib/permissions/constants';

export default function EditFormPage() {
  const params = useParams<{ tenant: string; formId: string }>();
  return (
    <FormsPermissionGate permission={Permission.FORMS_MANAGE}>
      <FormEditor tenantId={params.tenant} formId={params.formId} />
    </FormsPermissionGate>
  );
}
