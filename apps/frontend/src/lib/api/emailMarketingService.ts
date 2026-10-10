import { httpClient } from './http-client';
import { BaseApiService } from './base-service';
import type {
  EmailCampaign,
  CreateCampaignDto,
  UpdateCampaignDto,
  Subscriber,
  CreateSubscriberDto,
  UpdateSubscriberDto,
  EmailTemplate,
  CreateTemplateDto,
  UpdateTemplateDto,
} from '@affexai/shared-types';

// Re-export types for convenience
export type {
  EmailCampaign as Campaign,
  CreateCampaignDto,
  UpdateCampaignDto,
  Subscriber,
  CreateSubscriberDto,
  UpdateSubscriberDto,
  EmailTemplate,
  CreateTemplateDto as CreateEmailTemplateDto,
  UpdateTemplateDto as UpdateEmailTemplateDto,
};

/**
 * Email Marketing Service
 * Handles campaigns, subscribers, and email templates
 */
class EmailMarketingService extends BaseApiService<EmailCampaign, CreateCampaignDto, UpdateCampaignDto> {
  constructor() {
    super({ endpoint: '/email-campaigns', useWrappedResponses: true });
  }

  /**
   * Get all campaigns
   */
  async getCampaigns(): Promise<EmailCampaign[]> {
    return this.getAll();
  }

  /**
   * Send a campaign
   */
  async sendCampaign(campaignId: string): Promise<EmailCampaign> {
    return httpClient.postWrapped<EmailCampaign>(
      `${this.endpoint}/${campaignId}/send`,
      undefined
    );
  }

  /**
   * Schedule a campaign
   */
  async scheduleCampaign(campaignId: string, scheduledDate: string): Promise<EmailCampaign> {
    return httpClient.postWrapped<EmailCampaign>(
      `${this.endpoint}/${campaignId}/schedule`,
      { scheduledDate }
    );
  }

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(campaignId: string): Promise<any> {
    return httpClient.getWrapped<any>(`${this.endpoint}/${campaignId}/stats`);
  }

  // Subscribers methods
  async getSubscribers(): Promise<Subscriber[]> {
    return httpClient.getWrapped<Subscriber[]>('/email-marketing/subscribers');
  }

  async createSubscriber(data: CreateSubscriberDto): Promise<Subscriber> {
    return httpClient.postWrapped<Subscriber>(
      '/email-marketing/subscribers',
      data
    );
  }

  async updateSubscriber(id: string, data: UpdateSubscriberDto): Promise<Subscriber> {
    return httpClient.patchWrapped<Subscriber>(
      `/email-marketing/subscribers/${id}`,
      data
    );
  }

  async deleteSubscriber(id: string): Promise<void> {
    return httpClient.delete(`/email-marketing/subscribers/${id}`);
  }

  // Templates methods
  async getTemplates(): Promise<EmailTemplate[]> {
    return httpClient.getWrapped<EmailTemplate[]>('/email-templates');
  }

  async getTemplateById(id: string): Promise<EmailTemplate> {
    return httpClient.getWrapped<EmailTemplate>(`/email-templates/${id}`);
  }

  async createTemplate(data: CreateTemplateDto): Promise<EmailTemplate> {
    return httpClient.postWrapped<EmailTemplate>(
      '/email-templates',
      data
    );
  }

  async updateTemplate(id: string, data: UpdateTemplateDto): Promise<EmailTemplate> {
    return httpClient.patchWrapped<EmailTemplate>(
      `/email-templates/${id}`,
      data
    );
  }

  async deleteTemplate(id: string): Promise<void> {
    return httpClient.delete(`/email-marketing/templates/${id}`);
  }
}

export const emailMarketingService = new EmailMarketingService();
export default emailMarketingService;
