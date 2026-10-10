import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../core/auth/guards/permissions.guard';
import { RequirePermissions } from '../../core/auth/decorators/permissions.decorator';
import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { AnalyticsService } from './analytics.service';
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

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('marketing.manage')
@Controller('email-marketing/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  async getDashboardData(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('period') period: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'month',
  ): Promise<AnalyticsDashboardData> {
    try {
      return await this.analyticsService.getDashboardData(startDate, endDate, period);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch dashboard data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('overview')
  async getOverviewMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<OverviewMetrics> {
    try {
      return await this.analyticsService.getOverviewMetrics(startDate, endDate);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch overview metrics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('campaigns')
  async getCampaignAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit: number = 50,
  ): Promise<CampaignAnalytics[]> {
    try {
      return await this.analyticsService.getCampaignAnalytics(startDate, endDate, limit);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch campaign analytics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('subscriber-growth')
  async getSubscriberGrowth(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('period') period: 'day' | 'week' | 'month' = 'day',
  ): Promise<SubscriberGrowth[]> {
    try {
      return await this.analyticsService.getSubscriberGrowth(startDate, endDate, period);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch subscriber growth data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('engagement')
  async getEmailEngagement(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('period') period: 'day' | 'week' | 'month' = 'day',
  ): Promise<EmailEngagement[]> {
    try {
      return await this.analyticsService.getEmailEngagement(startDate, endDate, period);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch email engagement data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('revenue')
  async getRevenueMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('period') period: 'day' | 'week' | 'month' = 'day',
  ): Promise<RevenueMetrics[]> {
    try {
      return await this.analyticsService.getRevenueMetrics(startDate, endDate, period);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch revenue metrics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('top-campaigns')
  async getTopCampaigns(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit: number = 10,
    @Query('sortBy') sortBy: 'openRate' | 'clickRate' | 'conversionRate' | 'revenue' | 'score' = 'score',
  ): Promise<TopPerformingCampaigns[]> {
    try {
      return await this.analyticsService.getTopCampaigns(startDate, endDate, limit, sortBy);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch top campaigns',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('ab-tests')
  async getAbTestSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit: number = 20,
  ): Promise<AbTestSummary[]> {
    try {
      return await this.analyticsService.getAbTestSummary(startDate, endDate, limit);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch A/B test summary',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('compare-campaigns')
  async compareCampaigns(
    @Body() body: { campaignIds: string[]; metrics: string[] },
  ): Promise<{
    campaigns: CampaignAnalytics[];
    comparison: Record<string, any>;
  }> {
    try {
      return await this.analyticsService.compareCampaigns(body.campaignIds, body.metrics);
    } catch (error) {
      throw new HttpException(
        'Failed to compare campaigns',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('debug/data-status')
  async getDataStatus(): Promise<{
    campaigns: number;
    subscribers: number;
    emailLogs: number;
    recentCampaigns: any[];
  }> {
    try {
      return await this.analyticsService.getDataStatus();
    } catch (error) {
      throw new HttpException(
        'Failed to get data status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('export')
  async exportData(
    @Query('type') type: 'campaigns' | 'subscribers' | 'engagement' | 'revenue',
    @Query('format') format: 'csv' | 'excel' = 'csv',
    @Query('startDate') startDate: string | undefined,
    @Query('endDate') endDate: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const data = await this.analyticsService.exportData(type, format, startDate, endDate);
      
      const filename = `${type}-analytics-${new Date().toISOString().split('T')[0]}.${format}`;
      const contentType = format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(data);
    } catch (error) {
      throw new HttpException(
        'Failed to export data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}