import { httpClient } from './http-client';

// A/B Test Types
export interface AbTestVariant {
  id: string;
  label: string;
  subject?: string;
  content?: string;
  fromName?: string;
  sendTimeOffset?: number;
  splitPercentage: number;
  status: 'draft' | 'testing' | 'winner' | 'loser';
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  conversionCount: number;
  revenue: number;
  bounceCount: number;
  unsubscribeCount: number;
  openRate?: number;
  clickRate?: number;
  conversionRate?: number;
}

export interface AbTestCampaign {
  id: string;
  name: string;
  testType: 'subject' | 'content' | 'send_time' | 'from_name' | 'combined';
  winnerCriteria: 'open_rate' | 'click_rate' | 'conversion_rate' | 'revenue';
  testStatus: 'draft' | 'testing' | 'completed';
  autoSelectWinner: boolean;
  testDuration: number;
  confidenceLevel: number;
  minSampleSize: number;
  winnerSelectionDate?: string;
  selectedWinnerId?: string;
  sentAt?: string;
  variants: AbTestVariant[];
}

export interface CreateAbTestDto {
  campaignId: string;
  testType: 'subject' | 'content' | 'send_time' | 'from_name' | 'combined';
  winnerCriteria: 'open_rate' | 'click_rate' | 'conversion_rate' | 'revenue';
  autoSelectWinner: boolean;
  testDuration: number;
  confidenceLevel: number;
  minSampleSize: number;
  variants: Array<{
    label: string;
    subject?: string;
    content?: string;
    fromName?: string;
    sendTimeOffset?: number;
    splitPercentage: number;
  }>;
}

export interface UpdateVariantDto {
  subject?: string;
  content?: string;
  fromName?: string;
  splitPercentage?: number;
}

export interface SendAbTestDto {
  campaignId: string;
  subscriberIds?: string[];
  segmentIds?: string[];
}

export interface AbTestResults {
  campaign: {
    id: string;
    name: string;
    testType: string;
    winnerCriteria: string;
    testStatus: string;
    autoSelectWinner: boolean;
    winnerSelectionDate?: string;
    selectedWinnerId?: string;
    testDuration: number;
    confidenceLevel: number;
    minSampleSize: number;
    sentAt?: string;
  };
  variants: Array<{
    id: string;
    label: string;
    status: string;
    sentCount: number;
    openedCount: number;
    clickedCount: number;
    conversionCount: number;
    revenue: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  }>;
  statistics: {
    isSignificant: boolean;
    pValue: number;
    confidenceLevel: number;
    chiSquare: number;
    winner?: string;
    message: string;
    hasMinimumSample: boolean;
    canDeclareWinner: boolean;
    testDurationElapsed: boolean;
  };
  confidenceIntervals?: Array<{
    label: string;
    interval: {
      lower: number;
      upper: number;
      margin: number;
    };
  }>;
}

/**
 * A/B Test Service
 * Handles A/B testing operations for email campaigns
 */
class AbTestService {
  private readonly endpoint = '/email-marketing/ab-test';

  /**
   * Create a new A/B test for a campaign
   */
  async createAbTest(data: CreateAbTestDto): Promise<AbTestCampaign> {
    return httpClient.postWrapped<AbTestCampaign>(this.endpoint, data);
  }

  /**
   * Get A/B test results with statistical analysis
   */
  async getResults(campaignId: string): Promise<AbTestResults> {
    return httpClient.getWrapped<AbTestResults>(`${this.endpoint}/${campaignId}/results`);
  }

  /**
   * Get A/B test summary
   */
  async getSummary(campaignId: string): Promise<AbTestCampaign> {
    return httpClient.getWrapped<AbTestCampaign>(`${this.endpoint}/${campaignId}/summary`);
  }

  /**
   * Update a variant's content
   */
  async updateVariant(
    campaignId: string,
    variantId: string,
    data: UpdateVariantDto
  ): Promise<AbTestVariant> {
    return httpClient.putWrapped<AbTestVariant>(
      `${this.endpoint}/${campaignId}/variants/${variantId}`,
      data
    );
  }

  /**
   * Send A/B test (start the test)
   */
  async sendAbTest(data: SendAbTestDto): Promise<{
    message: string;
    totalRecipients: number;
    distributions: Array<{
      variantLabel: string;
      variantId: string;
      recipientCount: number;
      splitPercentage: number;
    }>;
    campaign: {
      id: string;
      name: string;
      testStatus: string;
      sentAt: string;
    };
  }> {
    return httpClient.postWrapped(`${this.endpoint}/${data.campaignId}/send`, data);
  }

  /**
   * Manually select winner
   */
  async selectWinner(campaignId: string, variantId: string): Promise<AbTestCampaign> {
    return httpClient.postWrapped<AbTestCampaign>(
      `${this.endpoint}/${campaignId}/select-winner`,
      { variantId }
    );
  }

  /**
   * Delete A/B test
   */
  async deleteAbTest(campaignId: string): Promise<void> {
    return httpClient.deleteWrapped<void>(`${this.endpoint}/${campaignId}`);
  }
}

export const abTestService = new AbTestService();
export default abTestService;