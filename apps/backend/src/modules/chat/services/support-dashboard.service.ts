import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { ChatSession, ChatSessionStatus } from '../entities/chat-session.entity';
import { ChatMessage, ChatMessageSenderType } from '../entities/chat-message.entity';
import { ChatSupportAssignment, AssignmentStatus, AssignmentType } from '../entities/chat-support-assignment.entity';
import { User } from '../../users/entities/user.entity';
import { ChatSupportAssignmentService } from './chat-support-assignment.service';
import { TenantService } from '../../../core/tenant/tenant.service';

export interface DashboardStats {
  activeSessions: number;
  waitingSessions: number;
  totalSessionsToday: number;
  avgResponseTime: number; // in minutes
  avgResolutionTime: number; // in minutes
  customerSatisfactionScore: number;
  escalationRate: number; // percentage
}

export interface SupportAgentStats {
  userId: string;
  userName: string;
  email: string;
  activeSessions: number;
  completedToday: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  customerRating: number;
  isOnline: boolean;
  lastActivity: Date;
  workloadCapacity: number; // percentage of max capacity
}

export interface SessionOverview {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  status: ChatSessionStatus;
  createdAt: Date;
  lastMessageAt: Date;
  messageCount: number;
  assignedSupport?: {
    userId: string;
    userName: string;
    assignedAt: Date;
  };
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  hasUnreadMessages: boolean;
  waitingTime: number; // in minutes
  tags: string[];
}

export interface EscalationAlert {
  sessionId: string;
  customerName: string;
  escalatedBy: string;
  escalatedByName: string;
  escalationReason: string;
  urgencyLevel: 'high' | 'critical';
  escalatedAt: Date;
  waitingTime: number;
}

@Injectable()
export class SupportDashboardService {
  private readonly logger = new Logger(SupportDashboardService.name);

  constructor(
    @InjectRepository(ChatSession)
    private readonly sessionRepository: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly messageRepository: Repository<ChatMessage>,
    @InjectRepository(ChatSupportAssignment)
    private readonly assignmentRepository: Repository<ChatSupportAssignment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly supportAssignmentService: ChatSupportAssignmentService,
    private readonly tenantService: TenantService,
  ) { }

  /**
   * Get overall dashboard statistics
   */
  async getDashboardStats(dateFrom?: Date, dateTo?: Date): Promise<DashboardStats> {
    const tenantId = this.tenantService.getTenantId();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const fromDate = dateFrom || today;
    const toDate = dateTo || tomorrow;

    // Get active sessions
    const activeSessions = await this.sessionRepository.count({
      where: { status: ChatSessionStatus.ACTIVE, tenantId }
    });

    // Get sessions waiting for support (no active assignment)
    const allActiveSessions = await this.sessionRepository.find({
      where: { status: ChatSessionStatus.ACTIVE, tenantId },
      relations: ['supportAssignments']
    });

    const waitingSessions = allActiveSessions.filter(session =>
      !session.supportAssignments?.some(assignment => assignment.status === AssignmentStatus.ACTIVE)
    ).length;

    // Get total sessions created today
    const totalSessionsToday = await this.sessionRepository.count({
      where: {
        createdAt: Between(fromDate, toDate),
        tenantId
      }
    });

    // Calculate average response time (time from session creation to first support message)
    const avgResponseTime = await this.calculateAverageResponseTime(tenantId, fromDate, toDate);

    // Calculate average resolution time (time from assignment to completion)
    const avgResolutionTime = await this.calculateAverageResolutionTime(tenantId, fromDate, toDate);

    // Calculate customer satisfaction (placeholder - would need actual rating system)
    const customerSatisfactionScore = 4.2; // Placeholder

    // Calculate escalation rate
    const escalationRate = await this.calculateEscalationRate(tenantId, fromDate, toDate);

    return {
      activeSessions,
      waitingSessions,
      totalSessionsToday,
      avgResponseTime,
      avgResolutionTime,
      customerSatisfactionScore,
      escalationRate,
    };
  }

