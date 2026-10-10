import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ChatSupportAssignment, AssignmentType, AssignmentStatus } from '../entities/chat-support-assignment.entity';
import { ChatSession } from '../entities/chat-session.entity';
import { User } from '../../users/entities/user.entity';
import { ChatGateway } from '../gateways/chat.gateway';
import { TenantService } from '../../../core/tenant/tenant.service';

export interface CreateAssignmentDto {
  sessionId: string;
  supportUserId: string;
  assignedBy?: string;
  assignmentType?: AssignmentType;
  notes?: string;
}

export interface TransferAssignmentDto {
  sessionId: string;
  fromSupportUserId: string;
  toSupportUserId: string;
  transferredBy: string;
  notes?: string;
}

export interface SupportTeamAvailability {
  userId: string;
  userName: string;
  email: string;
  isOnline: boolean;
  activeAssignments: number;
  maxAssignments: number;
  isAvailable: boolean;
  lastActivity?: Date;
}

export interface AssignmentNotification {
  type: 'assignment' | 'transfer' | 'escalation' | 'completion';
  sessionId: string;
  supportUserId: string;
  supportUserName: string;
  assignedBy?: string;
  assignedByName?: string;
  notes?: string;
  timestamp: Date;
}

@Injectable()
export class ChatSupportAssignmentService {
  private readonly logger = new Logger(ChatSupportAssignmentService.name);

  constructor(
    @InjectRepository(ChatSupportAssignment)
    private readonly assignmentRepository: Repository<ChatSupportAssignment>,
    @InjectRepository(ChatSession)
    private readonly sessionRepository: Repository<ChatSession>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly chatGateway: ChatGateway,
    private readonly tenantService: TenantService,
  ) { }

  /**
   * Create a new support assignment
   */
  async createAssignment(createDto: CreateAssignmentDto): Promise<ChatSupportAssignment> {
    const { sessionId, supportUserId, assignedBy, assignmentType = AssignmentType.MANUAL, notes } = createDto;
    const tenantId = this.tenantService.getTenantId();

    // Validate session exists
    const session = await this.sessionRepository.findOne({ where: { id: sessionId, tenantId } });
    if (!session) {
      throw new NotFoundException(`Chat session ${sessionId} not found`);
    }

    // Validate support user exists and has support role
    const supportUser = await this.userRepository.findOne({
      where: { id: supportUserId, tenantId },
      relations: ['userRoles', 'userRoles.role']
    });
    if (!supportUser) {
      throw new NotFoundException(`Support user ${supportUserId} not found`);
    }

    // Check if user has support role (support, manager, or admin)
    const supportRoles = ['support', 'manager', 'admin'];
    const userRoles = supportUser.userRoles?.map(ur => ur.role?.name) || [];
    const hasSupportRole = userRoles.some(role => supportRoles.includes(role));

    if (!hasSupportRole) {
      throw new BadRequestException(`User ${supportUserId} does not have support permissions`);
    }

    // Check if there's already an active assignment for this session
    const existingAssignment = await this.assignmentRepository.findOne({
      where: {
        sessionId,
        status: AssignmentStatus.ACTIVE,
        tenantId
      }
    });

    if (existingAssignment) {
      throw new BadRequestException(`Session ${sessionId} already has an active assignment`);
    }

    // Create the assignment
    const assignment = this.assignmentRepository.create({
      sessionId,
      supportUserId,
      assignedBy,
      assignmentType,
      notes,
      status: AssignmentStatus.ACTIVE,
      assignedAt: new Date(),
      tenantId
    });

    const savedAssignment = await this.assignmentRepository.save(assignment);

    // Load the assignment with relations for notification
    const assignmentWithRelations = await this.assignmentRepository.findOne({
      where: { id: savedAssignment.id, tenantId },
      relations: ['supportUser', 'assignedByUser', 'session']
    });

    // Send WebSocket notification
    await this.sendAssignmentNotification({
      type: 'assignment',
      sessionId,
      supportUserId,
      supportUserName: supportUser.fullName,
      assignedBy,
      assignedByName: assignmentWithRelations?.assignedByUser?.fullName,
      notes,
      timestamp: new Date(),
    });

    // Notify the support user about the assignment
    await this.chatGateway.broadcastSupportJoined({
      sessionId,
      supportUserId,
      supportUserName: supportUser.fullName,
    });

    this.logger.log(`Created assignment for session ${sessionId} to support user ${supportUserId}`);
    return assignmentWithRelations!;
  }

