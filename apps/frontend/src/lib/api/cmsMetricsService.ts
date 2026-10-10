import { httpClient } from './http-client';

export interface PageView {
  pageId: string;
  pageTitle: string;
  viewCount: number;
  uniqueVisitors: number;
}

export interface LinkClick {
  linkUrl: string;
  linkText: string;
  clickCount: number;
  pageId?: string;
}

export interface CategoryEngagement {
  category: string;
  views: number;
  clicks: number;
}

export interface MetricsSummary {
  totalViews: number;
  uniqueVisitors: number;
  totalClicks: number;
  uniqueLinks: number;
  edits: number;
  publishes: number;
}

export interface CmsMetrics {
  summary: MetricsSummary;
  topPages: PageView[];
  topLinks: LinkClick[];
  categoryEngagement: CategoryEngagement[];
}

/**
 * CMS Metrics Service
 * Tracks page views, link clicks, and content activity
 */
class CmsMetricsService {
  private readonly endpoint = '/cms-metrics';

  async getMetrics(
    period: 'day' | 'week' | 'month' = 'week',
  ): Promise<CmsMetrics> {
    return httpClient.getWrapped<CmsMetrics>(
      `${this.endpoint}?period=${period}`,
    );
  }

  async trackPageView(pageId: string, pageTitle: string): Promise<void> {
    try {
      await httpClient.postWrapped(`${this.endpoint}/view`, {
        pageId,
        pageTitle,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  }

  async trackLinkClick(
    linkUrl: string,
    linkText: string,
    pageId?: string,
  ): Promise<void> {
    try {
      await httpClient.postWrapped(`${this.endpoint}/click`, {
        linkUrl,
        linkText,
        pageId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to track link click:', error);
    }
  }

  async trackActivity(
    action: 'edit' | 'publish' | 'draft' | 'unpublish',
    pageId: string,
  ): Promise<void> {
    try {
      await httpClient.postWrapped(`${this.endpoint}/activity`, {
        action,
        pageId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to track activity:', error);
    }
  }
}

export const cmsMetricsService = new CmsMetricsService();
