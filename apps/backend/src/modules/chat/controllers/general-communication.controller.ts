import { IsString, IsOptional, IsIn, IsObject, IsUUID, IsBoolean, IsInt, Min, Max, MaxLength, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '../../users/enums/user-role.enum';
import { Controller, Post, Get, Body, Param, Query, UseGuards, Request, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { GeneralCommunicationAiService } from '../services/general-communication-ai.service';
import { GeneralCommunicationContextService } from '../services/general-communication-context.service';
import { ChatSessionService } from '../services/chat-session.service';
import { ChatSessionType } from '../entities/chat-session.entity';
import { authorizeChatSession } from '../services/chat-session-access';
import { ChatMessageService } from '../services/chat-message.service';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { ChatEscalationService } from '../services/chat-escalation.service';

export class CreateGeneralSessionDto {
  @IsOptional() @IsString() @MaxLength(200)
  title?: string;
  @IsOptional() @IsIn(['tr', 'en'])
  language?: 'tr' | 'en';
  @IsOptional() @IsObject()
  metadata?: Record<string, unknown>;
}

export class GeneralQueryDto {
  @IsString() @MinLength(1) @MaxLength(8192)
  query: string;
  @IsUUID()
  sessionId: string;
  @IsOptional() @IsBoolean()
  includeContextSources?: boolean;
  @IsOptional() @IsInt() @Min(1) @Max(4000)
  maxResponseLength?: number;
  @IsOptional() @IsIn(['friendly', 'professional', 'helpful'])
  tone?: 'friendly' | 'professional' | 'helpful';
  @IsOptional() @IsIn(['tr', 'en'])
  language?: 'tr' | 'en';
}

export class GetSuggestedTopicsDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50)
  limit?: number;
}

