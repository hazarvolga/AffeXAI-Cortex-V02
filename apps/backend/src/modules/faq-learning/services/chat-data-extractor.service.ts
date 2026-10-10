import { BadRequestException } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { DataExtractor, ExtractedData, ExtractionCriteria } from '../interfaces/data-extraction.interface';
import { DataNormalizerService } from './data-normalizer.service';
import { ChatSession, ChatSessionStatus } from '../../chat/entities/chat-session.entity';
import { ChatMessage, ChatMessageSenderType, ChatMessageType } from '../../chat/entities/chat-message.entity';

/**
 * Chat Data Extractor Service
 * Extracts learning data from successful chat sessions for FAQ generation
 *
 * Extraction Logic:
 * 1. Query closed/resolved chat sessions within date range
 * 2. Extract Q&A pairs from user questions and AI/support responses
 * 3. Calculate confidence based on session duration, message quality, and user feedback
 * 4. Apply filtering criteria (min session duration, satisfaction score)
 */
@Injectable()
export class ChatDataExtractorService implements DataExtractor {
  private readonly logger = new Logger(ChatDataExtractorService.name);

  constructor(
    @InjectRepository(ChatSession)
    private chatSessionRepository: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private chatMessageRepository: Repository<ChatMessage>,
    private dataNormalizer: DataNormalizerService,
  ) { }

