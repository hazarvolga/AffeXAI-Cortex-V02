
import { httpClient } from './http-client';
import { Group, Segment } from '@affexai/shared-types';

export interface RecipientStats {
  totalActiveSubscribers: number;
  groups: Group[];
  segments: Segment[];
}

class EmailMarketingStatsService {
  private basePath = '/api/email-marketing/stats';

  async getRecipientStats(): Promise<RecipientStats> {
    try {
      const response = await httpClient.getWrapped<RecipientStats>(`${this.basePath}/recipients`);
      return response;
    } catch (error) {
      // Fallback to fetching data separately if stats endpoint doesn't exist
      console.warn('Stats endpoint not available, fetching data separately');

      // Import services dynamically to avoid circular dependencies
      const { default: subscribersService } = await import('./subscribersService');
      const { default: groupsService } = await import('./groupsService');
      const { default: segmentsService } = await import('./segmentsService');

      const [subscribers, groups, segments] = await Promise.all([
        subscribersService.getAll().catch(() => []),
        groupsService.getAll().catch(() => []),
        segmentsService.getAll().catch(() => [])
      ]);

      return {
        totalActiveSubscribers: Array.isArray(subscribers)
          ? subscribers.filter((s: any) => s.status === 'subscribed').length
          : 0,
        groups: Array.isArray(groups) ? groups : [],
        segments: Array.isArray(segments) ? segments : []
      };
    }
  }

  async getCampaignStats(campaignId: string) {
    const response = await httpClient.get<ApiResponse<any>>(`${this.basePath}/campaigns/${campaignId}`);
    return response.data;
  }

  async getOverallStats(startDate?: string, endDate?: string) {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await httpClient.get<ApiResponse<any>>(`${this.basePath}/overall`, { params });
    return response.data;
  }
}

import { ApiResponse } from '@affexai/shared-types';
const emailMarketingStatsService = new EmailMarketingStatsService();
export default emailMarketingStatsService;