@Controller('chat/general')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GeneralCommunicationController {
  private readonly logger = new Logger(GeneralCommunicationController.name);

  constructor(
    private readonly generalCommunicationAiService: GeneralCommunicationAiService,
    private readonly generalContextService: GeneralCommunicationContextService,
    private readonly chatSessionService: ChatSessionService,
    private readonly chatEscalationService: ChatEscalationService,
    private readonly chatMessageService: ChatMessageService,
  ) { }

  /**
   * Create a new general communication session
   */
  @Post('sessions')
  async createGeneralSession(
    @Request() req: any,
    @Body() createSessionDto: CreateGeneralSessionDto
  ) {
    try {
      const userId = req.user.id;
      const { title, language = 'tr', metadata = {} } = createSessionDto;

      this.logger.log(`Creating general communication session for user ${userId}`);

      const session = await this.chatSessionService.createSession({
        userId,
        sessionType: ChatSessionType.GENERAL,
        title: title || (language === 'tr' ? 'Genel Sohbet' : 'General Chat'),
        metadata: {
          ...metadata,
          language,
          createdVia: 'general-communication-api',
          initialContext: 'platform-information'
        }
      });

      // Get conversation starters for the new session
      const conversationStarters = await this.generalCommunicationAiService.getConversationStarters(language);

      return {
        session,
        conversationStarters,
        suggestedTopics: await this.generalContextService.getSuggestedTopics(6)
      };

    } catch (error) {
      this.logger.error(`Error creating general session: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate AI response for general communication query
   */
  @Post('query')
  async handleGeneralQuery(
    @Request() req: any,
    @Body() queryDto: GeneralQueryDto
  ) {
    try {
      const userId = req.user.id;
      const {
        query,
        sessionId,
        includeContextSources = true,
        maxResponseLength = 800,
        tone = 'friendly',
        language = 'tr'
      } = queryDto;

      this.logger.log(`Handling general query for user ${userId} in session ${sessionId}`);

      // Validate session access
      await authorizeChatSession(this.chatSessionService, this.chatMessageService, req.user, sessionId);

      // Generate AI response
      const response = await this.generalCommunicationAiService.generateGeneralResponse(
        query,
        sessionId,
        {
          includeContextSources,
          maxResponseLength,
          tone,
          language
        }
      );

      return {
        response: response.content,
        confidence: response.confidence,
        responseType: response.responseType,
        suggestedActions: response.suggestedActions,
        contextSources: response.contextSources,
        escalationReason: response.escalationReason,
        timestamp: new Date()
      };

    } catch (error) {
      this.logger.error(`Error handling general query: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get conversation starters for general communication
   */
  @Get('conversation-starters')
  async getConversationStarters(
    @Query('language') language: string = 'tr'
  ) {
    try {
      const starters = await this.generalCommunicationAiService.getConversationStarters(language);

      return {
        starters,
        language,
        timestamp: new Date()
      };

    } catch (error) {
      this.logger.error(`Error getting conversation starters: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get suggested topics for general communication
   */
  @Get('suggested-topics')
  async getSuggestedTopics(
    @Query() getSuggestedTopicsDto: GetSuggestedTopicsDto
  ) {
    try {
      const { limit = 6 } = getSuggestedTopicsDto;

      const topics = await this.generalContextService.getSuggestedTopics(limit);

      return {
        topics,
        timestamp: new Date()
      };

    } catch (error) {
      this.logger.error(`Error getting suggested topics: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Check if a query is platform information related
   */
  @Post('analyze-query')
  async analyzeQuery(
    @Body() body: { query: string }
  ) {
    try {
      const { query } = body;

      const isPlatformQuery = this.generalContextService.isPlatformInformationQuery(query);

      return {
        query,
        isPlatformInformationQuery: isPlatformQuery,
        timestamp: new Date()
      };

    } catch (error) {
      this.logger.error(`Error analyzing query: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get general communication context for a query
   */
  @Post('context')
  async getGeneralContext(
    @Request() req: any,
    @Body() body: {
      query: string;
      sessionId: string;
      maxSources?: number;
      minRelevanceScore?: number;
      focusOnPlatformInfo?: boolean;
    }
  ) {
    try {
      const userId = req.user.id;
      const {
        query,
        sessionId,
        maxSources = 6,
        minRelevanceScore = 0.2,
        focusOnPlatformInfo = true
      } = body;

      // Validate session access
      await authorizeChatSession(this.chatSessionService, this.chatMessageService, req.user, sessionId);

      const contextResult = await this.generalContextService.buildGeneralContext(
        query,
        sessionId,
        {
          maxSources,
          minRelevanceScore,
          focusOnPlatformInfo
        }
      );

      return {
        ...contextResult,
        timestamp: new Date()
      };

    } catch (error) {
      this.logger.error(`Error getting general context: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get general communication session statistics
   */
  @Get('sessions/:sessionId/stats')
  async getSessionStats(
    @Request() req: any,
    @Param('sessionId') sessionId: string
  ) {
    try {
      const userId = req.user.id;

      // Validate session access
      await authorizeChatSession(this.chatSessionService, this.chatMessageService, req.user, sessionId);

      const session = await this.chatSessionService.getSession(sessionId);
      if (!session || session.sessionType !== ChatSessionType.GENERAL) {
        throw new Error('Session not found or not a general communication session');
      }

      // NOTE: getSessionMessageCount method planned for future implementation
      // const messageCount = await this.chatSessionService.getSessionMessageCount(sessionId);
      const messageCount = session.messageCount;
      const contextStats = await this.generalContextService['chatContextEngineService'].getContextStatistics(sessionId);

      return {
        sessionId,
        sessionType: session.sessionType,
        messageCount,
        contextStats,
        sessionDuration: session.updatedAt.getTime() - session.createdAt.getTime(),
        isActive: session.status === 'active',
        timestamp: new Date()
      };

    } catch (error) {
      this.logger.error(`Error getting session stats: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Escalate general communication session to support
   */
  @Post('sessions/:sessionId/escalate')
  async escalateToSupport(
    @Request() req: any,
    @Param('sessionId') sessionId: string,
    @Body() body: {
      reason?: string;
      notes?: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      category?: string;
    }
  ) {
    try {
      const userId = req.user.id;
      const { reason = 'user-requested', notes, priority = 'medium', category } = body;

      this.logger.log(`Escalating session ${sessionId} to support by user ${userId}`);

      await authorizeChatSession(this.chatSessionService, this.chatMessageService, req.user, sessionId);

      // Use escalation service for comprehensive escalation handling
      const escalationResult = await this.chatEscalationService.escalateToSupport({
        sessionId,
        userId,
        reason,
        notes,
        priority,
        category
      });

      return {
        success: escalationResult.success,
        session: escalationResult.session,
        assignment: escalationResult.assignment,
        escalationMessage: escalationResult.escalationMessage,
        notificationsSent: escalationResult.notificationsSent,
        timestamp: new Date()
      };

    } catch (error) {
      this.logger.error(`Error escalating session to support: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Analyze if session needs escalation
   */
  @Post('sessions/:sessionId/analyze-escalation')
  async analyzeEscalationNeed(
    @Request() req: any,
    @Param('sessionId') sessionId: string
  ) {
    try {
      const userId = req.user.id;

      // Validate session access
      await authorizeChatSession(this.chatSessionService, this.chatMessageService, req.user, sessionId);

      const analysis = await this.chatEscalationService.analyzeEscalationNeed(sessionId);

      return {
        ...analysis,
        sessionId,
        timestamp: new Date()
      };

    } catch (error) {
      this.logger.error(`Error analyzing escalation need: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get escalation history for a session
   */
  @Get('sessions/:sessionId/escalation-history')
  async getEscalationHistory(
    @Request() req: any,
    @Param('sessionId') sessionId: string
  ) {
    try {
      const userId = req.user.id;

      // Validate session access
      await authorizeChatSession(this.chatSessionService, this.chatMessageService, req.user, sessionId);

      const history = await this.chatEscalationService.getSessionEscalationHistory(sessionId);

      return {
        ...history,
        sessionId,
        timestamp: new Date()
      };

    } catch (error) {
      this.logger.error(`Error getting escalation history: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get escalation statistics
   */
  @Roles(UserRole.ADMIN, UserRole.SUPPORT, UserRole.SUPPORT_MANAGER, UserRole.SUPPORT_AGENT)
  @Get('escalation-statistics')
  async getEscalationStatistics(
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    try {
      const timeframe = from && to ? {
        from: new Date(from),
        to: new Date(to)
      } : undefined;

      const statistics = await this.chatEscalationService.getEscalationStatistics(timeframe);

      return {
        ...statistics,
        timeframe,
        timestamp: new Date()
      };

    } catch (error) {
      this.logger.error(`Error getting escalation statistics: ${error.message}`, error.stack);
      throw error;
    }
  }
}