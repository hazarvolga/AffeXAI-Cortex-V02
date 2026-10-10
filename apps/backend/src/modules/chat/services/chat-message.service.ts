import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { ChatMessage, ChatMessageSenderType, ChatMessageType } from '../entities/chat-message.entity';
import { ChatSession } from '../entities/chat-session.entity';
import { ChatSessionService } from './chat-session.service';
import { TenantService } from '../../../core/tenant/tenant.service';

export interface CreateChatMessageDto {
  sessionId: string;
  senderType: ChatMessageSenderType;
  senderId?: string;
  content: string;
  messageType?: ChatMessageType;
  metadata?: any;
}

export interface UpdateChatMessageDto {
  content?: string;
  metadata?: any;
}

export interface MessageFilters {
  sessionId?: string;
  senderType?: ChatMessageSenderType;
  messageType?: ChatMessageType;
  limit?: number;
  offset?: number;
  fromDate?: Date;
  toDate?: Date;
}

export interface PaginationDto {
  limit?: number;
  offset?: number;
  page?: number;
}

@Injectable()
export class ChatMessageService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
    @InjectRepository(ChatSession)
    private readonly chatSessionRepository: Repository<ChatSession>,
    private readonly chatSessionService: ChatSessionService,
    private readonly tenantService: TenantService,
  ) { }

  /**
   * Send a new message
   */
  async sendMessage(createDto: CreateChatMessageDto, userId?: string): Promise<ChatMessage> {
    // Validate session exists and user has access
    const session = await this.chatSessionService.getSession(createDto.sessionId, userId);

    if (!session.isActive) {
      throw new BadRequestException('Cannot send message to inactive session');
    }

    // Validate content
    if (!createDto.content || createDto.content.trim().length === 0) {
      throw new BadRequestException('Message content cannot be empty');
    }

    // Content filtering and validation
    const filteredContent = this.filterContent(createDto.content);

    const message = this.chatMessageRepository.create({
      sessionId: createDto.sessionId,
      senderType: createDto.senderType,
      senderId: createDto.senderId,
      content: filteredContent,
      messageType: createDto.messageType || ChatMessageType.TEXT,
      metadata: createDto.metadata || {},
      tenantId: this.tenantService.getTenantId()
    });

    const savedMessage = await this.chatMessageRepository.save(message);

    // Update session metadata
    await this.updateSessionMessageCount(createDto.sessionId);

    return savedMessage;
  }

  /**
   * Get messages for a session
   */
  async getMessages(sessionId: string, pagination?: PaginationDto, userId?: string): Promise<ChatMessage[]> {
    // Validate session access
    await this.chatSessionService.getSession(sessionId, userId);

    const queryBuilder = this.chatMessageRepository.createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.contextSources', 'contextSources')
      .where('message.sessionId = :sessionId', { sessionId })
      .andWhere('message.tenantId = :tenantId', { tenantId: this.tenantService.getTenantId() })
      .orderBy('message.createdAt', 'ASC');

    if (pagination?.limit) {
      queryBuilder.limit(pagination.limit);
    }

    if (pagination?.offset) {
      queryBuilder.offset(pagination.offset);
    } else if (pagination?.page && pagination?.limit) {
      queryBuilder.offset((pagination.page - 1) * pagination.limit);
    }

    return await queryBuilder.getMany();
  }

  /**
   * Get a specific message
   */
  async getMessage(messageId: string, userId?: string): Promise<ChatMessage> {
    const message = await this.chatMessageRepository.findOne({
      where: { id: messageId, tenantId: this.tenantService.getTenantId() },
      relations: ['session', 'sender', 'contextSources']
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Validate user has access to the session
    if (userId) {
      await this.chatSessionService.validateSessionAccess(message.sessionId, userId);
    }

    return message;
  }

  /**
   * Update a message (for editing)
   */
  async updateMessage(messageId: string, updateDto: UpdateChatMessageDto, userId?: string): Promise<ChatMessage> {
    const message = await this.getMessage(messageId, userId);

    // Only allow updating user messages
    if (message.senderType !== ChatMessageSenderType.USER) {
      throw new ForbiddenException('Only user messages can be edited');
    }

    // Validate user is the sender
    if (userId && message.senderId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    if (updateDto.content !== undefined) {
      message.content = this.filterContent(updateDto.content);
      message.metadata = {
        ...message.metadata,
        isEdited: true,
        editedAt: new Date()
      };
    }

    if (updateDto.metadata !== undefined) {
      message.metadata = {
        ...message.metadata,
        ...updateDto.metadata
      };
    }

    return await this.chatMessageRepository.save(message);
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string, userId?: string): Promise<void> {
    const message = await this.getMessage(messageId, userId);

    // Only allow deleting user messages
    if (message.senderType !== ChatMessageSenderType.USER) {
      throw new ForbiddenException('Only user messages can be deleted');
    }

    // Validate user is the sender
    if (userId && message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.chatMessageRepository.remove(message);

    // Update session message count
    await this.updateSessionMessageCount(message.sessionId);
  }

  /**
   * Get messages with filters
   */
  async getMessagesWithFilters(filters: MessageFilters): Promise<ChatMessage[]> {
    const queryBuilder = this.chatMessageRepository.createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.session', 'session')
      .leftJoinAndSelect('message.contextSources', 'contextSources')
      .where('message.tenantId = :tenantId', { tenantId: this.tenantService.getTenantId() });

    if (filters.sessionId) {
      queryBuilder.andWhere('message.sessionId = :sessionId', { sessionId: filters.sessionId });
    }

    if (filters.senderType) {
      queryBuilder.andWhere('message.senderType = :senderType', { senderType: filters.senderType });
    }

    if (filters.messageType) {
      queryBuilder.andWhere('message.messageType = :messageType', { messageType: filters.messageType });
    }

    if (filters.fromDate) {
      queryBuilder.andWhere('message.createdAt >= :fromDate', { fromDate: filters.fromDate });
    }

    if (filters.toDate) {
      queryBuilder.andWhere('message.createdAt <= :toDate', { toDate: filters.toDate });
    }

    queryBuilder.orderBy('message.createdAt', 'DESC');

    if (filters.limit) {
      queryBuilder.limit(filters.limit);
    }

    if (filters.offset) {
      queryBuilder.offset(filters.offset);
    }

    return await queryBuilder.getMany();
  }

  /**
   * Get message statistics
   */
  async getMessageStats(sessionId?: string): Promise<{
    total: number;
    userMessages: number;
    aiMessages: number;
    supportMessages: number;
    systemMessages: number;
  }> {
    const tenantId = this.tenantService.getTenantId();
    const queryBuilder = this.chatMessageRepository.createQueryBuilder('message')
      .where('message.tenantId = :tenantId', { tenantId });

    if (sessionId) {
      queryBuilder.andWhere('message.sessionId = :sessionId', { sessionId });
    }

    const [
      total,
      userMessages,
      aiMessages,
      supportMessages,
      systemMessages
    ] = await Promise.all([
      queryBuilder.getCount(),
      queryBuilder.clone().andWhere('message.senderType = :type', { type: ChatMessageSenderType.USER }).getCount(),
      queryBuilder.clone().andWhere('message.senderType = :type', { type: ChatMessageSenderType.AI }).getCount(),
      queryBuilder.clone().andWhere('message.senderType = :type', { type: ChatMessageSenderType.SUPPORT }).getCount(),
      queryBuilder.clone().andWhere('message.messageType = :type', { type: ChatMessageType.SYSTEM }).getCount()
    ]);

    return {
      total,
      userMessages,
      aiMessages,
      supportMessages,
      systemMessages
    };
  }

  /**
   * Search messages by content
   */
  async searchMessages(query: string, sessionId?: string, limit: number = 50): Promise<ChatMessage[]> {
    const queryBuilder = this.chatMessageRepository.createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.session', 'session')
      .where('message.content ILIKE :query', { query: `%${query}%` });

    if (sessionId) {
      queryBuilder.andWhere('message.sessionId = :sessionId', { sessionId });
    }

    queryBuilder
      .orderBy('message.createdAt', 'DESC')
      .limit(limit);

    return await queryBuilder.getMany();
  }

  /**
   * Get recent messages across all sessions
   */
  async getRecentMessages(limit: number = 100): Promise<ChatMessage[]> {
    const tenantId = this.tenantService.getTenantId();
    return await this.chatMessageRepository.find({
      where: { tenantId },
      relations: ['sender', 'session', 'session.user'],
      order: { createdAt: 'DESC' },
      take: limit
    });
  }

  /**
   * Private helper methods
   */
  private filterContent(content: string): string {
    // Basic content filtering
    let filtered = content.trim();

    // Remove excessive whitespace
    filtered = filtered.replace(/\s+/g, ' ');

    // Basic XSS prevention (remove script tags)
    filtered = filtered.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Limit length
    if (filtered.length > 10000) {
      filtered = filtered.substring(0, 10000) + '...';
    }

    return filtered;
  }

  private async updateSessionMessageCount(sessionId: string): Promise<void> {
    const messageCount = await this.chatMessageRepository.count({
      where: { sessionId }
    });

    await this.chatSessionRepository.update(sessionId, {
      metadata: () => `jsonb_set(metadata, '{messageCount}', '${messageCount}')`
    });
  }
}