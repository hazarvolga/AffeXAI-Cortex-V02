import { IsString, IsEnum, IsOptional, IsBoolean, MaxLength, IsNotEmpty, IsUrl, ValidateIf } from 'class-validator';
import { KnowledgeSourceType } from '../entities/enums/knowledge-source-type.enum';

export class CreateKnowledgeSourceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(KnowledgeSourceType)
  sourceType: KnowledgeSourceType;

  // Document-specific fields
  @ValidateIf(o => o.sourceType === KnowledgeSourceType.DOCUMENT)
  @IsString()
  @IsOptional()
  filePath?: string;

  @ValidateIf(o => o.sourceType === KnowledgeSourceType.DOCUMENT)
  @IsString()
  @IsOptional()
  fileName?: string;

  @ValidateIf(o => o.sourceType === KnowledgeSourceType.DOCUMENT)
  @IsString()
  @IsOptional()
  fileType?: string;

  @ValidateIf(o => o.sourceType === KnowledgeSourceType.DOCUMENT)
  @IsOptional()
  fileSize?: number;

  // URL-specific fields
  @ValidateIf(o => o.sourceType === KnowledgeSourceType.URL)
  @IsUrl()
  @IsNotEmpty()
  url?: string;

  // Text-specific fields
  @ValidateIf(o => o.sourceType === KnowledgeSourceType.TEXT)
  @IsString()
  @IsNotEmpty()
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

  @IsString()
  @IsOptional()
  uploadedById?: string; // Will be set automatically by controller from @CurrentUser()
}
