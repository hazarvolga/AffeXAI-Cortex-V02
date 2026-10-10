import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MetricType } from '../entities/cms-metric.entity';

export class TrackPageViewDto {
  @ApiProperty({ example: 'uuid-page-id' })
  @IsUUID()
  pageId: string;

  @ApiProperty({ example: 'Ana Sayfa' })
  @IsString()
  pageTitle: string;

  @ApiPropertyOptional({ example: 'Blog' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'visitor-session-id' })
  @IsOptional()
  @IsString()
  visitorId?: string;
}

export class TrackLinkClickDto {
  @ApiProperty({ example: 'https://example.com' })
  @IsString()
  linkUrl: string;

  @ApiPropertyOptional({ example: 'Daha Fazla Bilgi' })
  @IsOptional()
  @IsString()
  linkText?: string;

  @ApiPropertyOptional({ example: 'uuid-page-id' })
  @IsOptional()
  @IsUUID()
  pageId?: string;

  @ApiPropertyOptional({ example: 'visitor-session-id' })
  @IsOptional()
  @IsString()
  visitorId?: string;
}

export class TrackActivityDto {
  @ApiProperty({ enum: MetricType, example: MetricType.EDIT })
  @IsEnum(MetricType)
  activityType: MetricType;

  @ApiProperty({ example: 'uuid-page-id' })
  @IsUUID()
  pageId: string;

  @ApiPropertyOptional({ example: 'Ana Sayfa' })
  @IsOptional()
  @IsString()
  pageTitle?: string;

  @ApiPropertyOptional({ example: 'Blog' })
  @IsOptional()
  @IsString()
  category?: string;
}

export class GetMetricsQueryDto {
  @ApiPropertyOptional({ enum: ['day', 'week', 'month'], default: 'week' })
  @IsOptional()
  @IsString()
  period?: 'day' | 'week' | 'month';
}

export class PageViewMetric {
  @ApiProperty()
  pageId: string;

  @ApiProperty()
  pageTitle: string;

  @ApiProperty()
  viewCount: number;

  @ApiProperty()
  uniqueVisitors: number;
}

export class LinkClickMetric {
  @ApiProperty()
  linkUrl: string;

  @ApiProperty()
  linkText: string;

  @ApiProperty()
  clickCount: number;

  @ApiProperty()
  uniqueVisitors: number;
}

export class CategoryEngagementMetric {
  @ApiProperty()
  category: string;

  @ApiProperty()
  views: number;

  @ApiProperty()
  clicks: number;
}

export class MetricsSummary {
  @ApiProperty()
  totalViews: number;

  @ApiProperty()
  uniqueVisitors: number;

  @ApiProperty()
  totalClicks: number;

  @ApiProperty()
  uniqueLinks: number;

  @ApiProperty()
  edits: number;

  @ApiProperty()
  publishes: number;
}

export class CmsMetricsResponseDto {
  @ApiProperty({ type: MetricsSummary })
  summary: MetricsSummary;

  @ApiProperty({ type: [PageViewMetric] })
  topPages: PageViewMetric[];

  @ApiProperty({ type: [LinkClickMetric] })
  topLinks: LinkClickMetric[];

  @ApiProperty({ type: [CategoryEngagementMetric] })
  categoryEngagement: CategoryEngagementMetric[];
}