  /**
   * Extract learning data from successful chat sessions
   * Queries real chat data from the database
   */
  async extract(criteria: ExtractionCriteria): Promise<ExtractedData[]> {
    if(!criteria.tenantId || !/^[A-Za-z0-9_-]{1,128}$/.test(criteria.tenantId))throw new BadRequestException('Explicit tenant required for extraction');
    if(criteria.sourceIds && (!Array.isArray(criteria.sourceIds)||criteria.sourceIds.length===0||criteria.sourceIds.length>100))throw new BadRequestException('Invalid source selection');
    this.logger.log('Extracting data from chat sessions (real implementation)');

    const extractedData: ExtractedData[] = [];

    try {
      // Build query conditions
      const queryBuilder = this.chatSessionRepository
        .createQueryBuilder('session')
        .leftJoinAndSelect('session.messages', 'message')
        .leftJoinAndSelect('session.user', 'user')
        .where('session.status = :status', { status: ChatSessionStatus.CLOSED })
        .orderBy('session.closedAt', 'DESC');

      // Apply tenant filter
      if (criteria.tenantId) {
        queryBuilder.andWhere('session.tenantId = :tenantId', { tenantId: criteria.tenantId });
      }

      if(criteria.sourceIds)queryBuilder.andWhere('session.id IN (:...sourceIds)',{sourceIds:criteria.sourceIds});
      // Apply date range filter
      if (criteria.dateRange) {
        queryBuilder.andWhere('session.closedAt BETWEEN :from AND :to', {
          from: criteria.dateRange.from,
          to: criteria.dateRange.to
        });
      }

      // Limit results
      queryBuilder.take(criteria.maxResults || 500);

      const sessions = await queryBuilder.getMany();

      this.logger.log(`Found ${sessions.length} closed chat sessions to process`);

      for (const session of sessions) {
        try {
          // Skip if no messages
          if (!session.messages || session.messages.length < 2) {
            continue;
          }

          // Calculate session duration in seconds
          const sessionDuration = this.calculateSessionDuration(session);

          // Apply minimum session duration filter
          if (criteria.minSessionDuration && sessionDuration < criteria.minSessionDuration) {
            continue;
          }

          // Extract Q&A pairs from the session
          const qaPairs = this.extractQAPairs(session);

          if (qaPairs.length === 0) {
            continue;
          }

          // Get satisfaction score if available
          const satisfactionScore = this.extractSatisfactionScore(session);

          // Apply satisfaction score filter
          if (criteria.requiredSatisfactionScore && satisfactionScore < criteria.requiredSatisfactionScore) {
            continue;
          }

          // Process each Q&A pair
          for (let i = 0; i < qaPairs.length; i++) {
            const pair = qaPairs[i];

            // Extract keywords
            const keywords = this.dataNormalizer.extractKeywords(
              `${pair.question} ${pair.answer}`
            );

            // Calculate confidence for this pair
            const confidence = this.calculatePairConfidence(pair, session, satisfactionScore);

            // Determine category from metadata or session info
            const category = this.determineCategory(session, pair);

            // Apply category filters
            if (criteria.excludedCategories?.includes(category)) {
              continue;
            }
            if (criteria.includeCategories?.length && !criteria.includeCategories.includes(category)) {
              continue;
            }

            // Build context
            const context = this.buildContext(session, pair);

            const data: ExtractedData = {
              id: `chat-${session.id}-${i}`,
              source: 'chat',
              sourceId: session.id,
              question: pair.question.trim(),
              answer: pair.answer.trim(),
              context,
              confidence,
              keywords,
              category,
              extractedAt: new Date(),
              sessionDuration,
              satisfactionScore,
              metadata: {
                timestamp: new Date(),
                sessionId: session.id,
                sessionTitle: session.title || undefined,
                messageCount: session.messages.length,
                pairIndex: i,
                totalPairs: qaPairs.length,
                userId: session.userId,
                aiProvider: session.metadata?.aiProvider,
                modelUsed: session.metadata?.modelUsed,
                startedAt: session.createdAt.toISOString(),
                endedAt: session.closedAt?.toISOString(),
                sessionDuration,
                satisfactionScore,
                category,
                tags: session.metadata?.tags || [],
                hasHelpfulFeedback: pair.isHelpful,
                aiConfidence: pair.aiConfidence,
                contextSources: session.metadata?.contextSources || 0,
              }
            };

            // Validate data before adding
            if (this.validateData(data)) {
              extractedData.push(data);
            }
          }
        } catch (sessionError) {
          this.logger.warn(`Error processing session ${session.id}: ${sessionError.message}`);
          continue;
        }
      }

      this.logger.log(`Successfully extracted ${extractedData.length} FAQ candidates from chat sessions`);
      return extractedData;

    } catch (error) {
      this.logger.error(`Failed to extract chat data: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Calculate session duration in seconds
   */
  private calculateSessionDuration(session: ChatSession): number {
    if (!session.closedAt || !session.createdAt) {
      return 0;
    }

    return Math.floor(
      (session.closedAt.getTime() - session.createdAt.getTime()) / 1000
    );
  }

  /**
   * Extract Q&A pairs from chat messages
   * Pairs user questions with AI/support responses
   */
  private extractQAPairs(session: ChatSession): Array<{
    question: string;
    answer: string;
    isHelpful?: boolean;
    aiConfidence?: number;
  }> {
    const pairs: Array<{
      question: string;
      answer: string;
      isHelpful?: boolean;
      aiConfidence?: number;
    }> = [];

    // Sort messages by creation date
    const messages = [...session.messages].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Filter only text messages (not system, file, or URL messages)
    const textMessages = messages.filter(
      msg => msg.messageType === ChatMessageType.TEXT
    );

    let currentQuestion: ChatMessage | null = null;

    for (const message of textMessages) {
      if (message.senderType === ChatMessageSenderType.USER) {
        // This is a user question
        const content = this.dataNormalizer.cleanText(message.content);

        // Only consider meaningful questions (not greetings, thanks, etc.)
        if (this.isMeaningfulQuestion(content)) {
          currentQuestion = message;
        }
      } else if (
        (message.senderType === ChatMessageSenderType.AI ||
          message.senderType === ChatMessageSenderType.SUPPORT) &&
        currentQuestion
      ) {
        // This is a response to a user question
        const answer = this.dataNormalizer.cleanText(message.content);

        // Only consider meaningful answers
        if (this.isMeaningfulAnswer(answer)) {
          pairs.push({
            question: this.dataNormalizer.cleanText(currentQuestion.content),
            answer,
            isHelpful: message.isHelpful ?? undefined,
            aiConfidence: message.confidenceScore ?? message.metadata?.confidence,
          });
        }

        // Reset current question after pairing
        currentQuestion = null;
      }
    }

    return pairs;
  }

  /**
   * Check if text is a meaningful question
   */
  private isMeaningfulQuestion(text: string): boolean {
    // Filter out common non-question phrases
    const nonQuestionPhrases = [
      'hi', 'hello', 'hey', 'thanks', 'thank you', 'ok', 'okay', 'bye',
      'merhaba', 'selam', 'teşekkürler', 'sağol', 'tamam', 'peki', 'görüşürüz'
    ];

    const lowerText = text.toLowerCase().trim();

    // Too short
    if (lowerText.length < 15) {
      return false;
    }

    // Is just a greeting or acknowledgment
    if (nonQuestionPhrases.some(phrase =>
      lowerText === phrase || lowerText.startsWith(phrase + ' ')
    )) {
      return false;
    }

    return true;
  }

  /**
   * Check if text is a meaningful answer
   */
  private isMeaningfulAnswer(text: string): boolean {
    // Minimum length for a useful answer
    if (text.length < 30) {
      return false;
    }

    // Should contain at least some complete sentences
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) {
      return false;
    }

    return true;
  }

  /**
   * Calculate confidence score for a Q&A pair
   */
  private calculatePairConfidence(
    pair: { question: string; answer: string; isHelpful?: boolean; aiConfidence?: number },
    session: ChatSession,
    satisfactionScore: number
  ): number {
    let confidence = 60; // Base confidence

    // Factor 1: AI confidence score (if available)
    if (pair.aiConfidence && pair.aiConfidence > 0) {
      confidence += Math.min(pair.aiConfidence * 0.2, 15);
    }

    // Factor 2: User marked as helpful
    if (pair.isHelpful === true) {
      confidence += 15;
    } else if (pair.isHelpful === false) {
      confidence -= 15;
    }

    // Factor 3: Answer length (longer answers tend to be more helpful)
    const answerLength = pair.answer.length;
    if (answerLength >= 100 && answerLength <= 500) {
      confidence += 5;
    } else if (answerLength > 500 && answerLength <= 1000) {
      confidence += 10;
    }

    // Factor 4: Session has context sources (better informed answers)
    if (session.metadata?.contextSources && session.metadata.contextSources > 0) {
      confidence += 5;
    }

    // Factor 5: Session satisfaction score
    if (satisfactionScore >= 4) {
      confidence += 10;
    } else if (satisfactionScore >= 3) {
      confidence += 5;
    }

    // Factor 6: Answer contains structured content (lists, steps)
    if (this.hasStructuredContent(pair.answer)) {
      confidence += 5;
    }

    // Cap at 100
    return Math.min(Math.max(confidence, 0), 100);
  }

  /**
   * Check if answer contains structured content
   */
  private hasStructuredContent(answer: string): boolean {
    // Check for numbered lists, bullet points, or step indicators
    const structuredPatterns = [
      /\d+\.\s/,           // Numbered list
      /[-•]\s/,            // Bullet points
      /step\s*\d/i,        // Step 1, step 2
      /first|second|third|then|finally/i,
      /adım\s*\d/i,        // Turkish: adım 1
      /önce|sonra|ardından/i  // Turkish sequencing
    ];

    return structuredPatterns.some(pattern => pattern.test(answer));
  }

  /**
   * Extract satisfaction score from session
   */
  private extractSatisfactionScore(session: ChatSession): number {
    // Check metadata for satisfaction
    if (session.metadata?.customerSatisfaction) {
      return session.metadata.customerSatisfaction;
    }

    // Infer from message feedback
    const messages = session.messages || [];
    const helpfulMessages = messages.filter(m => m.isHelpful === true).length;
    const notHelpfulMessages = messages.filter(m => m.isHelpful === false).length;

    if (helpfulMessages > 0 || notHelpfulMessages > 0) {
      const helpfulRatio = helpfulMessages / (helpfulMessages + notHelpfulMessages);
      return Math.round(helpfulRatio * 5); // Scale to 1-5
    }

    // Default to neutral
    return 3;
  }

  /**
   * Determine category from session metadata
   */
  private determineCategory(
    session: ChatSession,
    pair: { question: string; answer: string }
  ): string {
    // Check session metadata for category
    if (session.metadata?.escalationCategory) {
      return session.metadata.escalationCategory;
    }

    // Check tags for category hints
    const tags = session.metadata?.tags || [];
    if (tags.length > 0) {
      return tags[0]; // Use first tag as category
    }

    // Try to infer from question content
    return this.inferCategory(pair.question);
  }

  /**
   * Infer category from question content
   */
  private inferCategory(question: string): string {
    const lowerQuestion = question.toLowerCase();

    const categoryKeywords: Record<string, string[]> = {
      'Technical': ['error', 'bug', 'crash', 'not working', 'problem', 'issue', 'hata', 'çalışmıyor', 'sorun'],
      'Account': ['account', 'login', 'password', 'profile', 'hesap', 'şifre', 'giriş'],
      'Billing': ['payment', 'invoice', 'price', 'subscription', 'ödeme', 'fatura', 'fiyat', 'abonelik'],
      'Installation': ['install', 'setup', 'download', 'kur', 'yükle', 'indir'],
      'Feature': ['how to', 'can i', 'feature', 'nasıl', 'özellik'],
      'License': ['license', 'activation', 'lisans', 'aktivasyon'],
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowerQuestion.includes(keyword))) {
        return category;
      }
    }

    return 'General';
  }

  /**
   * Build context string from session metadata
   */
  private buildContext(
    session: ChatSession,
    pair: { question: string; answer: string }
  ): string {
    const contextParts: string[] = [];

    if (session.sessionType) {
      contextParts.push(`Session Type: ${session.sessionType}`);
    }

    if (session.metadata?.aiProvider) {
      contextParts.push(`AI Provider: ${session.metadata.aiProvider}`);
    }

    if (session.metadata?.contextSources) {
      contextParts.push(`Context Sources: ${session.metadata.contextSources}`);
    }

    if (session.metadata?.tags?.length) {
      contextParts.push(`Tags: ${session.metadata.tags.join(', ')}`);
    }

    return contextParts.join('. ');
  }

  /**
   * Validate extracted data
   */
  validateData(data: ExtractedData): boolean {
    return !!(
      data.id &&
      data.sourceId &&
      data.source === 'chat' &&
      data.question &&
      data.question.length >= 10 &&
      data.answer &&
      data.answer.length >= 30 &&
      data.confidence >= 0 &&
      data.confidence <= 100 &&
      data.metadata?.timestamp
    );
  }

  /**
   * Get extraction statistics
   */
  async getExtractionStats(tenantId: string): Promise<{
    totalSessions: number;
    successfulSessions: number;
    extractableSessions: number;
    lastExtraction: Date | null;
  }> {
    try {
      const totalSessions = await this.chatSessionRepository.count({
        where: { tenantId }
      });

      const successfulSessions = await this.chatSessionRepository.count({
        where: {
          status: ChatSessionStatus.CLOSED,
          tenantId
        }
      });

      // Extractable = closed sessions with at least 2 messages
      const extractableSessions = await this.chatSessionRepository
        .createQueryBuilder('session')
        .leftJoin('session.messages', 'message')
        .where('session.status = :status', { status: ChatSessionStatus.CLOSED })
        .andWhere('session.tenantId = :tenantId', { tenantId })
        .groupBy('session.id')
        .having('COUNT(message.id) >= 2')
        .getCount();

      return {
        totalSessions,
        successfulSessions,
        extractableSessions,
        lastExtraction: new Date() // Will be tracked in separate table in future
      };
    } catch (error) {
      this.logger.error(`Failed to get extraction stats: ${error.message}`);
      return {
        totalSessions: 0,
        successfulSessions: 0,
        extractableSessions: 0,
        lastExtraction: null
      };
    }
  }
}
