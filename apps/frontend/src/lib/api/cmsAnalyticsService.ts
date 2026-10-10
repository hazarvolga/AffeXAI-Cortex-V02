import { httpClient } from './http-client';

// Enums matching backend
export enum InteractionType {
  CLICK = 'click',
  HOVER = 'hover',
  SCROLL = 'scroll',
  FOCUS = 'focus',
  INPUT = 'input',
  SUBMIT = 'submit',
  VIEW = 'view',
  EXIT = 'exit',
}

export enum DeviceType {
  MOBILE = 'mobile',
  TABLET = 'tablet',
  DESKTOP = 'desktop',
}

export enum ABTestStatus {
  DRAFT = 'draft',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

export type AnalyticsTimeRange =
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last30days'
  | 'last90days'
  | 'custom';

// DTOs
export interface ViewportDto {
  width: number;
  height: number;
}

export interface CoordinatesDto {
  x: number;
  y: number;
  relativeX: number;
  relativeY: number;
}

export interface TrackEventDto {
  componentId: string;
  componentType: string;
  interactionType: InteractionType;
  sessionId: string;
  userId?: string;
  pageUrl: string;
  deviceType: DeviceType;
  browser?: string;
  viewport: ViewportDto;
  coordinates?: CoordinatesDto;
  metadata?: Record<string, any>;
}

export interface SessionDto {
  id: string;
  startTime: string;
  deviceType: DeviceType;
  browser: string;
  os: string;
  userId?: string;
}

export interface BatchTrackEventsDto {
  events: TrackEventDto[];
  session?: SessionDto;
}

export interface AnalyticsQueryDto {
  timeRange: AnalyticsTimeRange;
  customStartDate?: string;
  customEndDate?: string;
  pageUrl?: string;
  componentType?: string;
  deviceTypes?: DeviceType[];
}

export interface HeatmapQueryDto {
  componentId: string;
  pageUrl?: string;
  timeRange: AnalyticsTimeRange;
  customStartDate?: string;
  customEndDate?: string;
}

// Response types
export interface OverviewMetrics {
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

export interface ComponentRanking {
  componentId: string;
  componentType: string;
  pageUrl: string;
  interactionRate: number;
  conversions: number;
}

export interface TimelineDataPoint {
  timestamp: string;
  views: number;
  interactions: number;
  conversions: number;
}

export interface DashboardData {
  overview: OverviewMetrics;
  topComponents: ComponentRanking[];
  timeline: TimelineDataPoint[];
  deviceDistribution: Record<DeviceType, number>;
  recentSessions: any[];
}

export interface HeatmapPoint {
  x: number;
  y: number;
  intensity: number;
  type: InteractionType;
}

export interface HeatmapData {
  id: string;
  componentId: string;
  componentType: string;
  pageUrl: string;
  periodStart: string;
  periodEnd: string;
  points: HeatmapPoint[];
  dimensionWidth: number;
  dimensionHeight: number;
  totalInteractions: number;
  uniqueUsers: number;
}

export interface ABTestVariant {
  id: string;
  name: string;
  description?: string;
  componentConfig: Record<string, any>;
  trafficAllocation: number;
  impressions: number;
  interactions: number;
  conversions: number;
  conversionRate: number;
}

export interface ABTest {
  id: string;
  name: string;
  description?: string;
  componentId: string;
  componentType: string;
  status: ABTestStatus;
  periodStart: string;
  periodEnd: string;
  conversionGoal: string;
  targetAudience?: Record<string, any>;
  variants: ABTestVariant[];
  winnerVariantId?: string;
  confidenceLevel?: number;
  sampleSize?: number;
}

export interface CreateABTestDto {
  name: string;
  description?: string;
  componentId: string;
  componentType: string;
  status: ABTestStatus;
  periodStart: string;
  periodEnd: string;
  conversionGoal: string;
  targetAudience?: Record<string, any>;
  variants: Array<{
    name: string;
    description?: string;
    componentConfig: Record<string, any>;
    trafficAllocation: number;
  }>;
}

export interface UpdateABTestDto {
  name?: string;
  description?: string;
  status?: ABTestStatus;
  periodEnd?: string;
  winnerVariantId?: string;
  confidenceLevel?: number;
}

/**
 * CMS Analytics Service
 * Handles CMS component event tracking, dashboard data, heatmaps, and A/B testing
 */
class CmsAnalyticsService {
  private readonly endpoint = '/analytics';
  private readonly abTestEndpoint = '/ab-tests';

