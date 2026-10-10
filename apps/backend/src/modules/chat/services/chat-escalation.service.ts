import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSession, ChatSessionType, ChatSessionStatus } from '../entities/chat-session.entity';
import { ChatMessage, ChatMessageSenderType, ChatMessageType } from '../entities/chat-message.entity';
import { ChatSupportAssignment } from '../entities/chat-support-assignment.entity';
import { ChatSessionService } from './chat-session.service';
import { ChatMessageService } from './chat-message.service';
import { ChatSupportAssignmentService } from './chat-support-assignment.service';
import { TenantService } from '../../../core/tenant/tenant.service';

export interface EscalationRequest {
  sessionId: string;
  userId: string;
  reason: string;
  notes?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
}

export interface EscalationResult {
  success: boolean;
  session: ChatSession;
  assignment?: ChatSupportAssignment;
  escalationMessage: ChatMessage;
  notificationsSent: string[];
}

export interface EscalationAnalysis {
  shouldEscalate: boolean;
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  confidence: number;
}

@Injectable()
export class ChatEscalationService {
  private readonly logger = new Logger(ChatEscalationService.name);

  constructor(
    @InjectRepository(ChatSession)
    private readonly sessionRepository: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly messageRepository: Repository<ChatMessage>,
    private readonly chatSessionService: ChatSessionService,
    private readonly chatMessageService: ChatMessageService,
    private readonly supportAssignmentService: ChatSupportAssignmentService,
    private readonly tenantService: TenantService,
  ) { }

