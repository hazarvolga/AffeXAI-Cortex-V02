import { IsString, IsNotEmpty, IsOptional, IsObject, IsArray, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCmsTemplateDto {
  @ApiProperty({ description: 'Template name', example: 'Modern SaaS Landing' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Template category', example: 'landing' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ description: 'Design system configuration' })
  @IsObject()
  @IsNotEmpty()
  designSystem: Record<string, any>;

  @ApiProperty({ description: 'Array of block instances' })
  @IsArray()
  @IsNotEmpty()
  blocks: Record<string, any>[];

  @ApiPropertyOptional({ description: 'Layout options' })
  @IsObject()
  @IsOptional()
  layoutOptions?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Template metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Preview configuration' })
  @IsObject()
  @IsOptional()
  preview?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Template constraints' })
  @IsObject()
  @IsOptional()
  constraints?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Is featured template', default: false })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Author user ID' })
  @IsString()
  @IsOptional()
  authorId?: string;
}
