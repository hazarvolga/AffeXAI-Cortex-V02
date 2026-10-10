import { httpClient } from './http-client';

// ✅ OPTIMIZATION: Shared interfaces with backend (import from shared types folder in production)
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
  avgTimeToOpen: number;
  avgTimeToClick: number;
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
  score: number;
}

export interface AbTestSummary {
  testId: string;
  campaignName: string;
  testType: 'subject' | 'content' | 'send_time';
  status: 'running' | 'completed' | 'paused';
  winnerVariant?: 'A' | 'B';
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
  engagementTrend: 'up' | 'down' | 'stable';
}

export interface AnalyticsDateRange {
  startDate: string;
  endDate: string;
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
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

export interface ComparisonResult {
  campaigns: CampaignAnalytics[];
  comparison: Record<string, { average: number; min: number; max: number }>;
}

// ✅ OPTIMIZATION: Simple in-memory cache with TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class AnalyticsCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > this.TTL;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * Analytics Service
 * Handles all analytics and reporting API calls with caching and retry logic
 */
class AnalyticsService {
  private readonly endpoint = '/email-marketing/analytics';
  private cache = new AnalyticsCache();

  /**
   * ✅ OPTIMIZATION: Retry logic for failed requests
   */
  private async fetchWithRetry<T>(
    url: string,
    retries: number = 2,
    delay: number = 1000,
  ): Promise<T> {
    try {
      return await httpClient.getWrapped<T>(url);
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry<T>(url, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  /**
   * ✅ OPTIMIZATION: Generic cached fetch method
   */
  private async cachedFetch<T>(
    cacheKey: string,
    url: string,
    skipCache: boolean = false,
  ): Promise<T> {
    if (!skipCache) {
      const cached = this.cache.get<T>(cacheKey);
      if (cached) return cached;
    }

    const data = await this.fetchWithRetry<T>(url);
    this.cache.set(cacheKey, data);
    return data;
  }

  /**
   * Get complete dashboard data
   */
  async getDashboardData(
    startDate?: string,
    endDate?: string,
    period: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'month',
    skipCache: boolean = false,
  ): Promise<AnalyticsDashboardData> {
    const params = new URLSearchParams({
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      period,
    });

    const cacheKey = `dashboard:${params.toString()}`;
    return this.cachedFetch<AnalyticsDashboardData>(
      cacheKey,
      `${this.endpoint}/dashboard?${params}`,
      skipCache,
    );
  }

  /**
   * Get overview metrics
   */
  async getOverviewMetrics(
    startDate?: string,
    endDate?: string,
    skipCache: boolean = false,
  ): Promise<OverviewMetrics> {
    const params = new URLSearchParams({
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    });

    const cacheKey = `overview:${params.toString()}`;
    return this.cachedFetch<OverviewMetrics>(
      cacheKey,
      `${this.endpoint}/overview?${params}`,
      skipCache,
    );
  }

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(
    startDate?: string,
    endDate?: string,
    limit: number = 50,
    skipCache: boolean = false,
  ): Promise<CampaignAnalytics[]> {
    const params = new URLSearchParams({
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      limit: limit.toString(),
    });

    const cacheKey = `campaigns:${params.toString()}`;
    return this.cachedFetch<CampaignAnalytics[]>(
      cacheKey,
      `${this.endpoint}/campaigns?${params}`,
      skipCache,
    );
  }

  /**
   * Get subscriber growth data
   */
  async getSubscriberGrowth(
    startDate?: string,
    endDate?: string,
    period: 'day' | 'week' | 'month' = 'day',
    skipCache: boolean = false,
  ): Promise<SubscriberGrowth[]> {
    const params = new URLSearchParams({
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      period,
    });

    const cacheKey = `subscriber-growth:${params.toString()}`;
    return this.cachedFetch<SubscriberGrowth[]>(
      cacheKey,
      `${this.endpoint}/subscriber-growth?${params}`,
      skipCache,
    );
  }

  /**
   * Get email engagement data
   */
  async getEmailEngagement(
    startDate?: string,
    endDate?: string,
    period: 'day' | 'week' | 'month' = 'day',
    skipCache: boolean = false,
  ): Promise<EmailEngagement[]> {
    const params = new URLSearchParams({
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      period,
    });

    const cacheKey = `engagement:${params.toString()}`;
    return this.cachedFetch<EmailEngagement[]>(
      cacheKey,
      `${this.endpoint}/engagement?${params}`,
      skipCache,
    );
  }

  /**
   * Get revenue metrics
   */
  async getRevenueMetrics(
    startDate?: string,
    endDate?: string,
    period: 'day' | 'week' | 'month' = 'day',
    skipCache: boolean = false,
  ): Promise<RevenueMetrics[]> {
    const params = new URLSearchParams({
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      period,
    });

    const cacheKey = `revenue:${params.toString()}`;
    return this.cachedFetch<RevenueMetrics[]>(
      cacheKey,
      `${this.endpoint}/revenue?${params}`,
      skipCache,
    );
  }

  /**
   * Get top performing campaigns
   */
  async getTopCampaigns(
    startDate?: string,
    endDate?: string,
    limit: number = 10,
    sortBy: 'openRate' | 'clickRate' | 'conversionRate' | 'revenue' | 'score' = 'score',
    skipCache: boolean = false,
  ): Promise<TopPerformingCampaigns[]> {
    const params = new URLSearchParams({
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      limit: limit.toString(),
      sortBy,
    });

    const cacheKey = `top-campaigns:${params.toString()}`;
    return this.cachedFetch<TopPerformingCampaigns[]>(
      cacheKey,
      `${this.endpoint}/top-campaigns?${params}`,
      skipCache,
    );
  }

  /**
   * Get A/B test summary
   */
  async getAbTestSummary(
    startDate?: string,
    endDate?: string,
    limit: number = 20,
    skipCache: boolean = false,
  ): Promise<AbTestSummary[]> {
    const params = new URLSearchParams({
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      limit: limit.toString(),
    });

    const cacheKey = `ab-tests:${params.toString()}`;
    return this.cachedFetch<AbTestSummary[]>(
      cacheKey,
      `${this.endpoint}/ab-tests?${params}`,
      skipCache,
    );
  }

  /**
   * Compare multiple campaigns
   */
  async compareCampaigns(
    campaignIds: string[],
    metrics: string[],
  ): Promise<ComparisonResult> {
    return httpClient.postWrapped<ComparisonResult>(
      `${this.endpoint}/compare-campaigns`,
      { campaignIds, metrics },
    );
  }

  /**
   * Export analytics data
   */
  async exportData(
    type: 'campaigns' | 'subscribers' | 'engagement' | 'revenue',
    format: 'csv' | 'excel' = 'csv',
    startDate?: string,
    endDate?: string,
  ): Promise<Blob> {
    const params = new URLSearchParams({
      type,
      format,
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    });

    const response = await fetch(`/api${this.endpoint}/export?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export data');
    }

    return response.blob();
  }

  /**
   * ✅ OPTIMIZATION: Download exported data
   */
  async downloadExport(
    type: 'campaigns' | 'subscribers' | 'engagement' | 'revenue',
    format: 'csv' | 'excel' = 'csv',
    startDate?: string,
    endDate?: string,
  ): Promise<void> {
    const blob = await this.exportData(type, format, startDate, endDate);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-analytics-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get debug data status
   */
  async getDataStatus(): Promise<{
    campaigns: number;
    subscribers: number;
    emailLogs: number;
    recentCampaigns: any[];
  }> {
    return httpClient.getWrapped(`${this.endpoint}/debug/data-status`);
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
