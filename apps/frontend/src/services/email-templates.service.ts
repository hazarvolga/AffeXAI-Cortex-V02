import { httpClient } from '@/lib/api/http-client';

export interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
  content?: string;
  structure?: {
    rows: any[];
    settings: {
      backgroundColor?: string;
      contentWidth?: string;
      fonts?: string[];
    };
  };
  compiledHtml?: string;
  compiledMjml?: string;
  type: string;
  isActive: boolean;
  isEditable: boolean;
  version: number;
  createdFrom?: string;
  fileTemplateName?: string;
  thumbnailUrl?: string;
  variables?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateDto {
  name: string;
  description?: string;
  structure: any;
  type?: string;
  isActive?: boolean;
}

export interface UpdateTemplateDto {
  name?: string;
  description?: string;
  structure?: any;
  isActive?: boolean;
}

export interface CloneTemplateDto {
  newName?: string;
  newDescription?: string;
  makeEditable?: boolean;
}

export const EmailTemplatesService = {
  /**
   * Get all templates (Database-only architecture)
   */
  async getTemplates(): Promise<EmailTemplate[]> {
    // API returns { success: true, data: [...] } format - use getWrapped to unwrap
    return httpClient.getWrapped<EmailTemplate[]>('/email-templates');
  },

  /**
   * Get single template by ID
   */
  async getTemplate(id: string): Promise<EmailTemplate> {
    return httpClient.get<EmailTemplate>(`/email-templates/${id}`);
  },

  /**
   * Create new template
   */
  async createTemplate(data: CreateTemplateDto): Promise<EmailTemplate> {
    return httpClient.post<EmailTemplate>('/email-templates', data);
  },

  /**
   * Update template
   */
  async updateTemplate(id: string, data: UpdateTemplateDto): Promise<EmailTemplate> {
    return httpClient.patch<EmailTemplate>(`/email-templates/${id}`, data);
  },

  /**
   * Delete template
   */
  async deleteTemplate(id: string): Promise<void> {
    await httpClient.delete(`/email-templates/${id}`);
  },

  /**
   * Clone template
   */
  async cloneTemplate(id: string, data: CloneTemplateDto): Promise<EmailTemplate> {
    return httpClient.post<EmailTemplate>(`/email-templates/${id}/clone`, data);
  },

  /**
   * Render template to HTML/MJML
   */
  async renderTemplate(id: string): Promise<{ html: string; mjml: string }> {
    return httpClient.get<{ html: string; mjml: string }>(`/email-templates/${id}/render`);
  },

  /**
   * Preview template (Database-only)
   */
  async previewTemplate(id: string): Promise<{ content: string }> {
    return httpClient.get<{ content: string }>(`/email-templates/${id}/preview`);
  },
};
