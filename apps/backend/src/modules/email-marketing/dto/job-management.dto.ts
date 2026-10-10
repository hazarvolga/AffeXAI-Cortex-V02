import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNumber, IsDateString } from 'class-validator';

export enum JobType {
  IMPORT = 'IMPORT',
  EXPORT = 'EXPORT'
}

export enum JobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export class ImportJobSummaryDto {
  @ApiProperty({ description: 'Job ID' })
  id: string;

  @ApiProperty({ description: 'File name' })
  fileName: string;

  @ApiProperty({ description: 'Job status', enum: JobStatus })
  status: JobStatus;

  @ApiProperty({ description: 'Total records' })
  totalRecords: number;

  @ApiProperty({ description: 'Processed records' })
  processedRecords: number;

  @ApiProperty({ description: 'Valid records' })
  validRecords: number;

  @ApiProperty({ description: 'Invalid records' })
  invalidRecords: number;

  @ApiProperty({ description: 'Progress percentage' })
  progressPercentage: number;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Completed at' })
  completedAt?: Date;

  @ApiPropertyOptional({ description: 'Error message' })
  error?: string;
}

export class ExportJobSummaryDto {
  @ApiProperty({ description: 'Job ID' })
  id: string;

  @ApiProperty({ description: 'File name' })
  fileName: string;

  @ApiProperty({ description: 'Job status', enum: JobStatus })
  status: JobStatus;

  @ApiProperty({ description: 'Total records' })
  totalRecords: number;

  @ApiProperty({ description: 'Processed records' })
  processedRecords: number;

  @ApiProperty({ description: 'Progress percentage' })
  progressPercentage: number;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Completed at' })
  completedAt?: Date;

  @ApiPropertyOptional({ description: 'Error message' })
  error?: string;
}

export class JobSummaryDto {
  @ApiProperty({ description: 'Job ID' })
  id: string;

  @ApiProperty({ description: 'Job type', enum: JobType })
  type: JobType;

  @ApiProperty({ description: 'File name' })
  fileName: string;

  @ApiProperty({ description: 'Job status', enum: JobStatus })
  status: JobStatus;

  @ApiProperty({ description: 'Total records' })
  totalRecords: number;

  @ApiProperty({ description: 'Processed records' })
  processedRecords: number;

  @ApiProperty({ description: 'Progress percentage' })
  progressPercentage: number;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Completed at' })
  completedAt?: Date;
}

export class JobStatisticsDto {
  @ApiProperty({ description: 'Total jobs' })
  totalJobs: number;

  @ApiProperty({ description: 'Total import jobs' })
  totalImportJobs: number;

  @ApiProperty({ description: 'Active import jobs' })
  activeImportJobs: number;

  @ApiProperty({ description: 'Completed import jobs' })
  completedImportJobs: number;

  @ApiProperty({ description: 'Failed import jobs' })
  failedImportJobs: number;

  @ApiProperty({ description: 'Total export jobs' })
  totalExportJobs: number;

  @ApiProperty({ description: 'Active export jobs' })
  activeExportJobs: number;

  @ApiProperty({ description: 'Completed export jobs' })
  completedExportJobs: number;

  @ApiProperty({ description: 'Failed export jobs' })
  failedExportJobs: number;

  @ApiProperty({ description: 'Total records processed' })
  totalRecordsProcessed: number;

  @ApiPropertyOptional({ description: 'Completed jobs (combined)' })
  completedJobs?: number;

  @ApiPropertyOptional({ description: 'Failed jobs (combined)' })
  failedJobs?: number;

  @ApiPropertyOptional({ description: 'Processing jobs' })
  processingJobs?: number;

  @ApiPropertyOptional({ description: 'Pending jobs' })
  pendingJobs?: number;

  @ApiPropertyOptional({ description: 'Average processing time in seconds' })
  averageProcessingTime?: number;
}

export class CleanupResultDto {
  @ApiProperty({ description: 'Number of import jobs cleaned' })
  importJobsCleaned: number;

  @ApiProperty({ description: 'Number of export jobs cleaned' })
  exportJobsCleaned: number;

  @ApiProperty({ description: 'Total jobs cleaned' })
  totalJobsCleaned: number;

  @ApiProperty({ description: 'Cleanup timestamp' })
  cleanedAt: Date;
}

export class JobListResponseDto {
  @ApiProperty({ description: 'List of jobs', type: [JobSummaryDto] })
  jobs: JobSummaryDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;
}

export class JobCleanupResponseDto {
  @ApiProperty({ description: 'Number of jobs cleaned' })
  cleanedCount: number;

  @ApiPropertyOptional({ description: 'Number of cleaned jobs (alias)' })
  cleanedJobs?: number;

  @ApiProperty({ description: 'Cleanup timestamp' })
  cleanedAt: Date;

  @ApiPropertyOptional({ description: 'Error message if any' })
  error?: string;
}
