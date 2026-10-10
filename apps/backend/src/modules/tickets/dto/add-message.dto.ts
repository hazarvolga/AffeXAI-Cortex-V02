import { IsString, IsNotEmpty, IsBoolean, IsOptional, MinLength, IsArray, IsUUID, ArrayMaxSize, ArrayUnique } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for adding a message to a ticket
 */
export class AddMessageDto {
  @ApiProperty({
    description: 'Message content (plain text)',
    example: 'Merhaba, lütfen lisans anahtarınızı tekrar kontrol edin ve doğru girdiğinizden emin olun.',
    minLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  content: string;

  @ApiPropertyOptional({
    description: 'Message content (HTML formatted)',
    example: '<p>Merhaba,</p><p>Lütfen <strong>lisans anahtarınızı</strong> tekrar kontrol edin.</p>',
  })
  @IsOptional()
  @IsString()
  htmlContent?: string;

  @ApiPropertyOptional({
    description: 'Whether this is an internal note (not visible to customer)',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;

  @ApiPropertyOptional({
    description: 'Array of attachment IDs (media files)',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsUUID('all', {each:true})
  attachmentIds?: string[];

  @ApiPropertyOptional({
    description: 'Content type of the message',
    example: 'html',
    enum: ['plain', 'html'],
  })
  @IsOptional()
  contentType?: 'plain' | 'html';
}
