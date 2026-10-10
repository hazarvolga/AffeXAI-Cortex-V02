import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSession, ChatSessionStatus } from '../entities/chat-session.entity';
import { ChatMessage, ChatMessageSenderType, ChatMessageType } from '../entities/chat-message.entity';
import { ChatSupportAssignment } from '../entities/chat-support-assignment.entity';
import { User } from '../../users/entities/user.entity';
import { ChatGateway } from '../gateways/chat.gateway';
import { ChatSupportAssignmentService } from './chat-support-assignment.service';
import { ChatMessageService } from './chat-message.service';
import { TenantService } from '../../../core/tenant/tenant.service';

export interface HandoffContext {
  sessionId: string;
  previousMessages: ChatMessage[];
  contextSummary: string;
  customerInfo: {
    userId: string;
    userName: string;
    email: string;
  };
  previousAssignments: ChatSupportAssignment[];
  sessionMetadata: any;
  handoffReason: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface HandoffNote {
  id: string;
  sessionId: string;
  authorId: string;
  authorName: string;
  content: string;
  isPrivate: boolean; // Private notes only visible to support team
  createdAt: Date;
  tags?: string[];
}

@Injectable()
export class ChatHandoffService {
  private readonly logger = new Logger(ChatHandoffService.name);

  constructor(
    @InjectRepository(ChatSession)
    private readonly sessionRepository: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly messageRepository: Repository<ChatMessage>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly chatGateway: ChatGateway,
    private readonly supportAssignmentService: ChatSupportAssignmentService,
    private readonly chatMessageService: ChatMessageService,
    private readonly tenantService: TenantService,
  ) { }

  /**
   * Prepare handoff context for smooth transition
   */
  async prepareHandoffContext(sessionId: string): Promise<HandoffContext> {
    // Get session with user info
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, tenantId: this.tenantService.getTenantId() },
      relations: ['user']
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    // Get recent messages (last 20 for context)
    const recentMessages = await this.messageRepository.find({
      where: { sessionId, tenantId: this.tenantService.getTenantId() },
      order: { createdAt: 'DESC' },
      take: 20,
      relations: ['contextSources']
    });

    // Get all previous assignments
    const previousAssignments = await this.supportAssignmentService.getSessionAssignments(sessionId);

    // Generate context summary
    const contextSummary = await this.generateContextSummary(recentMessages, session);

    // Determine urgency level based on session metadata and history
    const urgencyLevel = this.determineUrgencyLevel(session, recentMessages, previousAssignments);

    return {
      sessionId,
      previousMessages: recentMessages.reverse(), // Chronological order
      contextSummary,
      customerInfo: {
        userId: session.userId,
        userName: session.user?.fullName || 'Unknown User',
        email: session.user?.email || 'unknown@example.com',
      },
      previousAssignments,
      sessionMetadata: session.metadata,
      handoffReason: 'Transfer requested', // Default reason
      urgencyLevel,
    };
  }

  /**
   * Execute handoff with context preservation
   */
  async executeHandoff(
    sessionId: string,
    fromSupportUserId: string,
    toSupportUserId: string,
    handoffReason: string,
    privateNotes?: string,
    transferredBy?: string
  ): Promise<void> {
    // Prepare handoff context
    const context = await this.prepareHandoffContext(sessionId);
    context.handoffReason = handoffReason;

    // Get support user details
    const [fromUser, toUser] = await Promise.all([
      this.userRepository.findOne({ where: { id: fromSupportUserId, tenantId: this.tenantService.getTenantId() } }),
      this.userRepository.findOne({ where: { id: toSupportUserId, tenantId: this.tenantService.getTenantId() } })
    ]);

    if (!fromUser || !toUser) {
      throw new NotFoundException('Support user not found');
    }

    // Create handoff message for session history
    const handoffMessage = await this.chatMessageService.sendMessage({
      sessionId,
      senderType: ChatMessageSenderType.SUPPORT,
      content: `Chat transferred from ${fromUser.fullName} to ${toUser.fullName}. Reason: ${handoffReason}`,
      messageType: ChatMessageType.SYSTEM,
      metadata: {
        handoffContext: {
          fromUserId: fromSupportUserId,
          toUserId: toSupportUserId,
          reason: handoffReason,
          contextSummary: context.contextSummary,
          urgencyLevel: context.urgencyLevel,
        }
      }
    });

    // Add private notes if provided
    if (privateNotes) {
      await this.addHandoffNote(sessionId, fromSupportUserId, privateNotes, true);
    }

    // Transfer the assignment
    await this.supportAssignmentService.transferAssignment({
      sessionId,
      fromSupportUserId,
      toSupportUserId,
      transferredBy: transferredBy || fromSupportUserId,
      notes: `Handoff: ${handoffReason}. ${privateNotes || ''}`.trim(),
    });

    // Send handoff context to new support agent
    await this.sendHandoffNotification(toSupportUserId, context);

    // Broadcast handoff to session participants
    await this.chatGateway.broadcastSupportTransfer({
      sessionId,
      fromUserId: fromSupportUserId,
      toUserId: toSupportUserId,
      reason: handoffReason,
    });

    // Send private handoff details to support team only
    if (privateNotes) {
      await this.chatGateway.sendRoleNotification(['support', 'admin'], {
        type: 'handoff-private-details',
        sessionId,
        fromSupportUserId,
        toSupportUserId,
        privateNotes,
        timestamp: new Date()
      });
    }

    this.logger.log(`Executed handoff for session ${sessionId} from ${fromSupportUserId} to ${toSupportUserId}`);
  }

