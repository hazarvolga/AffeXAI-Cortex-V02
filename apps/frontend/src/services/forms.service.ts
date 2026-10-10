import { httpClient } from '@/lib/api/http-client';
import type {
  FormBlock,
  FormSettings,
  FormStatus,
  FormStructure,
} from '@affexai/shared-types';

export type { FormBlock, FormSettings, FormStatus, FormStructure } from '@affexai/shared-types';

export interface FormRecord {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  structure: FormStructure;
  settings?: FormSettings | null;
  status: FormStatus;
  submissionCount: number;
  createdAt: string;
  updatedAt: string;
}

export type PublicFormRecord = Pick<
  FormRecord,
  'id' | 'name' | 'description' | 'structure' | 'settings'
>;

export interface FormSubmission {
  id: string;
  tenantId: string;
  formId: string;
  data: Record<string, unknown>;
  submittedBy?: string | null;
  submittedAt: string;
}

export interface SaveFormInput {
  name: string;
  description?: string;
  structure: FormStructure;
  settings?: FormSettings;
}

export interface SubmitFormResult {
  submissionId: string;
}

const segment = (value: string) => encodeURIComponent(value);

export const formsService = {
  list(): Promise<FormRecord[]> {
    return httpClient.getWrapped<FormRecord[]>('/forms');
  },

  get(id: string): Promise<FormRecord> {
    return httpClient.getWrapped<FormRecord>(`/forms/${segment(id)}`);
  },

  getPublished(tenantId: string, id: string): Promise<PublicFormRecord> {
    return httpClient.getWrapped<PublicFormRecord>(
      `/forms/public/${segment(tenantId)}/${segment(id)}`,
    );
  },

  create(input: SaveFormInput): Promise<FormRecord> {
    return httpClient.postWrapped<FormRecord, SaveFormInput>('/forms', input);
  },

  update(id: string, input: Partial<SaveFormInput>): Promise<FormRecord> {
    return httpClient.patchWrapped<FormRecord, Partial<SaveFormInput>>(
      `/forms/${segment(id)}`,
      input,
    );
  },

  publish(id: string): Promise<FormRecord> {
    return httpClient.postWrapped<FormRecord, Record<string, never>>(
      `/forms/${segment(id)}/publish`,
      {},
    );
  },

  unpublish(id: string): Promise<FormRecord> {
    return httpClient.postWrapped<FormRecord, Record<string, never>>(
      `/forms/${segment(id)}/unpublish`,
      {},
    );
  },

  archive(id: string): Promise<{ message: string }> {
    return httpClient.deleteWrapped<{ message: string }>(`/forms/${segment(id)}`);
  },

  submissions(id: string): Promise<FormSubmission[]> {
    return httpClient.getWrapped<FormSubmission[]>(`/forms/${segment(id)}/submissions`);
  },

  submit(
    tenantId: string,
    id: string,
    data: Record<string, unknown>,
    idempotencyKey: string,
  ): Promise<SubmitFormResult> {
    return httpClient.postWrapped<SubmitFormResult, { data: Record<string, unknown> }>(
      `/forms/public/${segment(tenantId)}/${segment(id)}/submissions`,
      { data },
      { headers: { 'Idempotency-Key': idempotencyKey } },
    );
  },
};
