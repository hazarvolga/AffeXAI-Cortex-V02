import { httpClient } from './http-client';
import { BaseApiService } from './base-service';
import type {
  EmailCampaign,
  CreateCampaignDto,
  UpdateCampaignDto,
  CampaignStats,
} from '@affexai/shared-types';

// Re-export types for convenience
export type {
  EmailCampaign,
  CreateCampaignDto,
  UpdateCampaignDto,
  CampaignStats,
};

/**
 * Email Campaigns Service
 * Handles email campaign operations extending BaseApiService
 */
class EmailCampaignsService extends BaseApiService<EmailCampaign, CreateCampaignDto, UpdateCampaignDto> {
  constructor() {
    super({ endpoint: '/email-campaigns', useWrappedResponses: true });
  }

  /**
   * Send campaign to recipients
   */
  async sendCampaign(id: string): Promise<void> {
    return httpClient.postWrapped<void>(`${this.endpoint}/${id}/send`);
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats(id: string): Promise<CampaignStats> {
    return httpClient.getWrapped<CampaignStats>(`${this.endpoint}/${id}/stats`);
  }

  /**
   * Get campaign by slug
   */
  async getBySlug(slug: string): Promise<EmailCampaign> {
    return httpClient.getWrapped<EmailCampaign>(`${this.endpoint}/by-slug/${slug}`);
  }

  /**
   * Schedule a campaign for future sending
   */
  async scheduleCampaign(id: string, scheduledAt: string): Promise<EmailCampaign> {
    return httpClient.postWrapped<EmailCampaign>(`${this.endpoint}/${id}/schedule`, {
      scheduledAt,
    });
  }

  /**
   * Cancel a scheduled campaign
   */
  async cancelSchedule(id: string): Promise<EmailCampaign> {
    return httpClient.postWrapped<EmailCampaign>(`${this.endpoint}/${id}/cancel-schedule`);
  }

  /**
   * Reschedule a campaign
   */
  async rescheduleCampaign(id: string, scheduledAt: string): Promise<EmailCampaign> {
    return httpClient.postWrapped<EmailCampaign>(`${this.endpoint}/${id}/reschedule`, {
      scheduledAt,
    });
  }

  /**
   * Get all scheduled campaigns
   */
  async getScheduledCampaigns(): Promise<EmailCampaign[]> {
    return httpClient.getWrapped<EmailCampaign[]>(`${this.endpoint}/scheduled/list`);
  }

  /**
   * Get scheduling statistics
   */
  async getSchedulingStats(): Promise<{
    totalScheduled: number;
    readyToSend: number;
    upcomingToday: number;
    upcomingThisWeek: number;
  }> {
    return httpClient.getWrapped(`${this.endpoint}/scheduled/stats`);
  }
}

export const emailCampaignsService = new EmailCampaignsService();
export default emailCampaignsService;