  /**
   * Transfer assignment from one support user to another
   */
  async transferAssignment(transferDto: TransferAssignmentDto): Promise<ChatSupportAssignment> {
    const { sessionId, fromSupportUserId, toSupportUserId, transferredBy, notes } = transferDto;

    // Find the current active assignment
    const currentAssignment = await this.assignmentRepository.findOne({
      where: {
        sessionId,
        supportUserId: fromSupportUserId,
        status: AssignmentStatus.ACTIVE,
        tenantId: this.tenantService.getTenantId()
      },
      relations: ['supportUser']
    });

    if (!currentAssignment) {
      throw new NotFoundException(`No active assignment found for session ${sessionId} and support user ${fromSupportUserId}`);
    }

    // Validate the new support user
    const newSupportUser = await this.userRepository.findOne({
      where: { id: toSupportUserId, tenantId: this.tenantService.getTenantId() },
      relations: ['userRoles', 'userRoles.role']
    });
    if (!newSupportUser) {
      throw new NotFoundException(`Support user ${toSupportUserId} not found`);
    }

    // Check if new user has support role
    const supportRoles = ['support', 'manager', 'admin'];
    const userRoles = newSupportUser.userRoles?.map(ur => ur.role?.name) || [];
    const hasSupportRole = userRoles.some(role => supportRoles.includes(role));

    if (!hasSupportRole) {
      throw new BadRequestException(`User ${toSupportUserId} does not have support permissions`);
    }

    // Complete the current assignment
    currentAssignment.status = AssignmentStatus.TRANSFERRED;
    currentAssignment.completedAt = new Date();
    currentAssignment.notes = notes ? `${currentAssignment.notes || ''}\nTransferred: ${notes}` : currentAssignment.notes;
    await this.assignmentRepository.save(currentAssignment);

    // Create new assignment
    const newAssignment = await this.createAssignment({
      sessionId,
      supportUserId: toSupportUserId,
      assignedBy: transferredBy,
      assignmentType: AssignmentType.MANUAL,
      notes: `Transferred from ${currentAssignment.supportUser.fullName}. ${notes || ''}`.trim(),
    });

    // Send transfer notifications
    await this.sendAssignmentNotification({
      type: 'transfer',
      sessionId,
      supportUserId: toSupportUserId,
      supportUserName: newSupportUser.fullName,
      assignedBy: transferredBy,
      notes: `Transferred from ${currentAssignment.supportUser.fullName}`,
      timestamp: new Date(),
    });

    // Notify about support user change
    await this.chatGateway.broadcastSupportLeft({
      sessionId,
      supportUserId: fromSupportUserId,
      supportUserName: currentAssignment.supportUser.fullName,
    });

    this.logger.log(`Transferred assignment for session ${sessionId} from ${fromSupportUserId} to ${toSupportUserId}`);
    return newAssignment;
  }

  /**
   * Escalate assignment to manager
   */
  async escalateAssignment(sessionId: string, escalatedBy: string, notes?: string): Promise<ChatSupportAssignment> {
    // Find available managers
    const managers = await this.userRepository.find({
      where: {
        tenantId: this.tenantService.getTenantId(),
        userRoles: {
          role: {
            name: In(['manager', 'admin'])
          }
        },
        isActive: true
      },
      relations: ['userRoles', 'userRoles.role']
    });

    if (managers.length === 0) {
      throw new NotFoundException('No available managers for escalation');
    }

    // Find manager with least active assignments
    const managerAvailability = await this.getSupportTeamAvailability(managers.map(m => m.id));
    const availableManager = managerAvailability
      .filter(m => m.isAvailable)
      .sort((a, b) => a.activeAssignments - b.activeAssignments)[0];

    if (!availableManager) {
      throw new BadRequestException('No available managers for escalation');
    }

    // Get current assignment if exists
    const currentAssignment = await this.assignmentRepository.findOne({
      where: { sessionId, status: AssignmentStatus.ACTIVE, tenantId: this.tenantService.getTenantId() },
      relations: ['supportUser']
    });

    let newAssignment: ChatSupportAssignment;

    if (currentAssignment) {
      // Transfer to manager
      newAssignment = await this.transferAssignment({
        sessionId,
        fromSupportUserId: currentAssignment.supportUserId,
        toSupportUserId: availableManager.userId,
        transferredBy: escalatedBy,
        notes: `Escalated to manager. ${notes || ''}`.trim(),
      });
    } else {
      // Create new assignment to manager
      newAssignment = await this.createAssignment({
        sessionId,
        supportUserId: availableManager.userId,
        assignedBy: escalatedBy,
        assignmentType: AssignmentType.ESCALATED,
        notes: `Escalated to manager. ${notes || ''}`.trim(),
      });
    }

    // Send escalation notification
    await this.sendAssignmentNotification({
      type: 'escalation',
      sessionId,
      supportUserId: availableManager.userId,
      supportUserName: availableManager.userName,
      assignedBy: escalatedBy,
      notes: `Escalated to manager. ${notes || ''}`.trim(),
      timestamp: new Date(),
    });

    this.logger.log(`Escalated assignment for session ${sessionId} to manager ${availableManager.userId}`);
    return newAssignment;
  }

