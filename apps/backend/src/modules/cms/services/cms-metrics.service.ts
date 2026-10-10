import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { CmsMetric, MetricType } from '../entities/cms-metric.entity';
import {
  TrackPageViewDto,
  TrackLinkClickDto,
  TrackActivityDto,
  CmsMetricsResponseDto,
  PageViewMetric,
  LinkClickMetric,
  CategoryEngagementMetric,
  MetricsSummary,
} from '../dto/cms-metrics.dto';
import { TenantService } from '../../../core/tenant/tenant.service';

@Injectable()
export class CmsMetricsService {
  constructor(
    @InjectRepository(CmsMetric)
    private readonly metricsRepository: Repository<CmsMetric>,
    private readonly tenantService: TenantService,
  ) { }

  private get tenantId(): string {
    return this.tenantService.getTenantId();
  }

  async trackPageView(dto: TrackPageViewDto): Promise<CmsMetric> {
    const metric = this.metricsRepository.create({
      metricType: MetricType.VIEW,
      pageId: dto.pageId,
      pageTitle: dto.pageTitle,
      category: dto.category,
      visitorId: dto.visitorId,
      tenantId: this.tenantId,
    });

    return this.metricsRepository.save(metric);
  }

  async trackLinkClick(dto: TrackLinkClickDto): Promise<CmsMetric> {
    const metric = this.metricsRepository.create({
      metricType: MetricType.CLICK,
      linkUrl: dto.linkUrl,
      linkText: dto.linkText,
      pageId: dto.pageId,
      visitorId: dto.visitorId,
      tenantId: this.tenantId,
    });

    return this.metricsRepository.save(metric);
  }

  async trackActivity(dto: TrackActivityDto): Promise<CmsMetric> {
    const metric = this.metricsRepository.create({
      metricType: dto.activityType,
      pageId: dto.pageId,
      pageTitle: dto.pageTitle,
      category: dto.category,
      tenantId: this.tenantId,
    });

    return this.metricsRepository.save(metric);
  }

  async getMetrics(period: 'day' | 'week' | 'month'): Promise<CmsMetricsResponseDto> {
    const startDate = this.getStartDate(period);

    const [summary, topPages, topLinks, categoryEngagement] = await Promise.all([
      this.getSummary(startDate),
      this.getTopPages(startDate),
      this.getTopLinks(startDate),
      this.getCategoryEngagement(startDate),
    ]);

    return {
      summary,
      topPages,
      topLinks,
      categoryEngagement,
    };
  }

  private getStartDate(period: 'day' | 'week' | 'month'): Date {
    const now = new Date();
    const startDate = new Date(now);

    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(now.getDate() - 30);
        break;
    }

    return startDate;
  }

  private async getSummary(startDate: Date): Promise<MetricsSummary> {
    const metrics = await this.metricsRepository.find({
      where: {
        createdAt: MoreThan(startDate),
        tenantId: this.tenantId,
      },
    });

    const views = metrics.filter((m) => m.metricType === MetricType.VIEW);
    const clicks = metrics.filter((m) => m.metricType === MetricType.CLICK);
    const edits = metrics.filter((m) => m.metricType === MetricType.EDIT);
    const publishes = metrics.filter((m) => m.metricType === MetricType.PUBLISH);

    const uniqueVisitors = new Set(views.map((m) => m.visitorId).filter(Boolean)).size;
    const uniqueLinks = new Set(clicks.map((m) => m.linkUrl).filter(Boolean)).size;

    return {
      totalViews: views.length,
      uniqueVisitors,
      totalClicks: clicks.length,
      uniqueLinks,
      edits: edits.length,
      publishes: publishes.length,
    };
  }

  private async getTopPages(startDate: Date): Promise<PageViewMetric[]> {
    const results = await this.metricsRepository
      .createQueryBuilder('metric')
      .select('metric.pageId', 'page_id')
      .addSelect('metric.pageTitle', 'page_title')
      .addSelect('COUNT(*)', 'view_count')
      .addSelect('COUNT(DISTINCT metric.visitorId)', 'unique_visitors')
      .where('metric.metricType = :type', { type: MetricType.VIEW })
      .andWhere('metric.createdAt > :startDate', { startDate })
      .andWhere('metric.pageId IS NOT NULL')
      .andWhere('metric.tenantId = :tenantId', { tenantId: this.tenantId })
      .groupBy('metric.pageId')
      .addGroupBy('metric.pageTitle')
      .orderBy('view_count', 'DESC')
      .limit(10)
      .getRawMany();

    return results.map((r) => ({
      pageId: r.page_id,
      pageTitle: r.page_title || 'Başlıksız Sayfa',
      viewCount: parseInt(r.view_count, 10),
      uniqueVisitors: parseInt(r.unique_visitors, 10),
    }));
  }

  private async getTopLinks(startDate: Date): Promise<LinkClickMetric[]> {
    const results = await this.metricsRepository
      .createQueryBuilder('metric')
      .select('metric.linkUrl', 'link_url')
      .addSelect('metric.linkText', 'link_text')
      .addSelect('COUNT(*)', 'click_count')
      .addSelect('COUNT(DISTINCT metric.visitorId)', 'unique_visitors')
      .where('metric.metricType = :type', { type: MetricType.CLICK })
      .andWhere('metric.createdAt > :startDate', { startDate })
      .andWhere('metric.linkUrl IS NOT NULL')
      .andWhere('metric.tenantId = :tenantId', { tenantId: this.tenantId })
      .groupBy('metric.linkUrl')
      .addGroupBy('metric.linkText')
      .orderBy('click_count', 'DESC')
      .limit(10)
      .getRawMany();

    return results.map((r) => ({
      linkUrl: r.link_url,
      linkText: r.link_text || r.link_url,
      clickCount: parseInt(r.click_count, 10),
      uniqueVisitors: parseInt(r.unique_visitors, 10),
    }));
  }

  private async getCategoryEngagement(startDate: Date): Promise<CategoryEngagementMetric[]> {
    const results = await this.metricsRepository
      .createQueryBuilder('metric')
      .select('metric.category', 'category')
      .addSelect(
        'SUM(CASE WHEN metric.metricType = :viewType THEN 1 ELSE 0 END)',
        'views',
      )
      .addSelect(
        'SUM(CASE WHEN metric.metricType = :clickType THEN 1 ELSE 0 END)',
        'clicks',
      )
      .where('metric.createdAt > :startDate', { startDate })
      .andWhere('metric.category IS NOT NULL')
      .andWhere('metric.tenantId = :tenantId', { tenantId: this.tenantId })
      .setParameter('viewType', MetricType.VIEW)
      .setParameter('clickType', MetricType.CLICK)
      .groupBy('metric.category')
      .orderBy('views', 'DESC')
      .getRawMany();

    return results.map((r) => ({
      category: r.category,
      views: parseInt(r.views, 10),
      clicks: parseInt(r.clicks, 10),
    }));
  }
}
