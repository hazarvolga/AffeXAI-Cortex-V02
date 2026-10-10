import httpClient from './httpClient';

export interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
  content: string;
  thumbnailUrl?: string;
  isDefault: boolean;
  type: 'file_based' | 'custom';
  fileTemplateName?: string;
  variables?: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FileTemplate {
  id: string;
  name: string;
  fileName: string;
}

export interface TemplateResponse {
  dbTemplates: EmailTemplate[];
  fileTemplates: FileTemplate[];
  total: number;
}

export interface CreateTemplateDto {
  name: string;
  description?: string;
  content: string;
  thumbnailUrl?: string;
  isDefault?: boolean;
  type?: 'file_based' | 'custom';
  fileTemplateName?: string;
  variables?: Record<string, any>;
  isActive?: boolean;
}

export interface UpdateTemplateDto {
  name?: string;
  description?: string;
  content?: string;
  thumbnailUrl?: string;
  isDefault?: boolean;
  type?: 'file_based' | 'custom';
  fileTemplateName?: string;
  variables?: Record<string, any>;
  isActive?: boolean;
}

class TemplatesService {
  async getAllTemplates(): Promise<TemplateResponse> {
    return httpClient.get<TemplateResponse>('/email-templates');
  }

  async getTemplateById(id: string): Promise<EmailTemplate> {
    return httpClient.get<EmailTemplate>(`/email-templates/${id}`);
  }

  async createTemplate(templateData: CreateTemplateDto): Promise<EmailTemplate> {
    return httpClient.post<EmailTemplate>('/email-templates', templateData);
  }

  async createTemplateFromFile(
    fileTemplateName: string,
    name?: string,
  ): Promise<EmailTemplate> {
    return httpClient.post<EmailTemplate>(
      `/email-templates/from-file/${fileTemplateName}`,
      { name },
    );
  }

  async updateTemplate(
    id: string,
    templateData: UpdateTemplateDto,
  ): Promise<EmailTemplate> {
    return httpClient.patch<EmailTemplate>(`/email-templates/${id}`, templateData);
  }

  async deleteTemplate(id: string): Promise<void> {
    return httpClient.delete<void>(`/email-templates/${id}`);
  }
}

export default new TemplatesService();