  /**
   * Complete an assignment
   */
  async completeAssignment(sessionId: string, supportUserId: string, notes?: string): Promise<ChatSupportAssignment> {
    const assignment = await this.assignmentRepository.findOne({
      where: {
        sessionId,
        supportUserId,
        status: AssignmentStatus.ACTIVE,
        tenantId: this.tenantService.getTenantId()
      },
      relations: ['supportUser']
    });

    if (!assignment) {
      throw new NotFoundException(`No active assignment found for session ${sessionId} and support user ${supportUserId}`);
    }

    assignment.status = AssignmentStatus.COMPLETED;
    assignment.completedAt = new Date();
    assignment.notes = notes ? `${assignment.notes || ''}\nCompleted: ${notes}` : assignment.notes;

    const completedAssignment = await this.assignmentRepository.save(assignment);

    // Send completion notification
    await this.sendAssignmentNotification({
      type: 'completion',
      sessionId,
      supportUserId,
      supportUserName: assignment.supportUser.fullName,
      notes,
      timestamp: new Date(),
    });

    // Notify about support user leaving
    await this.chatGateway.broadcastSupportLeft({
      sessionId,
      supportUserId,
      supportUserName: assignment.supportUser.fullName,
    });

    this.logger.log(`Completed assignment for session ${sessionId} by support user ${supportUserId}`);
    return completedAssignment;
  }

  /**
   * Get active assignment for a session
   */
  async getActiveAssignment(sessionId: string): Promise<ChatSupportAssignment | null> {
    return this.assignmentRepository.findOne({
      where: { sessionId, status: AssignmentStatus.ACTIVE, tenantId: this.tenantService.getTenantId() },
      relations: ['supportUser', 'assignedByUser', 'session']
    });
  }

  /**
   * Get all assignments for a session
   */
  async getSessionAssignments(sessionId: string): Promise<ChatSupportAssignment[]> {
    return this.assignmentRepository.find({
      where: { sessionId, tenantId: this.tenantService.getTenantId() },
      relations: ['supportUser', 'assignedByUser'],
      order: { assignedAt: 'DESC' }
    });
  }

  /**
   * Get active assignments for a support user
   */
  async getSupportUserAssignments(supportUserId: string): Promise<ChatSupportAssignment[]> {
    return this.assignmentRepository.find({
      where: { supportUserId, status: AssignmentStatus.ACTIVE, tenantId: this.tenantService.getTenantId() },
      relations: ['session', 'assignedByUser'],
      order: { assignedAt: 'DESC' }
    });
  }

