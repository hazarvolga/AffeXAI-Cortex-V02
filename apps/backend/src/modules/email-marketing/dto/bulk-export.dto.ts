import { IsArray, IsBoolean, IsDateString, IsEnum, IsIn, IsNumber, IsOptional, IsString, Min, Max, ArrayNotEmpty, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriberStatus } from '@affexai/shared-types';

export class DateRangeDto {
  @ApiPropertyOptional({ description: 'Start date for filtering' })
  @IsOptional()
  @IsDateString()
  start?: string;

  @ApiPropertyOptional({ description: 'End date for filtering' })
  @IsOptional()
  @IsDateString()
  end?: string;
}

export class CreateExportJobDto {
  @ApiPropertyOptional({ 
    description: 'Filter subscribers by status',
    enum: SubscriberStatus,
    isArray: true
  })
  @IsOptional()
  @IsArray()
  @IsEnum(SubscriberStatus, { each: true })
  status?: SubscriberStatus[];

  @ApiPropertyOptional({ 
    description: 'Filter subscribers by group IDs',
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  groupIds?: string[];

  @ApiPropertyOptional({ 
    description: 'Filter subscribers by segment IDs',
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  segmentIds?: string[];

  @ApiPropertyOptional({ 
    description: 'Date range for filtering subscribers',
    type: DateRangeDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DateRangeDto)
  dateRange?: DateRangeDto;

  @ApiPropertyOptional({ 
    description: 'Filter by email validation status',
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  validationStatus?: string[];

  @ApiProperty({ 
    description: 'Fields to include in export',
    type: [String],
    example: ['email', 'firstName', 'lastName', 'status']
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  fields: string[];

  @ApiProperty({ 
    description: 'Export format',
    enum: ['csv', 'xlsx']
  })
  @IsIn(['csv', 'xlsx'])
  format: 'csv' | 'xlsx';

  @ApiPropertyOptional({ 
    description: 'Include metadata fields in export',
    default: false
  })
  @IsOptional()
  @IsBoolean()
  includeMetadata?: boolean = false;

  @ApiPropertyOptional({ 
    description: 'Batch size for processing',
    minimum: 100,
    maximum: 10000,
    default: 1000
  })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(10000)
  batchSize?: number = 1000;
}

export class ExportJobResponseDto {
  @ApiProperty({ description: 'Export job ID' })
  id: string;

  @ApiProperty({ description: 'Export file name' })
  fileName: string;

  @ApiProperty({ description: 'Export job status' })
  status: string;

  @ApiProperty({ description: 'Total records to export' })
  totalRecords: number;

  @ApiProperty({ description: 'Records processed so far' })
  processedRecords: number;

  @ApiProperty({ description: 'Progress percentage' })
  progressPercentage: number;

  @ApiProperty({ description: 'File size in bytes', nullable: true })
  fileSizeBytes: number | null;

  @ApiProperty({ description: 'Export filters used' })
  filters: any;

  @ApiProperty({ description: 'Export options used' })
  options: any;

  @ApiProperty({ description: 'Error message if failed', nullable: true })
  error: string | null;

  @ApiProperty({ description: 'Job completion date', nullable: true })
  completedAt: Date | null;

  @ApiProperty({ description: 'File expiration date' })
  expiresAt: Date;

  @ApiProperty({ description: 'Job creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Job last update date' })
  updatedAt: Date;
}

export class ExportJobListDto {
  @ApiPropertyOptional({ 
    description: 'Page number for pagination',
    minimum: 1,
    default: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @ApiPropertyOptional({ 
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    default: 20
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20;

  @ApiPropertyOptional({ 
    description: 'Filter by job status',
    enum: ['pending', 'processing', 'completed', 'failed']
  })
  @IsOptional()
  @IsIn(['pending', 'processing', 'completed', 'failed'])
  status?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by user ID'
  })
  @IsOptional()
  @IsString()
  userId?: string;
}

export class AvailableFieldsResponseDto {
  @ApiProperty({ 
    description: 'List of available fields for export',
    type: [String]
  })
  fields: string[];

  @ApiProperty({ 
    description: 'Field descriptions',
    type: 'object',
    additionalProperties: { type: 'string' }
  })
  descriptions: Record<string, string>;
}

export class ExportStatsDto {
  @ApiProperty({ description: 'Total number of subscribers matching filters' })
  totalSubscribers: number;

  @ApiProperty({ description: 'Estimated file size in bytes' })
  estimatedFileSizeBytes: number;

  @ApiProperty({ description: 'Estimated processing time in seconds' })
  estimatedProcessingTimeSeconds: number;
}

export class ExportJobSummaryDto {
  @ApiProperty({ description: 'Export job ID' })
  id: string;

  @ApiProperty({ description: 'File name' })
  fileName: string;

  @ApiProperty({ description: 'Export status' })
  status: string;

  @ApiProperty({ description: 'Total records to export' })
  totalRecords: number;

  @ApiProperty({ description: 'Processed records' })
  processedRecords: number;

  @ApiProperty({ description: 'Progress percentage' })
  progressPercentage: number;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Completed at timestamp' })
  completedAt?: Date;

  @ApiPropertyOptional({ description: 'Error message if failed' })
  error?: string;
}

export class ExportJobDetailsDto extends ExportJobSummaryDto {
  @ApiProperty({ description: 'Export filters' })
  filters: any;

  @ApiProperty({ description: 'Export options' })
  options: any;

  @ApiProperty({ description: 'File path on server' })
  filePath: string;

  @ApiPropertyOptional({ description: 'User ID who created the export' })
  userId?: string;
}

export class ExportJobQueryDto {
  @ApiPropertyOptional({ 
    description: 'Filter by status',
    enum: SubscriberStatus,
    isArray: true
  })
  @IsOptional()
  @IsArray()
  @IsEnum(SubscriberStatus, { each: true })
  status?: SubscriberStatus[];

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Start date for filtering' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for filtering' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ 
    description: 'Date range for filtering',
    type: DateRangeDto
  })
  @IsOptional()
  dateRange?: DateRangeDto;
}

export class ExportStatisticsDto {
  @ApiProperty({ description: 'Total subscribers matching filters' })
  totalSubscribers: number;

  @ApiProperty({ description: 'Total exports' })
  totalExports: number;

  @ApiProperty({ description: 'Active exports' })
  activeExports: number;

  @ApiProperty({ description: 'Completed exports' })
  completedExports: number;

  @ApiProperty({ description: 'Failed exports' })
  failedExports: number;

  @ApiProperty({ description: 'Total records exported' })
  totalRecordsExported: number;

  @ApiProperty({ description: 'Estimated file size in bytes' })
  estimatedFileSizeBytes: number;

  @ApiProperty({ description: 'Estimated processing time in seconds' })
  estimatedProcessingTimeSeconds: number;
}

export class ExportResultListDto {
  @ApiProperty({ description: 'List of export results' })
  results: any[];

  @ApiProperty({ description: 'Total count' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;
}
