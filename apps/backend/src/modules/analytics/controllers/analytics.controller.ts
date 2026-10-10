import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import {
  AnalyticsTrackingService,
  AnalyticsDashboardService,
  HeatmapService,
  ABTestingService,
} from '../services';
import {
  TrackEventDto,
  BatchTrackEventsDto,
  AnalyticsQueryDto,
  HeatmapQueryDto,
} from '../dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly trackingService: AnalyticsTrackingService,
    private readonly dashboardService: AnalyticsDashboardService,
    private readonly heatmapService: HeatmapService,
    private readonly abTestingService: ABTestingService,
  ) { }

  /**
   * Track a single event
   * POST /analytics/track
   */
  @Post('track')
  @HttpCode(HttpStatus.NO_CONTENT)
  async trackEvent(
    @Body() dto: TrackEventDto,
    @CurrentUser() user?: User,
  ): Promise<void> {
    if (user) {
      dto.userId = user.id;
    }
    await this.trackingService.trackEvent(dto);
  }

  /**
   * Track multiple events (batch)
   * POST /analytics/track/batch
   */
  @Post('track/batch')
  @HttpCode(HttpStatus.OK)
  async trackEventsBatch(
    @Body() dto: BatchTrackEventsDto,
    @CurrentUser() user?: User,
  ) {
    if (user) {
      dto.events.forEach(event => {
        event.userId = user.id;
      });
    }
    return this.trackingService.trackEventsBatch(dto);
  }

  /**
   * Get dashboard data
   * GET /analytics/dashboard
   */
  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  async getDashboard(@Query() query: AnalyticsQueryDto, @CurrentUser() user: User) {
    return this.dashboardService.getDashboardData(query);
  }

  /**
   * Generate/Get heatmap
   * GET /analytics/heatmap
   */
  @Get('heatmap')
  @UseGuards(JwtAuthGuard)
  async getHeatmap(@Query() query: HeatmapQueryDto, @CurrentUser() user: User) {
    return this.heatmapService.generateHeatmap(query);
  }

  /**
   * Get heatmaps for component
   * GET /analytics/heatmap/:componentId
   */
  @Get('heatmap/:componentId')
  @UseGuards(JwtAuthGuard)
  async getComponentHeatmaps(
    @CurrentUser() user: User,
    @Query('componentId') componentId: string,
    @Query('pageUrl') pageUrl?: string,
  ) {
    // Note: getComponentHeatmaps implementation needs to be checked if it supports tenantId
    // Assuming we extend it or it's implicitly handling it via other means for now
    // For this refactor, we are focusing on dashboard/tracking primarily as per plan
    // For this refactor, we are focusing on dashboard/tracking primarily as per plan
    return this.heatmapService.getHeatmapsForComponent(componentId, pageUrl);
  }

  /**
   * Get variant for A/B test (for user assignment)
   * GET /analytics/ab-test/:testId/variant
   */
  @Get('ab-test/:testId/variant')
  async getTestVariant(@Query('testId') testId: string) {
    return this.abTestingService.getVariantForUser(testId);
  }

  /**
   * Track A/B test impression
   * POST /analytics/ab-test/impression
   */
  @Post('ab-test/impression')
  @HttpCode(HttpStatus.NO_CONTENT)
  async trackTestImpression(@Body('variantId') variantId: string): Promise<void> {
    await this.abTestingService.trackImpression(variantId);
  }

  /**
   * Track A/B test conversion
   * POST /analytics/ab-test/conversion
   */
  @Post('ab-test/conversion')
  @HttpCode(HttpStatus.NO_CONTENT)
  async trackTestConversion(
    @Body('variantId') variantId: string,
    @Body('engagementTime') engagementTime?: number,
  ): Promise<void> {
    await this.abTestingService.trackConversion(variantId, engagementTime);
  }
}
