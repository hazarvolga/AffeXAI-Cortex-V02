import { IsString, IsEmail, IsOptional, IsArray, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for inbound email webhook
 * Format matches Resend webhook payload
 */
export class InboundEmailDto {
  @ApiProperty({
    description: 'Sender email address',
    example: 'customer@example.com',
  })
  @IsEmail()
  from: string;

  @ApiPropertyOptional({
    description: 'Sender name',
    example: 'John Doe',
  })
  @IsString()
  @IsOptional()
  from_name?: string;

  @ApiProperty({
    description: 'Recipient email address (ticket-{id}@affexai.com)',
    example: 'ticket-123@affexai.com',
  })
  @IsEmail()
  to: string;

  @ApiProperty({
    description: 'Email subject',
    example: 'Re: Support Ticket #SUP-00043',
  })
  @IsString()
  subject: string;

  @ApiProperty({
    description: 'Plain text email body',
    example: 'This is my reply to the ticket...',
  })
  @IsString()
  text: string;

  @ApiPropertyOptional({
    description: 'HTML email body',
    example: '<p>This is my reply to the ticket...</p>',
  })
  @IsString()
  @IsOptional()
  html?: string;

  @ApiPropertyOptional({
    description: 'In-Reply-To message ID for threading',
    example: '<ticket-123-created-1234567890@affexai.com>',
  })
  @IsString()
  @IsOptional()
  in_reply_to?: string;

  @ApiPropertyOptional({
    description: 'References message IDs for threading',
    example: ['<ticket-123-created-1234567890@affexai.com>'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  references?: string[];

  @ApiProperty({
    description: 'Message ID of this email',
    example: '<unique-message-id@gmail.com>',
  })
  @IsString()
  message_id: string;

  @ApiPropertyOptional({
    description: 'Email received timestamp',
    example: '2025-01-29T10:30:00Z',
  })
  @IsDateString()
  @IsOptional()
  received_at?: string;

  @ApiPropertyOptional({
    description: 'Email attachments',
    example: [],
  })
  @IsArray()
  @IsOptional()
  attachments?: any[];
}
