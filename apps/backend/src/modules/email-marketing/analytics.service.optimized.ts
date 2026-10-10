import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { TenantService } from '../../core/tenant/tenant.service';
import {
  AnalyticsDashboardData,
  OverviewMetrics,
  CampaignAnalytics,
  SubscriberGrowth,
  EmailEngagement,
  RevenueMetrics,
  TopPerformingCampaigns,
  AbTestSummary,
} from './dto/analytics.dto';
import { EmailCampaign } from './entities/email-campaign.entity';
import { Subscriber } from './entities/subscriber.entity';
import { EmailLog } from './entities/email-log.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(EmailCampaign)
    private campaignRepository: Repository<EmailCampaign>,
    @InjectRepository(Subscriber)
    private subscriberRepository: Repository<Subscriber>,
    @InjectRepository(EmailLog)
    private emailLogRepository: Repository<EmailLog>,
    private readonly tenantService: TenantService,
  ) { }

  private getTenantId(): string {
    const tenantId = this.tenantService.getTenantId();
    if (!tenantId) throw new UnauthorizedException('Tenant context required');
    return tenantId;
  }

  async getDashboardData(
    startDate?: string,
    endDate?: string,
    period: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'month',
  ): Promise<AnalyticsDashboardData> {
    const dateRange = this.getDateRange(startDate, endDate);

    // ✅ OPTIMIZATION: Parallel execution instead of sequential
    const [
      overview,
      campaignAnalytics,
      subscriberGrowth,
      emailEngagement,
      revenueMetrics,
      topCampaigns,
      abTestSummary,
    ] = await Promise.all([
      this.getOverviewMetrics(startDate, endDate),
      this.getCampaignAnalytics(startDate, endDate, 50),
      this.getSubscriberGrowth(startDate, endDate, period),
      this.getEmailEngagement(startDate, endDate, period),
      this.getRevenueMetrics(startDate, endDate, period),
      this.getTopCampaigns(startDate, endDate, 10, 'score'),
      this.getAbTestSummary(startDate, endDate, 20),
    ]);

    return {
      overview,
      campaignAnalytics,
      subscriberGrowth,
      emailEngagement,
      revenueMetrics,
      topCampaigns,
      abTestSummary,
      dateRange: {
        startDate: dateRange.start.toISOString().split('T')[0],
        endDate: dateRange.end.toISOString().split('T')[0],
        period,
      },
    };
  }

  async getOverviewMetrics(
    startDate?: string,
    endDate?: string,
  ): Promise<OverviewMetrics> {
    const dateRange = this.getDateRange(startDate, endDate);

    const tenantId = this.getTenantId();
    // ✅ OPTIMIZATION: Single aggregation query instead of multiple counts
    const [campaignStats, subscriberStats, campaignMetrics] = await Promise.all([
      this.campaignRepository.createQueryBuilder('campaign')
        .select('COUNT(*)', 'total')
        .addSelect('SUM(CASE WHEN status = \'sent\' THEN 1 ELSE 0 END)', 'active')
        .where('tenantId = :tenantId', { tenantId })
        .getRawOne(),

      this.subscriberRepository.createQueryBuilder('subscriber')
        .select('COUNT(CASE WHEN status = \'active\' THEN 1 END)', 'active')
        .addSelect('COUNT(CASE WHEN createdAt >= :startDate THEN 1 END)', 'new')
        .addSelect('COUNT(CASE WHEN createdAt < :startDate THEN 1 END)', 'previous')
        .where('tenantId = :tenantId', { tenantId })
        .setParameters({ startDate: dateRange.start, tenantId })
        .getRawOne(),

      this.campaignRepository.createQueryBuilder('campaign')
        .select('SUM(sentCount)', 'totalSent')
        .addSelect('SUM(openedCount)', 'totalOpened')
        .addSelect('SUM(clickedCount)', 'totalClicked')
        .addSelect('SUM(CAST(metadata->>\'revenue\' AS DECIMAL))', 'totalRevenue')
        .where('sentAt BETWEEN :start AND :end', { start: dateRange.start, end: dateRange.end })
        .andWhere('tenantId = :tenantId', { tenantId })
        .getRawOne(),
    ]);

    const totalEmailsSent = parseInt(campaignMetrics.totalSent || '0');
    const totalOpened = parseInt(campaignMetrics.totalOpened || '0');
    const totalClicked = parseInt(campaignMetrics.totalClicked || '0');
    const totalRevenue = parseFloat(campaignMetrics.totalRevenue || '0');

    const averageOpenRate = totalEmailsSent > 0 ? (totalOpened / totalEmailsSent) * 100 : 0;
    const averageClickRate = totalEmailsSent > 0 ? (totalClicked / totalEmailsSent) * 100 : 0;

    // ✅ OPTIMIZATION: Calculate actual subscriber growth rate
    const activeSubscribers = parseInt(subscriberStats.active || '0');
    const newSubscribers = parseInt(subscriberStats.new || '0');
    const previousSubscribers = parseInt(subscriberStats.previous || '0');
    const subscriberGrowthRate = previousSubscribers > 0
      ? ((activeSubscribers - previousSubscribers) / previousSubscribers) * 100
      : 0;

    return {
      totalCampaigns: parseInt(campaignStats.total || '0'),
      totalSubscribers: activeSubscribers,
      totalEmailsSent,
      averageOpenRate: Math.round(averageOpenRate * 100) / 100,
      averageClickRate: Math.round(averageClickRate * 100) / 100,
      totalRevenue,
      activeCampaigns: parseInt(campaignStats.active || '0'),
      activeAbTests: 0, // NOTE: Will be implemented when dedicated A/B test analytics entity is created
      subscriberGrowthRate: Math.round(subscriberGrowthRate * 100) / 100,
      engagementTrend: averageOpenRate > 25 ? 'up' : averageOpenRate < 15 ? 'down' : 'stable',
    };
  }

  async getCampaignAnalytics(
    startDate?: string,
    endDate?: string,
    limit: number = 50,
  ): Promise<CampaignAnalytics[]> {
    const dateRange = this.getDateRange(startDate, endDate);
    const tenantId = this.getTenantId();

    const campaigns = await this.campaignRepository.find({
      where: {
        sentAt: Between(dateRange.start, dateRange.end),
        tenantId,
      },
      order: {
        sentAt: 'DESC',
      },
      take: limit,
    });

    return campaigns.map(campaign => this.calculateCampaignMetrics(campaign));
  }

  async getSubscriberGrowth(
    startDate?: string,
    endDate?: string,
    period: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'day',
  ): Promise<SubscriberGrowth[]> {
    const tenantId = this.getTenantId();
    const dateRange = this.getDateRange(startDate, endDate);

    // ✅ OPTIMIZATION: Single query with date truncation instead of loop
    const format = this.getDateTruncFormat(period);

    const growthData = await this.subscriberRepository.createQueryBuilder('subscriber')
      .select(`DATE_TRUNC('${format}', createdAt)`, 'date')
      .addSelect('COUNT(*)', 'newSubscribers')
      .where('createdAt BETWEEN :start AND :end', { start: dateRange.start, end: dateRange.end })
      .andWhere('tenantId = :tenantId', { tenantId })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    const unsubscribeData = await this.subscriberRepository.createQueryBuilder('subscriber')
      .select(`DATE_TRUNC('${format}', updatedAt)`, 'date')
      .addSelect('COUNT(*)', 'unsubscribes')
      .where('status = :status', { status: 'unsubscribed' })
      .andWhere('updatedAt BETWEEN :start AND :end', { start: dateRange.start, end: dateRange.end })
      .andWhere('tenantId = :tenantId', { tenantId })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    // Merge data by date
    const dataMap = new Map<string, { new: number; unsub: number }>();
    growthData.forEach(row => {
      const dateStr = new Date(row.date).toISOString().split('T')[0];
      dataMap.set(dateStr, { new: parseInt(row.newSubscribers), unsub: 0 });
    });

    unsubscribeData.forEach(row => {
      const dateStr = new Date(row.date).toISOString().split('T')[0];
      const existing = dataMap.get(dateStr) || { new: 0, unsub: 0 };
      existing.unsub = parseInt(row.unsubscribes);
      dataMap.set(dateStr, existing);
    });

    // Calculate cumulative totals
    let cumulativeTotal = await this.subscriberRepository.count({
      where: {
        createdAt: Between(new Date('2020-01-01'), dateRange.start),
        status: 'active',
        tenantId,
      },
    });

    const result: SubscriberGrowth[] = [];
    const sortedDates = Array.from(dataMap.keys()).sort();

    for (const date of sortedDates) {
      const data = dataMap.get(date)!;
      const netGrowth = data.new - data.unsub;
      cumulativeTotal += netGrowth;
      const growthRate = cumulativeTotal > 0 ? (netGrowth / cumulativeTotal) * 100 : 0;

      result.push({
        date,
        totalSubscribers: cumulativeTotal,
        newSubscribers: data.new,
        unsubscribes: data.unsub,
        netGrowth,
        growthRate: Math.round(growthRate * 100) / 100,
      });
    }

    return result;
  }

  async getEmailEngagement(
    startDate?: string,
    endDate?: string,
    period: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'day',
  ): Promise<EmailEngagement[]> {
    const tenantId = this.getTenantId();
    const dateRange = this.getDateRange(startDate, endDate);
    const format = this.getDateTruncFormat(period);

    // ✅ OPTIMIZATION: Single aggregation query instead of loop with multiple queries
    const engagementData = await this.emailLogRepository.createQueryBuilder('log')
      .select(`DATE_TRUNC('${format}', sentAt)`, 'date')
      .addSelect('COUNT(*)', 'emailsSent')
      .addSelect('COUNT(CASE WHEN openedAt IS NOT NULL THEN 1 END)', 'uniqueOpens')
      .addSelect('COUNT(CASE WHEN clickedAt IS NOT NULL THEN 1 END)', 'uniqueClicks')
      .addSelect('AVG(EXTRACT(EPOCH FROM (openedAt - sentAt)) / 60)', 'avgTimeToOpen')
      .addSelect('AVG(EXTRACT(EPOCH FROM (clickedAt - openedAt)) / 60)', 'avgTimeToClick')
      .where('sentAt BETWEEN :start AND :end', { start: dateRange.start, end: dateRange.end })
      .andWhere('tenantId = :tenantId', { tenantId })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    return engagementData.map(row => {
      const emailsSent = parseInt(row.emailsSent);
      const uniqueOpens = parseInt(row.uniqueOpens);
      const uniqueClicks = parseInt(row.uniqueClicks);

      return {
        date: new Date(row.date).toISOString().split('T')[0],
        emailsSent,
        uniqueOpens,
        uniqueClicks,
        openRate: emailsSent > 0 ? Math.round((uniqueOpens / emailsSent) * 10000) / 100 : 0,
        clickRate: emailsSent > 0 ? Math.round((uniqueClicks / emailsSent) * 10000) / 100 : 0,
        avgTimeToOpen: parseFloat(row.avgTimeToOpen) || 0,
        avgTimeToClick: parseFloat(row.avgTimeToClick) || 0,
      };
    });
  }

  async getRevenueMetrics(
    startDate?: string,
    endDate?: string,
    period: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'day',
  ): Promise<RevenueMetrics[]> {
    const tenantId = this.getTenantId();
    const dateRange = this.getDateRange(startDate, endDate);
    const format = this.getDateTruncFormat(period);

    // ✅ OPTIMIZATION: Single aggregation query
    const revenueData = await this.campaignRepository.createQueryBuilder('campaign')
      .select(`DATE_TRUNC('${format}', sentAt)`, 'date')
      .addSelect('SUM(CAST(metadata->>\'revenue\' AS DECIMAL))', 'revenue')
      .addSelect('SUM(CAST(metadata->>\'conversions\' AS INT))', 'conversions')
      .addSelect('SUM(sentCount)', 'emailsSent')
      .where('sentAt BETWEEN :start AND :end', { start: dateRange.start, end: dateRange.end })
      .andWhere('tenantId = :tenantId', { tenantId })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    return revenueData.map(row => {
      const revenue = parseFloat(row.revenue || '0');
      const conversions = parseInt(row.conversions || '0');
      const emailsSent = parseInt(row.emailsSent || '0');

      return {
        date: new Date(row.date).toISOString().split('T')[0],
        revenue,
        conversions,
        averageOrderValue: conversions > 0 ? Math.round((revenue / conversions) * 100) / 100 : 0,
        revenuePerEmail: emailsSent > 0 ? Math.round((revenue / emailsSent) * 100) / 100 : 0,
        conversionRate: emailsSent > 0 ? Math.round((conversions / emailsSent) * 10000) / 100 : 0,
      };
    });
  }

  async getTopCampaigns(
    startDate?: string,
    endDate?: string,
    limit: number = 10,
    sortBy: 'openRate' | 'clickRate' | 'conversionRate' | 'revenue' | 'score' = 'score',
  ): Promise<TopPerformingCampaigns[]> {
    const tenantId = this.getTenantId();
    const dateRange = this.getDateRange(startDate, endDate);

    const campaigns = await this.campaignRepository.find({
      where: {
        sentAt: Between(dateRange.start, dateRange.end),
        tenantId,
      },
    });

    const topCampaigns = campaigns
      .map(campaign => {
        const metrics = this.calculateCampaignMetrics(campaign);

        // Composite score calculation
        const score = (metrics.openRate + metrics.clickRate + metrics.conversionRate * 10) / 3;

        return {
          campaignId: campaign.id,
          campaignName: campaign.name,
          sentAt: campaign.sentAt?.toISOString() || '',
          openRate: metrics.openRate,
          clickRate: metrics.clickRate,
          conversionRate: metrics.conversionRate,
          revenue: metrics.revenue,
          score: Math.round(score * 100) / 100,
        };
      })
      .sort((a, b) => b[sortBy] - a[sortBy])
      .slice(0, limit);

    return topCampaigns;
  }

  async getAbTestSummary(
    startDate?: string,
    endDate?: string,
    limit: number = 20,
  ): Promise<AbTestSummary[]> {
    // NOTE: Returns empty array until dedicated A/B test analytics entity is created
    // The A/B test data is currently stored within EmailCampaign entity
    return [];
  }

  async compareCampaigns(
    campaignIds: string[],
    metrics: string[],
  ): Promise<{
    campaigns: CampaignAnalytics[];
    comparison: Record<string, any>;
  }> {
    const tenantId = this.getTenantId();
    // ✅ OPTIMIZATION: Use findBy instead of deprecated findByIds
    const campaigns = await this.campaignRepository.find({
      where: {
        id: In(campaignIds as any),
        tenantId,
      },
    });

    const campaignAnalytics = campaigns.map(campaign => this.calculateCampaignMetrics(campaign));

    // Generate comparison data
    const comparison: Record<string, any> = {};
    metrics.forEach(metric => {
      const values = campaignAnalytics.map(c => Number(c[metric as keyof CampaignAnalytics]) || 0);
      comparison[metric] = {
        average: Math.round((values.reduce((sum, val) => sum + val, 0) / values.length) * 100) / 100,
        min: Math.min(...values),
        max: Math.max(...values),
      };
    });

    return {
      campaigns: campaignAnalytics,
      comparison,
    };
  }

  async getDataStatus(): Promise<{
    campaigns: number;
    subscribers: number;
    emailLogs: number;
    recentCampaigns: any[];
  }> {
    const tenantId = this.getTenantId();
    const [campaignCount, subscriberCount, emailLogCount, recentCampaigns] = await Promise.all([
      this.campaignRepository.count({ where: { tenantId } }),
      this.subscriberRepository.count({ where: { tenantId } }),
      this.emailLogRepository.count({ where: { tenantId } }),
      this.campaignRepository.find({
        where: { tenantId },
        order: { createdAt: 'DESC' },
        take: 5,
        select: ['id', 'name', 'status', 'sentCount', 'openedCount', 'clickedCount', 'createdAt', 'sentAt'],
      }),
    ]);

    return {
      campaigns: campaignCount,
      subscribers: subscriberCount,
      emailLogs: emailLogCount,
      recentCampaigns,
    };
  }

  async exportData(
    type: 'campaigns' | 'subscribers' | 'engagement' | 'revenue',
    format: 'csv' | 'excel' = 'csv',
    startDate?: string,
    endDate?: string,
  ): Promise<string> {
    let csvContent = '';

    switch (type) {
      case 'campaigns': {
        const campaigns = await this.getCampaignAnalytics(startDate, endDate, 10000);
        csvContent = 'Campaign Name,Sent Count,Open Rate,Click Rate,Conversion Rate,Revenue\n';
        campaigns.forEach(c => {
          csvContent += `"${c.campaignName}",${c.sentCount},${c.openRate.toFixed(2)}%,${c.clickRate.toFixed(2)}%,${c.conversionRate.toFixed(2)}%,${c.revenue}\n`;
        });
        break;
      }

      case 'subscribers': {
        const subscriberGrowth = await this.getSubscriberGrowth(startDate, endDate, 'day');
        csvContent = 'Date,Total Subscribers,New Subscribers,Unsubscribes,Growth Rate\n';
        subscriberGrowth.forEach(s => {
          csvContent += `${s.date},${s.totalSubscribers},${s.newSubscribers},${s.unsubscribes},${s.growthRate.toFixed(2)}%\n`;
        });
        break;
      }

      case 'engagement': {
        const engagement = await this.getEmailEngagement(startDate, endDate, 'day');
        csvContent = 'Date,Emails Sent,Open Rate,Click Rate,Avg Time to Open,Avg Time to Click\n';
        engagement.forEach(e => {
          csvContent += `${e.date},${e.emailsSent},${e.openRate.toFixed(2)}%,${e.clickRate.toFixed(2)}%,${e.avgTimeToOpen.toFixed(1)}min,${e.avgTimeToClick.toFixed(1)}min\n`;
        });
        break;
      }

      case 'revenue': {
        const revenue = await this.getRevenueMetrics(startDate, endDate, 'day');
        csvContent = 'Date,Revenue,Conversions,Average Order Value,Revenue Per Email\n';
        revenue.forEach(r => {
          csvContent += `${r.date},${r.revenue.toFixed(2)},${r.conversions},${r.averageOrderValue.toFixed(2)},${r.revenuePerEmail.toFixed(4)}\n`;
        });
        break;
      }
    }

    return csvContent;
  }

  // ✅ HELPER: Extract campaign metrics calculation to avoid duplication
  private calculateCampaignMetrics(campaign: EmailCampaign): CampaignAnalytics {
    const sentCount = campaign.sentCount || 0;
    const openedCount = campaign.openedCount || 0;
    const clickedCount = campaign.clickedCount || 0;
    const conversionCount = campaign.metadata?.conversions || 0;
    const revenue = campaign.metadata?.revenue || 0;
    const bounceCount = campaign.metadata?.bounces || 0;
    const unsubscribeCount = campaign.metadata?.unsubscribes || 0;

    return {
      campaignId: campaign.id,
      campaignName: campaign.name,
      sentCount,
      openedCount,
      clickedCount,
      conversionCount,
      revenue,
      bounceCount,
      unsubscribeCount,
      openRate: sentCount > 0 ? Math.round((openedCount / sentCount) * 10000) / 100 : 0,
      clickRate: sentCount > 0 ? Math.round((clickedCount / sentCount) * 10000) / 100 : 0,
      conversionRate: sentCount > 0 ? Math.round((conversionCount / sentCount) * 10000) / 100 : 0,
      bounceRate: sentCount > 0 ? Math.round((bounceCount / sentCount) * 10000) / 100 : 0,
      unsubscribeRate: sentCount > 0 ? Math.round((unsubscribeCount / sentCount) * 10000) / 100 : 0,
      sentAt: campaign.sentAt?.toISOString() || '',
      status: campaign.status,
    };
  }

  private getDateRange(startDate?: string, endDate?: string): { start: Date; end: Date } {
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    return { start, end };
  }

  private getDateTruncFormat(period: 'day' | 'week' | 'month' | 'quarter' | 'year'): string {
    const formats = {
      day: 'day',
      week: 'week',
      month: 'month',
      quarter: 'quarter',
      year: 'year',
    };
    return formats[period];
  }
}
