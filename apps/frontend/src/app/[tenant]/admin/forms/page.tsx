'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Eye, FilePlus2, Inbox, Pencil, Search } from 'lucide-react';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import { FormEmptyState, FormErrorState, FormLoadingState } from '@/components/forms/FormPageState';
import { FormsPermissionGate } from '@/components/forms/FormsPermissionGate';
import { filterForms } from '@/components/forms/forms.logic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/lib/permissions/constants';
import { cn } from '@/lib/utils';
import { formsService, type FormRecord, type FormStatus } from '@/services/forms.service';

const STATUS_LABELS: Record<FormStatus, string> = {
  draft: 'Taslak',
  published: 'Yayında',
  archived: 'Arşivde',
};

function FormsListContent({ tenantId }: { tenantId: string }) {
  const { hasPermission, isSuperAdmin } = usePermissions();
  const canManage = isSuperAdmin || hasPermission(Permission.FORMS_MANAGE);
  const canViewSubmissions = isSuperAdmin || hasPermission(Permission.FORMS_SUBMISSIONS_VIEW);
  const [forms, setForms] = useState<FormRecord[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<FormStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setForms(await formsService.list());
    } catch {
      setError('Form listesi yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const visibleForms = useMemo(() => filterForms(forms, query, status), [forms, query, status]);

  return (
    <BccEditorialWrapper theme="tenant-admin" headerTitle="Form Yönetimi" headerSubtitle="Formları oluşturun, yayınlayın ve gönderimleri takip edin." headerBadge={`${forms.length} form`}>
      <div className="space-y-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:max-w-2xl sm:flex-row">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Formlarda ara</span>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" aria-hidden="true" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Form adı veya açıklamasında ara" className="border-white/10 bg-[#0c0c0c] pl-10 text-white" />
            </label>
            <label>
              <span className="sr-only">Duruma göre filtrele</span>
              <select value={status} onChange={(event) => setStatus(event.target.value as FormStatus | 'all')} className="h-10 w-full rounded-md border border-white/10 bg-[#0c0c0c] px-3 text-sm text-white sm:w-40">
                <option value="all">Tüm durumlar</option>
                <option value="draft">Taslak</option>
                <option value="published">Yayında</option>
                <option value="archived">Arşivde</option>
              </select>
            </label>
          </div>
          {canManage && (
            <Link href={`/${tenantId}/admin/forms/new`}>
              <Button className="w-full bg-[#ff8c00] font-semibold text-black hover:bg-[#ff8c00]/90 sm:w-auto"><FilePlus2 className="mr-2 h-4 w-4" /> Yeni form</Button>
            </Link>
          )}
        </div>

        {loading ? <FormLoadingState /> : error ? <FormErrorState message={error} onRetry={() => void load()} /> : forms.length === 0 ? (
          <FormEmptyState title="Henüz form yok" description={canManage ? 'İlk formunuzu oluşturup taslak olarak kaydedebilir veya yayınlayabilirsiniz.' : 'Size görünür bir form bulunmuyor.'} />
        ) : visibleForms.length === 0 ? (
          <FormEmptyState title="Eşleşen form yok" description="Arama metnini veya durum filtresini değiştirin." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleForms.map((form) => (
              <article key={form.id} className="flex min-w-0 flex-col rounded-2xl border border-white/5 bg-[#0c0c0c] p-5 transition-colors hover:border-white/15">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-white">{form.name}</h2>
                    <p className="mt-1 line-clamp-2 min-h-10 text-sm text-white/40">{form.description || 'Açıklama eklenmemiş.'}</p>
                  </div>
                  <span className={cn('shrink-0 rounded-full border px-2.5 py-1 text-xs', form.status === 'published' ? 'border-green-400/20 bg-green-400/10 text-green-300' : form.status === 'archived' ? 'border-white/10 text-white/40' : 'border-[#ff8c00]/20 bg-[#ff8c00]/10 text-[#ffb45b]')}>{STATUS_LABELS[form.status]}</span>
                </div>
                <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-white/5 pt-4 text-sm">
                  <div><dt className="text-xs text-white/30">Gönderim</dt><dd className="mt-1 font-medium text-white">{form.submissionCount}</dd></div>
                  <div><dt className="text-xs text-white/30">Güncellendi</dt><dd className="mt-1 text-white/70">{new Date(form.updatedAt).toLocaleDateString('tr-TR')}</dd></div>
                </dl>
                <div className="mt-5 flex flex-wrap gap-2">
                  {canManage && <Link href={`/${tenantId}/admin/forms/${form.id}`}><Button size="sm" variant="outline"><Pencil className="mr-2 h-3.5 w-3.5" /> Düzenle</Button></Link>}
                  {form.status === 'published' && <Link href={`/${tenantId}/forms/${form.id}`}><Button size="sm" variant="ghost"><Eye className="mr-2 h-3.5 w-3.5" /> Aç</Button></Link>}
                  {canViewSubmissions && <Link href={`/${tenantId}/admin/forms/${form.id}/submissions`}><Button size="sm" variant="ghost"><Inbox className="mr-2 h-3.5 w-3.5" /> Gönderimler</Button></Link>}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </BccEditorialWrapper>
  );
}

export default function FormsListPage() {
  const params = useParams<{ tenant: string }>();
  return <FormsPermissionGate permission={Permission.FORMS_VIEW}><FormsListContent tenantId={params.tenant} /></FormsPermissionGate>;
}
