import { authorizeChatSession } from '../services/chat-session-access';
import { ChatSessionService } from '../services/chat-session.service';
import { ChatMessageService } from '../services/chat-message.service';
import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
  Logger,
  Sse,
  MessageEvent,
  Param
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../users/enums/user-role.enum';
import { ChatAiService } from '../services/chat-ai.service';
import {
  ChatAiRequestDto,
  ChatAiTestRequestDto
} from '../dto/chat-ai-request.dto';
import {
  ChatAiResponseDto,
  ChatAiTestResponseDto,
  ChatAiUsageStatsDto,
  StreamingChunkResponseDto
} from '../dto/chat-ai-response.dto';
import { AiProvider, AiModel } from '../../settings/dto/ai-settings.dto';
import { Observable, map } from 'rxjs';

@ApiTags('Chat AI')
@Controller('chat/ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ChatAiController {
  private readonly logger = new Logger(ChatAiController.name);

  constructor(private readonly chatAiService: ChatAiService, private readonly sessions: ChatSessionService, private readonly messages: ChatMessageService) { }

  @Post('generate')
  @ApiOperation({ summary: 'Generate AI response with context' })
  @ApiResponse({
    status: 200,
    description: 'AI response generated successfully',
    type: ChatAiResponseDto
  })
  @ApiResponse({ status: 400, description: 'Invalid request parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'AI generation failed' })
  @Roles(UserRole.CUSTOMER, UserRole.SUPPORT_AGENT, UserRole.SUPPORT_MANAGER, UserRole.ADMIN)
  async generateResponse(
    @Body() request: ChatAiRequestDto,
    @CurrentUser() user: User
  ): Promise<ChatAiResponseDto> {
    await authorizeChatSession(this.sessions, this.messages, user, request.sessionId, request.messageId);
    this.logger.log(`Generating AI response for user ${user.id} in session ${request.sessionId}`);

    try {
      const result = await this.chatAiService.generateChatResponse(request.prompt, {
        includeContext: request.includeContext,
        contextOptions: request.contextOptions,
        sessionId: request.sessionId,
        messageId: request.messageId,
        model: request.model,
        provider: request.provider,
        temperature: request.temperature,
        maxTokens: request.maxTokens,
        streamResponse: false
      });

      return {
        content: result.content,
        model: result.model,
        provider: result.provider,
        tokensUsed: result.tokensUsed,
        finishReason: result.finishReason,
        contextUsed: result.contextUsed ? {
          sources: result.contextUsed.sources.map(source => ({
            id: source.id,
            type: source.type,
            title: source.title,
            content: source.content,
            relevanceScore: source.relevanceScore,
            url: source.url,
            sourceId: source.sourceId,
            metadata: source.metadata
          })),
          totalRelevanceScore: result.contextUsed.totalRelevanceScore,
          searchQuery: result.contextUsed.searchQuery,
          processingTime: result.contextUsed.processingTime
        } : undefined,
        contextSources: result.contextSources?.map(source => ({
          id: source.id,
          type: source.type,
          title: source.title,
          content: source.content,
          relevanceScore: source.relevanceScore,
          url: source.url,
          sourceId: source.sourceId,
          metadata: source.metadata
        })),
        confidenceScore: result.confidenceScore,
        citations: result.citations,
        streamingSupported: result.streamingSupported
      };

    } catch (error) {
      this.logger.error(`AI generation failed for user ${user.id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Sse('stream')
  @ApiOperation({ summary: 'Generate streaming AI response with context' })
  @ApiResponse({
    status: 200,
    description: 'Streaming AI response',
    type: StreamingChunkResponseDto
  })
  @ApiResponse({ status: 400, description: 'Invalid request parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(UserRole.CUSTOMER, UserRole.SUPPORT_AGENT, UserRole.SUPPORT_MANAGER, UserRole.ADMIN)
  async streamResponse(
    @Query('prompt') prompt: string,
    @Query('sessionId') sessionId: string,
    @Query('messageId') messageId?: string,
    @Query('includeContext') includeContext: boolean = true,
    @Query('maxSources') maxSources?: number,
    @Query('minRelevanceScore') minRelevanceScore?: number,
    @CurrentUser() user?: User
  ): Promise<Observable<MessageEvent>> {
    await authorizeChatSession(this.sessions, this.messages, user, sessionId, messageId);
    this.logger.log(`Starting streaming AI response for user ${user?.id} in session ${sessionId}`);

    return new Observable<MessageEvent>(observer => {
      (async () => {
        try {
          const generator = this.chatAiService.generateStreamingChatResponse(prompt, {
            includeContext,
            contextOptions: {
              maxSources,
              minRelevanceScore
            },
            sessionId,
            messageId,
            streamResponse: true
          });

          for await (const chunk of generator) {
            const event: MessageEvent = {
              data: {
                content: chunk.content,
                isComplete: chunk.isComplete,
                metadata: chunk.metadata
              }
            };

            observer.next(event);

            if (chunk.isComplete) {
              break;
            }
          }

          observer.complete();

        } catch (error) {
          this.logger.error(`Streaming AI generation failed: ${error.message}`, error.stack);
          observer.error(error);
        }
      })();
    });
  }

  @Post('test')
  @ApiOperation({ summary: 'Test AI configuration for chat' })
  @ApiResponse({
    status: 200,
    description: 'AI configuration test results',
    type: ChatAiTestResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_MANAGER)
  async testConfiguration(
    @Body() request: ChatAiTestRequestDto,
    @CurrentUser() user: User
  ): Promise<ChatAiTestResponseDto> {
    this.logger.log(`Testing AI configuration for user ${user.id}`);

    try {
      const result = await this.chatAiService.testChatAiConfiguration();

      return {
        success: result.success,
        provider: result.provider,
        model: result.model,
        streamingSupported: result.streamingSupported,
        responseTime: result.responseTime,
        error: result.error,
        testResponse: result.success ? 'Test successful' : undefined
      };

    } catch (error) {
      this.logger.error(`AI configuration test failed: ${error.message}`, error.stack);
      return {
        success: false,
        provider: AiProvider.OPENAI,
        model: AiModel.GPT_4_TURBO,
        streamingSupported: false,
        responseTime: 0,
        error: error.message
      };
    }
  }

  @Get('usage-stats')
  @ApiOperation({ summary: 'Get AI usage statistics' })
  @ApiQuery({ name: 'sessionId', required: false, description: 'Filter by session ID' })
  @ApiResponse({
    status: 200,
    description: 'AI usage statistics',
    type: ChatAiUsageStatsDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_MANAGER, UserRole.SUPPORT_AGENT)
  async getUsageStats(
    @Query('sessionId') sessionId?: string,
    @CurrentUser() user?: User
  ): Promise<ChatAiUsageStatsDto> {
    this.logger.log(`Getting AI usage stats for user ${user?.id}${sessionId ? ` and session ${sessionId}` : ''}`);

    try {
      const stats = await this.chatAiService.getChatAiUsageStats(sessionId);

      return {
        totalRequests: stats.totalRequests,
        totalTokens: stats.totalTokens,
        averageResponseTime: stats.averageResponseTime,
        averageConfidence: stats.averageConfidence,
        providerUsage: stats.providerUsage,
        modelUsage: stats.modelUsage,
        sessionStats: sessionId ? {
          sessionId,
          requestCount: 0, // Would be populated from actual usage data
          totalTokens: 0,
          averageConfidence: 0
        } : undefined
      };

    } catch (error) {
      this.logger.error(`Failed to get AI usage stats: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('context-preview/:sessionId')
  @ApiOperation({ summary: 'Preview context that would be used for AI generation' })
  @ApiResponse({
    status: 200,
    description: 'Context preview',
    type: 'object'
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(UserRole.CUSTOMER, UserRole.SUPPORT_AGENT, UserRole.SUPPORT_MANAGER, UserRole.ADMIN)
  async previewContext(
    @Param('sessionId') sessionId: string,
    @Query('query') query: string,
    @Query('maxSources') maxSources?: number,
    @Query('minRelevanceScore') minRelevanceScore?: number,
    @Query('includeKnowledgeBase') includeKnowledgeBase?: boolean,
    @Query('includeFaqLearning') includeFaqLearning?: boolean,
    @Query('includeDocuments') includeDocuments?: boolean,
    @CurrentUser() user?: User
  ) {
    this.logger.log(`Previewing context for user ${user?.id} in session ${sessionId}`);

    try {
      // This would use the context engine directly to show what context would be used
      // without actually generating an AI response
      return {
        message: 'Context preview functionality would be implemented here',
        sessionId,
        query,
        options: {
          maxSources,
          minRelevanceScore,
          includeKnowledgeBase,
          includeFaqLearning,
          includeDocuments
        }
      };

    } catch (error) {
      this.logger.error(`Context preview failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}