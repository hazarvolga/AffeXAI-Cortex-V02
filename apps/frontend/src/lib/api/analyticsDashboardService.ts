import { BaseApiService } from './base-service';

export enum AnalyticsTimeRange {
    TODAY = 'today',
    YESTERDAY = 'yesterday',
    LAST_7_DAYS = 'last7days',
    LAST_30_DAYS = 'last30days',
    LAST_90_DAYS = 'last90days',
    CUSTOM = 'custom',
}

export interface AnalyticsQuery {
    timeRange: AnalyticsTimeRange;
    customStartDate?: string;
    customEndDate?: string;
    pageUrl?: string;
    componentType?: string;
    deviceTypes?: string[];
    userSegment?: string;
}

export interface DashboardData {
    overview: {
        totalViews: number;
        totalInteractions: number;
        averageEngagementTime: number;
        conversionRate: number;
        changeFromPrevious: {
            views: number;
            interactions: number;
            engagementTime: number;
            conversionRate: number;
        };
    };
    topComponents: Array<{
        componentId: string;
        componentType: string;
        pageUrl: string;
        interactionRate: number;
        conversions: number;
    }>;
    timeline: Array<{
        timestamp: string;
        views: number;
        interactions: number;
        conversions: number;
    }>;
    deviceDistribution: {
        mobile: number;
        tablet: number;
        desktop: number;
    };
    recentSessions: any[];
    socialSentiment?: {
        score: number;
        trend: 'up' | 'down' | 'stable';
        recentPosts: number;
    };
    emailEngagement?: {
        openRate: number;
        atRiskSubscribers: number;
    };
    neuralInsights?: Array<{
        type: 'opportunity' | 'warning' | 'trend';
        title: string;
        impact: 'high' | 'medium' | 'low';
    }>;
    quotaUsage?: {
        remaining: number;
        limit: number;
        usedPercentage: number;
    };
}

class AnalyticsDashboardService extends BaseApiService<DashboardData> {
    constructor() {
        super({ endpoint: '/analytics' });
    }

    async getDashboardData(query: AnalyticsQuery): Promise<DashboardData> {
        // Construct query string manually or assume base service/axios handles object params
        // Our BaseApiService usually handles object params if passed correctly to client
        return this.client.get<DashboardData>(`${this.endpoint}/dashboard`, { params: query });
    }
}

export const analyticsDashboardService = new AnalyticsDashboardService();
