import { IsArray, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for merging tickets
 */
export class MergeTicketsDto {
  @ApiProperty({
    description: 'Array of ticket IDs to merge into the target ticket',
    example: ['ticket-id-1', 'ticket-id-2'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  ticketIds: string[];

  @ApiProperty({
    description: 'Target ticket ID where other tickets will be merged into',
    example: 'target-ticket-id',
  })
  @IsString()
  @IsNotEmpty()
  targetTicketId: string;

  @ApiPropertyOptional({
    description: 'Optional note to add to the target ticket explaining the merge',
    example: 'Merged duplicate tickets for the same issue',
  })
  @IsOptional()
  @IsString()
  mergeNote?: string;
}