export type FormStatus = 'draft' | 'published' | 'archived';

export type FormBlockType =
  | 'input'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'heading'
  | 'text'
  | 'button';

export interface FormBlock {
  id: string;
  type: FormBlockType;
  label?: string;
  properties: Record<string, unknown>;
  styles: Record<string, unknown>;
}

export interface FormColumn {
  id: string;
  width: string;
  blocks: FormBlock[];
}

export interface FormRow {
  id: string;
  type: 'section';
  columns: FormColumn[];
  settings: Record<string, unknown>;
}

export interface FormStructure {
  rows: FormRow[];
  settings: {
    theme?: string;
    submitButtonText?: string;
    width?: string;
  };
  logicConfig?: {
    rules: Array<{
      blockId: string;
      conditions: Array<{
        fieldId: string;
        operator: 'equals' | 'not_equals' | 'contains' | 'empty' | 'not_empty';
        value: unknown;
      }>;
      action: 'show' | 'hide';
    }>;
  };
}

export interface FormSettings {
  theme?: string;
  submitButtonText?: string;
  successMessage?: string;
  redirectUrl?: string;
  notificationEmail?: string;
  crmLeadCapture?: {
    enabled: boolean;
    emailField?: string;
    phoneField?: string;
    companyField?: string;
    contactNameField?: string;
  };
}

export type PublicFormSettings = Pick<
  FormSettings,
  'theme' | 'submitButtonText' | 'successMessage' | 'redirectUrl'
>;

export interface PublishedFormContract {
  id: string;
  name: string;
  description: string | null;
  structure: FormStructure;
  settings: PublicFormSettings;
}

export interface FormSubmissionPayload {
  data: Record<string, unknown>;
}
