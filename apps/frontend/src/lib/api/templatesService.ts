import { httpClient } from './http-client';
import { BaseApiService } from './base-service';
import type {
  EmailTemplate,
  CreateTemplateDto,
  UpdateTemplateDto,
} from '@affexai/shared-types';

// Re-export types for convenience
export type {
  EmailTemplate,
  CreateTemplateDto,
  UpdateTemplateDto,
};

/**
 * Email Templates Service (Database-Only Architecture)
 * Handles email template operations extending BaseApiService
 */
class TemplatesService extends BaseApiService<EmailTemplate, CreateTemplateDto, UpdateTemplateDto> {
  constructor() {
    super({ endpoint: '/email-templates', useWrappedResponses: true });
  }

  /**
   * Get all templates from database
   */
  async getAll(): Promise<EmailTemplate[]> {
    return httpClient.getWrapped<EmailTemplate[]>(this.endpoint);
  }

  /**
   * Get all templates (alias for getAll for backwards compatibility)
   */
  async getAllTemplates(): Promise<EmailTemplate[]> {
    return this.getAll();
  }
}

export const templatesService = new TemplatesService();
export default templatesService;