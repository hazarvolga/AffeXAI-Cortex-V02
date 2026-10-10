import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for splitting a ticket
 */
export class SplitTicketDto {
  @ApiProperty({
    description: 'ID of the original ticket to split',
    example: 'original-ticket-id',
  })
  @IsString()
  @IsNotEmpty()
  originalTicketId: string;

  @ApiProperty({
    description: 'Subject for the new ticket',
    example: 'New issue from split ticket',
  })
  @IsString()
  @IsNotEmpty()
  newTicketSubject: string;

  @ApiProperty({
    description: 'Description for the new ticket',
    example: 'This is a new issue that was split from the original ticket',
  })
  @IsString()
  @IsNotEmpty()
  newTicketDescription: string;

  @ApiPropertyOptional({
    description: 'Priority for the new ticket',
    example: 'medium',
    enum: ['low', 'medium', 'high', 'urgent'],
  })
  @IsOptional()
  @IsString()
  newTicketPriority?: string;

  @ApiPropertyOptional({
    description: 'Category ID for the new ticket',
    example: 'category-id',
  })
  @IsOptional()
  @IsString()
  newTicketCategoryId?: string;

  @ApiPropertyOptional({
    description: 'Array of message IDs to move to the new ticket',
    example: ['message-id-1', 'message-id-2'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  messageIds?: string[];

  @ApiPropertyOptional({
    description: 'Optional note to add to the original ticket explaining the split',
    example: 'Split ticket to separate unrelated issues',
  })
  @IsOptional()
  @IsString()
  splitNote?: string;
}