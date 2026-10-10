import { IsUUID, IsOptional, IsString, IsEnum, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssignmentType } from '../entities/chat-support-assignment.entity';

export class CreateSupportAssignmentDto {
  @ApiProperty({ description: 'Chat session ID' })
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ description: 'Support user ID to assign' })
  @IsUUID()
  @IsNotEmpty()
  supportUserId: string;

  @ApiPropertyOptional({ description: 'User ID who made the assignment' })
  @IsUUID()
  @IsOptional()
  assignedBy?: string;

  @ApiPropertyOptional({ 
    description: 'Type of assignment',
    enum: AssignmentType,
    default: AssignmentType.MANUAL
  })
  @IsEnum(AssignmentType)
  @IsOptional()
  assignmentType?: AssignmentType;

  @ApiPropertyOptional({ description: 'Assignment notes', maxLength: 1000 })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}

export class TransferSupportAssignmentDto {
  @ApiProperty({ description: 'Chat session ID' })
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ description: 'Current support user ID' })
  @IsUUID()
  @IsNotEmpty()
  fromSupportUserId: string;

  @ApiProperty({ description: 'New support user ID' })
  @IsUUID()
  @IsNotEmpty()
  toSupportUserId: string;

  @ApiProperty({ description: 'User ID who initiated the transfer' })
  @IsUUID()
  @IsNotEmpty()
  transferredBy: string;

  @ApiPropertyOptional({ description: 'Transfer notes', maxLength: 1000 })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}

export class EscalateSupportAssignmentDto {
  @ApiProperty({ description: 'Chat session ID' })
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ description: 'User ID who initiated the escalation' })
  @IsUUID()
  @IsNotEmpty()
  escalatedBy: string;

  @ApiPropertyOptional({ description: 'Escalation notes', maxLength: 1000 })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}

export class CompleteSupportAssignmentDto {
  @ApiProperty({ description: 'Chat session ID' })
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ description: 'Support user ID completing the assignment' })
  @IsUUID()
  @IsNotEmpty()
  supportUserId: string;

  @ApiPropertyOptional({ description: 'Completion notes', maxLength: 1000 })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}

export class SupportAssignmentQueryDto {
  @ApiPropertyOptional({ description: 'Support user ID to filter by' })
  @IsUUID()
  @IsOptional()
  supportUserId?: string;

  @ApiPropertyOptional({ description: 'Chat session ID to filter by' })
  @IsUUID()
  @IsOptional()
  sessionId?: string;

  @ApiPropertyOptional({ description: 'Assignment status to filter by' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Date from (ISO string)' })
  @IsString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Date to (ISO string)' })
  @IsString()
  @IsOptional()
  dateTo?: string;
}

export class SupportTeamAvailabilityResponseDto {
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'User full name' })
  userName: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'Whether user is currently online' })
  isOnline: boolean;

  @ApiProperty({ description: 'Number of active assignments' })
  activeAssignments: number;

  @ApiProperty({ description: 'Maximum assignments allowed' })
  maxAssignments: number;

  @ApiProperty({ description: 'Whether user is available for new assignments' })
  isAvailable: boolean;

  @ApiPropertyOptional({ description: 'Last activity timestamp' })
  lastActivity?: Date;
}

export class AssignmentStatsResponseDto {
  @ApiProperty({ description: 'Total number of assignments' })
  totalAssignments: number;

  @ApiProperty({ description: 'Number of active assignments' })
  activeAssignments: number;

  @ApiProperty({ description: 'Number of completed assignments' })
  completedAssignments: number;

  @ApiProperty({ description: 'Number of transferred assignments' })
  transferredAssignments: number;

  @ApiProperty({ description: 'Number of escalated assignments' })
  escalatedAssignments: number;

  @ApiProperty({ description: 'Number of auto assignments' })
  autoAssignments: number;

  @ApiProperty({ description: 'Average resolution time in minutes' })
  avgResolutionTimeMinutes: number;
}

export class AssignmentNotificationDto {
  @ApiProperty({ description: 'Notification type' })
  type: 'assignment' | 'transfer' | 'escalation' | 'completion';

  @ApiProperty({ description: 'Chat session ID' })
  sessionId: string;

  @ApiProperty({ description: 'Support user ID' })
  supportUserId: string;

  @ApiProperty({ description: 'Support user name' })
  supportUserName: string;

  @ApiPropertyOptional({ description: 'User ID who initiated the action' })
  assignedBy?: string;

  @ApiPropertyOptional({ description: 'Name of user who initiated the action' })
  assignedByName?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  notes?: string;

  @ApiProperty({ description: 'Notification timestamp' })
  timestamp: Date;
}