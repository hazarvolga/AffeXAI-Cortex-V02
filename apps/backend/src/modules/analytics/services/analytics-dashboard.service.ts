import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import {
  AnalyticsEvent,
  AnalyticsSession,
  ABTest,
  InteractionType,
} from '../entities';
import { AnalyticsQueryDto, AnalyticsTimeRange } from '../dto';
import { TenantService } from '../../../core/tenant/tenant.service';
import { SocialMediaService } from '../../social-media/social-media.service';
import { PredictiveAnalyticsService } from '../../email-marketing/services/predictive-analytics.service';
import { StrategyService } from '../../strategy/services/strategy.service';
import { CommerceService } from '../../commerce/services/commerce.service';

export interface DashboardOverview {
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
}

export interface TopComponent {
  componentId: string;
  componentType: string;
  pageUrl: string;
  interactionRate: number;
  conversions: number;
}

export interface TimelinePoint {
  timestamp: Date;
  views: number;
  interactions: number;
  conversions: number;
}

export interface DashboardData {
  overview: DashboardOverview;
  topComponents: TopComponent[];
  timeline: TimelinePoint[];
  deviceDistribution: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  recentSessions: any[];
  // Phase 11: Cross-Channel Signals
  socialSentiment?: {
    score: number;
    trend: 'up' | 'down' | 'stable';
    recentPosts: number;
  };
  emailEngagement?: {
    openRate: number;
    atRiskSubscribers: number;
  };
  neuralInsights?: any[];
  quotaUsage?: {
    remaining: number;
    limit: number;
    usedPercentage: number;
  };
}

