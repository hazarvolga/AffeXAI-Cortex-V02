import { Injectable, Logger } from '@nestjs/common';
import { AiService, AiGenerationOptions, AiGenerationResult } from '../../ai/ai.service';
import { SettingsService } from '../../settings/settings.service';
import { ChatContextEngineService, ContextResult, ContextSource } from './chat-context-engine.service';
import { ChatAiSettingsService, ChatAiConfiguration } from './chat-ai-settings.service';
import { AiModel, AiProvider } from '../../settings/dto/ai-settings.dto';
import { TenantService } from '../../../core/tenant/tenant.service';

export interface ChatAiOptions extends AiGenerationOptions {
  includeContext?: boolean;
  contextOptions?: {
    maxSources?: number;
    minRelevanceScore?: number;
    includeKnowledgeBase?: boolean;
    includeFaqLearning?: boolean;
    includeDocuments?: boolean;
  };
  streamResponse?: boolean;
  sessionId?: string;
  messageId?: string;
}

export interface ChatAiResult extends AiGenerationResult {
  contextUsed?: ContextResult;
  contextSources?: ContextSource[];
  confidenceScore?: number;
  citations?: string[];
  streamingSupported?: boolean;
}

export interface StreamingChunk {
  content: string;
  isComplete: boolean;
  metadata?: {
    tokensGenerated?: number;
    processingTime?: number;
  };
}

@Injectable()
export class ChatAiService {
  private readonly logger = new Logger(ChatAiService.name);

  constructor(
    private readonly aiService: AiService,
    private readonly settingsService: SettingsService,
    private readonly contextEngine: ChatContextEngineService,
    private readonly chatAiSettingsService: ChatAiSettingsService,
    private readonly tenantService: TenantService,
  ) { }