  /**
   * Execute escalation with enhanced context
   */
  async executeEscalation(
    sessionId: string,
    escalatedBy: string,
    escalationReason: string,
    urgencyLevel: 'high' | 'critical' = 'high',
    privateNotes?: string
  ): Promise<void> {
    // Prepare handoff context
    const context = await this.prepareHandoffContext(sessionId);
    context.handoffReason = `Escalation: ${escalationReason}`;
    context.urgencyLevel = urgencyLevel;

    // Get escalating user details
    const escalatingUser = await this.userRepository.findOne({ where: { id: escalatedBy, tenantId: this.tenantService.getTenantId() } });
    if (!escalatingUser) {
      throw new NotFoundException('Escalating user not found');
    }

    // Create escalation message for session history
    const escalationMessage = await this.chatMessageService.sendMessage({
      sessionId,
      senderType: ChatMessageSenderType.SUPPORT,
      content: `Chat escalated by ${escalatingUser.fullName}. Reason: ${escalationReason}`,
      messageType: ChatMessageType.SYSTEM,
      metadata: {
        escalationContext: {
          escalatedBy,
          reason: escalationReason,
          urgencyLevel,
          contextSummary: context.contextSummary,
          escalatedAt: new Date(),
        }
      }
    });

    // Add private escalation notes
    if (privateNotes) {
      await this.addHandoffNote(sessionId, escalatedBy, `Escalation notes: ${privateNotes}`, true);
    }

    // Escalate the assignment
    const newAssignment = await this.supportAssignmentService.escalateAssignment(
      sessionId,
      escalatedBy,
      `Escalation: ${escalationReason}. ${privateNotes || ''}`.trim()
    );

    // Send escalation context to assigned manager
    await this.sendEscalationNotification(newAssignment.supportUserId, context);

    // Broadcast escalation
    await this.chatGateway.broadcastSupportEscalation({
      sessionId,
      userId: escalatedBy,
      reason: escalationReason,
      priority: urgencyLevel,
    });

    // Send private escalation details to support team
    if (privateNotes) {
      await this.chatGateway.sendRoleNotification(['support', 'admin', 'manager'], {
        type: 'escalation-private-details',
        sessionId,
        escalatedBy,
        escalatedTo: newAssignment.supportUserId,
        privateNotes,
        timestamp: new Date()
      });
    }

    this.logger.log(`Executed escalation for session ${sessionId} by ${escalatedBy}`);
  }

  /**
   * Add handoff note (private or public)
   */
  async addHandoffNote(
    sessionId: string,
    authorId: string,
    content: string,
    isPrivate: boolean = false,
    tags?: string[]
  ): Promise<HandoffNote> {
    const author = await this.userRepository.findOne({ where: { id: authorId, tenantId: this.tenantService.getTenantId() } });
    if (!author) {
      throw new NotFoundException('Author not found');
    }

    // Create note as a system message with special metadata
    const noteMessage = await this.chatMessageService.sendMessage({
      sessionId,
      senderType: ChatMessageSenderType.SUPPORT,
      senderId: authorId,
      content: isPrivate ? '[Private Note]' : content,
      messageType: ChatMessageType.SYSTEM,
      metadata: {
        handoffNote: {
          isPrivate,
          actualContent: content,
          authorName: author.fullName,
          tags: tags || [],
          noteType: 'handoff',
        }
      }
    });

    const handoffNote: HandoffNote = {
      id: noteMessage.id,
      sessionId,
      authorId,
      authorName: author.fullName,
      content,
      isPrivate,
      createdAt: noteMessage.createdAt,
      tags,
    };

    // Only broadcast to support team if private
    if (isPrivate) {
      // Securely broadcast private note only to support team
      await this.chatGateway.sendRoleNotification(['support', 'admin'], {
        type: 'private-note-added',
        sessionId,
        note: handoffNote,
        timestamp: new Date()
      });
    } else {
      await this.chatGateway.broadcastSessionUpdate(sessionId, { type: 'handoff-note', note: handoffNote });
    }

    return handoffNote;
  }

