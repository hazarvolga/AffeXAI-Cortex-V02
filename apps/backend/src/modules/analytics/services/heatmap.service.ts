import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AnalyticsHeatmap, AnalyticsEvent, InteractionType, HeatmapPoint } from '../entities';
import { HeatmapQueryDto, AnalyticsTimeRange } from '../dto';
import { TenantService } from '../../../core/tenant/tenant.service';

@Injectable()
export class HeatmapService {
  constructor(
    @InjectRepository(AnalyticsHeatmap)
    private readonly heatmapRepository: Repository<AnalyticsHeatmap>,
    @InjectRepository(AnalyticsEvent)
    private readonly eventRepository: Repository<AnalyticsEvent>,
    private readonly tenantService: TenantService,
  ) { }

  /**
   * Generate heatmap from events
   */
  async generateHeatmap(query: HeatmapQueryDto): Promise<AnalyticsHeatmap> {
    const tenantId = this.tenantService.getTenantId();
    const { startDate, endDate } = this.getDateRange(
      query.timeRange,
      query.customStartDate,
      query.customEndDate,
    );

    // Check if heatmap already exists for this period
    const existing = await this.heatmapRepository.findOne({
      where: {
        componentId: query.componentId,
        ...(query.pageUrl && { pageUrl: query.pageUrl }),
        periodStart: startDate,
        periodEnd: endDate,
        tenantId: tenantId as any,
      } as any,
    });

    if (existing) {
      return existing;
    }

    // Get events with coordinates
    const qb = this.eventRepository
      .createQueryBuilder('event')
      .where('event.componentId = :componentId', { componentId: query.componentId })
      .andWhere('event.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('event.coordinateX IS NOT NULL')
      .andWhere('event.coordinateY IS NOT NULL')
      .andWhere('event.relativeX IS NOT NULL')
      .andWhere('event.relativeY IS NOT NULL')
      .andWhere('event.tenantId = :tenantId', { tenantId });

    if (query.pageUrl) {
      qb.andWhere('event.pageUrl = :pageUrl', { pageUrl: query.pageUrl });
    }

    const events = await qb.getMany();

    if (events.length === 0) {
      // Return empty heatmap
      return this.heatmapRepository.create({
        componentId: query.componentId,
        componentType: 'unknown',
        pageUrl: query.pageUrl || '',
        periodStart: startDate,
        periodEnd: endDate,
        points: [],
        dimensionWidth: 0,
        dimensionHeight: 0,
        totalInteractions: 0,
        uniqueUsers: 0,
        tenantId: tenantId,
      });
    }

    // Aggregate points by coordinates
    const pointsMap = new Map<string, HeatmapPoint>();

    events.forEach((event) => {
      // Grid size for aggregation (10x10 pixels)
      const gridSize = 10;
      const gridX = Math.floor(event.relativeX! / gridSize) * gridSize;
      const gridY = Math.floor(event.relativeY! / gridSize) * gridSize;
      const key = `${gridX},${gridY}`;

      const existing = pointsMap.get(key);
      if (existing) {
        existing.intensity += 1;
      } else {
        pointsMap.set(key, {
          x: gridX,
          y: gridY,
          intensity: 1,
          type: event.interactionType,
        });
      }
    });

    const points = Array.from(pointsMap.values());

    // Get component dimensions (max coordinates)
    const maxWidth = Math.max(...events.map((e) => e.relativeX!));
    const maxHeight = Math.max(...events.map((e) => e.relativeY!));

    // Get unique users
    const uniqueUserIds = new Set(events.map((e) => e.userId).filter(Boolean));

    // Create heatmap
    const heatmap = this.heatmapRepository.create({
      componentId: query.componentId,
      componentType: events[0].componentType,
      pageUrl: query.pageUrl || events[0].pageUrl,
      periodStart: startDate,
      periodEnd: endDate,
      points,
      dimensionWidth: maxWidth,
      dimensionHeight: maxHeight,
      totalInteractions: events.length,
      uniqueUsers: uniqueUserIds.size,
      tenantId: tenantId,
    });

    return this.heatmapRepository.save(heatmap);
  }

  /**
   * Get heatmap by ID
   */
  async getHeatmapById(id: string): Promise<AnalyticsHeatmap | null> {
    const tenantId = this.tenantService.getTenantId();
    return this.heatmapRepository.findOne({ where: { id, tenantId } });
  }

  /**
   * Get heatmaps for component
   */
  async getHeatmapsForComponent(
    componentId: string,
    pageUrl?: string,
  ): Promise<AnalyticsHeatmap[]> {
    const tenantId = this.tenantService.getTenantId();
    const where: any = { componentId };
    where.tenantId = tenantId;
    if (pageUrl) {
      where.pageUrl = pageUrl;
    }

    return this.heatmapRepository.find({
      where,
      order: { periodStart: 'DESC' },
    });
  }

  /**
   * Delete old heatmaps
   */
  async deleteOldHeatmaps(daysToKeep: number = 90): Promise<number> {
    const tenantId = this.tenantService.getTenantId();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const qb = this.heatmapRepository
      .createQueryBuilder()
      .delete()
      .where('periodEnd < :cutoffDate', { cutoffDate });

    qb.andWhere('tenantId = :tenantId', { tenantId });

    const result = await qb.execute();

    return result.affected || 0;
  }

  /**
   * Helper: Get date range from query
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
}
