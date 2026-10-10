import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum, IsArray, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketPriority } from '../enums/ticket-priority.enum';

/**
 * DTO for creating a ticket template
 */
export class CreateTicketTemplateDto {
  @ApiProperty({
    description: 'Template name',
    example: 'Password Reset Request',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Template description',
    example: 'Template for password reset requests',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Default ticket subject',
    example: 'Unable to reset password',
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    description: 'Default ticket content/description',
    example: 'I am unable to reset my password using the reset link.',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description: 'Default priority',
    enum: TicketPriority,
    example: TicketPriority.MEDIUM,
  })
  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;

  @ApiPropertyOptional({
    description: 'Default category ID',
    example: 'category-uuid',
  })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Default tags',
    example: ['password', 'authentication'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  defaultTags?: string[];

  @ApiPropertyOptional({
    description: 'Custom fields for the template',
    example: { affectedSystem: 'Login System' },
  })
  @IsObject()
  @IsOptional()
  customFields?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Is template publicly available',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