  /**
   * Get handoff notes for a session
   */
  async getHandoffNotes(sessionId: string, includePrivate: boolean = false): Promise<HandoffNote[]> {
    const messages = await this.messageRepository.find({
      where: {
        sessionId,
        tenantId: this.tenantService.getTenantId(),
        messageType: ChatMessageType.SYSTEM,
      },
      order: { createdAt: 'ASC' }
    });

    const handoffNotes: HandoffNote[] = [];

    for (const message of messages) {
      const noteMetadata = message.metadata?.handoffNote;
      if (noteMetadata && noteMetadata.noteType === 'handoff') {
        if (!noteMetadata.isPrivate || includePrivate) {
          handoffNotes.push({
            id: message.id,
            sessionId,
            authorId: message.senderId!,
            authorName: noteMetadata.authorName,
            content: noteMetadata.actualContent,
            isPrivate: noteMetadata.isPrivate,
            createdAt: message.createdAt,
            tags: noteMetadata.tags,
          });
        }
      }
    }

    return handoffNotes;
  }

  /**
   * Get session handoff history
   */
  async getHandoffHistory(sessionId: string): Promise<{
    transfers: any[];
    escalations: any[];
    notes: HandoffNote[];
  }> {
    const [assignments, notes] = await Promise.all([
      this.supportAssignmentService.getSessionAssignments(sessionId),
      this.getHandoffNotes(sessionId, true) // Include private notes for support team
    ]);

    const transfers = assignments.filter(a => a.assignmentType === 'manual' && a.notes?.includes('Handoff'));
    const escalations = assignments.filter(a => a.assignmentType === 'escalated');

    return {
      transfers,
      escalations,
      notes,
    };
  }

  /**
   * Generate context summary for handoff
   */
  private async generateContextSummary(messages: ChatMessage[], session: ChatSession): Promise<string> {
    if (messages.length === 0) {
      return 'No previous conversation history.';
    }

    // Extract key information from recent messages
    const userMessages = messages.filter(m => m.senderType === ChatMessageSenderType.USER);
    const aiMessages = messages.filter(m => m.senderType === ChatMessageSenderType.AI);
    const supportMessages = messages.filter(m => m.senderType === ChatMessageSenderType.SUPPORT);

    let summary = `Session started ${session.createdAt.toLocaleDateString()}. `;

    if (userMessages.length > 0) {
      const lastUserMessage = userMessages[0];
      summary += `Customer's latest concern: "${lastUserMessage.content.substring(0, 100)}${lastUserMessage.content.length > 100 ? '...' : ''}". `;
    }

    if (supportMessages.length > 0) {
      summary += `Previous support interaction provided. `;
    }

    if (aiMessages.length > 0) {
      summary += `AI assistance was provided with context from knowledge base. `;
    }

    // Add document/URL context if available
    const documentsUploaded = messages.some(m => m.messageType === ChatMessageType.FILE);
    const urlsProcessed = messages.some(m => m.messageType === ChatMessageType.URL);

    if (documentsUploaded) {
      summary += `Customer uploaded documents for analysis. `;
    }

    if (urlsProcessed) {
      summary += `URLs were processed for additional context. `;
    }

    return summary.trim();
  }

  /**
   * Determine urgency level based on session data
   */
  private determineUrgencyLevel(
    session: ChatSession,
    messages: ChatMessage[],
    assignments: ChatSupportAssignment[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Check for escalation keywords in recent messages
    const urgentKeywords = ['urgent', 'critical', 'emergency', 'asap', 'immediately', 'broken', 'down', 'not working'];
    const recentContent = messages.slice(0, 5).map(m => m.content.toLowerCase()).join(' ');

    if (urgentKeywords.some(keyword => recentContent.includes(keyword))) {
      return 'high';
    }

    // Check session age
    const sessionAge = Date.now() - session.createdAt.getTime();
    const hoursOld = sessionAge / (1000 * 60 * 60);

    if (hoursOld > 24) {
      return 'high';
    }

    // Check number of previous assignments (multiple transfers indicate complexity)
    if (assignments.length > 2) {
      return 'medium';
    }

    // Check message frequency (high activity might indicate urgency)
    if (messages.length > 20) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Send handoff notification to new support agent
   */
  private async sendHandoffNotification(supportUserId: string, context: HandoffContext): Promise<void> {
    await this.chatGateway.sendUserNotification(supportUserId, {
      type: 'handoff-received',
      sessionId: context.sessionId,
      customerInfo: context.customerInfo,
      contextSummary: context.contextSummary,
      urgencyLevel: context.urgencyLevel,
      handoffReason: context.handoffReason,
      messageCount: context.previousMessages.length,
      timestamp: new Date(),
    });
  }

  /**
   * Send escalation notification to manager
   */
  private async sendEscalationNotification(managerId: string, context: HandoffContext): Promise<void> {
    await this.chatGateway.sendUserNotification(managerId, {
      type: 'escalation-received',
      sessionId: context.sessionId,
      customerInfo: context.customerInfo,
      contextSummary: context.contextSummary,
      urgencyLevel: context.urgencyLevel,
      escalationReason: context.handoffReason,
      messageCount: context.previousMessages.length,
      timestamp: new Date(),
    });

    // Also send to role-based notification for all managers
    await this.chatGateway.sendRoleNotification(['manager', 'admin'], {
      type: 'escalation-alert',
      sessionId: context.sessionId,
      customerInfo: context.customerInfo,
      urgencyLevel: context.urgencyLevel,
      escalationReason: context.handoffReason,
      timestamp: new Date(),
    });
  }
}