import { IsString, IsBoolean, IsOptional, IsArray, IsEnum } from 'class-validator';

export class CreateCertificateTemplateDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  htmlContent: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  variables?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  previewImageUrl?: string;

  @IsEnum(['landscape', 'portrait'])
  @IsOptional()
  orientation?: 'landscape' | 'portrait';

  @IsString()
  @IsOptional()
  pageFormat?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
