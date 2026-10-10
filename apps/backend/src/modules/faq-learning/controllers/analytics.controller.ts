import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { LearningAnalyticsService } from '../services/learning-analytics.service';

@ApiTags('FAQ Learning Analytics')
@ApiBearerAuth()
@Controller('faq-learning/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPPORT_AGENT)
export class AnalyticsController {
  constructor(private readonly analyticsService: LearningAnalyticsService) {}

  @Get('effectiveness')
  @ApiOperation({ summary: 'Get learning effectiveness metrics' })
  @ApiQuery({ name: 'period', enum: ['day', 'week', 'month', 'all'], required: false })
  @ApiResponse({ status: 200, description: 'Learning effectiveness metrics retrieved' })
  async getLearningEffectiveness(
    @Query('period') period: 'day' | 'week' | 'month' | 'all' = 'week',
  ) {
    const metrics = await this.analyticsService.getLearningEffectiveness(period);
    return {
      success: true,
      data: metrics,
    };
  }

  @Get('provider-performance')
  @ApiOperation({ summary: 'Get AI provider performance comparison' })
  @ApiQuery({ name: 'period', enum: ['day', 'week', 'month', 'all'], required: false })
  @ApiResponse({ status: 200, description: 'Provider performance metrics retrieved' })
  async getProviderPerformance(
    @Query('period') period: 'day' | 'week' | 'month' | 'all' = 'week',
  ) {
    const metrics = await this.analyticsService.getProviderPerformance(period);
    return {
      success: true,
      data: metrics,
    };
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get FAQ usage metrics' })
  @ApiQuery({ name: 'period', enum: ['day', 'week', 'month', 'all'], required: false })
  @ApiResponse({ status: 200, description: 'FAQ usage metrics retrieved' })
  async getFaqUsageMetrics(
    @Query('period') period: 'day' | 'week' | 'month' | 'all' = 'week',
  ) {
    const metrics = await this.analyticsService.getFaqUsageMetrics(period);
    return {
      success: true,
      data: metrics,
    };
  }

  @Get('roi')
  @ApiOperation({ summary: 'Get ROI and ticket reduction metrics' })
  @ApiQuery({ name: 'period', enum: ['day', 'week', 'month', 'all'], required: false })
  @ApiResponse({ status: 200, description: 'ROI metrics retrieved' })
  async getROIMetrics(
    @Query('period') period: 'day' | 'week' | 'month' | 'all' = 'month',
  ) {
    const metrics = await this.analyticsService.getROIMetrics(period);
    return {
      success: true,
      data: metrics,
    };
  }

  @Get('comprehensive')
  @ApiOperation({ summary: 'Get comprehensive analytics dashboard data' })
  @ApiQuery({ name: 'period', enum: ['day', 'week', 'month', 'all'], required: false })
  @ApiResponse({ status: 200, description: 'Comprehensive analytics retrieved' })
  async getComprehensiveAnalytics(
    @Query('period') period: 'day' | 'week' | 'month' | 'all' = 'week',
  ) {
    const analytics = await this.analyticsService.getComprehensiveAnalytics(period);
    return {
      success: true,
      data: analytics,
    };
  }

  @Get('patterns')
  @ApiOperation({ summary: 'Get pattern analytics' })
  @ApiQuery({ name: 'period', enum: ['day', 'week', 'month', 'all'], required: false })
  @ApiResponse({ status: 200, description: 'Pattern analytics retrieved' })
  async getPatternAnalytics(
    @Query('period') period: 'day' | 'week' | 'month' | 'all' = 'week',
  ) {
    const analytics = await this.analyticsService.getPatternAnalytics(period);
    return {
      success: true,
      data: analytics,
    };
  }
}
