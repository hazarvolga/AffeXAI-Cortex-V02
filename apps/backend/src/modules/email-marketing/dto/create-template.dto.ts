import { IsString, IsOptional, MinLength, IsBoolean, IsEnum, IsObject } from 'class-validator';
import { CreateTemplateDto as ICreateTemplateDto, TemplateType } from '@affexai/shared-types';

export class CreateEmailTemplateDto implements ICreateTemplateDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsEnum(TemplateType)
  @IsOptional()
  type?: TemplateType | string;

  @IsString()
  @IsOptional()
  fileTemplateName?: string;

  @IsOptional()
  variables?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  // Email Builder structure (JSONB)
  @IsOptional()
  @IsObject()
  structure?: {
    rows: Array<{
      id: string;
      type: string;
      columns: Array<{
        id: string;
        width: string;
        blocks: Array<{
          id: string;
          type: string;
          properties: Record<string, any>;
          styles: Record<string, any>;
        }>;
      }>;
      settings: Record<string, any>;
    }>;
    settings: {
      backgroundColor?: string;
      contentWidth?: string;
      fonts?: string[];
    };
  };
}