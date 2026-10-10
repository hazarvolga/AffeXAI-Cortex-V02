import { IsOptional, IsString, IsUUID, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChatSessionStatus } from '../entities/chat-session.entity';

export class DashboardStatsResponseDto {
  @ApiProperty({ description: 'Number of active chat sessions' })
  activeSessions: number;

  @ApiProperty({ description: 'Number of sessions waiting for support assignment' })
  waitingSessions: number;

  @ApiProperty({ description: 'Total sessions created today' })
  totalSessionsToday: number;

  @ApiProperty({ description: 'Average response time in minutes' })
  avgResponseTime: number;

  @ApiProperty({ description: 'Average resolution time in minutes' })
  avgResolutionTime: number;

  @ApiProperty({ description: 'Customer satisfaction score (1-5)' })
  customerSatisfactionScore: number;

  @ApiProperty({ description: 'Escalation rate as percentage' })
  escalationRate: number;
}

export class SupportAgentStatsResponseDto {
  @ApiProperty({ description: 'Support agent user ID' })
  userId: string;

  @ApiProperty({ description: 'Support agent full name' })
  userName: string;

  @ApiProperty({ description: 'Support agent email' })
  email: string;

  @ApiProperty({ description: 'Number of active sessions assigned' })
  activeSessions: number;

  @ApiProperty({ description: 'Number of sessions completed today' })
  completedToday: number;

  @ApiProperty({ description: 'Average response time in minutes' })
  avgResponseTime: number;

  @ApiProperty({ description: 'Average resolution time in minutes' })
  avgResolutionTime: number;

  @ApiProperty({ description: 'Customer rating (1-5)' })
  customerRating: number;

  @ApiProperty({ description: 'Whether agent is currently online' })
  isOnline: boolean;

  @ApiProperty({ description: 'Last activity timestamp' })
  lastActivity: Date;

  @ApiProperty({ description: 'Workload capacity as percentage' })
  workloadCapacity: number;
}

export class SessionOverviewResponseDto {
  @ApiProperty({ description: 'Session ID' })
  id: string;

  @ApiProperty({ description: 'Customer user ID' })
  userId: string;

  @ApiProperty({ description: 'Customer full name' })
  customerName: string;

  @ApiProperty({ description: 'Customer email' })
  customerEmail: string;

  @ApiProperty({ description: 'Session status', enum: ChatSessionStatus })
  status: ChatSessionStatus;

  @ApiProperty({ description: 'Session creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last message timestamp' })
  lastMessageAt: Date;

  @ApiProperty({ description: 'Total number of messages' })
  messageCount: number;

  @ApiPropertyOptional({ description: 'Assigned support agent info' })
  assignedSupport?: {
    userId: string;
    userName: string;
    assignedAt: Date;
  };

  @ApiProperty({ description: 'Session urgency level' })
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';

  @ApiProperty({ description: 'Whether session has unread messages' })
  hasUnreadMessages: boolean;

  @ApiProperty({ description: 'Waiting time in minutes' })
  waitingTime: number;

  @ApiProperty({ description: 'Session tags' })
  tags: string[];
}

export class EscalationAlertResponseDto {
  @ApiProperty({ description: 'Session ID' })
  sessionId: string;

  @ApiProperty({ description: 'Customer name' })
  customerName: string;

  @ApiProperty({ description: 'User ID who escalated' })
  escalatedBy: string;

  @ApiProperty({ description: 'Name of user who escalated' })
  escalatedByName: string;

  @ApiProperty({ description: 'Reason for escalation' })
  escalationReason: string;

  @ApiProperty({ description: 'Urgency level' })
  urgencyLevel: 'high' | 'critical';

  @ApiProperty({ description: 'Escalation timestamp' })
  escalatedAt: Date;

  @ApiProperty({ description: 'Waiting time since escalation in minutes' })
  waitingTime: number;
}

export class RealTimeMetricsResponseDto {
  @ApiProperty({ description: 'Number of currently active support agents' })
  activeAgents: number;

  @ApiProperty({ description: 'Number of sessions in queue waiting for assignment' })
  queueLength: number;

  @ApiProperty({ description: 'Average wait time for queued sessions in minutes' })
  avgWaitTime: number;

  @ApiProperty({ description: 'Response rate percentage (sessions responded to within SLA)' })
  responseRate: number;
}

export class DashboardQueryDto {
  @ApiPropertyOptional({ description: 'Start date for statistics (ISO string)' })
  @IsString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'End date for statistics (ISO string)' })
  @IsString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Specific support agent ID to filter by' })
  @IsUUID()
  @IsOptional()
  agentId?: string;
}

export class SessionOverviewQueryDto {
  @ApiPropertyOptional({ description: 'Filter by session status', enum: ChatSessionStatus })
  @IsEnum(ChatSessionStatus)
  @IsOptional()
  status?: ChatSessionStatus;

  @ApiPropertyOptional({ description: 'Filter by assigned support user ID' })
  @IsUUID()
  @IsOptional()
  assignedTo?: string;

  @ApiPropertyOptional({ description: 'Maximum number of sessions to return', minimum: 1, maximum: 100 })
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;
}