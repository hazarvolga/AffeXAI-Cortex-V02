import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { ChatSession, ChatSessionType, ChatSessionStatus } from '../entities/chat-session.entity';
import { User } from '../../users/entities/user.entity';
import { TenantService } from '../../../core/tenant/tenant.service';

export interface CreateChatSessionDto {
  userId: string;
  sessionType?: ChatSessionType;
  title?: string;
  metadata?: any;
}

export interface UpdateChatSessionDto {
  title?: string;
  status?: ChatSessionStatus;
  sessionType?: ChatSessionType;
  metadata?: any;
}

export interface ChatSessionFilters {
  userId?: string;
  status?: ChatSessionStatus;
  sessionType?: ChatSessionType;
  limit?: number;
  offset?: number;
}

@Injectable()
export class ChatSessionService {
  constructor(
    @InjectRepository(ChatSession)
    private readonly chatSessionRepository: Repository<ChatSession>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly tenantService: TenantService,
  ) { }

  /**
   * Create a new chat session
   */
  async createSession(createDto: CreateChatSessionDto): Promise<ChatSession> {
    // Validate user exists
    const user = await this.userRepository.findOne({
      where: { id: createDto.userId }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user already has an active session of the same type in this tenant
    const existingActiveSession = await this.chatSessionRepository.findOne({
      where: {
        userId: createDto.userId,
        sessionType: createDto.sessionType || ChatSessionType.SUPPORT,
        status: ChatSessionStatus.ACTIVE,
        tenantId: this.tenantService.getTenantId()
      }
    });

    if (existingActiveSession) {
      // Return existing active session instead of creating a new one
      return existingActiveSession;
    }

    const tenantId = this.tenantService.getTenantId();

    const session = this.chatSessionRepository.create({
      userId: createDto.userId,
      tenantId, // Set explicitly if needed, but BaseEntity logic might handle it if properly hooked. Setting explicitly is safer.
      sessionType: createDto.sessionType || ChatSessionType.SUPPORT,
      title: createDto.title,
      metadata: {
        ...createDto.metadata,
        messageCount: 0,
        supportAssigned: false
      }
    });

    return await this.chatSessionRepository.save(session);
  }

  /**
   * Get a chat session by ID
   */
  async getSession(sessionId: string, userId?: string): Promise<ChatSession> {
    const whereCondition: FindOptionsWhere<ChatSession> = {
      id: sessionId,
      tenantId: this.tenantService.getTenantId()
    };

    // If userId is provided, ensure user can only access their own sessions
    if (userId) {
      whereCondition.userId = userId;
    }

    const session = await this.chatSessionRepository.findOne({
      where: whereCondition,
      relations: ['user', 'messages', 'documents', 'supportAssignments']
    });

    if (!session) {
      throw new NotFoundException('Chat session not found');
    }

    return session;
  }

  /**
   * Get all sessions for a user
   */
  async getUserSessions(userId: string, filters?: ChatSessionFilters): Promise<ChatSession[]> {
    const queryBuilder = this.chatSessionRepository.createQueryBuilder('session')
      .leftJoinAndSelect('session.user', 'user')
      .leftJoinAndSelect('session.messages', 'messages')
      .leftJoinAndSelect('session.supportAssignments', 'assignments')
      .where('session.userId = :userId', { userId })
      .andWhere('session.tenantId = :tenantId', { tenantId: this.tenantService.getTenantId() });

    if (filters?.status) {
      queryBuilder.andWhere('session.status = :status', { status: filters.status });
    }

    if (filters?.sessionType) {
      queryBuilder.andWhere('session.sessionType = :sessionType', { sessionType: filters.sessionType });
    }

    queryBuilder.orderBy('session.updatedAt', 'DESC');

    if (filters?.limit) {
      queryBuilder.limit(filters.limit);
    }

    if (filters?.offset) {
      queryBuilder.offset(filters.offset);
    }

    return await queryBuilder.getMany();
  }

  /**
   * Update a chat session
   */
  async updateSession(sessionId: string, updateDto: UpdateChatSessionDto, userId?: string): Promise<ChatSession> {
    const session = await this.getSession(sessionId, userId);

    // Update fields
    if (updateDto.title !== undefined) {
      session.title = updateDto.title;
    }

    if (updateDto.status !== undefined) {
      session.status = updateDto.status;

      // Set closedAt when closing session
      if (updateDto.status === ChatSessionStatus.CLOSED) {
        session.closedAt = new Date();
      }
    }

    if (updateDto.sessionType !== undefined) {
      session.sessionType = updateDto.sessionType;
    }

    if (updateDto.metadata !== undefined) {
      session.metadata = {
        ...session.metadata,
        ...updateDto.metadata
      };
    }

    return await this.chatSessionRepository.save(session);
  }

  /**
   * Close a chat session
   */
  async closeSession(sessionId: string, userId?: string): Promise<ChatSession> {
    return await this.updateSession(sessionId, {
      status: ChatSessionStatus.CLOSED
    }, userId);
  }

  /**
   * Get active sessions (for support team dashboard)
   */
  async getActiveSessions(filters?: ChatSessionFilters): Promise<ChatSession[]> {
    const tenantId = this.tenantService.getTenantId();
    const queryBuilder = this.chatSessionRepository.createQueryBuilder('session')
      .leftJoinAndSelect('session.user', 'user')
      .leftJoinAndSelect('session.messages', 'messages')
      .leftJoinAndSelect('session.supportAssignments', 'assignments')
      .leftJoinAndSelect('assignments.supportUser', 'supportUser')
      .where('session.status = :status', { status: ChatSessionStatus.ACTIVE })
      .andWhere('session.tenantId = :tenantId', { tenantId });

    if (filters?.sessionType) {
      queryBuilder.andWhere('session.sessionType = :sessionType', { sessionType: filters.sessionType });
    }

    queryBuilder.orderBy('session.updatedAt', 'DESC');

    if (filters?.limit) {
      queryBuilder.limit(filters.limit);
    }

    return await queryBuilder.getMany();
  }

  /**
   * Validate session access for user
   */
  async validateSessionAccess(sessionId: string, userId: string): Promise<boolean> {
    const session = await this.chatSessionRepository.findOne({
      where: { id: sessionId, userId, tenantId: this.tenantService.getTenantId() }
    });

    return !!session;
  }

  /**
   * Update session metadata
   */
  async updateSessionMetadata(sessionId: string, metadata: any, userId?: string): Promise<ChatSession> {
    const session = await this.getSession(sessionId, userId);

    session.metadata = {
      ...session.metadata,
      ...metadata
    };

    return await this.chatSessionRepository.save(session);
  }

  /**
   * Get session statistics
   */
  async getSessionStats(userId?: string): Promise<{
    total: number;
    active: number;
    closed: number;
    support: number;
    general: number;
  }> {
    const tenantId = this.tenantService.getTenantId();
    const queryBuilder = this.chatSessionRepository.createQueryBuilder('session')
      .where('session.tenantId = :tenantId', { tenantId });

    if (userId) {
      queryBuilder.andWhere('session.userId = :userId', { userId });
    }

    const [
      total,
      active,
      closed,
      support,
      general
    ] = await Promise.all([
      queryBuilder.getCount(),
      queryBuilder.clone().andWhere('session.status = :status', { status: ChatSessionStatus.ACTIVE }).getCount(),
      queryBuilder.clone().andWhere('session.status = :status', { status: ChatSessionStatus.CLOSED }).getCount(),
      queryBuilder.clone().andWhere('session.sessionType = :type', { type: ChatSessionType.SUPPORT }).getCount(),
      queryBuilder.clone().andWhere('session.sessionType = :type', { type: ChatSessionType.GENERAL }).getCount()
    ]);

    return {
      total,
      active,
      closed,
      support,
      general
    };
  }
}