  /**
   * Escalate a general communication session to support
   */
  async escalateToSupport(escalationRequest: EscalationRequest): Promise<EscalationResult> {
    const { sessionId, userId, reason, notes, priority = 'medium', category } = escalationRequest;

    this.logger.log(`Escalating session ${sessionId} to support. Reason: ${reason}`);

    try {
      // Get current session
      const session = await this.sessionRepository.findOne({
        where: { id: sessionId, tenantId: this.tenantService.getTenantId() },
        relations: ['messages']
      });

      if (!session) {
        throw new Error('Session not found');
      }

      if (session.sessionType === ChatSessionType.SUPPORT) {
        throw new Error('Session is already a support session');
      }

      // Update session to support type
      const updatedSession = await this.chatSessionService.updateSession(sessionId, {
        sessionType: ChatSessionType.SUPPORT,
        status: ChatSessionStatus.ACTIVE,
        metadata: {
          ...session.metadata,
          escalatedFrom: session.sessionType,
          escalationReason: reason,
          escalationNotes: notes,
          escalationPriority: priority,
          escalationCategory: category,
          escalatedAt: new Date(),
          escalatedBy: userId,
          originalSessionType: session.sessionType
        }
      });

      // Create escalation system message
      const escalationMessage = await this.chatMessageService.sendMessage({
        sessionId,
        senderType: ChatMessageSenderType.AI,
        content: this.generateEscalationMessage(reason, priority),
        messageType: ChatMessageType.SYSTEM,
        metadata: {
          escalation: true,
          escalationReason: reason,
          escalationPriority: priority,
          escalationCategory: category,
          escalatedBy: userId,
          escalatedAt: new Date()
        }
      });

      // Try to assign support agent if auto-assignment is enabled
      let assignment: ChatSupportAssignment | undefined;
      try {
        assignment = await this.supportAssignmentService.autoAssignSupport(sessionId);
      } catch (assignmentError) {
        this.logger.warn(`Failed to auto-assign support for session ${sessionId}: ${assignmentError.message}`);
        // Continue without assignment - manual assignment can be done later
      }

      // Send notifications
      const notificationsSent = await this.sendEscalationNotifications({
        session: updatedSession,
        reason,
        priority,
        category,
        escalatedBy: userId,
        assignment
      });

      this.logger.log(`Session ${sessionId} successfully escalated to support`);

      return {
        success: true,
        session: updatedSession,
        assignment,
        escalationMessage,
        notificationsSent
      };

    } catch (error) {
      this.logger.error(`Failed to escalate session ${sessionId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Analyze if a conversation should be escalated based on content and context
   */
  async analyzeEscalationNeed(sessionId: string, recentMessages?: ChatMessage[]): Promise<EscalationAnalysis> {
    try {
      // Get recent messages if not provided
      if (!recentMessages) {
        recentMessages = await this.messageRepository
          .createQueryBuilder('message')
          .where('message.sessionId = :sessionId', { sessionId })
          .andWhere('message.tenantId = :tenantId', { tenantId: this.tenantService.getTenantId() })
          .orderBy('message.createdAt', 'DESC')
          .take(10)
          .getMany();
      }

      const analysis = this.performEscalationAnalysis(recentMessages);

      this.logger.debug(`Escalation analysis for session ${sessionId}: ${JSON.stringify(analysis)}`);

      return analysis;

    } catch (error) {
      this.logger.error(`Error analyzing escalation need for session ${sessionId}: ${error.message}`, error.stack);

      // Return safe default
      return {
        shouldEscalate: false,
        reason: 'analysis-failed',
        priority: 'medium',
        confidence: 0.1
      };
    }
  }

  /**
   * Get escalation statistics
   */
  async getEscalationStatistics(timeframe?: { from: Date; to: Date }): Promise<{
    totalEscalations: number;
    escalationsByReason: Record<string, number>;
    escalationsByPriority: Record<string, number>;
    averageEscalationTime: number;
    escalationRate: number;
  }> {
    try {
      const query = this.sessionRepository
        .createQueryBuilder('session')
        .where('session.sessionType = :supportType', { supportType: ChatSessionType.SUPPORT })
        .andWhere('session.tenantId = :tenantId', { tenantId: this.tenantService.getTenantId() })
        .andWhere('session.metadata->>\'escalatedFrom\' IS NOT NULL');

      if (timeframe) {
        query.andWhere('session.createdAt BETWEEN :from AND :to', {
          from: timeframe.from,
          to: timeframe.to
        });
      }

      const escalatedSessions = await query.getMany();

      const totalEscalations = escalatedSessions.length;

      const escalationsByReason: Record<string, number> = {};
      const escalationsByPriority: Record<string, number> = {};
      let totalEscalationTime = 0;

      escalatedSessions.forEach(session => {
        const reason = session.metadata?.escalationReason || 'unknown';
        const priority = session.metadata?.escalationPriority || 'medium';

        escalationsByReason[reason] = (escalationsByReason[reason] || 0) + 1;
        escalationsByPriority[priority] = (escalationsByPriority[priority] || 0) + 1;

        if (session.metadata?.escalatedAt) {
          const escalationTime = new Date(session.metadata.escalatedAt).getTime() - session.createdAt.getTime();
          totalEscalationTime += escalationTime;
        }
      });

      const averageEscalationTime = totalEscalations > 0 ? totalEscalationTime / totalEscalations : 0;

      // Calculate escalation rate (escalated sessions vs total sessions)
      const totalSessionsQuery = this.sessionRepository
        .createQueryBuilder('session')
        .where('session.tenantId = :tenantId', { tenantId: this.tenantService.getTenantId() });

      if (timeframe) {
        totalSessionsQuery.andWhere('session.createdAt BETWEEN :from AND :to', {
          from: timeframe.from,
          to: timeframe.to
        });
      }

      const totalSessions = await totalSessionsQuery.getCount();
      const escalationRate = totalSessions > 0 ? (totalEscalations / totalSessions) * 100 : 0;

      return {
        totalEscalations,
        escalationsByReason,
        escalationsByPriority,
        averageEscalationTime,
        escalationRate
      };

    } catch (error) {
      this.logger.error(`Error getting escalation statistics: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Perform escalation analysis on messages
   */
  private performEscalationAnalysis(messages: ChatMessage[]): EscalationAnalysis {
    let shouldEscalate = false;
    let reason = 'no-escalation-needed';
    let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
    let category: string | undefined;
    let confidence = 0.5;

    if (messages.length === 0) {
      return { shouldEscalate, reason, priority, confidence };
    }

    const userMessages = messages.filter(m => m.senderType === ChatMessageSenderType.USER);
    const aiMessages = messages.filter(m => m.senderType === ChatMessageSenderType.AI);

    // Analyze user message content
    const allUserContent = userMessages.map(m => m.content.toLowerCase()).join(' ');

    // Technical problem indicators
    const technicalPatterns = [
      /çalışmıyor|not working|broken|bozuk/i,
      /hata|error|bug|sorun/i,
      /yavaş|slow|performance|performans/i,
      /erişemiyorum|can't access|cannot access/i,
      /giriş yapamıyorum|can't login|cannot login/i,
      /kayıt olamıyorum|can't register|cannot register/i
    ];

    const technicalMatches = technicalPatterns.filter(pattern => pattern.test(allUserContent)).length;
    if (technicalMatches >= 2) {
      shouldEscalate = true;
      reason = 'technical-problem';
      priority = 'high';
      category = 'technical';
      confidence = Math.min(0.9, 0.6 + (technicalMatches * 0.1));
    }

    // Account/billing issues
    const accountPatterns = [
      /hesap|account/i,
      /fatura|billing|payment|ödeme/i,
      /subscription|abonelik/i,
      /iptal|cancel/i,
      /upgrade|downgrade/i,
      /para|money|ücret|fee/i
    ];

    const accountMatches = accountPatterns.filter(pattern => pattern.test(allUserContent)).length;
    if (accountMatches >= 2) {
      shouldEscalate = true;
      reason = 'account-billing';
      priority = 'high';
      category = 'billing';
      confidence = Math.min(0.9, 0.7 + (accountMatches * 0.1));
    }

    // Urgent language
    const urgentPatterns = [
      /acil|urgent|emergency/i,
      /hemen|immediately|asap/i,
      /kritik|critical/i,
      /önemli|important/i
    ];

    const urgentMatches = urgentPatterns.filter(pattern => pattern.test(allUserContent)).length;
    if (urgentMatches >= 1) {
      shouldEscalate = true;
      reason = 'urgent-request';
      priority = 'urgent';
      confidence = Math.min(0.95, confidence + 0.2);
    }

    // Frustration indicators
    const frustrationPatterns = [
      /sinirli|angry|frustrated/i,
      /berbat|terrible|awful/i,
      /işe yaramıyor|useless|doesn't work/i,
      /memnun değilim|not satisfied|unhappy/i
    ];

    const frustrationMatches = frustrationPatterns.filter(pattern => pattern.test(allUserContent)).length;
    if (frustrationMatches >= 1) {
      shouldEscalate = true;
      reason = 'customer-frustration';
      priority = 'high';
      confidence = Math.min(0.8, confidence + 0.15);
    }

    // Repetitive questions (user asking same thing multiple times)
    if (userMessages.length >= 3) {
      const uniqueQuestions = new Set(userMessages.map(m =>
        m.content.toLowerCase().replace(/[^\w\s]/g, '').trim()
      ));

      if (uniqueQuestions.size < userMessages.length * 0.7) {
        shouldEscalate = true;
        reason = 'repetitive-questions';
        priority = 'medium';
        confidence = Math.min(0.7, confidence + 0.1);
      }
    }

    // AI confidence analysis
    const lowConfidenceAiMessages = aiMessages.filter(m =>
      m.metadata?.confidence && m.metadata.confidence < 0.5
    );

    if (lowConfidenceAiMessages.length >= 2) {
      shouldEscalate = true;
      reason = 'low-ai-confidence';
      priority = 'medium';
      confidence = Math.min(0.6, confidence + 0.1);
    }

    // Long conversation without resolution
    if (messages.length >= 10 && !shouldEscalate) {
      shouldEscalate = true;
      reason = 'long-conversation';
      priority = 'low';
      confidence = 0.4;
    }

    return {
      shouldEscalate,
      reason,
      priority,
      category,
      confidence
    };
  }

  /**
   * Generate escalation message based on reason and priority
   */
  private generateEscalationMessage(reason: string, priority: string): string {
    const messages = {
      'technical-problem': 'Teknik sorun nedeniyle sohbet destek ekibine yönlendirildi. Bir teknik uzman size yardımcı olacak.',
      'account-billing': 'Hesap/fatura konusu nedeniyle sohbet destek ekibine yönlendirildi. Uzman ekibimiz size yardımcı olacak.',
      'urgent-request': 'Acil talep nedeniyle sohbet öncelikli olarak destek ekibine yönlendirildi.',
      'customer-frustration': 'Daha iyi hizmet verebilmek için sohbet destek ekibine yönlendirildi.',
      'repetitive-questions': 'Sorularınıza daha detaylı yanıt verebilmek için destek ekibine yönlendirildi.',
      'low-ai-confidence': 'Size daha iyi yardımcı olabilmek için destek ekibine yönlendirildi.',
      'long-conversation': 'Uzun sohbet nedeniyle destek ekibine yönlendirildi.',
      'user-requested': 'Kullanıcı talebi üzerine destek ekibine yönlendirildi.'
    };

    const baseMessage = messages[reason] || messages['user-requested'];

    if (priority === 'urgent') {
      return `🚨 ${baseMessage} Acil öncelikle işleme alınacaktır.`;
    } else if (priority === 'high') {
      return `⚡ ${baseMessage} Yüksek öncelikle işleme alınacaktır.`;
    }

    return baseMessage;
  }

  /**
   * Send escalation notifications to relevant parties
   */
  private async sendEscalationNotifications(data: {
    session: ChatSession;
    reason: string;
    priority: string;
    category?: string;
    escalatedBy: string;
    assignment?: ChatSupportAssignment;
  }): Promise<string[]> {
    const notifications: string[] = [];

    try {
      // This would integrate with your notification system
      // For now, we'll just log the notifications that would be sent

      this.logger.log(`Would send escalation notification for session ${data.session.id}`);
      notifications.push('escalation-alert-sent');

      if (data.assignment) {
        this.logger.log(`Would notify assigned support agent: ${data.assignment.supportUserId}`);
        notifications.push('support-agent-notified');
      }

      if (data.priority === 'urgent') {
        this.logger.log('Would send urgent escalation alert to managers');
        notifications.push('manager-alert-sent');
      }

      return notifications;

    } catch (error) {
      this.logger.error(`Error sending escalation notifications: ${error.message}`, error.stack);
      return notifications;
    }
  }

  /**
   * Get escalation history for a session
   */
  async getSessionEscalationHistory(sessionId: string): Promise<{
    escalations: Array<{
      escalatedAt: Date;
      escalatedBy: string;
      reason: string;
      priority: string;
      category?: string;
      notes?: string;
    }>;
    currentStatus: string;
  }> {
    try {
      const session = await this.sessionRepository.findOne({
        where: { id: sessionId, tenantId: this.tenantService.getTenantId() }
      });

      if (!session) {
        throw new Error('Session not found');
      }

      const escalations = [];

      // Check if session was escalated
      if (session.metadata?.escalatedFrom) {
        escalations.push({
          escalatedAt: new Date(session.metadata.escalatedAt),
          escalatedBy: session.metadata.escalatedBy,
          reason: session.metadata.escalationReason,
          priority: session.metadata.escalationPriority,
          category: session.metadata.escalationCategory,
          notes: session.metadata.escalationNotes
        });
      }

      return {
        escalations,
        currentStatus: session.sessionType
      };

    } catch (error) {
      this.logger.error(`Error getting escalation history for session ${sessionId}: ${error.message}`, error.stack);
      throw error;
    }
  }
}