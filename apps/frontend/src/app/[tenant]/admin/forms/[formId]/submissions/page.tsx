'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import { FormEmptyState, FormErrorState, FormLoadingState } from '@/components/forms/FormPageState';
import { FormsPermissionGate } from '@/components/forms/FormsPermissionGate';
import { Button } from '@/components/ui/button';
import { Permission } from '@/lib/permissions/constants';
import { formsService, type FormRecord, type FormSubmission } from '@/services/forms.service';

function SubmissionsContent({ tenantId, formId }: { tenantId: string; formId: string }) {
  const [form, setForm] = useState<FormRecord | null>(null);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [loadedForm, loadedSubmissions] = await Promise.all([
        formsService.get(formId),
        formsService.submissions(formId),
      ]);
      setForm(loadedForm);
      setSubmissions(loadedSubmissions);
    } catch {
      setError('Gönderimler yüklenemedi. Erişiminizi ve bağlantınızı kontrol edin.');
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  return (
    <BccEditorialWrapper theme="tenant-admin" headerTitle="Form Gönderimleri" headerSubtitle={form?.name ?? 'Gönderim kayıtları'} headerBadge={`${submissions.length} kayıt`}>
      <div className="space-y-5">
        <Link href={`/${tenantId}/admin/forms`}><Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" /> Formlara dön</Button></Link>
        {loading ? <FormLoadingState label="Gönderimler yükleniyor" /> : error ? <FormErrorState message={error} onRetry={() => void load()} /> : submissions.length === 0 ? (
          <FormEmptyState title="Henüz gönderim yok" description="Yayınlanan formdan gelen yanıtlar burada görünecek." />
        ) : (
          <div className="space-y-3">
            {submissions.map((submission, index) => (
              <article key={submission.id} className="rounded-2xl border border-white/5 bg-[#0c0c0c] p-4 sm:p-6">
                <div className="mb-4 flex flex-col gap-1 border-b border-white/5 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="font-medium text-white">Gönderim #{submissions.length - index}</h2>
                  <time className="text-xs text-white/40" dateTime={submission.submittedAt}>{new Date(submission.submittedAt).toLocaleString('tr-TR')}</time>
                </div>
                <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {Object.entries(submission.data).map(([key, value]) => (
                    <div key={key} className="min-w-0 rounded-xl bg-white/[0.025] p-3">
                      <dt className="truncate text-xs font-medium uppercase tracking-wider text-white/30">{key}</dt>
                      <dd className="mt-1 break-words text-sm text-white/80">{typeof value === 'string' ? value : JSON.stringify(value)}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        )}
      </div>
    </BccEditorialWrapper>
  );
}

export default function FormSubmissionsPage() {
  const params = useParams<{ tenant: string; formId: string }>();
  return (
    <FormsPermissionGate permission={Permission.FORMS_SUBMISSIONS_VIEW}>
      <SubmissionsContent tenantId={params.tenant} formId={params.formId} />
    </FormsPermissionGate>
  );
}
