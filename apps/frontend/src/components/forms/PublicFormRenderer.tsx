'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormErrorState, FormLoadingState } from './FormPageState';
import { createSubmissionAttemptKey, resolveSafeFormRedirect } from './forms.logic';
import { formsService, type FormBlock, type PublicFormRecord } from '@/services/forms.service';

interface PublicFormRendererProps {
  tenantId: string;
  formId: string;
}

const textValue = (value: unknown, fallback = '') => typeof value === 'string' ? value : fallback;
const boolValue = (value: unknown) => value === true;
const optionsValue = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
const inputTypeValue = (value: unknown) => {
  const type = textValue(value, 'text');
  return ['text', 'email', 'tel', 'url', 'number', 'date'].includes(type) ? type : 'text';
};

export function PublicFormRenderer({ tenantId, formId }: PublicFormRendererProps) {
  const [form, setForm] = useState<PublicFormRecord | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const attemptKey = useRef(createSubmissionAttemptKey());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setForm(await formsService.getPublished(tenantId, formId));
    } catch {
      setError('Bu form bulunamadı veya artık yayında değil.');
    } finally {
      setLoading(false);
    }
  }, [formId, tenantId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const isVisible = (blockId: string) => {
    const rule = form?.structure.logicConfig?.rules.find((candidate) => candidate.blockId === blockId);
    if (!rule) return true;
    const matches = rule.conditions.every((condition) => {
      const current = values[condition.fieldId];
      switch (condition.operator) {
        case 'equals': return current === condition.value;
        case 'not_equals': return current !== condition.value;
        case 'contains': return Array.isArray(current) ? current.includes(condition.value) : String(current ?? '').includes(String(condition.value ?? ''));
        case 'empty': return current === undefined || current === null || current === '' || current === false;
        case 'not_empty': return current !== undefined && current !== null && current !== '' && current !== false;
      }
    });
    return rule.action === 'show' ? matches : !matches;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await formsService.submit(tenantId, form.id, values, attemptKey.current);
      const redirectUrl = resolveSafeFormRedirect(form.settings?.redirectUrl);
      if (redirectUrl) {
        window.location.assign(redirectUrl);
        return;
      }
      setSubmitted(true);
      attemptKey.current = createSubmissionAttemptKey();
    } catch {
      setError('Yanıtınız gönderilemedi. Aynı gönderimi güvenle tekrar deneyebilirsiniz.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <main className="mx-auto max-w-2xl p-4 sm:p-10"><FormLoadingState label="Form yükleniyor" /></main>;
  if (!form) return <main className="mx-auto max-w-2xl p-4 sm:p-10"><FormErrorState message={error ?? 'Form bulunamadı.'} onRetry={() => void load()} /></main>;

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] p-4 text-white">
        <div className="w-full max-w-xl rounded-3xl border border-green-400/20 bg-[#0c0c0c] p-8 text-center sm:p-12" role="status">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-400" aria-hidden="true" />
          <h1 className="mt-5 text-2xl font-semibold">Yanıtınız alındı</h1>
          <p className="mt-3 text-white/50">{form.settings?.successMessage || 'Formu doldurduğunuz için teşekkür ederiz.'}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-8 text-white sm:py-14">
      <form onSubmit={submit} className="mx-auto w-full rounded-3xl border border-white/10 bg-[#0c0c0c] p-5 shadow-2xl sm:p-10" style={{ maxWidth: form.structure.settings.width || '680px' }}>
        <header className="mb-8 border-b border-white/5 pb-6">
          <h1 className="text-2xl font-semibold sm:text-3xl">{form.name}</h1>
          {form.description && <p className="mt-3 text-sm leading-6 text-white/50">{form.description}</p>}
        </header>

        <div className="space-y-6">
          {form.structure.rows.map((row) => (
            <div key={row.id} className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))' }}>
              {row.columns.map((column) => (
                <div key={column.id} className="space-y-5">
                  {column.blocks.filter((block) => block.type !== 'button' && isVisible(block.id)).map((block) => (
                    <PublicField key={block.id} block={block} value={values[block.id]} onChange={(value) => setValues((current) => ({ ...current, [block.id]: value }))} />
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>

        {error && <p className="mt-6 rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-300" role="alert">{error}</p>}
        <Button type="submit" disabled={submitting} className="mt-8 h-12 w-full bg-[#ff8c00] font-semibold text-black hover:bg-[#ff8c00]/90">
          {submitting ? 'Gönderiliyor…' : form.settings?.submitButtonText || form.structure.settings.submitButtonText || 'Gönder'}
        </Button>
      </form>
    </main>
  );
}

function PublicField({ block, value, onChange }: { block: FormBlock; value: unknown; onChange: (value: unknown) => void }) {
  const label = textValue(block.properties.label, block.label || 'Alan');
  const required = boolValue(block.properties.required);
  const commonClass = 'mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-white/20 focus:border-[#ff8c00] focus:ring-2 focus:ring-[#ff8c00]/20';

  if (block.type === 'heading') {
    return <h2 className="text-xl font-semibold">{textValue(block.properties.text, label)}</h2>;
  }
  if (block.type === 'text') {
    return <p className="text-sm leading-6 text-white/60">{textValue(block.properties.text, label)}</p>;
  }
  if (block.type === 'checkbox') {
    return <label className="flex cursor-pointer items-start gap-3 text-sm text-white/70"><input type="checkbox" required={required} checked={value === true} onChange={(event) => onChange(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#ff8c00]" /><span>{label}{required && <span className="ml-1 text-[#ff8c00]">*</span>}</span></label>;
  }
  if (block.type === 'select') {
    return <label className="block text-sm text-white/70">{label}{required && <span className="ml-1 text-[#ff8c00]">*</span>}<select required={required} value={textValue(value)} onChange={(event) => onChange(event.target.value)} className={commonClass}><option value="">Seçin</option>{optionsValue(block.properties.options).map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
  }
  if (block.type === 'radio') {
    return <fieldset><legend className="text-sm text-white/70">{label}{required && <span className="ml-1 text-[#ff8c00]">*</span>}</legend><div className="mt-3 space-y-2">{optionsValue(block.properties.options).map((option) => <label key={option} className="flex items-center gap-3 text-sm text-white/70"><input type="radio" name={block.id} value={option} required={required} checked={value === option} onChange={() => onChange(option)} className="accent-[#ff8c00]" />{option}</label>)}</div></fieldset>;
  }
  if (block.type === 'textarea') {
    return <label className="block text-sm text-white/70">{label}{required && <span className="ml-1 text-[#ff8c00]">*</span>}<textarea required={required} rows={Number(block.properties.rows) || 4} value={textValue(value)} placeholder={textValue(block.properties.placeholder)} onChange={(event) => onChange(event.target.value)} className={commonClass} /></label>;
  }
  return <label className="block text-sm text-white/70">{label}{required && <span className="ml-1 text-[#ff8c00]">*</span>}<input type={inputTypeValue(block.properties.inputType)} required={required} value={textValue(value)} placeholder={textValue(block.properties.placeholder)} onChange={(event) => onChange(event.target.value)} className={commonClass} /></label>;
}
