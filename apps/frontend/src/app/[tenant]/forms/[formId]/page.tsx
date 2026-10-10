'use client';

import { useParams } from 'next/navigation';
import { PublicFormRenderer } from '@/components/forms/PublicFormRenderer';

export default function PublicFormPage() {
  const params = useParams<{ tenant: string; formId: string }>();
  return <PublicFormRenderer tenantId={params.tenant} formId={params.formId} />;
}
