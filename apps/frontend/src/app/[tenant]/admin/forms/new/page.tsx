'use client';

import { useParams } from 'next/navigation';
import { FormEditor } from '@/components/forms/FormEditor';
import { FormsPermissionGate } from '@/components/forms/FormsPermissionGate';
import { Permission } from '@/lib/permissions/constants';

export default function NewFormPage() {
  const params = useParams<{ tenant: string }>();
  return (
    <FormsPermissionGate permission={Permission.FORMS_MANAGE}>
      <FormEditor tenantId={params.tenant} />
    </FormsPermissionGate>
  );
}
