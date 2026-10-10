import { IsString, IsEnum, IsArray, IsOptional, IsNumber, IsObject, ValidateNested, Min, Max, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ABTestStatus } from '../entities';

export class ABTestVariantDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  componentConfig: Record<string, any>;

  @IsNumber()
  @Min(0)
  @Max(100)
  trafficAllocation: number;
}

export class TargetAudienceDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  countries?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  devices?: ('mobile' | 'tablet' | 'desktop')[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  userSegments?: string[];
}

export class CreateABTestDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  componentId: string;

  @IsString()
  componentType: string;

  @IsEnum(ABTestStatus)
  @IsOptional()
  status?: ABTestStatus;

  @IsDateString()
  periodStart: string;

  @IsDateString()
  @IsOptional()
  periodEnd?: string;

  @IsString()
  conversionGoal: string;

  @ValidateNested()
  @Type(() => TargetAudienceDto)
  @IsOptional()
  targetAudience?: TargetAudienceDto;

  @ValidateNested({ each: true })
  @Type(() => ABTestVariantDto)
  @IsArray()
  variants: ABTestVariantDto[];
}

export class UpdateABTestDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ABTestStatus)
  @IsOptional()
  status?: ABTestStatus;

  @IsDateString()
  @IsOptional()
  periodEnd?: string;

  @IsString()
  @IsOptional()
  winnerVariantId?: string;

  @IsNumber()
  @IsOptional()
  confidenceLevel?: number;
}