  /**
   * Get support agent statistics
   */
  async getSupportAgentStats(userId?: string): Promise<SupportAgentStats[]> {
    const tenantId = this.tenantService.getTenantId();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get support team members
    let supportUsers: User[];

    if (userId) {
      const user = await this.userRepository.findOne({
        where: { id: userId, tenantId },
        relations: ['userRoles', 'userRoles.role']
      });
      supportUsers = user ? [user] : [];
    } else {
      supportUsers = await this.userRepository.find({
        where: {
          tenantId,
          userRoles: {
            role: {
              name: In(['support', 'manager', 'admin'])
            }
          },
          isActive: true
        },
        relations: ['userRoles', 'userRoles.role']
      });
    }

    const agentStats: SupportAgentStats[] = [];

    for (const user of supportUsers) {
      // Get active assignments
      const activeAssignments = await this.assignmentRepository.count({
        where: { supportUserId: user.id, status: AssignmentStatus.ACTIVE, tenantId }
      });

      // Get completed assignments today
      const completedToday = await this.assignmentRepository.count({
        where: {
          supportUserId: user.id,
          status: AssignmentStatus.COMPLETED,
          completedAt: Between(today, tomorrow),
          tenantId
        }
      });

      // Calculate average response time for this agent
      const avgResponseTime = await this.calculateAgentResponseTime(tenantId, user.id, today, tomorrow);

      // Calculate average resolution time for this agent
      const avgResolutionTime = await this.calculateAgentResolutionTime(tenantId, user.id, today, tomorrow);

      // Determine workload capacity
      const userRoles = user.userRoles?.map(ur => ur.role?.name) || [];
      const isManager = userRoles.includes('manager') || userRoles.includes('admin');
      const maxAssignments = isManager ? 10 : 5;
      const workloadCapacity = (activeAssignments / maxAssignments) * 100;

      agentStats.push({
        userId: user.id,
        userName: user.fullName,
        email: user.email,
        activeSessions: activeAssignments,
        completedToday,
        avgResponseTime,
        avgResolutionTime,
        customerRating: 4.5, // Placeholder
        isOnline: true, // Placeholder - would check WebSocket connections
        lastActivity: user.lastLoginAt || new Date(),
        workloadCapacity: Math.min(workloadCapacity, 100),
      });
    }

    return agentStats.sort((a, b) => b.activeSessions - a.activeSessions);
  }

  /**
   * Get session overview for dashboard
   */
  async getSessionOverview(
    status?: ChatSessionStatus,
    assignedTo?: string,
    limit: number = 50
  ): Promise<SessionOverview[]> {
    const tenantId = this.tenantService.getTenantId();
    const whereConditions: any = { tenantId };

    if (status) {
      whereConditions.status = status;
    }

    let sessions = await this.sessionRepository.find({
      where: whereConditions,
      relations: ['user', 'supportAssignments', 'supportAssignments.supportUser', 'messages'],
      order: { updatedAt: 'DESC' },
      take: limit
    });

    // Filter by assigned support user if specified
    if (assignedTo) {
      sessions = sessions.filter(session =>
        session.supportAssignments?.some(assignment =>
          assignment.supportUserId === assignedTo && assignment.status === AssignmentStatus.ACTIVE
        )
      );
    }

    const sessionOverviews: SessionOverview[] = [];

    for (const session of sessions) {
      // Get last message timestamp
      const lastMessage = session.messages?.sort((a, b) =>
        b.createdAt.getTime() - a.createdAt.getTime()
      )[0];

      // Get active assignment
      const activeAssignment = session.supportAssignments?.find(
        assignment => assignment.status === AssignmentStatus.ACTIVE
      );

      // Calculate waiting time
      const waitingTime = activeAssignment
        ? 0
        : Math.floor((Date.now() - session.createdAt.getTime()) / (1000 * 60));

      // Determine urgency level (simplified logic)
      const urgencyLevel = this.determineSessionUrgency(session, waitingTime);

      // Check for unread messages (placeholder logic)
      const hasUnreadMessages = lastMessage?.senderType === ChatMessageSenderType.USER;

      // Extract tags from session metadata
      const tags = session.metadata?.tags || [];

      sessionOverviews.push({
        id: session.id,
        userId: session.userId,
        customerName: session.user?.fullName || 'Unknown User',
        customerEmail: session.user?.email || 'unknown@example.com',
        status: session.status,
        createdAt: session.createdAt,
        lastMessageAt: lastMessage?.createdAt || session.createdAt,
        messageCount: session.messages?.length || 0,
        assignedSupport: activeAssignment ? {
          userId: activeAssignment.supportUserId,
          userName: activeAssignment.supportUser?.fullName || 'Unknown',
          assignedAt: activeAssignment.assignedAt,
        } : undefined,
        urgencyLevel,
        hasUnreadMessages,
        waitingTime,
        tags,
      });
    }

    return sessionOverviews;
  }

  /**
   * Get escalation alerts
   */
  async getEscalationAlerts(): Promise<EscalationAlert[]> {
    const tenantId = this.tenantService.getTenantId();
    const escalatedAssignments = await this.assignmentRepository.find({
      where: {
        tenantId,
        assignmentType: AssignmentType.ESCALATED,
        status: AssignmentStatus.ACTIVE
      },
      relations: ['session', 'session.user', 'assignedByUser'],
      order: { assignedAt: 'DESC' }
    });

    const alerts: EscalationAlert[] = [];

    for (const assignment of escalatedAssignments) {
      const waitingTime = Math.floor((Date.now() - assignment.assignedAt.getTime()) / (1000 * 60));

      // Determine urgency based on waiting time and notes
      const urgencyLevel = assignment.notes?.toLowerCase().includes('critical') || waitingTime > 60
        ? 'critical' as const
        : 'high' as const;

      alerts.push({
        sessionId: assignment.sessionId,
        customerName: assignment.session?.user?.fullName || 'Unknown User',
        escalatedBy: assignment.assignedBy || 'Unknown',
        escalatedByName: assignment.assignedByUser?.fullName || 'Unknown',
        escalationReason: assignment.notes || 'No reason provided',
        urgencyLevel,
        escalatedAt: assignment.assignedAt,
        waitingTime,
      });
    }

    return alerts;
  }

