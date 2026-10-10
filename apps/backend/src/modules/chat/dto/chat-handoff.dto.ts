import { IsUUID, IsString, IsOptional, IsEnum, IsBoolean, IsArray, MaxLength, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UrgencyLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export type UrgencyLevelType = 'low' | 'medium' | 'high' | 'critical';

export class ExecuteHandoffDto {
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

  @ApiProperty({ description: 'Reason for handoff', maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  handoffReason: string;

  @ApiPropertyOptional({ description: 'Private notes for support team', maxLength: 1000 })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  privateNotes?: string;

  @ApiPropertyOptional({ description: 'User ID who initiated the transfer' })
  @IsUUID()
  @IsOptional()
  transferredBy?: string;
}

export class ExecuteEscalationDto {
  @ApiProperty({ description: 'Chat session ID' })
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ description: 'User ID who initiated escalation' })
  @IsUUID()
  @IsNotEmpty()
  escalatedBy: string;

  @ApiProperty({ description: 'Reason for escalation', maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  escalationReason: string;

  @ApiPropertyOptional({ 
    description: 'Urgency level',
    enum: UrgencyLevel,
    default: UrgencyLevel.HIGH
  })
  @IsEnum(UrgencyLevel)
  @IsOptional()
  urgencyLevel?: UrgencyLevel;

  @ApiPropertyOptional({ description: 'Private escalation notes', maxLength: 1000 })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  privateNotes?: string;
}

export class AddHandoffNoteDto {
  @ApiProperty({ description: 'Chat session ID' })
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ description: 'Note content', maxLength: 2000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;

  @ApiPropertyOptional({ description: 'Whether note is private to support team', default: false })
  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;

  @ApiPropertyOptional({ description: 'Tags for categorizing the note' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class HandoffContextResponseDto {
  @ApiProperty({ description: 'Chat session ID' })
  sessionId: string;

  @ApiProperty({ description: 'Previous messages for context' })
  previousMessages: any[];

  @ApiProperty({ description: 'Generated context summary' })
  contextSummary: string;

  @ApiProperty({ description: 'Customer information' })
  customerInfo: {
    userId: string;
    userName: string;
    email: string;
  };

  @ApiProperty({ description: 'Previous support assignments' })
  previousAssignments: any[];

  @ApiProperty({ description: 'Session metadata' })
  sessionMetadata: any;

  @ApiProperty({ description: 'Reason for handoff' })
  handoffReason: string;

  @ApiProperty({ description: 'Urgency level', enum: UrgencyLevel })
  urgencyLevel: UrgencyLevel;
}

export class HandoffNoteResponseDto {
  @ApiProperty({ description: 'Note ID' })
  id: string;

  @ApiProperty({ description: 'Chat session ID' })
  sessionId: string;

  @ApiProperty({ description: 'Author user ID' })
  authorId: string;

  @ApiProperty({ description: 'Author name' })
  authorName: string;

  @ApiProperty({ description: 'Note content' })
  content: string;

  @ApiProperty({ description: 'Whether note is private' })
  isPrivate: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Note tags' })
  tags?: string[];
}

export class HandoffHistoryResponseDto {
  @ApiProperty({ description: 'Transfer history' })
  transfers: any[];

  @ApiProperty({ description: 'Escalation history' })
  escalations: any[];

  @ApiProperty({ description: 'Handoff notes', type: [HandoffNoteResponseDto] })
  notes: HandoffNoteResponseDto[];
}

export class HandoffNotificationDto {
  @ApiProperty({ description: 'Notification type' })
  type: 'handoff-received' | 'escalation-received' | 'escalation-alert';

  @ApiProperty({ description: 'Chat session ID' })
  sessionId: string;

  @ApiProperty({ description: 'Customer information' })
  customerInfo: {
    userId: string;
    userName: string;
    email: string;
  };

  @ApiProperty({ description: 'Context summary' })
  contextSummary: string;

  @ApiProperty({ description: 'Urgency level', enum: UrgencyLevel })
  urgencyLevel: UrgencyLevel;

  @ApiProperty({ description: 'Handoff or escalation reason' })
  handoffReason?: string;
  escalationReason?: string;

  @ApiProperty({ description: 'Number of previous messages' })
  messageCount: number;

  @ApiProperty({ description: 'Notification timestamp' })
  timestamp: Date;
}