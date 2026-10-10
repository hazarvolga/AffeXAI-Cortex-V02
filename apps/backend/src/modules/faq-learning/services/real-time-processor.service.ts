import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FaqLearningService } from './faq-learning.service';
import { ChatFaqIntegrationService } from './chat-faq-integration.service';
import { ChatMessage } from '../../chat/entities/chat-message.entity';
import { ChatSession } from '../../chat/entities/chat-session.entity';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { TicketStatus } from '../../tickets/enums/ticket-status.enum';
import { FaqLearningConfig } from '../entities/faq-learning-config.entity';
import { LearnedFaqEntry } from '../entities/learned-faq-entry.entity';

export interface RealTimeProcessingConfig {
  enableChatProcessing: boolean;
  enableTicketProcessing: boolean;
  minChatMessagesForProcessing: number;
  minTicketMessagesForProcessing: number;
  processingDelay: number;
  chatFeedbackThreshold: number;
  ticketResolutionTimeThreshold: number;
}

export interface ProcessingResult {
  processed: boolean;
  reason?: string;
  faqsGenerated?: number;
  patternsIdentified?: number;
}

@Injectable()
export class RealTimeProcessorService {
  private readonly logger = new Logger(RealTimeProcessorService.name);
  private processingQueue: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    @InjectRepository(ChatSession)
    private chatSessionRepository: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private chatMessageRepository: Repository<ChatMessage>,
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    @InjectRepository(FaqLearningConfig)
    private configRepository: Repository<FaqLearningConfig>,
    private faqLearningService: FaqLearningService,
    private chatFaqIntegration: ChatFaqIntegrationService,
    private eventEmitter: EventEmitter2,
  ) { }

  async processChatSession(sessionId: string, tenantId: string): Promise<ProcessingResult> {
    try {
      const config = await this.getProcessingConfig(tenantId);

      if (!config.enableChatProcessing) {
        return { processed: false, reason: 'Chat processing is disabled' };
      }

      this.logger.log(`Processing chat session ${sessionId} for FAQ learning`);

      const session = await this.chatSessionRepository.findOne({
        where: { id: sessionId, tenantId },
        relations: ['messages'],
      });

      if (!session) {
        return { processed: false, reason: 'Session not found' };
      }

      if (!this.shouldProcessChatSession(session, config)) {
        return { processed: false, reason: 'Session does not meet processing criteria' };
      }

      await this.scheduleProcessing(
        `chat-${sessionId}`,
        config.processingDelay,
        async () => {
          await this.executeChatProcessing(session);
        },
      );

      return { processed: true, reason: 'Chat session scheduled for processing' };
    } catch (error) {
      this.logger.error(`Failed to process chat session ${sessionId}:`, error);
      return { processed: false, reason: error.message };
    }
  }

  async processTicket(ticketId: string, tenantId: string): Promise<ProcessingResult> {
    try {
      const config = await this.getProcessingConfig(tenantId);

      if (!config.enableTicketProcessing) {
        return { processed: false, reason: 'Ticket processing is disabled' };
      }

      this.logger.log(`Processing ticket ${ticketId} for FAQ learning`);

      const ticket = await this.ticketRepository.findOne({
        where: { id: ticketId, tenantId },
        relations: ['messages', 'messages.author'],
      });

      if (!ticket) {
        return { processed: false, reason: 'Ticket not found' };
      }

      if (!this.shouldProcessTicket(ticket, config)) {
        return { processed: false, reason: 'Ticket does not meet processing criteria' };
      }

      await this.scheduleProcessing(
        `ticket-${ticketId}`,
        config.processingDelay,
        async () => {
          await this.executeTicketProcessing(ticket);
        },
      );

      return { processed: true, reason: 'Ticket scheduled for processing' };
    } catch (error) {
      this.logger.error(`Failed to process ticket ${ticketId}:`, error);
      return { processed: false, reason: error.message };
    }
  }

  async processChatMessageFeedback(messageId: string, isHelpful: boolean, tenantId: string): Promise<ProcessingResult> {
    try {
      if (!isHelpful) {
        return { processed: false, reason: 'Only positive feedback triggers processing' };
      }

      const message = await this.chatMessageRepository.findOne({
        where: { id: messageId },
        relations: ['session', 'session.messages'],
      });

      if (!message || !message.session) {
        return { processed: false, reason: 'Message or session not found' };
      }

      this.logger.log(`Processing chat message ${messageId} with positive feedback`);
      return await this.processChatSession(message.session.id, tenantId);
    } catch (error) {
      this.logger.error(`Failed to process chat message feedback ${messageId}:`, error);
      return { processed: false, reason: error.message };
    }
  }

  private shouldProcessChatSession(session: ChatSession, config: RealTimeProcessingConfig): boolean {
    if (!session.messages || session.messages.length < config.minChatMessagesForProcessing) {
      return false;
    }

    const hasPositiveFeedback = session.messages.some(msg => msg.isHelpful === true);
    if (!hasPositiveFeedback) {
      return false;
    }

    const avgConfidence = this.calculateAverageConfidence(session.messages);
    if (avgConfidence < config.chatFeedbackThreshold) {
      return false;
    }

    return true;
  }

  private shouldProcessTicket(ticket: Ticket, config: RealTimeProcessingConfig): boolean {
    if (ticket.status !== TicketStatus.RESOLVED) {
      return false;
    }

    if (!ticket.messages || ticket.messages.length < config.minTicketMessagesForProcessing) {
      return false;
    }

    if (ticket.resolutionTimeHours && ticket.resolutionTimeHours > config.ticketResolutionTimeThreshold) {
      return false;
    }

    if (ticket.isSLABreached) {
      return false;
    }

    return true;
  }

  private calculateAverageConfidence(messages: ChatMessage[]): number {
    const botMessages = messages.filter(msg => msg.confidenceScore !== null);
    if (botMessages.length === 0) return 0;
    const sum = botMessages.reduce((acc, msg) => acc + (msg.confidenceScore || 0), 0);
    return sum / botMessages.length;
  }

  private async scheduleProcessing(key: string, delay: number, processor: () => Promise<void>): Promise<void> {
    const existing = this.processingQueue.get(key);
    if (existing) {
      clearTimeout(existing);
    }

    const timeout = setTimeout(async () => {
      try {
        await processor();
        this.processingQueue.delete(key);
      } catch (error) {
        this.logger.error(`Scheduled processing failed for ${key}:`, error);
        this.processingQueue.delete(key);
      }
    }, delay);

    this.processingQueue.set(key, timeout);
  }

  private async executeChatProcessing(session: ChatSession): Promise<void> {
    this.logger.log(`Executing FAQ learning for chat session ${session.id}`);
    try {
      await this.faqLearningService.processRealTimeData('chat', session.id, session.tenantId);
      this.logger.log(`Chat session ${session.id} processed successfully`);
    } catch (error) {
      this.logger.error(`Chat processing failed for session ${session.id}:`, error);
    }
  }

  private async executeTicketProcessing(ticket: Ticket): Promise<void> {
    this.logger.log(`Executing FAQ learning for ticket ${ticket.id}`);
    try {
      await this.faqLearningService.processRealTimeData('ticket', ticket.id, ticket.tenantId);
      this.logger.log(`Ticket ${ticket.id} processed successfully`);
    } catch (error) {
      this.logger.error(`Ticket processing failed for ticket ${ticket.id}:`, error);
    }
  }

  private async getProcessingConfig(tenantId: string): Promise<RealTimeProcessingConfig> {
    try {
      const configs = await this.configRepository.find({
        where: [
          { configKey: 'advanced_settings', tenantId },
          { configKey: 'data_processing', tenantId },
        ],
      });

      const advancedSettings = configs.find(c => c.configKey === 'advanced_settings')?.configValue || {};
      const dataProcessing = configs.find(c => c.configKey === 'data_processing')?.configValue || {};

      return {
        enableChatProcessing: advancedSettings.enableRealTimeProcessing || false,
        enableTicketProcessing: advancedSettings.enableRealTimeProcessing || false,
        minChatMessagesForProcessing: dataProcessing.minChatMessages || 3,
        minTicketMessagesForProcessing: dataProcessing.minTicketMessages || 2,
        processingDelay: dataProcessing.processingDelay || 5000,
        chatFeedbackThreshold: advancedSettings.chatFeedbackThreshold || 70,
        ticketResolutionTimeThreshold: advancedSettings.ticketResolutionTimeThreshold || 24,
      };
    } catch (error) {
      this.logger.error('Failed to load processing config:', error);
      return {
        enableChatProcessing: false,
        enableTicketProcessing: false,
        minChatMessagesForProcessing: 3,
        minTicketMessagesForProcessing: 2,
        processingDelay: 5000,
        chatFeedbackThreshold: 70,
        ticketResolutionTimeThreshold: 24,
      };
    }
  }

  getQueueStatus(): { queueSize: number; pendingItems: string[] } {
    return {
      queueSize: this.processingQueue.size,
      pendingItems: Array.from(this.processingQueue.keys()),
    };
  }

  clearQueue(): void {
    for (const timeout of this.processingQueue.values()) {
      clearTimeout(timeout);
    }
    this.processingQueue.clear();
    this.logger.log('Processing queue cleared');
  }
}
