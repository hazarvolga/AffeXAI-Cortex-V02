import { IsString, IsEnum, IsOptional, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { KnowledgeSourceType } from '../entities/enums/knowledge-source-type.enum';
import { KnowledgeSourceStatus } from '../entities/enums/knowledge-source-status.enum';

export class QueryKnowledgeSourceDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(KnowledgeSourceType)
  @IsOptional()
  sourceType?: KnowledgeSourceType;

  @IsEnum(KnowledgeSourceStatus)
  @IsOptional()
  status?: KnowledgeSourceStatus;

  @IsString()
  @IsOptional()
  uploadedById?: string;

  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  enableForFaqLearning?: boolean;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  enableForChat?: boolean;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  offset?: number = 0;

  @IsString()
  @IsOptional()
  sortBy?: 'createdAt' | 'usageCount' | 'averageRelevanceScore' | 'title' = 'createdAt';

  @IsString()
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