  /**
   * Get real-time metrics for dashboard
   */
  async getRealTimeMetrics(): Promise<{
    activeAgents: number;
    queueLength: number;
    avgWaitTime: number;
    responseRate: number;
  }> {
    const tenantId = this.tenantService.getTenantId();
    // Count active support agents (placeholder - would check WebSocket connections)
    const activeAgents = await this.userRepository.count({
      where: {
        tenantId,
        userRoles: {
          role: {
            name: In(['support', 'manager', 'admin'])
          }
        },
        isActive: true
      }
    });

    // Get queue length (sessions waiting for assignment)
    const allActiveSessions = await this.sessionRepository.find({
      where: { status: ChatSessionStatus.ACTIVE, tenantId },
      relations: ['supportAssignments']
    });

    const queueLength = allActiveSessions.filter(session =>
      !session.supportAssignments?.some(assignment => assignment.status === AssignmentStatus.ACTIVE)
    ).length;

    // Calculate average wait time for queued sessions
    const queuedSessions = allActiveSessions.filter(session =>
      !session.supportAssignments?.some(assignment => assignment.status === AssignmentStatus.ACTIVE)
    );

    const avgWaitTime = queuedSessions.length > 0
      ? queuedSessions.reduce((sum, session) => {
        const waitTime = (Date.now() - session.createdAt.getTime()) / (1000 * 60);
        return sum + waitTime;
      }, 0) / queuedSessions.length
      : 0;

    // Calculate response rate (sessions responded to within 5 minutes)
    const responseRate = 85; // Placeholder

    return {
      activeAgents,
      queueLength,
      avgWaitTime: Math.round(avgWaitTime),
      responseRate,
    };
  }

  /**
   * Calculate average response time
   */
  private async calculateAverageResponseTime(tenantId: string, fromDate: Date, toDate: Date): Promise<number> {
    // This would need complex query to calculate time from session creation to first support response
    // Placeholder implementation
    return 8; // 8 minutes average
  }

  /**
   * Calculate average resolution time
   */
  private async calculateAverageResolutionTime(tenantId: string, fromDate: Date, toDate: Date): Promise<number> {
    const completedAssignments = await this.assignmentRepository.find({
      where: {
        tenantId,
        status: AssignmentStatus.COMPLETED,
        completedAt: Between(fromDate, toDate)
      }
    });

    if (completedAssignments.length === 0) return 0;

    const totalTime = completedAssignments.reduce((sum, assignment) => {
      const duration = assignment.completedAt!.getTime() - assignment.assignedAt.getTime();
      return sum + duration;
    }, 0);

    return Math.round(totalTime / completedAssignments.length / (1000 * 60)); // Convert to minutes
  }

  /**
   * Calculate escalation rate
   */
  private async calculateEscalationRate(tenantId: string, fromDate: Date, toDate: Date): Promise<number> {
    const totalAssignments = await this.assignmentRepository.count({
      where: { assignedAt: Between(fromDate, toDate), tenantId }
    });

    const escalatedAssignments = await this.assignmentRepository.count({
      where: {
        tenantId,
        assignmentType: AssignmentType.ESCALATED,
        assignedAt: Between(fromDate, toDate)
      }
    });

    return totalAssignments > 0 ? (escalatedAssignments / totalAssignments) * 100 : 0;
  }

  /**
   * Calculate agent-specific response time
   */
  private async calculateAgentResponseTime(tenantId: string, userId: string, fromDate: Date, toDate: Date): Promise<number> {
    // Placeholder implementation
    return 6; // 6 minutes average
  }

  /**
   * Calculate agent-specific resolution time
   */
  private async calculateAgentResolutionTime(tenantId: string, userId: string, fromDate: Date, toDate: Date): Promise<number> {
    const completedAssignments = await this.assignmentRepository.find({
      where: {
        tenantId,
        supportUserId: userId,
        status: AssignmentStatus.COMPLETED,
        completedAt: Between(fromDate, toDate)
      }
    });

    if (completedAssignments.length === 0) return 0;

    const totalTime = completedAssignments.reduce((sum, assignment) => {
      const duration = assignment.completedAt!.getTime() - assignment.assignedAt.getTime();
      return sum + duration;
    }, 0);

    return Math.round(totalTime / completedAssignments.length / (1000 * 60));
  }

  /**
   * Determine session urgency level
   */
  private determineSessionUrgency(session: ChatSession, waitingTime: number): 'low' | 'medium' | 'high' | 'critical' {
    // Check for urgent keywords in session metadata or recent messages
    const urgentKeywords = ['urgent', 'critical', 'emergency', 'broken', 'down'];
    const sessionContent = JSON.stringify(session.metadata || {}).toLowerCase();

    if (urgentKeywords.some(keyword => sessionContent.includes(keyword))) {
      return 'critical';
    }

    // Check waiting time
    if (waitingTime > 60) return 'critical';
    if (waitingTime > 30) return 'high';
    if (waitingTime > 15) return 'medium';

    return 'low';
  }
}