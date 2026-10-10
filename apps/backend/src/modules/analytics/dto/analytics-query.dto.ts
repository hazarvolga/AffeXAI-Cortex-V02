import { IsEnum, IsOptional, IsString, IsDateString, IsArray } from 'class-validator';

export enum AnalyticsTimeRange {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  LAST_7_DAYS = 'last7days',
  LAST_30_DAYS = 'last30days',
  LAST_90_DAYS = 'last90days',
  CUSTOM = 'custom',
}

export class AnalyticsQueryDto {
  @IsEnum(AnalyticsTimeRange)
  timeRange: AnalyticsTimeRange;

  @IsDateString()
  @IsOptional()
  customStartDate?: string;

  @IsDateString()
  @IsOptional()
  customEndDate?: string;

  @IsString()
  @IsOptional()
  pageUrl?: string;

  @IsString()
  @IsOptional()
  componentType?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  deviceTypes?: ('mobile' | 'tablet' | 'desktop')[];

  @IsString()
  @IsOptional()
  userSegment?: string;
}

export class HeatmapQueryDto {
  @IsString()
  componentId: string;

  @IsString()
  @IsOptional()
  pageUrl?: string;

  @IsEnum(AnalyticsTimeRange)
  timeRange: AnalyticsTimeRange;

  @IsDateString()
  @IsOptional()
  customStartDate?: string;

  @IsDateString()
  @IsOptional()
  customEndDate?: string;
}
