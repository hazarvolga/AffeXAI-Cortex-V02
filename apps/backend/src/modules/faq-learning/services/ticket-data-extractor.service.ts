import { BadRequestException } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, Not, IsNull } from 'typeorm';
import { DataExtractor, ExtractedData, ExtractionCriteria } from '../interfaces/data-extraction.interface';
import { DataNormalizerService } from './data-normalizer.service';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { TicketMessage } from '../../tickets/entities/ticket-message.entity';
import { TicketStatus } from '../../tickets/enums/ticket-status.enum';

/**
 * Ticket Data Extractor Service
 * Extracts learning data from resolved tickets for FAQ generation
 *
 * Extraction Logic:
 * 1. Query resolved/closed tickets within date range
 * 2. Extract question from ticket description (initial user problem)
 * 3. Extract answer from last non-internal message before resolution
 * 4. Calculate confidence based on resolution time, satisfaction, and message quality
 * 5. Apply filtering criteria (min resolution time, satisfaction score, categories)
 */
@Injectable()
export class TicketDataExtractorService implements DataExtractor {
  private readonly logger = new Logger(TicketDataExtractorService.name);

  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    @InjectRepository(TicketMessage)
    private ticketMessageRepository: Repository<TicketMessage>,
    private dataNormalizer: DataNormalizerService,
  ) { }

  /**
   * Extract learning data from resolved tickets
   * Queries real ticket data from the database
   */
  async extract(criteria: ExtractionCriteria): Promise<ExtractedData[]> {
    if(!criteria.tenantId || !/^[A-Za-z0-9_-]{1,128}$/.test(criteria.tenantId))throw new BadRequestException('Explicit tenant required for extraction');
    if(criteria.sourceIds && (!Array.isArray(criteria.sourceIds)||criteria.sourceIds.length===0||criteria.sourceIds.length>100))throw new BadRequestException('Invalid source selection');
    this.logger.log('Extracting data from tickets (real implementation)');

    const extractedData: ExtractedData[] = [];

    try {
      // Build query conditions
      const whereConditions: any = {
        status: In([TicketStatus.RESOLVED, TicketStatus.CLOSED]),
        resolvedAt: Not(IsNull()),
      };

      // Apply tenant filter
      if (criteria.tenantId) {
        whereConditions.tenantId = criteria.tenantId;
      }

      if(criteria.sourceIds)whereConditions.id=In(criteria.sourceIds);
      // Apply date range filter
      if (criteria.dateRange) {
        whereConditions.resolvedAt = Between(
          criteria.dateRange.from,
          criteria.dateRange.to
        );
      }

      // Query tickets with relations
      const tickets = await this.ticketRepository.find({
        where: whereConditions,
        relations: ['messages', 'messages.author', 'category', 'user', 'assignedTo'],
        order: { resolvedAt: 'DESC' },
        take: criteria.maxResults || 500,
      });

      this.logger.log(`Found ${tickets.length} resolved tickets to process`);

      for (const ticket of tickets) {
        try {
          // Skip if no messages
          if (!ticket.messages || ticket.messages.length === 0) {
            continue;
          }

          // Calculate resolution time in seconds
          const resolutionTime = ticket.resolvedAt
            ? Math.floor((ticket.resolvedAt.getTime() - ticket.createdAt.getTime()) / 1000)
            : 0;

          // Apply minimum resolution time filter
          if (criteria.minResolutionTime && resolutionTime < criteria.minResolutionTime) {
            continue;
          }

          // Apply category filters
          const categoryName = ticket.category?.name || 'General';
          if (criteria.excludedCategories?.includes(categoryName)) {
            continue;
          }
          if (criteria.includeCategories?.length && !criteria.includeCategories.includes(categoryName)) {
            continue;
          }

          // Extract question from ticket description
          const question = this.extractQuestion(ticket);
          if (!question || question.length < 10) {
            continue;
          }

          // Extract answer from resolution messages
          const answer = await this.extractAnswer(ticket);
          if (!answer || answer.length < 20) {
            continue;
          }

          // Calculate confidence score
          const confidence = this.calculateTicketConfidence(ticket, resolutionTime);

          // Apply satisfaction score filter if available
          const satisfactionScore = this.extractSatisfactionScore(ticket);
          if (criteria.requiredSatisfactionScore && satisfactionScore < criteria.requiredSatisfactionScore) {
            continue;
          }

          // Extract keywords from question and answer
          const keywords = this.dataNormalizer.extractKeywords(`${question} ${answer}`);

          // Build context from ticket metadata
          const context = this.buildContext(ticket);

          const data: ExtractedData = {
            id: `ticket-${ticket.id}`,
            source: 'ticket',
            sourceId: ticket.id,
            question: question.trim(),
            answer: answer.trim(),
            context,
            confidence,
            keywords,
            category: categoryName,
            extractedAt: new Date(),
            sessionDuration: resolutionTime,
            satisfactionScore,
            metadata: {
              timestamp: new Date(),
              ticketId: ticket.id,
              displayNumber: ticket.displayNumber,
              resolutionTime,
              satisfactionScore,
              agentId: ticket.assignedToId || undefined,
              agentName: ticket.assignedTo?.firstName
                ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName || ''}`.trim()
                : undefined,
              userId: ticket.userId,
              priority: ticket.priority,
              createdAt: ticket.createdAt.toISOString(),
              resolvedAt: ticket.resolvedAt?.toISOString(),
              closedAt: ticket.closedAt?.toISOString(),
              category: categoryName,
              tags: ticket.tags || [],
              messageCount: ticket.messages.length,
              subject: ticket.subject,
              escalationLevel: ticket.escalationLevel,
            }
          };

          // Validate data before adding
          if (this.validateData(data)) {
            extractedData.push(data);
          }
        } catch (ticketError) {
          this.logger.warn(`Error processing ticket ${ticket.id}: ${ticketError.message}`);
          continue;
        }
      }

      this.logger.log(`Successfully extracted ${extractedData.length} FAQ candidates from tickets`);
      return extractedData;

    } catch (error) {
      this.logger.error(`Failed to extract ticket data: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Extract question from ticket
   * Uses ticket subject and description to form the question
   */
  private extractQuestion(ticket: Ticket): string {
    // Combine subject and description for better question context
    let question = ticket.subject || '';

    // If description adds meaningful context, include it
    if (ticket.description) {
      const cleanDescription = this.dataNormalizer.cleanText(ticket.description);

      // If subject and description are different, combine them
      if (cleanDescription.toLowerCase() !== question.toLowerCase()) {
        // Extract first sentence or paragraph if description is long
        const firstPart = cleanDescription.split(/[.!?]\s/)[0];
        if (firstPart && firstPart.length > 20 && firstPart.length < 500) {
          question = `${question}: ${firstPart}`;
        } else if (cleanDescription.length < 500) {
          question = cleanDescription;
        }
      }
    }

    // Clean and format as question
    question = this.dataNormalizer.cleanText(question);

    // Ensure it ends with a question mark if it looks like a question
    if (!question.endsWith('?') && !question.endsWith('.')) {
      question = `${question}?`;
    }

    return question;
  }

  /**
   * Extract answer from ticket messages
   * Finds the best resolution message from agent responses
   */
  private async extractAnswer(ticket: Ticket): Promise<string> {
    // Get non-internal messages sorted by creation date
    const publicMessages = ticket.messages
      .filter(msg => !msg.isInternal && !msg.isDeleted)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    if (publicMessages.length === 0) {
      return '';
    }

    // Find agent responses (messages not from ticket creator)
    const agentMessages = publicMessages.filter(
      msg => msg.authorId !== ticket.userId
    );

    if (agentMessages.length === 0) {
      // If no agent messages, try to find AI-generated response in metadata
      const lastMessage = publicMessages[publicMessages.length - 1];
      if (lastMessage.metadata?.aiGenerated) {
        return this.dataNormalizer.cleanText(lastMessage.content);
      }
      return '';
    }

    // Get the last meaningful agent response
    // Prefer longer responses as they're usually more helpful
    let bestAnswer = '';
    let bestScore = 0;

    for (const msg of agentMessages) {
      const content = this.dataNormalizer.cleanText(msg.content);

      // Score based on:
      // 1. Length (longer is usually better, up to a point)
      // 2. Position (later messages often have the solution)
      // 3. Contains solution keywords
      const lengthScore = Math.min(content.length / 100, 5);
      const positionScore = agentMessages.indexOf(msg) / agentMessages.length * 2;
      const keywordScore = this.hasSolutionKeywords(content) ? 2 : 0;

      const score = lengthScore + positionScore + keywordScore;

      if (score > bestScore && content.length >= 50) {
        bestScore = score;
        bestAnswer = content;
      }
    }

    // If no good answer found, use the last agent message
    if (!bestAnswer && agentMessages.length > 0) {
      bestAnswer = this.dataNormalizer.cleanText(
        agentMessages[agentMessages.length - 1].content
      );
    }

    // Truncate if too long
    if (bestAnswer.length > 2000) {
      bestAnswer = bestAnswer.substring(0, 2000) + '...';
    }

    return bestAnswer;
  }

  /**
   * Check if content contains solution keywords
   */
  private hasSolutionKeywords(content: string): boolean {
    const solutionKeywords = [
      'solved', 'solution', 'fix', 'fixed', 'resolve', 'resolved',
      'here is', 'you can', 'to do this', 'follow these steps',
      'the answer', 'this will', 'try this', 'please try',
      'çözüm', 'çözüldü', 'yapabilirsiniz', 'şu şekilde', 'adımları izleyin'
    ];

    const lowerContent = content.toLowerCase();
    return solutionKeywords.some(keyword => lowerContent.includes(keyword));
  }

  /**
   * Calculate confidence score for ticket extraction
   */
  private calculateTicketConfidence(ticket: Ticket, resolutionTime: number): number {
    let confidence = 60; // Base confidence

    // Factor 1: Resolution time (faster is often better, but too fast might be incomplete)
    // Sweet spot: 10 min - 2 hours
    if (resolutionTime >= 600 && resolutionTime <= 7200) {
      confidence += 10;
    } else if (resolutionTime > 7200 && resolutionTime <= 28800) {
      confidence += 5;
    }

    // Factor 2: Number of messages (more discussion usually means clearer answer)
    const messageCount = ticket.messages?.length || 0;
    if (messageCount >= 3 && messageCount <= 10) {
      confidence += 10;
    } else if (messageCount > 10) {
      confidence += 5;
    }

    // Factor 3: Has assigned agent (human verified)
    if (ticket.assignedToId) {
      confidence += 5;
    }

    // Factor 4: Low escalation level (resolved at first tier)
    if (ticket.escalationLevel === 0) {
      confidence += 5;
    }

    // Factor 5: Has category (organized data)
    if (ticket.categoryId) {
      confidence += 5;
    }

    // Factor 6: Not breached SLA (quality service)
    if (!ticket.isSLABreached) {
      confidence += 5;
    }

    // Cap at 100
    return Math.min(confidence, 100);
  }

  /**
   * Extract satisfaction score from ticket metadata
   */
  private extractSatisfactionScore(ticket: Ticket): number {
    // Check for CSAT in metadata
    if (ticket.metadata?.satisfactionScore) {
      return ticket.metadata.satisfactionScore;
    }

    // Check for rating in custom fields
    if (ticket.customFields?.rating) {
      return ticket.customFields.rating;
    }

    // Default to neutral if no rating available
    return 3;
  }

  /**
   * Build context string from ticket metadata
   */
  private buildContext(ticket: Ticket): string {
    const contextParts: string[] = [];

    if (ticket.category?.name) {
      contextParts.push(`Category: ${ticket.category.name}`);
    }

    if (ticket.priority) {
      contextParts.push(`Priority: ${ticket.priority}`);
    }

    if (ticket.tags?.length) {
      contextParts.push(`Tags: ${ticket.tags.join(', ')}`);
    }

    if (ticket.companyName) {
      contextParts.push(`Company: ${ticket.companyName}`);
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
      data.source === 'ticket' &&
      data.question &&
      data.question.length >= 10 &&
      data.answer &&
      data.answer.length >= 20 &&
      data.confidence >= 0 &&
      data.confidence <= 100 &&
      data.metadata?.timestamp
    );
  }

  /**
   * Extract data from specific ticket IDs
   */
  async extractFromIds(ticketIds: string[], criteria: ExtractionCriteria): Promise<ExtractedData[]> {
    this.logger.log(`Extracting data from specific tickets: ${ticketIds.join(', ')}`);

    const allData = await this.extract({
      ...criteria,
      maxResults: ticketIds.length,
      sourceIds:ticketIds,
    });

    return allData.filter(data => ticketIds.includes(data.sourceId));
  }

  /**
   * Get extraction statistics
   */
  async getExtractionStats(tenantId: string): Promise<{
    totalTickets: number;
    resolvedTickets: number;
    extractableTickets: number;
    lastExtraction: Date | null;
  }> {
    try {
      const totalTickets = await this.ticketRepository.count({
        where: { tenantId }
      });

      const resolvedTickets = await this.ticketRepository.count({
        where: {
          status: In([TicketStatus.RESOLVED, TicketStatus.CLOSED]),
          tenantId
        }
      });

      // Extractable = resolved with at least 2 messages
      const extractableTickets = await this.ticketRepository
        .createQueryBuilder('ticket')
        .leftJoin('ticket.messages', 'message')
        .where('ticket.status IN (:...statuses)', {
          statuses: [TicketStatus.RESOLVED, TicketStatus.CLOSED]
        })
        .andWhere('ticket.resolvedAt IS NOT NULL')
        .andWhere('ticket.tenantId = :tenantId', { tenantId })
        .groupBy('ticket.id')
        .having('COUNT(message.id) >= 2')
        .getCount();

      return {
        totalTickets,
        resolvedTickets,
        extractableTickets,
        lastExtraction: new Date() // Will be tracked in separate table in future
      };
    } catch (error) {
      this.logger.error(`Failed to get extraction stats: ${error.message}`);
      return {
        totalTickets: 0,
        resolvedTickets: 0,
        extractableTickets: 0,
        lastExtraction: null
      };
    }
  }
}
