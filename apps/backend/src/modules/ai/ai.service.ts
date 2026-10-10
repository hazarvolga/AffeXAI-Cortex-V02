import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AiModel, AiProvider } from '../settings/dto/ai-settings.dto';

export interface AiGenerationOptions {
  model?: AiModel;
  provider?: AiProvider;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  credentialContext?: AiCredentialContext;
}

export interface AiCredentialContext {
  tenantId: string;
  module: 'emailMarketing' | 'social' | 'support' | 'analytics';
  provider: AiProvider;
  revision: number;
}

export interface AiGenerationResult {
  content: string;
  model: string;
  provider: AiProvider;
  tokensUsed: number;
  finishReason: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openaiClients: Map<string, OpenAI> = new Map();
  private anthropicClients: Map<string, Anthropic> = new Map();
  private googleClients: Map<string, GoogleGenerativeAI> = new Map();
  private latestTenantRevision: Map<string, number> = new Map();

  /**
   * Detect AI provider from model name
   */
  private detectProvider(model: AiModel): AiProvider {
    if (model.startsWith('gpt-') || model.includes('openai/')) {
      return AiProvider.OPENAI;
    }
    if (model.startsWith('claude-') || model.includes('anthropic/')) {
      return AiProvider.ANTHROPIC;
    }
    if (model.startsWith('gemini-') || model.includes('google/')) {
      return AiProvider.GOOGLE;
    }
    if (model.includes('/') && !model.startsWith('gpt-') && !model.startsWith('claude-')) {
      return AiProvider.OPENROUTER;
    }
    if (model === AiModel.LOCAL_LLAMA_3_1 || model === AiModel.LOCAL_MISTRAL || model === AiModel.LOCAL_CODELLAMA) {
      return AiProvider.LOCAL;
    }

    // Default fallback
    return AiProvider.OPENAI;
  }

  /**
   * Get or create OpenAI client for specific API key
   */
  private getOpenAiClient(apiKey: string, context?: AiCredentialContext): OpenAI {
    if (!context) return new OpenAI({ apiKey });
    const cacheKey = this.prepareCredentialCache(context);
    if (!cacheKey) return new OpenAI({ apiKey });
    if (!this.openaiClients.has(cacheKey)) {
      this.openaiClients.set(
        cacheKey,
        new OpenAI({
          apiKey,
        }),
      );
    }
    return this.openaiClients.get(cacheKey)!;
  }

  /**
   * Get or create Anthropic client for specific API key
   */
  private getAnthropicClient(apiKey: string, context?: AiCredentialContext): Anthropic {
    if (!context) return new Anthropic({ apiKey });
    const cacheKey = this.prepareCredentialCache(context);
    if (!cacheKey) return new Anthropic({ apiKey });
    if (!this.anthropicClients.has(cacheKey)) {
      this.anthropicClients.set(
        cacheKey,
        new Anthropic({
          apiKey,
        }),
      );
    }
    return this.anthropicClients.get(cacheKey)!;
  }

  /**
   * Get or create Google AI client for specific API key
   */
  private getGoogleClient(apiKey: string, context?: AiCredentialContext): GoogleGenerativeAI {
    if (!context) return new GoogleGenerativeAI(apiKey);
    const cacheKey = this.prepareCredentialCache(context);
    if (!cacheKey) return new GoogleGenerativeAI(apiKey);
    if (!this.googleClients.has(cacheKey)) {
      this.googleClients.set(
        cacheKey,
        new GoogleGenerativeAI(apiKey),
      );
    }
    return this.googleClients.get(cacheKey)!;
  }

  /**
   * Get or create OpenRouter client (uses OpenAI SDK with custom base URL)
   */
  private getOpenRouterClient(apiKey: string, context?: AiCredentialContext): OpenAI {
    if (!context) return new OpenAI({ apiKey, baseURL: 'https://openrouter.ai/api/v1' });
    const cacheKey = this.prepareCredentialCache(context);
    if (!cacheKey) return new OpenAI({ apiKey, baseURL: 'https://openrouter.ai/api/v1' });
    if (!this.openaiClients.has(cacheKey)) {
      this.openaiClients.set(
        cacheKey,
        new OpenAI({
          apiKey,
          baseURL: 'https://openrouter.ai/api/v1',
        }),
      );
    }
    return this.openaiClients.get(cacheKey)!;
  }