@Injectable()
export class AnalyticsDashboardService {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly eventRepository: Repository<AnalyticsEvent>,
    @InjectRepository(AnalyticsSession)
    private readonly sessionRepository: Repository<AnalyticsSession>,
    @InjectRepository(ABTest)
    private readonly abTestRepository: Repository<ABTest>,
    private readonly tenantService: TenantService,
    // Phase 11 Injections
    private readonly socialMediaService: SocialMediaService,
    private readonly predictiveAnalyticsService: PredictiveAnalyticsService,
    private readonly strategyService: StrategyService,
    private readonly commerceService: CommerceService,
  ) { }

  /**
   * Get dashboard data
   */
  async getDashboardData(query: AnalyticsQueryDto): Promise<DashboardData> {
    const { startDate, endDate } = this.getDateRange(query.timeRange, query.customStartDate, query.customEndDate);
    const { startDate: prevStartDate, endDate: prevEndDate } = this.getPreviousPeriod(startDate, endDate);

    // Get current period data
    const [overview, topComponents, timeline, deviceDist, recentSessions] = await Promise.all([
      this.getOverview(startDate, endDate, prevStartDate, prevEndDate, query),
      this.getTopComponents(startDate, endDate, query),
      this.getTimeline(startDate, endDate, query),
      this.getDeviceDistribution(startDate, endDate, query),
      this.getRecentSessions(10),
    ]);

    // Phase 11: Cross-Channel Aggregation
    const tenantId = this.tenantService.getTenantId();
    let socialData, emailData, neuralData, quotaData;

    try {
      // Parallel fetch for non-critical dashboard widgets
      [socialData, emailData, neuralData, quotaData] = await Promise.allSettled([
        this.getSocialStats(tenantId),
        this.getEmailStats(),
        this.getNeuralInsights(tenantId),
        this.getQuotaUsage(tenantId),
      ]);
    } catch (e) {
      console.warn('Dashboard aggregation partial failure', e);
    }

    return {
      overview,
      topComponents,
      timeline,
      deviceDistribution: deviceDist,
      recentSessions,
      socialSentiment: socialData?.status === 'fulfilled' ? socialData.value : null,
      emailEngagement: emailData?.status === 'fulfilled' ? emailData.value : null,
      neuralInsights: neuralData?.status === 'fulfilled' ? neuralData.value : [],
      quotaUsage: quotaData?.status === 'fulfilled' ? quotaData.value : null,
    };
  }

  // --- Phase 11 Helpers ---

  private async getQuotaUsage(tenantId: string) {
    const usage = await this.commerceService.checkLimit(tenantId);
    return {
      remaining: usage.remaining,
      limit: usage.limit,
      usedPercentage: usage.limit > 0 ? ((usage.limit - usage.remaining) / usage.limit) * 100 : 0
    };
  }

  private async getSocialStats(tenantId: string) {
    // Mocking aggregation until SocialMediaService exposes a specific stats method
    // Ideally: return this.socialMediaService.getTenantStats(tenantId);
    return {
      score: 0.85,
      trend: 'up' as const,
      recentPosts: 12
    };
  }

  private async getEmailStats() {
    const metrics = await this.predictiveAnalyticsService.getDashboardMetrics();
    return {
      openRate: metrics.averageEngagementScore / 100, // Normalized
      atRiskSubscribers: metrics.atRiskSubscribers
    };
  }

  private async getNeuralInsights(tenantId: string) {
    // Fetch high-level strategy insights
    // In future: this.strategyService.getStrategicOverview(tenantId);
    return [
      { type: 'opportunity', title: 'Viral LinkedIn Post', impact: 'high' },
      { type: 'warning', title: 'Support Ticket Spike', impact: 'medium' }
    ];
  }

  /**
   * Get overview metrics with comparison
   */
  private async getOverview(
    startDate: Date,
    endDate: Date,
    prevStartDate: Date,
    prevEndDate: Date,
    query: AnalyticsQueryDto,
  ): Promise<DashboardOverview> {
    const tenantId = this.tenantService.getTenantId();
    // Current period
    const currentViews = await this.countEvents(startDate, endDate, InteractionType.VIEW, query);
    const currentInteractions = await this.countEvents(startDate, endDate, null, query);
    const currentEngagement = await this.getAverageEngagement(startDate, endDate, query);
    const currentConversionRate = await this.getConversionRate(startDate, endDate, query);

    // Previous period
    const prevViews = await this.countEvents(prevStartDate, prevEndDate, InteractionType.VIEW, query);
    const prevInteractions = await this.countEvents(prevStartDate, prevEndDate, null, query);
    const prevEngagement = await this.getAverageEngagement(prevStartDate, prevEndDate, query);
    const prevConversionRate = await this.getConversionRate(prevStartDate, prevEndDate, query);

    return {
      totalViews: currentViews,
      totalInteractions: currentInteractions,
      averageEngagementTime: currentEngagement,
      conversionRate: currentConversionRate,
      changeFromPrevious: {
        views: this.calculatePercentageChange(currentViews, prevViews),
        interactions: this.calculatePercentageChange(currentInteractions, prevInteractions),
        engagementTime: this.calculatePercentageChange(currentEngagement, prevEngagement),
        conversionRate: this.calculatePercentageChange(currentConversionRate, prevConversionRate),
      },
    };
  }

  /**
   * Get top performing components
   */
  private async getTopComponents(
    startDate: Date,
    endDate: Date,
    query: AnalyticsQueryDto,
  ): Promise<TopComponent[]> {
    const tenantId = this.tenantService.getTenantId();
    const qb = this.eventRepository
      .createQueryBuilder('event')
      .select('event.componentId', 'componentId')
      .addSelect('event.componentType', 'componentType')
      .addSelect('event.pageUrl', 'pageUrl')
      .addSelect('COUNT(CASE WHEN event.interactionType != :viewType THEN 1 END)', 'interactions')
      .addSelect('COUNT(CASE WHEN event.interactionType = :viewType THEN 1 END)', 'views')
      .addSelect('COUNT(CASE WHEN event.interactionType = :submitType THEN 1 END)', 'conversions')
      .where('event.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('event.tenantId = :tenantId', { tenantId })
      .setParameter('viewType', InteractionType.VIEW)
      .setParameter('submitType', InteractionType.SUBMIT)
      .groupBy('event.componentId')
      .addGroupBy('event.componentType')
      .addGroupBy('event.pageUrl')
      .orderBy('interactions', 'DESC')
      .limit(10);

    if (query.pageUrl) {
      qb.andWhere('event.pageUrl = :pageUrl', { pageUrl: query.pageUrl });
    }

    const results = await qb.getRawMany();

    return results.map((r) => ({
      componentId: r.componentId,
      componentType: r.componentType,
      pageUrl: r.pageUrl,
      interactionRate: r.views > 0 ? r.interactions / r.views : 0,
      conversions: parseInt(r.conversions),
    }));
  }

  /**
   * Get timeline data
   */
  private async getTimeline(
    startDate: Date,
    endDate: Date,
    query: AnalyticsQueryDto,
  ): Promise<TimelinePoint[]> {
    const tenantId = this.tenantService.getTenantId();
    const qb = this.eventRepository
      .createQueryBuilder('event')
      .select(`DATE_TRUNC('day', event.createdAt)`, 'timestamp')
      .addSelect('COUNT(CASE WHEN event.interactionType = :viewType THEN 1 END)', 'views')
      .addSelect('COUNT(CASE WHEN event.interactionType != :viewType THEN 1 END)', 'interactions')
      .addSelect('COUNT(CASE WHEN event.interactionType = :submitType THEN 1 END)', 'conversions')
      .where('event.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('event.tenantId = :tenantId', { tenantId })
      .setParameter('viewType', InteractionType.VIEW)
      .setParameter('submitType', InteractionType.SUBMIT)
      .groupBy('timestamp')
      .orderBy('timestamp', 'ASC');

    if (query.pageUrl) {
      qb.andWhere('event.pageUrl = :pageUrl', { pageUrl: query.pageUrl });
    }

    const results = await qb.getRawMany();

    return results.map((r) => ({
      timestamp: r.timestamp,
      views: parseInt(r.views),
      interactions: parseInt(r.interactions),
      conversions: parseInt(r.conversions),
    }));
  }

  /**
   * Get device distribution
   */
  private async getDeviceDistribution(
    startDate: Date,
    endDate: Date,
    query: AnalyticsQueryDto,
  ): Promise<{ mobile: number; tablet: number; desktop: number }> {
    const tenantId = this.tenantService.getTenantId();
    const total = await this.countEvents(startDate, endDate, null, query);

    if (total === 0) {
      return { mobile: 0, tablet: 0, desktop: 0 };
    }

    const qb = this.eventRepository
      .createQueryBuilder('event')
      .select('event.deviceType', 'deviceType')
      .addSelect('COUNT(*)', 'count')
      .where('event.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('event.tenantId = :tenantId', { tenantId })
      .groupBy('event.deviceType');

    const results = await qb.getRawMany();

    const distribution = { mobile: 0, tablet: 0, desktop: 0 };
    results.forEach((r) => {
      distribution[r.deviceType] = parseInt(r.count) / total;
    });

    return distribution;
  }

  /**
   * Get recent sessions
   */
  private async getRecentSessions(limit: number = 10): Promise<any[]> {
    const tenantId = this.tenantService.getTenantId();
    return this.sessionRepository.find({
      where: { tenantId } as any,
      order: { startTime: 'DESC' },
      take: limit,
    });
  }

  /**
   * Helper: Count events
   */
  private async countEvents(
    startDate: Date,
    endDate: Date,
    interactionType: InteractionType | null,
    query: AnalyticsQueryDto,
  ): Promise<number> {
    const tenantId = this.tenantService.getTenantId();
    const qb = this.eventRepository
      .createQueryBuilder('event')
      .where('event.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('event.tenantId = :tenantId', { tenantId });

    if (interactionType) {
      qb.andWhere('event.interactionType = :type', { type: interactionType });
    }

    if (query.pageUrl) {
      qb.andWhere('event.pageUrl = :pageUrl', { pageUrl: query.pageUrl });
    }

    if (query.deviceTypes && query.deviceTypes.length > 0) {
      qb.andWhere('event.deviceType IN (:...deviceTypes)', { deviceTypes: query.deviceTypes });
    }

    return qb.getCount();
  }

  /**
   * Helper: Get average engagement time
   */
  private async getAverageEngagement(
    startDate: Date,
    endDate: Date,
    query: AnalyticsQueryDto,
  ): Promise<number> {
    const tenantId = this.tenantService.getTenantId();
    const sessions = await this.sessionRepository
      .createQueryBuilder('session')
      .where('session.startTime BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('session.tenantId = :tenantId', { tenantId })
      .andWhere('session.duration IS NOT NULL')
      .getMany();

    if (sessions.length === 0) return 0;

    const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    return totalDuration / sessions.length;
  }

  /**
   * Helper: Get conversion rate
   */
  private async getConversionRate(
    startDate: Date,
    endDate: Date,
    query: AnalyticsQueryDto,
  ): Promise<number> {
    const tenantId = this.tenantService.getTenantId();
    const totalSessions = await this.sessionRepository.count({
      where: {
        startTime: Between(startDate, endDate),
        tenantId: tenantId as any,
      } as any,
    });

    if (totalSessions === 0) return 0;

    const convertedSessions = await this.sessionRepository.count({
      where: {
        startTime: Between(startDate, endDate),
        converted: true,
        tenantId: tenantId as any,
      } as any,
    });

    return convertedSessions / totalSessions;
  }

  /**
   * Helper: Calculate percentage change
   */
  private calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  /**
   * Helper: Get date range from time range enum
   */
  private getDateRange(
    timeRange: AnalyticsTimeRange,
    customStart?: string,
    customEnd?: string,
  ): { startDate: Date; endDate: Date } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (timeRange) {
      case AnalyticsTimeRange.TODAY:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case AnalyticsTimeRange.YESTERDAY:
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        break;
      case AnalyticsTimeRange.LAST_7_DAYS:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case AnalyticsTimeRange.LAST_30_DAYS:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        break;
      case AnalyticsTimeRange.LAST_90_DAYS:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 90);
        break;
      case AnalyticsTimeRange.CUSTOM:
        startDate = customStart ? new Date(customStart) : new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = customEnd ? new Date(customEnd) : now;
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
    }

    return { startDate, endDate };
  }

  /**
   * Helper: Get previous period dates
   */
  private getPreviousPeriod(startDate: Date, endDate: Date): { startDate: Date; endDate: Date } {
    const duration = endDate.getTime() - startDate.getTime();
    const prevEndDate = new Date(startDate);
    const prevStartDate = new Date(startDate.getTime() - duration);

    return { startDate: prevStartDate, endDate: prevEndDate };
  }
}
