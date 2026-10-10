import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImportTemplateDto {
  @ApiProperty({ description: 'Template JSON data as string' })
  @IsString()
  @IsNotEmpty()
  templateData: string;

  @ApiPropertyOptional({ description: 'Override author ID' })
  @IsString()
  @IsOptional()
  authorId?: string;
}

export class ExportTemplateResponseDto {
  @ApiProperty({ description: 'Template ID' })
  id: string;

  @ApiProperty({ description: 'Template name' })
  name: string;

  @ApiProperty({ description: 'Exported template data' })
  data: Record<string, any>;

  @ApiProperty({ description: 'Export timestamp' })
  exportedAt: Date;
}