  private prepareCredentialCache(context: AiCredentialContext): string | null {
    if (!context.tenantId || !Number.isSafeInteger(context.revision) || context.revision < 0) {
      throw new Error('A valid tenant and settings revision are required for AI client caching');
    }
    const cacheKey = `${context.tenantId}:${context.module}:${context.provider}:${context.revision}`;
    const latestRevision = this.latestTenantRevision.get(context.tenantId);
    if (latestRevision !== undefined && context.revision < latestRevision) return null;
    const tenantPrefix = `${context.tenantId}:`;
    if (latestRevision === undefined || context.revision > latestRevision) {
      this.latestTenantRevision.set(context.tenantId, context.revision);
      for (const cache of [this.openaiClients, this.anthropicClients, this.googleClients]) {
        for (const key of cache.keys()) {
          if (key.startsWith(tenantPrefix)) cache.delete(key);
        }
      }
    }
    return cacheKey;
  }

  /**
   * Generate text completion using specified AI provider
   * 
   * @param apiKey - API key for the provider
   * @param prompt - User prompt
   * @param options - Generation options
   * @returns Generated content with metadata
   */
  async generateCompletion(
    apiKey: string,
    prompt: string,
    options: AiGenerationOptions = {},
  ): Promise<AiGenerationResult> {
    const {
      model = AiModel.GPT_4_TURBO,
      temperature = 0.7,
      maxTokens = 1000,
      systemPrompt,
    } = options;

    const provider = options.provider || this.detectProvider(model);

    this.logger.log(`Generating completion with ${provider}:${model}`);

    try {
      switch (provider) {
        case AiProvider.OPENAI:
          return await this.generateWithOpenAI(apiKey, prompt, { model, temperature, maxTokens, systemPrompt }, options.credentialContext);

        case AiProvider.ANTHROPIC:
          return await this.generateWithAnthropic(apiKey, prompt, { model, temperature, maxTokens, systemPrompt }, options.credentialContext);

        case AiProvider.GOOGLE:
          return await this.generateWithGoogle(apiKey, prompt, { model, temperature, maxTokens, systemPrompt }, options.credentialContext);

        case AiProvider.OPENROUTER:
          return await this.generateWithOpenRouter(apiKey, prompt, { model, temperature, maxTokens, systemPrompt }, options.credentialContext);

        case AiProvider.LOCAL:
          return await this.generateWithLocal(apiKey, prompt, { model, temperature, maxTokens, systemPrompt });

        default:
          throw new Error(`Unsupported AI provider: ${provider}`);
      }
    } catch (error) {
      this.logger.error(`${provider} API error:`, error);
      throw new Error(`AI generation failed with ${provider}: ${error.message}`);
    }
  }