  /**
   * Get support team availability
   */
  async getSupportTeamAvailability(userIds?: string[]): Promise<SupportTeamAvailability[]> {
    // Get all support team members
    let supportUsers: User[];

    if (userIds) {
      supportUsers = await this.userRepository.find({
        where: { id: In(userIds), tenantId: this.tenantService.getTenantId() },
        relations: ['userRoles', 'userRoles.role']
      });
    } else {
      supportUsers = await this.userRepository.find({
        where: {
          tenantId: this.tenantService.getTenantId(),
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

    const availability: SupportTeamAvailability[] = [];

    for (const user of supportUsers) {
      // Count active assignments
      const activeAssignments = await this.assignmentRepository.count({
        where: { supportUserId: user.id, status: AssignmentStatus.ACTIVE, tenantId: this.tenantService.getTenantId() }
      });

      // Determine max assignments based on role
      const userRoles = user.userRoles?.map(ur => ur.role?.name) || [];
      const isManager = userRoles.includes('manager') || userRoles.includes('admin');
      const maxAssignments = isManager ? 10 : 5; // Managers can handle more

      // Check if user is online (this would need to be implemented with actual presence tracking)
      const isOnline = true; // Placeholder - would check WebSocket connections or last activity

      availability.push({
        userId: user.id,
        userName: user.fullName,
        email: user.email,
        isOnline,
        activeAssignments,
        maxAssignments,
        isAvailable: isOnline && activeAssignments < maxAssignments,
        lastActivity: user.lastLoginAt,
      });
    }

    return availability.sort((a, b) => a.activeAssignments - b.activeAssignments);
  }

  /**
   * Auto-assign support user to session
   */
  async autoAssignSupport(sessionId: string): Promise<ChatSupportAssignment | null> {
    try {
      // Get available support team members
      const availability = await this.getSupportTeamAvailability();
      const availableSupport = availability.filter(s => s.isAvailable);

      if (availableSupport.length === 0) {
        this.logger.warn(`No available support users for auto-assignment to session ${sessionId}`);
        return null;
      }

      // Select the support user with the least active assignments
      const selectedSupport = availableSupport[0];

      // Create auto assignment
      const assignment = await this.createAssignment({
        sessionId,
        supportUserId: selectedSupport.userId,
        assignmentType: AssignmentType.AUTO,
        notes: 'Auto-assigned based on availability',
      });

      this.logger.log(`Auto-assigned session ${sessionId} to support user ${selectedSupport.userId}`);
      return assignment;

    } catch (error) {
      this.logger.error(`Failed to auto-assign support for session ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Send assignment notification via WebSocket
   */
  private async sendAssignmentNotification(notification: AssignmentNotification): Promise<void> {
    try {
      // Broadcast to the session
      await this.chatGateway.server.to(notification.sessionId).emit('assignment-notification', notification);

      // Send to specific support user (if they're connected)
      const supportUserSockets = await this.chatGateway.server.fetchSockets();
      const supportSocket = supportUserSockets.find(socket =>
        socket.data.userId === notification.supportUserId
      );

      if (supportSocket) {
        supportSocket.emit('support-assignment-notification', notification);
      }

      // Send to managers for escalations
      if (notification.type === 'escalation') {
        const managerSockets = supportUserSockets.filter(socket => {
          // This would need to check user roles - placeholder implementation
          return socket.data.userRoles?.includes('manager') || socket.data.userRoles?.includes('admin');
        });

        managerSockets.forEach(socket => {
          socket.emit('escalation-notification', notification);
        });
      }

    } catch (error) {
      this.logger.error('Failed to send assignment notification:', error);
    }
  }

  /**
   * Get assignment statistics
   */
  async getAssignmentStats(supportUserId?: string, dateFrom?: Date, dateTo?: Date) {
    const tenantId = this.tenantService.getTenantId();
    const whereConditions: any = { tenantId };

    if (supportUserId) {
      whereConditions.supportUserId = supportUserId;
    }

    if (dateFrom) {
      whereConditions.assignedAt = { $gte: dateFrom };
    }

    if (dateTo) {
      whereConditions.assignedAt = { ...whereConditions.assignedAt, $lte: dateTo };
    }

    const [
      totalAssignments,
      activeAssignments,
      completedAssignments,
      transferredAssignments,
      escalatedAssignments,
      autoAssignments,
    ] = await Promise.all([
      this.assignmentRepository.count({ where: whereConditions }),
      this.assignmentRepository.count({ where: { ...whereConditions, status: AssignmentStatus.ACTIVE } }),
      this.assignmentRepository.count({ where: { ...whereConditions, status: AssignmentStatus.COMPLETED } }),
      this.assignmentRepository.count({ where: { ...whereConditions, status: AssignmentStatus.TRANSFERRED } }),
      this.assignmentRepository.count({ where: { ...whereConditions, assignmentType: AssignmentType.ESCALATED } }),
      this.assignmentRepository.count({ where: { ...whereConditions, assignmentType: AssignmentType.AUTO } }),
    ]);

    // Calculate average resolution time for completed assignments
    const completedWithDuration = await this.assignmentRepository.find({
      where: { ...whereConditions, status: AssignmentStatus.COMPLETED },
      select: ['assignedAt', 'completedAt']
    });

    const avgResolutionTime = completedWithDuration.length > 0
      ? completedWithDuration.reduce((sum, assignment) => {
        const duration = assignment.completedAt!.getTime() - assignment.assignedAt.getTime();
        return sum + duration;
      }, 0) / completedWithDuration.length / 1000 / 60 // Convert to minutes
      : 0;

    return {
      totalAssignments,
      activeAssignments,
      completedAssignments,
      transferredAssignments,
      escalatedAssignments,
      autoAssignments,
      avgResolutionTimeMinutes: Math.round(avgResolutionTime),
    };
  }
}