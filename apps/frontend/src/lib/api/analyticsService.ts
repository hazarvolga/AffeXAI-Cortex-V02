import { httpClient } from "./http-client";

// Analytics Types
export interface CampaignAnalytics {
  campaignId: string;
  campaignName: string;
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  conversionCount: number;
  revenue: number;
  bounceCount: number;
  unsubscribeCount: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  sentAt: string;
  status: string;
}

export interface SubscriberGrowth {
  date: string;
  totalSubscribers: number;
  newSubscribers: number;
  unsubscribes: number;
  netGrowth: number;
  growthRate: number;
}

export interface EmailEngagement {
  date: string;
  emailsSent: number;
  uniqueOpens: number;
  uniqueClicks: number;
  openRate: number;
  clickRate: number;
  avgTimeToOpen: number; // in minutes
  avgTimeToClick: number; // in minutes
}

export interface RevenueMetrics {
  date: string;
  revenue: number;
  conversions: number;
  averageOrderValue: number;
  revenuePerEmail: number;
  conversionRate: number;
}

export interface TopPerformingCampaigns {
  campaignId: string;
  campaignName: string;
  sentAt: string;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  revenue: number;
  score: number; // Composite performance score
}

export interface AbTestSummary {
  testId: string;
  campaignName: string;
  testType: string;
  status: string;
  winnerVariant?: string;
  improvementPercentage?: number;
  confidenceLevel: number;
  createdAt: string;
  completedAt?: string;
}

export interface OverviewMetrics {
  totalCampaigns: number;
  totalSubscribers: number;
  totalEmailsSent: number;
  averageOpenRate: number;
  averageClickRate: number;
  totalRevenue: number;
  activeCampaigns: number;
  activeAbTests: number;
  subscriberGrowthRate: number;
  engagementTrend: "up" | "down" | "stable";
}

export interface AnalyticsDateRange {
  startDate: string;
  endDate: string;
  period: "day" | "week" | "month" | "quarter" | "year";
}

export interface AnalyticsDashboardData {
  overview: OverviewMetrics;
  campaignAnalytics: CampaignAnalytics[];
  subscriberGrowth: SubscriberGrowth[];
  emailEngagement: EmailEngagement[];
  revenueMetrics: RevenueMetrics[];
  topCampaigns: TopPerformingCampaigns[];
  abTestSummary: AbTestSummary[];
  dateRange: AnalyticsDateRange;
}

/**
 * Analytics Service
 * Handles email marketing analytics and reporting
 */
class AnalyticsService {
  private readonly endpoint = "/email-marketing/analytics";

  /**
   * Get complete dashboard data
   */
  async getDashboardData(
    startDate?: string,
    endDate?: string,
    period: "day" | "week" | "month" | "quarter" | "year" = "month",
  ): Promise<AnalyticsDashboardData> {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    params.append("period", period);

    return httpClient.getWrapped<AnalyticsDashboardData>(
      `${this.endpoint}/dashboard?${params.toString()}`,
    );
  }

  /**
   * Get overview metrics
   */
  async getOverviewMetrics(
    startDate?: string,
    endDate?: string,
  ): Promise<OverviewMetrics> {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    return httpClient.getWrapped<OverviewMetrics>(
      `${this.endpoint}/overview?${params.toString()}`,
    );
  }

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(
    startDate?: string,
    endDate?: string,
    limit: number = 50,
  ): Promise<CampaignAnalytics[]> {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    params.append("limit", limit.toString());

    return httpClient.getWrapped<CampaignAnalytics[]>(
      `${this.endpoint}/campaigns?${params.toString()}`,
    );
  }

  /**
   * Get subscriber growth data
   */
  async getSubscriberGrowth(
    startDate?: string,
    endDate?: string,
    period: "day" | "week" | "month" = "day",
  ): Promise<SubscriberGrowth[]> {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    params.append("period", period);

    return httpClient.getWrapped<SubscriberGrowth[]>(
      `${this.endpoint}/subscriber-growth?${params.toString()}`,
    );
  }

  /**
   * Get email engagement metrics
   */
  async getEmailEngagement(
    startDate?: string,
    endDate?: string,
    period: "day" | "week" | "month" = "day",
  ): Promise<EmailEngagement[]> {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    params.append("period", period);

    return httpClient.getWrapped<EmailEngagement[]>(
      `${this.endpoint}/engagement?${params.toString()}`,
    );
  }

  /**
   * Get revenue metrics
   */
  async getRevenueMetrics(
    startDate?: string,
    endDate?: string,
    period: "day" | "week" | "month" = "day",
  ): Promise<RevenueMetrics[]> {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    params.append("period", period);

    return httpClient.getWrapped<RevenueMetrics[]>(
      `${this.endpoint}/revenue?${params.toString()}`,
    );
  }

  /**
   * Get top performing campaigns
   */
  async getTopCampaigns(
    startDate?: string,
    endDate?: string,
    limit: number = 10,
    sortBy:
      | "openRate"
      | "clickRate"
      | "conversionRate"
      | "revenue"
      | "score" = "score",
  ): Promise<TopPerformingCampaigns[]> {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    params.append("limit", limit.toString());
    params.append("sortBy", sortBy);

    return httpClient.getWrapped<TopPerformingCampaigns[]>(
      `${this.endpoint}/top-campaigns?${params.toString()}`,
    );
  }

  /**
   * Get A/B test summary
   */
  async getAbTestSummary(
    startDate?: string,
    endDate?: string,
    limit: number = 20,
  ): Promise<AbTestSummary[]> {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    params.append("limit", limit.toString());

    return httpClient.getWrapped<AbTestSummary[]>(
      `${this.endpoint}/ab-tests?${params.toString()}`,
    );
  }

  /**
   * Get campaign performance comparison
   */
  async compareCampaigns(
    campaignIds: string[],
    metrics: string[] = ["openRate", "clickRate", "conversionRate"],
  ): Promise<{
    campaigns: CampaignAnalytics[];
    comparison: Record<string, any>;
  }> {
    return httpClient.postWrapped(`${this.endpoint}/compare-campaigns`, {
      campaignIds,
      metrics,
    });
  }

  /**
   * Export analytics data
   */
  async exportData(
    type: "campaigns" | "subscribers" | "engagement" | "revenue",
    format: "csv" | "excel" = "csv",
    startDate?: string,
    endDate?: string,
  ): Promise<Blob> {
    const params = new URLSearchParams();
    params.append("type", type);
    params.append("format", format);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const response = await httpClient
      .getAxiosInstance()
      .get(`${this.endpoint}/export?${params.toString()}`, {
        responseType: "blob",
      });

    return response.data;
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
