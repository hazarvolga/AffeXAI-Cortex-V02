import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for assigning a ticket to a support agent
 */
export class AssignTicketDto {
  @ApiProperty({
    description: 'User ID of the support agent to assign the ticket to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  assignedToId: string;
}