  // Event Tracking (Public endpoints)
  async trackEvent(dto: TrackEventDto): Promise<void> {
    try {
      await httpClient.postWrapped(`${this.endpoint}/track`, dto);
    } catch (error) {
      console.error('Failed to track CMS event:', error);
    }
  }

  async trackEventsBatch(dto: BatchTrackEventsDto): Promise<{ success: boolean; count: number }> {
    try {
      return await httpClient.postWrapped<{ success: boolean; count: number }>(
        `${this.endpoint}/track/batch`,
        dto,
      );
    } catch (error) {
      console.error('Failed to track batch CMS events:', error);
      return { success: false, count: 0 };
    }
  }

  async getVariantForUser(testId: string): Promise<ABTestVariant> {
    return httpClient.getWrapped<ABTestVariant>(
      `${this.endpoint}/ab-test/${testId}/variant`,
    );
  }

  async trackImpression(variantId: string): Promise<void> {
    try {
      await httpClient.postWrapped(`${this.endpoint}/ab-test/impression`, {
        variantId,
      });
    } catch (error) {
      console.error('Failed to track AB test impression:', error);
    }
  }

  async trackConversion(variantId: string, engagementTime?: number): Promise<void> {
    try {
      await httpClient.postWrapped(`${this.endpoint}/ab-test/conversion`, {
        variantId,
        engagementTime,
      });
    } catch (error) {
      console.error('Failed to track AB test conversion:', error);
    }
  }

  // Dashboard (Admin endpoints - require JWT)
  async getDashboardData(query: AnalyticsQueryDto): Promise<DashboardData> {
    const params = new URLSearchParams();
    params.append('timeRange', query.timeRange);
    if (query.customStartDate) params.append('customStartDate', query.customStartDate);
    if (query.customEndDate) params.append('customEndDate', query.customEndDate);
    if (query.pageUrl) params.append('pageUrl', query.pageUrl);
    if (query.componentType) params.append('componentType', query.componentType);
    if (query.deviceTypes) {
      query.deviceTypes.forEach(dt => params.append('deviceTypes[]', dt));
    }

    return httpClient.getWrapped<DashboardData>(
      `${this.endpoint}/dashboard?${params.toString()}`,
    );
  }

  async getHeatmap(query: HeatmapQueryDto): Promise<HeatmapData> {
    const params = new URLSearchParams();
    params.append('componentId', query.componentId);
    params.append('timeRange', query.timeRange);
    if (query.pageUrl) params.append('pageUrl', query.pageUrl);
    if (query.customStartDate) params.append('customStartDate', query.customStartDate);
    if (query.customEndDate) params.append('customEndDate', query.customEndDate);

    return httpClient.getWrapped<HeatmapData>(
      `${this.endpoint}/heatmap?${params.toString()}`,
    );
  }

  // A/B Testing (Admin endpoints - require JWT)
  async createABTest(dto: CreateABTestDto): Promise<ABTest> {
    return httpClient.postWrapped<ABTest>(this.abTestEndpoint, dto);
  }

  async getAllABTests(status?: ABTestStatus): Promise<ABTest[]> {
    const params = status ? `?status=${status}` : '';
    return httpClient.getWrapped<ABTest[]>(`${this.abTestEndpoint}${params}`);
  }

  async getABTestById(id: string): Promise<ABTest> {
    return httpClient.getWrapped<ABTest>(`${this.abTestEndpoint}/${id}`);
  }

  async updateABTest(id: string, dto: UpdateABTestDto): Promise<ABTest> {
    return httpClient.putWrapped<ABTest>(`${this.abTestEndpoint}/${id}`, dto);
  }

  async deleteABTest(id: string): Promise<{ message: string }> {
    return httpClient.deleteWrapped<{ message: string }>(`${this.abTestEndpoint}/${id}`);
  }

  async startABTest(id: string): Promise<ABTest> {
    return httpClient.postWrapped<ABTest>(`${this.abTestEndpoint}/${id}/start`, {});
  }

  async pauseABTest(id: string): Promise<ABTest> {
    return httpClient.postWrapped<ABTest>(`${this.abTestEndpoint}/${id}/pause`, {});
  }

  async completeABTest(id: string, winnerVariantId?: string): Promise<ABTest> {
    return httpClient.postWrapped<ABTest>(`${this.abTestEndpoint}/${id}/complete`, {
      winnerVariantId,
    });
  }
}

export const cmsAnalyticsService = new CmsAnalyticsService();