  /**
   * Generate completion using OpenAI
   */
  private async generateWithOpenAI(
    apiKey: string,
    prompt: string,
    options: { model: AiModel; temperature: number; maxTokens: number; systemPrompt?: string },
    credentialContext?: AiCredentialContext,
  ): Promise<AiGenerationResult> {
    const client = this.getOpenAiClient(apiKey, credentialContext);

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (options.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt,
      });
    }

    messages.push({
      role: 'user',
      content: prompt,
    });

    const completion = await client.chat.completions.create({
      model: options.model,
      messages,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
    });

    return {
      content: completion.choices[0].message.content || '',
      model: completion.model,
      provider: AiProvider.OPENAI,
      tokensUsed: completion.usage?.total_tokens || 0,
      finishReason: completion.choices[0].finish_reason,
    };
  }

  /**
   * Generate completion using Anthropic Claude
   */
  private async generateWithAnthropic(
    apiKey: string,
    prompt: string,
    options: { model: AiModel; temperature: number; maxTokens: number; systemPrompt?: string },
    credentialContext?: AiCredentialContext,
  ): Promise<AiGenerationResult> {
    const client = this.getAnthropicClient(apiKey, credentialContext);

    const message = await client.messages.create({
      model: options.model,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      system: options.systemPrompt,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    return {
      content: message.content[0].type === 'text' ? message.content[0].text : '',
      model: message.model,
      provider: AiProvider.ANTHROPIC,
      tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
      finishReason: message.stop_reason || 'completed',
    };
  }

  /**
   * Generate completion using Google Gemini
   */
  private async generateWithGoogle(
    apiKey: string,
    prompt: string,
    options: { model: AiModel; temperature: number; maxTokens: number; systemPrompt?: string },
    credentialContext?: AiCredentialContext,
  ): Promise<AiGenerationResult> {
    const client = this.getGoogleClient(apiKey, credentialContext);
    const model = client.getGenerativeModel({ model: options.model });

    const fullPrompt = options.systemPrompt
      ? `${options.systemPrompt}\n\nUser: ${prompt}`
      : prompt;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      generationConfig: {
        temperature: options.temperature,
        maxOutputTokens: options.maxTokens,
      },
    });

    const response = await result.response;

    return {
      content: response.text(),
      model: options.model,
      provider: AiProvider.GOOGLE,
      tokensUsed: response.usageMetadata?.totalTokenCount || 0,
      finishReason: response.candidates?.[0]?.finishReason || 'completed',
    };
  }

  /**
   * Generate completion using OpenRouter
   */
  private async generateWithOpenRouter(
    apiKey: string,
    prompt: string,
    options: { model: AiModel; temperature: number; maxTokens: number; systemPrompt?: string },
    credentialContext?: AiCredentialContext,
  ): Promise<AiGenerationResult> {
    const client = this.getOpenRouterClient(apiKey, credentialContext);

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (options.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt,
      });
    }

    messages.push({
      role: 'user',
      content: prompt,
    });

    const completion = await client.chat.completions.create({
      model: options.model,
      messages,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
    });

    return {
      content: completion.choices[0].message.content || '',
      model: completion.model,
      provider: AiProvider.OPENROUTER,
      tokensUsed: completion.usage?.total_tokens || 0,
      finishReason: completion.choices[0].finish_reason,
    };
  }

  /**
   * Generate completion using Local AI (Ollama)
   */
  private async generateWithLocal(
    apiKey: string, // Not used for local, but kept for interface consistency
    prompt: string,
    options: { model: AiModel; temperature: number; maxTokens: number; systemPrompt?: string }
  ): Promise<AiGenerationResult> {
    // Use Ollama API (configured via AI_PROVIDER_URL or default to localhost)
    const baseUrl = process.env.AI_PROVIDER_URL || 'http://localhost:11434';
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model,
        prompt: options.systemPrompt ? `${options.systemPrompt}\n\n${prompt}` : prompt,
        stream: false,
        options: {
          temperature: options.temperature,
          num_predict: options.maxTokens,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Local AI API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      content: data.response,
      model: options.model,
      provider: AiProvider.LOCAL,
      tokensUsed: data.eval_count || 0,
      finishReason: data.done ? 'completed' : 'incomplete',
    };
  }

  /**
   * Test API key validity for any provider
   * Makes a minimal API call to verify the key works
   */
  async testApiKey(apiKey: string, model: AiModel = AiModel.GPT_4_TURBO, provider?: AiProvider): Promise<boolean> {
    try {
      const detectedProvider = provider || this.detectProvider(model);

      // Make minimal test call
      await this.generateCompletion(apiKey, 'test', {
        model,
        provider: detectedProvider,
        maxTokens: 5,
      });

      return true;
    } catch (error) {
      this.logger.warn(`API key test failed for ${provider || 'auto-detected'}: ${error.message}`);
      return false;
    }
  }

  /**
   * Clear cached clients for specific API key or all clients
   * Useful when API keys are updated
   */
  clearClientCache(tenantId?: string): void {
    if (tenantId) {
      const prefix = `${tenantId}:`;
      for (const cache of [this.openaiClients, this.anthropicClients, this.googleClients]) {
        for (const key of cache.keys()) {
          if (key.startsWith(prefix)) cache.delete(key);
        }
      }
    } else {
      this.openaiClients.clear();
      this.anthropicClients.clear();
      this.googleClients.clear();
    }
  }

  /**
   * Get supported models for a provider
   */
  getSupportedModels(provider: AiProvider): AiModel[] {
    switch (provider) {
      case AiProvider.OPENAI:
        return [AiModel.GPT_4, AiModel.GPT_4_TURBO, AiModel.GPT_4O, AiModel.GPT_3_5_TURBO];

      case AiProvider.ANTHROPIC:
        return [AiModel.CLAUDE_3_5_SONNET, AiModel.CLAUDE_3_OPUS, AiModel.CLAUDE_3_SONNET, AiModel.CLAUDE_3_HAIKU];

      case AiProvider.GOOGLE:
        return [AiModel.GEMINI_PRO, AiModel.GEMINI_PRO_VISION, AiModel.GEMINI_1_5_PRO, AiModel.GEMINI_1_5_FLASH];

      case AiProvider.OPENROUTER:
        return [AiModel.OPENROUTER_GPT_4, AiModel.OPENROUTER_CLAUDE_3_5_SONNET, AiModel.OPENROUTER_LLAMA_3_1_70B];

      case AiProvider.LOCAL:
        return [AiModel.LOCAL_LLAMA_3_1, AiModel.LOCAL_MISTRAL, AiModel.LOCAL_CODELLAMA];

      default:
        return [];
    }
  }
}
