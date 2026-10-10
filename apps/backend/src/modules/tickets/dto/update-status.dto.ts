import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TicketStatus } from '../enums/ticket-status.enum';

/**
 * DTO for updating ticket status
 */
export class UpdateStatusDto {
  @ApiProperty({
    description: 'New status for the ticket',
    enum: TicketStatus,
    example: TicketStatus.OPEN,
  })
  @IsEnum(TicketStatus)
  @IsNotEmpty()
  status: TicketStatus;
}
