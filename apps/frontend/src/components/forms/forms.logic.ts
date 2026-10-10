import type { FormRecord, FormStatus } from '@/services/forms.service';

export function filterForms(
  forms: FormRecord[],
  query: string,
  status: FormStatus | 'all',
): FormRecord[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return forms.filter((form) => {
    const matchesStatus = status === 'all' || form.status === status;
    const matchesQuery =
      normalizedQuery.length === 0 ||
      form.name.toLocaleLowerCase().includes(normalizedQuery) ||
      (form.description ?? '').toLocaleLowerCase().includes(normalizedQuery);
    return matchesStatus && matchesQuery;
  });
}

export function createSubmissionAttemptKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `form_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function resolveSafeFormRedirect(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0 || value.length > 2048) return null;
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : null;
  } catch {
    return null;
  }
}
