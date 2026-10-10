import { IsString, IsEnum, IsOptional, IsBoolean, MaxLength, IsUrl } from 'class-validator';
import { KnowledgeSourceStatus } from '../entities/enums/knowledge-source-status.enum';

export class UpdateKnowledgeSourceDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(KnowledgeSourceStatus)
  @IsOptional()
  status?: KnowledgeSourceStatus;

  @IsUrl()
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  extractedContent?: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];

  @IsOptional()
  metadata?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  enableForFaqLearning?: boolean;

  @IsBoolean()
  @IsOptional()
  enableForChat?: boolean;
}
