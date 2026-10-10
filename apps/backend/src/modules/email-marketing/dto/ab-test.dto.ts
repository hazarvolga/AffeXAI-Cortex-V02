import {
  IsString,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsOptional,
  ValidateNested,
  IsArray,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Types of A/B tests
 */
export enum TestType {
  SUBJECT = 'subject',
  CONTENT = 'content',
  SEND_TIME = 'send_time',
  FROM_NAME = 'from_name',
  COMBINED = 'combined',
}

/**
 * Criteria for selecting the winning variant
 */
export enum WinnerCriteria {
  OPEN_RATE = 'open_rate',
  CLICK_RATE = 'click_rate',
  CONVERSION_RATE = 'conversion_rate',
  REVENUE = 'revenue',
}

/**
 * Single variant configuration
 */
export class VariantDto {
  @ApiProperty({
    description: 'Variant label (A, B, C, D, or E)',
    example: 'A',
  })
  @IsString()
  label: string;

  @ApiPropertyOptional({
    description: 'Email subject line for this variant',
    example: 'Special Offer - 50% Off Today!',
  })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({
    description: 'Email content/body for this variant (HTML)',
    example: '<h1>Welcome!</h1><p>Check out our amazing deals...</p>',
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    description: 'From name for this variant',
    example: 'Support Team',
  })
  @IsOptional()
  @IsString()
  fromName?: string;

  @ApiPropertyOptional({
    description: 'Send time offset in minutes from base send time',
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(-1440) // -24 hours
  @Max(1440) // +24 hours
  sendTimeOffset?: number;

  @ApiProperty({
    description: 'Percentage of recipients for this variant (0-100)',
    example: 50,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  splitPercentage: number;
}

/**
 * DTO for creating a new A/B test
 */
export class CreateAbTestDto {
  @ApiProperty({
    description: 'Campaign ID to create A/B test for',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  campaignId: string;

  @ApiProperty({
    description: 'Type of test to run',
    enum: TestType,
    example: TestType.SUBJECT,
  })
  @IsEnum(TestType)
  testType: TestType;

  @ApiProperty({
    description: 'Criteria for selecting the winner',
    enum: WinnerCriteria,
    example: WinnerCriteria.OPEN_RATE,
  })
  @IsEnum(WinnerCriteria)
  winnerCriteria: WinnerCriteria;

  @ApiProperty({
    description: 'Auto-select winner when test completes',
    example: true,
  })
  @IsBoolean()
  autoSelectWinner: boolean;

  @ApiProperty({
    description: 'Test duration in hours',
    example: 24,
    minimum: 1,
    maximum: 168,
  })
  @IsNumber()
  @Min(1)
  @Max(168) // Max 1 week
  testDuration: number;

  @ApiProperty({
    description: 'Confidence level for statistical significance (90-99.9)',
    example: 95,
    minimum: 90,
    maximum: 99.9,
  })
  @IsNumber()
  @Min(90)
  @Max(99.9)
  confidenceLevel: number;

  @ApiProperty({
    description: 'Minimum number of sends per variant before declaring winner',
    example: 100,
    minimum: 50,
  })
  @IsNumber()
  @Min(50)
  minSampleSize: number;

  @ApiProperty({
    description: 'Array of variants (2-5 variants)',
    type: [VariantDto],
    example: [
      {
        label: 'A',
        subject: 'Original Subject',
        splitPercentage: 50,
      },
      {
        label: 'B',
        subject: 'Alternative Subject',
        splitPercentage: 50,
      },
    ],
  })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => VariantDto)
  variants: VariantDto[];
}

/**
 * DTO for updating a variant's content
 */
export class UpdateVariantDto {
  @ApiPropertyOptional({
    description: 'Updated subject line',
    example: 'New Subject',
  })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({
    description: 'Updated content',
    example: '<h1>Updated content</h1>',
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    description: 'Updated from name',
    example: 'Sales Team',
  })
  @IsOptional()
  @IsString()
  fromName?: string;

  @ApiPropertyOptional({
    description: 'Updated split percentage',
    example: 60,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  splitPercentage?: number;
}

/**
 * DTO for sending an A/B test
 */
export class SendAbTestDto {
  @ApiProperty({
    description: 'Campaign ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  campaignId: string;

  @ApiPropertyOptional({
    description: 'Array of subscriber IDs to send to (optional, will use all if not provided)',
    type: [String],
    example: ['sub-1', 'sub-2', 'sub-3'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subscriberIds?: string[];

  @ApiPropertyOptional({
    description: 'Segment IDs to send to (optional)',
    type: [String],
    example: ['seg-1', 'seg-2'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  segmentIds?: string[];
}

/**
 * DTO for manually selecting a winner
 */
export class SelectWinnerDto {
  @ApiProperty({
    description: 'Variant ID to select as winner',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  variantId: string;
}

/**
 * Response DTO for A/B test results
 */
export class AbTestResultDto {
  @ApiProperty({
    description: 'Campaign information',
  })
  campaign: {
    id: string;
    name: string;
    testType: string;
    winnerCriteria: string;
    testStatus: string;
    autoSelectWinner: boolean;
    winnerSelectionDate: Date | null;
    selectedWinnerId: string | null;
  };

  @ApiProperty({
    description: 'Variant statistics',
  })
  variants: Array<{
    id: string;
    label: string;
    status: string;
    sentCount: number;
    openedCount: number;
    clickedCount: number;
    conversionCount: number;
    revenue: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  }>;

  @ApiProperty({
    description: 'Statistical analysis',
  })
  statistics: {
    isSignificant: boolean;
    pValue: number;
    confidenceLevel: number;
    chiSquare: number;
    winner?: string;
    message: string;
    hasMinimumSample: boolean;
    canDeclareWinner: boolean;
  };
}