  /**
   * Generate AI response with chat context integration
   */
  async generateChatResponse(
    prompt: string,
    options: ChatAiOptions = {}
  ): Promise<ChatAiResult> {
    const tenantId = this.tenantService.getTenantId();
    const startTime = Date.now();

    try {
      // Get AI configuration with failover support
      const config = await this.chatAiSettingsService.getConfigurationWithFailover();

      // Build context if requested
      let contextResult: ContextResult | undefined;
      let enhancedPrompt = prompt;

      if (options.includeContext && options.sessionId) {
        contextResult = await this.contextEngine.buildContext(
          prompt,
          options.sessionId,
          options.contextOptions
        );

        enhancedPrompt = this.buildContextAwarePrompt(prompt, contextResult);
      }

      // Prepare AI generation options
      const aiOptions: AiGenerationOptions = {
        model: options.model || config.model,
        provider: options.provider || config.provider,
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 2000,
        systemPrompt: this.buildSystemPrompt(options.sessionId ? 'support' : 'general')
      };

      // Generate AI response with retry logic
      const aiResult = await this.generateWithRetry(
        config,
        enhancedPrompt,
        aiOptions
      );

      // Calculate confidence score based on context and AI response
      const confidenceScore = this.calculateConfidenceScore(
        aiResult,
        contextResult,
        prompt
      );

      // Extract citations from the response
      const citations = this.extractCitations(aiResult.content, contextResult?.sources || []);

      const processingTime = Date.now() - startTime;

      this.logger.log(
        `Generated chat response: ${aiResult.content.length} chars, ` +
        `confidence: ${confidenceScore.toFixed(2)}, ` +
        `context sources: ${contextResult?.sources.length || 0}, ` +
        `time: ${processingTime}ms`
      );

      return {
        ...aiResult,
        contextUsed: contextResult,
        contextSources: contextResult?.sources,
        confidenceScore,
        citations,
        streamingSupported: this.isStreamingSupported(aiResult.provider, aiResult.model)
      };

    } catch (error) {
      this.logger.error(`Error generating chat response: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate streaming AI response with context
   */
  async *generateStreamingChatResponse(
    prompt: string,
    options: ChatAiOptions = {}
  ): AsyncGenerator<StreamingChunk, ChatAiResult, unknown> {
    const tenantId = this.tenantService.getTenantId();
    const startTime = Date.now();

    try {
      // Get AI configuration with failover support
      const config = await this.chatAiSettingsService.getConfigurationWithFailover();

      // Build context if requested
      let contextResult: ContextResult | undefined;
      let enhancedPrompt = prompt;

      if (options.includeContext && options.sessionId) {
        contextResult = await this.contextEngine.buildContext(
          prompt,
          options.sessionId,
          options.contextOptions
        );

        enhancedPrompt = this.buildContextAwarePrompt(prompt, contextResult);
      }

      // Check if streaming is supported for this provider/model
      if (!this.isStreamingSupported(config.provider, config.model)) {
        // Fallback to non-streaming response
        const result = await this.generateChatResponse(prompt, options);
        yield {
          content: result.content,
          isComplete: true,
          metadata: {
            tokensGenerated: result.tokensUsed,
            processingTime: Date.now() - startTime
          }
        };
        return result;
      }

      // Generate streaming response
      let fullContent = '';
      let tokensGenerated = 0;

      for await (const chunk of this.generateStreamingCompletion(config.apiKey, enhancedPrompt, {
        model: options.model || config.model,
        provider: options.provider || config.provider,
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 2000,
        systemPrompt: this.buildSystemPrompt(options.sessionId ? 'support' : 'general')
      })) {
        fullContent += chunk.content;
        tokensGenerated += chunk.tokensGenerated || 0;

        yield {
          content: chunk.content,
          isComplete: chunk.isComplete,
          metadata: {
            tokensGenerated,
            processingTime: Date.now() - startTime
          }
        };
      }

      // Calculate final metrics
      const confidenceScore = this.calculateConfidenceScore(
        { content: fullContent, tokensUsed: tokensGenerated } as AiGenerationResult,
        contextResult,
        prompt
      );

      const citations = this.extractCitations(fullContent, contextResult?.sources || []);
      const processingTime = Date.now() - startTime;

      this.logger.log(
        `Generated streaming chat response: ${fullContent.length} chars, ` +
        `confidence: ${confidenceScore.toFixed(2)}, ` +
        `context sources: ${contextResult?.sources.length || 0}, ` +
        `time: ${processingTime}ms`
      );

      return {
        content: fullContent,
        model: config.model,
        provider: config.provider,
        tokensUsed: tokensGenerated,
        finishReason: 'completed',
        contextUsed: contextResult,
        contextSources: contextResult?.sources,
        confidenceScore,
        citations,
        streamingSupported: true
      };

    } catch (error) {
      this.logger.error(`Error generating streaming chat response: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Build context-aware prompt with sources
   */
  private buildContextAwarePrompt(userPrompt: string, contextResult: ContextResult): string {
    if (!contextResult.sources.length) {
      return userPrompt;
    }

    let contextSection = '\n\n=== CONTEXT INFORMATION ===\n';
    contextSection += `Found ${contextResult.sources.length} relevant sources:\n\n`;

    contextResult.sources.forEach((source, index) => {
      contextSection += `[${index + 1}] ${source.type.toUpperCase()}: ${source.title}\n`;
      contextSection += `Relevance: ${(source.relevanceScore * 100).toFixed(1)}%\n`;
      contextSection += `Content: ${source.content}\n`;
      if (source.url) {
        contextSection += `URL: ${source.url}\n`;
      }
      contextSection += '\n';
    });

    contextSection += '=== END CONTEXT ===\n\n';
    contextSection += 'Please use the above context information to provide a comprehensive and accurate response. ';
    contextSection += 'Include citations using [1], [2], etc. format when referencing specific sources. ';
    contextSection += 'If the context doesn\'t contain relevant information, please indicate that and provide general guidance.\n\n';
    contextSection += `User Question: ${userPrompt}`;

    return contextSection;
  }

  /**
   * Build system prompt based on chat type
   */
  private buildSystemPrompt(chatType: 'support' | 'general'): string {
    const basePrompt = `You are an AI assistant integrated into a professional support system. `;

    if (chatType === 'support') {
      return basePrompt +
        `Your role is to provide helpful, accurate, and professional support responses. ` +
        `You have access to knowledge base articles, FAQ entries, and uploaded documents. ` +
        `Always cite your sources using [1], [2], etc. format when referencing specific information. ` +
        `If you cannot find relevant information in the provided context, clearly state this and offer general guidance. ` +
        `Be concise but thorough, and maintain a professional and helpful tone. ` +
        `If the question requires human intervention or is outside your capabilities, suggest escalating to a support team member.`;
    } else {
      return basePrompt +
        `Your role is to provide general information and guidance about the platform and services. ` +
        `Be helpful and informative while maintaining a friendly and professional tone. ` +
        `If users need specific technical support, guide them to the appropriate support channels. ` +
        `Keep responses concise and actionable.`;
    }
  }

  /**
   * Calculate confidence score based on multiple factors
   */
  private calculateConfidenceScore(
    aiResult: Partial<AiGenerationResult>,
    contextResult?: ContextResult,
    originalPrompt?: string
  ): number {
    let confidence = 0.5; // Base confidence

    // Context quality factor (0-0.3)
    if (contextResult) {
      const avgRelevance = contextResult.sources.length > 0
        ? contextResult.sources.reduce((sum, s) => sum + s.relevanceScore, 0) / contextResult.sources.length
        : 0;
      confidence += avgRelevance * 0.3;
    }

    // Response length factor (0-0.1)
    if (aiResult.content) {
      const responseLength = aiResult.content.length;
      if (responseLength > 100 && responseLength < 2000) {
        confidence += 0.1; // Optimal length
      } else if (responseLength >= 50) {
        confidence += 0.05; // Acceptable length
      }
    }

    // Finish reason factor (0-0.1)
    if (aiResult.finishReason === 'stop' || aiResult.finishReason === 'completed') {
      confidence += 0.1;
    }

    // Citation factor (0-0.1)
    if (aiResult.content && contextResult?.sources.length) {
      const citationCount = (aiResult.content.match(/\[\d+\]/g) || []).length;
      if (citationCount > 0) {
        confidence += Math.min(0.1, citationCount * 0.02);
      }
    }

    // Normalize to 0-1 range
    return Math.min(1, Math.max(0, confidence));
  }

  /**
   * Extract citations from AI response
   */
  private extractCitations(content: string, sources: ContextSource[]): string[] {
    const citations: string[] = [];
    const citationMatches: string[] = content.match(/\[(\d+)\]/g) || [];

    citationMatches.forEach((match) => {
      const index = parseInt(match.replace(/[\[\]]/g, '')) - 1;
      if (index >= 0 && index < sources.length) {
        const source = sources[index];
        let citation = `${source.title}`;
        if (source.url) {
          citation += ` (${source.url})`;
        }
        if (!citations.includes(citation)) {
          citations.push(citation);
        }
      }
    });

    return citations;
  }

  /**
   * Check if streaming is supported for provider/model
   */
  private isStreamingSupported(provider: AiProvider, model: string): boolean {
    switch (provider) {
      case AiProvider.OPENAI:
      case AiProvider.OPENROUTER:
        return true;
      case AiProvider.ANTHROPIC:
        return true;
      case AiProvider.GOOGLE:
        return false; // Google doesn't support streaming in current implementation
      case AiProvider.LOCAL:
        return false; // Local models don't support streaming in current implementation
      default:
        return false;
    }
  }

  /**
   * Generate streaming completion (internal method)
   */
  private async *generateStreamingCompletion(
    apiKey: string,
    prompt: string,
    options: {
      model: AiModel;
      provider: AiProvider;
      temperature: number;
      maxTokens: number;
      systemPrompt?: string;
    }
  ): AsyncGenerator<{ content: string; isComplete: boolean; tokensGenerated?: number }, void, unknown> {
    // This is a simplified implementation - in a real scenario, you'd need to implement
    // streaming for each provider separately using their streaming APIs

    try {
      switch (options.provider) {
        case AiProvider.OPENAI:
        case AiProvider.OPENROUTER:
          yield* this.generateOpenAIStreaming(apiKey, prompt, options);
          break;
        case AiProvider.ANTHROPIC:
          yield* this.generateAnthropicStreaming(apiKey, prompt, options);
          break;
        default:
          // Fallback to non-streaming
          const result = await this.aiService.generateCompletion(apiKey, prompt, options);
          yield {
            content: result.content,
            isComplete: true,
            tokensGenerated: result.tokensUsed
          };
      }
    } catch (error) {
      this.logger.error(`Streaming generation error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * OpenAI streaming implementation
   */
  private async *generateOpenAIStreaming(
    apiKey: string,
    prompt: string,
    options: {
      model: AiModel;
      temperature: number;
      maxTokens: number;
      systemPrompt?: string;
    }
  ): AsyncGenerator<{ content: string; isComplete: boolean; tokensGenerated?: number }, void, unknown> {
    // Import OpenAI dynamically to avoid circular dependencies
    const OpenAI = (await import('openai')).default;

    const client = new OpenAI({ apiKey });

    const messages: any[] = [];
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const stream = await client.chat.completions.create({
      model: options.model,
      messages,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      stream: true,
    });

    let tokensGenerated = 0;

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      const isComplete = chunk.choices[0]?.finish_reason !== null;

      if (content) {
        tokensGenerated += 1; // Approximate token count
      }

      yield {
        content,
        isComplete,
        tokensGenerated
      };

      if (isComplete) break;
    }
  }

  /**
   * Anthropic streaming implementation
   */
  private async *generateAnthropicStreaming(
    apiKey: string,
    prompt: string,
    options: {
      model: AiModel;
      temperature: number;
      maxTokens: number;
      systemPrompt?: string;
    }
  ): AsyncGenerator<{ content: string; isComplete: boolean; tokensGenerated?: number }, void, unknown> {
    // Import Anthropic dynamically
    const { Anthropic } = await import('@anthropic-ai/sdk');

    const client = new Anthropic({ apiKey });

    const stream = await client.messages.create({
      model: options.model,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      system: options.systemPrompt,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });

    let tokensGenerated = 0;

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        const content = chunk.delta.text;
        tokensGenerated += 1; // Approximate token count

        yield {
          content,
          isComplete: false,
          tokensGenerated
        };
      } else if (chunk.type === 'message_stop') {
        yield {
          content: '',
          isComplete: true,
          tokensGenerated
        };
        break;
      }
    }
  }

  /**
   * Generate AI response with retry logic and failover
   */
  private async generateWithRetry(
    config: ChatAiConfiguration,
    prompt: string,
    options: AiGenerationOptions,
    retryCount: number = 0
  ): Promise<AiGenerationResult> {
    try {
      const result = await this.aiService.generateCompletion(
        config.apiKey,
        prompt,
        options
      );

      // Reset failure count on success
      this.chatAiSettingsService.resetProviderFailures(config.provider, config.tenantId);

      return result;

    } catch (error) {
      this.logger.warn(`AI generation attempt ${retryCount + 1} failed: ${error.message}`);

      // If we haven't exceeded max retries, try again
      if (retryCount < config.maxRetries) {
        // Wait before retry (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));

        return this.generateWithRetry(config, prompt, options, retryCount + 1);
      }

      // If all retries failed, try failover
      if (retryCount >= config.maxRetries) {
        this.chatAiSettingsService.recordProviderFailure(config.provider, config.tenantId);
        this.logger.warn(`All retries failed for ${config.provider}, attempting failover`);

        try {
          const fallbackConfig = await this.chatAiSettingsService.getConfigurationWithFailover();

          // Only try failover if we get a different provider
          if (fallbackConfig.provider !== config.provider) {
            return await this.aiService.generateCompletion(
              fallbackConfig.apiKey,
              prompt,
              {
                ...options,
                model: fallbackConfig.model,
                provider: fallbackConfig.provider
              }
            );
          }
        } catch (failoverError) {
          this.logger.error(`Failover also failed: ${failoverError.message}`);
        }
      }

      throw error;
    }
  }

  /**
   * Test AI configuration for chat
   */
  async testChatAiConfiguration(): Promise<{
    success: boolean;
    provider: AiProvider;
    model: AiModel;
    streamingSupported: boolean;
    responseTime: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      const config = await this.chatAiSettingsService.getConfigurationWithFailover();
      const streamingSupported = this.isStreamingSupported(config.provider, config.model);

      // Test with a simple prompt
      const testResult = await this.aiService.generateCompletion(
        config.apiKey,
        'Hello, this is a test message. Please respond with "Test successful".',
        {
          model: config.model,
          provider: config.provider,
          maxTokens: 50,
          temperature: 0.1
        }
      );

      const responseTime = Date.now() - startTime;

      return {
        success: true,
        provider: config.provider,
        model: config.model,
        streamingSupported,
        responseTime,
      };

    } catch (error) {
      return {
        success: false,
        provider: AiProvider.OPENAI,
        model: AiModel.GPT_4_TURBO,
        streamingSupported: false,
        responseTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * Get AI usage statistics for chat
   */
  async getChatAiUsageStats(sessionId?: string): Promise<{
    totalRequests: number;
    totalTokens: number;
    averageResponseTime: number;
    averageConfidence: number;
    providerUsage: Record<AiProvider, number>;
    modelUsage: Record<AiModel, number>;
  }> {
    // Get analytics from the settings service
    const analytics = await this.chatAiSettingsService.getAiUsageAnalytics();

    return {
      totalRequests: analytics.totalRequests,
      totalTokens: analytics.totalTokens,
      averageResponseTime: Object.values(analytics.providerBreakdown)
        .reduce((sum, provider) => sum + provider.averageResponseTime, 0) /
        Object.keys(analytics.providerBreakdown).length || 0,
      averageConfidence: analytics.averageConfidence,
      providerUsage: Object.fromEntries(
        Object.entries(analytics.providerBreakdown).map(([provider, data]) => [provider, data.requests])
      ) as Record<AiProvider, number>,
      modelUsage: Object.fromEntries(
        Object.entries(analytics.modelBreakdown).map(([model, data]) => [model, data.requests])
      ) as Record<AiModel, number>
    };
  }

  /**
   * Get provider health status
   */
  async getProviderHealthStatus() {
    return this.chatAiSettingsService.getProviderHealthStatus();
  }

  /**
   * Test all configured providers
   */
  async testAllProviders() {
    return this.chatAiSettingsService.testAllProviders();
  }
}
