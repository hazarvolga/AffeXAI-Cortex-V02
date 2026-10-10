import { IsOptional, IsString, IsArray, IsEnum, IsNumber, IsObject, IsBoolean, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ImportJobStatus } from '../entities/import-job.entity';

export class ImportOptionsDto {
  @ApiPropertyOptional({
    description: 'Group IDs to assign imported subscribers to',
    example: ['group-1', 'group-2'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  groupIds?: string[];

  @ApiPropertyOptional({
    description: 'Segment IDs to assign imported subscribers to',
    example: ['segment-1', 'segment-2'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  segmentIds?: string[];

  @ApiProperty({
    description: 'How to handle duplicate subscribers',
    enum: ['skip', 'update', 'replace'],
    example: 'update'
  })
  @IsEnum(['skip', 'update', 'replace'])
  duplicateHandling: 'skip' | 'update' | 'replace';

  @ApiProperty({
    description: 'Minimum confidence score for email validation (0-100)',
    example: 70,
    minimum: 0,
    maximum: 100
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  validationThreshold: number;

  @ApiProperty({
    description: 'Batch size for processing records',
    example: 100,
    minimum: 10,
    maximum: 1000
  })
  @IsNumber()
  @Min(10)
  @Max(1000)
  batchSize: number;

  @ApiProperty({
    description: 'Mapping of CSV columns to subscriber fields',
    example: {
      'Email Address': 'email',
      'First Name': 'firstName',
      'Last Name': 'lastName',
      'Company': 'company'
    }
  })
  @IsObject()
  columnMapping: Record<string, string>;
}

export class CreateImportJobDto {
  @ApiProperty({
    description: 'Import options and configuration',
    type: ImportOptionsDto
  })
  @ValidateNested()
  @Type(() => ImportOptionsDto)
  options: ImportOptionsDto;

  @ApiPropertyOptional({
    description: 'User ID initiating the import',
    example: 'user-123'
  })
  @IsOptional()
  @IsString()
  userId?: string;
}

export class ImportJobSummaryDto {
  @ApiProperty({
    description: 'Import job ID',
    example: 'job-123'
  })
  id: string;

  @ApiProperty({
    description: 'Original file name',
    example: 'subscribers.csv'
  })
  fileName: string;

  @ApiProperty({
    description: 'Current job status',
    enum: ImportJobStatus,
    example: ImportJobStatus.PROCESSING
  })
  status: ImportJobStatus;

  @ApiProperty({
    description: 'Total number of records in file',
    example: 1000
  })
  totalRecords: number;

  @ApiProperty({
    description: 'Number of records processed so far',
    example: 750
  })
  processedRecords: number;

  @ApiProperty({
    description: 'Number of valid records',
    example: 700
  })
  validRecords: number;

  @ApiProperty({
    description: 'Number of invalid records',
    example: 30
  })
  invalidRecords: number;

  @ApiProperty({
    description: 'Number of risky records',
    example: 20
  })
  riskyRecords: number;

  @ApiProperty({
    description: 'Number of duplicate records',
    example: 50
  })
  duplicateRecords: number;

  @ApiProperty({
    description: 'Processing progress percentage',
    example: 75.5
  })
  progressPercentage: number;

  @ApiProperty({
    description: 'Job creation timestamp',
    example: '2024-01-01T12:00:00.000Z'
  })
  createdAt: Date;

  @ApiPropertyOptional({
    description: 'Job completion timestamp',
    example: '2024-01-01T12:30:00.000Z'
  })
  completedAt?: Date;

  @ApiPropertyOptional({
    description: 'Error message if job failed',
    example: 'File parsing failed: Invalid CSV format'
  })
  error?: string;
}

export class ImportJobDetailsDto extends ImportJobSummaryDto {
  @ApiProperty({
    description: 'Import options used for this job',
    type: ImportOptionsDto
  })
  options: ImportOptionsDto;

  @ApiProperty({
    description: 'Column mapping used for this job',
    example: {
      'Email Address': 'email',
      'First Name': 'firstName'
    }
  })
  columnMapping: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Validation summary statistics'
  })
  validationSummary?: {
    totalProcessed: number;
    validEmails: number;
    invalidEmails: number;
    riskyEmails: number;
    duplicates: number;
    averageConfidenceScore: number;
    processingTimeMs: number;
  };

  @ApiProperty({
    description: 'File path on server',
    example: '/temp/uploads/imports/job-123/file.csv'
  })
  filePath: string;
}

export class ImportJobListDto {
  @ApiProperty({
    description: 'List of import jobs',
    type: [ImportJobSummaryDto]
  })
  jobs: ImportJobSummaryDto[];

  @ApiProperty({
    description: 'Total number of jobs',
    example: 25
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1
  })
  page: number;

  @ApiProperty({
    description: 'Number of jobs per page',
    example: 20
  })
  limit: number;
}

export class ImportResultDto {
  @ApiProperty({
    description: 'Result ID',
    example: 'result-123'
  })
  id: string;

  @ApiProperty({
    description: 'Email address from CSV',
    example: 'user@example.com'
  })
  email: string;

  @ApiProperty({
    description: 'Validation result status',
    enum: ['valid', 'invalid', 'risky', 'duplicate'],
    example: 'valid'
  })
  status: string;

  @ApiProperty({
    description: 'Confidence score (0-100)',
    example: 85
  })
  confidenceScore: number;

  @ApiPropertyOptional({
    description: 'Detailed validation information'
  })
  validationDetails?: {
    syntaxValid: boolean;
    domainExists: boolean;
    mxRecordExists: boolean;
    isDisposable: boolean;
    isRoleAccount: boolean;
    hasTypos: boolean;
    ipReputation: 'good' | 'poor' | 'unknown';
    confidenceScore: number;
    validationProvider: string;
    validatedAt: Date;
  };

  @ApiPropertyOptional({
    description: 'Issues found during validation',
    example: ['Domain has poor reputation', 'Possible typo in domain']
  })
  issues?: string[];

  @ApiPropertyOptional({
    description: 'Suggestions for improvement',
    example: ['Consider using gmail.com instead of gmai.com']
  })
  suggestions?: string[];

  @ApiProperty({
    description: 'Whether the record was successfully imported',
    example: true
  })
  imported: boolean;

  @ApiPropertyOptional({
    description: 'Error message if import failed',
    example: 'Subscriber already exists with different data'
  })
  error?: string;

  @ApiProperty({
    description: 'Row number in original CSV file',
    example: 15
  })
  rowNumber: number;

  @ApiPropertyOptional({
    description: 'ID of created/updated subscriber',
    example: 'subscriber-456'
  })
  subscriberId?: string;
}

export class ImportResultListDto {
  @ApiProperty({
    description: 'List of import results',
    type: [ImportResultDto]
  })
  results: ImportResultDto[];

  @ApiProperty({
    description: 'Total number of results',
    example: 1000
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1
  })
  page: number;

  @ApiProperty({
    description: 'Number of results per page',
    example: 100
  })
  limit: number;
}

export class CsvValidationDto {
  @ApiProperty({
    description: 'Whether the CSV structure is valid',
    example: true
  })
  isValid: boolean;

  @ApiProperty({
    description: 'CSV column headers',
    example: ['Email Address', 'First Name', 'Last Name', 'Company']
  })
  headers: string[];

  @ApiProperty({
    description: 'Sample data rows (first 5 rows)',
    example: [
      { 'Email Address': 'user1@example.com', 'First Name': 'John', 'Last Name': 'Doe' },
      { 'Email Address': 'user2@example.com', 'First Name': 'Jane', 'Last Name': 'Smith' }
    ]
  })
  sampleData: any[];

  @ApiProperty({
    description: 'Suggested column mappings',
    example: [
      { csvColumn: 'Email Address', suggestedField: 'email', confidence: 0.9 },
      { csvColumn: 'First Name', suggestedField: 'firstName', confidence: 0.8 }
    ]
  })
  suggestions: Array<{
    csvColumn: string;
    suggestedField: string;
    confidence: number;
    reason: string;
  }>;

  @ApiProperty({
    description: 'Validation errors if any',
    example: ['Missing required email column', 'Invalid CSV format on line 15']
  })
  errors: string[];
}

export class ImportStatisticsDto {
  @ApiProperty({
    description: 'Total number of import jobs',
    example: 25
  })
  totalJobs: number;

  @ApiProperty({
    description: 'Number of completed jobs',
    example: 20
  })
  completedJobs: number;

  @ApiProperty({
    description: 'Number of failed jobs',
    example: 2
  })
  failedJobs: number;

  @ApiProperty({
    description: 'Total records processed across all jobs',
    example: 50000
  })
  totalRecordsProcessed: number;

  @ApiProperty({
    description: 'Total valid records across all jobs',
    example: 45000
  })
  totalValidRecords: number;

  @ApiProperty({
    description: 'Average success rate percentage',
    example: 90.5
  })
  averageSuccessRate: number;
}

export class ImportJobQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by user ID',
    example: 'user-123'
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filter by job status',
    enum: ImportJobStatus,
    example: ImportJobStatus.COMPLETED
  })
  @IsOptional()
  @IsEnum(ImportJobStatus)
  status?: ImportJobStatus;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class ImportResultQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by result status',
    enum: ['valid', 'invalid', 'risky', 'duplicate'],
    example: 'valid'
  })
  @IsOptional()
  @IsEnum(['valid', 'invalid', 'risky', 'duplicate'])
  status?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 100,
    minimum: 1,
    maximum: 500
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  limit?: number;
}