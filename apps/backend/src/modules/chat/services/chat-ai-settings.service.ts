import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { TenantService } from '../../../core/tenant/tenant.service';
import { SettingsService } from '../../settings/settings.service';
import { AiService } from '../../ai/ai.service';
import { AiModel, AiProvider, AiSettingsDto } from '../../settings/dto/ai-settings.dto';
import { AiUsageLog } from '../entities/ai-usage-log.entity';

export interface CreateAiUsageLogDto {
  provider: string;
  model: string;
  tokensInput: number;
  tokensOutput: number;
  cost?: number;
  userId?: string;
  sessionId?: string;
  contextType?: string;
  responseTimeMs?: number;
  metadata?: any;
  tenantId?: string; // Optional because we use ALS
}

export interface ChatAiConfiguration {
  tenantId: string;
  module: 'emailMarketing' | 'social' | 'support' | 'analytics';
  revision: number;
  apiKey: string;
  model: AiModel;
  provider: AiProvider;
  enabled: boolean;
  priority: number;
  maxRetries: number;
  timeoutMs: number;
}

export interface ProviderFailoverConfig {
  primaryProvider: AiProvider;
  fallbackProviders: AiProvider[];
  maxFailuresBeforeFailover: number;
  failoverCooldownMs: number;
}

@Injectable()
export class ChatAiSettingsService {
  private readonly logger = new Logger(ChatAiSettingsService.name);
  private providerFailureCount: Map<string, number> = new Map();
  private providerLastFailure: Map<string, number> = new Map();

  constructor(
    @InjectRepository(AiUsageLog)
    private readonly usageLogRepository: Repository<AiUsageLog>,
    private readonly tenantService: TenantService,
    private readonly settingsService: SettingsService,
    private readonly aiService: AiService,
  ) { }

  /**
   * Get AI configuration for chat with failover support
   */
  async getChatAiConfiguration(): Promise<ChatAiConfiguration> {
    const tenantId = this.tenantService.getTenantId();
    try {
      const configuration = await this.settingsService.getAiModuleConfiguration('support', tenantId);
      if (configuration.apiKey) {
        return {
          tenantId,
          module: 'support',
          revision: configuration.revision,
          apiKey: configuration.apiKey,
          model: configuration.model,
          provider: configuration.provider,
          enabled: true,
          priority: 1,
          maxRetries: 3,
          timeoutMs: 30000
        };
      }

      throw new Error('No AI configuration available for chat');

    } catch (error) {
      this.logger.error(`Failed to get chat AI configuration: ${error.message}`);
      throw error;
    }
  }  /**
   
* Get failover configuration for providers
   */
  async getFailoverConfiguration(): Promise<ProviderFailoverConfig> {
    const tenantId = this.tenantService.getTenantId();
    const { settings: aiSettings } = await this.settingsService.getAiSettingsSnapshot(tenantId);
    const supportSettings = this.getEffectiveModuleSettings(aiSettings, 'support');
    const primaryProvider = supportSettings.provider ?? this.detectProvider(supportSettings.model);

    return {
      primaryProvider,
      // The settings contract currently stores one effective credential per module.
      // Credentials owned by email/social/analytics must never become chat fallbacks.
      fallbackProviders: [],
      maxFailuresBeforeFailover: 3,
      failoverCooldownMs: 300000 // 5 minutes
    };
  }

  /**
   * Get AI configuration with failover logic
   */
  async getConfigurationWithFailover(): Promise<ChatAiConfiguration> {
    const tenantId = this.tenantService.getTenantId();
    const failoverConfig = await this.getFailoverConfiguration();

    // Check if primary provider is available
    if (this.isProviderAvailable(failoverConfig.primaryProvider)) {
      try {
        return await this.getChatAiConfiguration();
      } catch (error) {
        this.logger.warn(`Primary provider ${failoverConfig.primaryProvider} failed, trying fallback`);
      }
    }

    // Try fallback providers
    for (const provider of failoverConfig.fallbackProviders) {
      if (this.isProviderAvailable(provider)) {
        try {
          const config = await this.getConfigurationForProvider(provider);
          this.logger.log(`Using fallback provider: ${provider}`);
          return config;
        } catch (error) {
          this.logger.warn(`Fallback provider ${provider} failed: ${error.message}`);
        }
      }
    }

    throw new Error('All AI providers are unavailable');
  }

  /**
   * Get configuration for specific provider
   */
  private async getConfigurationForProvider(provider: AiProvider): Promise<ChatAiConfiguration> {
    const tenantId = this.tenantService.getTenantId();
    const { revision, settings: aiSettings } = await this.settingsService.getAiSettingsSnapshot(tenantId);

    const supportSettings = this.getEffectiveModuleSettings(aiSettings, 'support');
    const supportProvider = supportSettings.provider ?? this.detectProvider(supportSettings.model);
    const apiKey = supportSettings.enabled && supportProvider === provider
      ? this.getStoredApiKey(supportSettings.apiKey)
      : undefined;
    const model = supportSettings.model;

    if (!apiKey) {
      throw new Error(`No API key found for provider: ${provider}`);
    }

    return {
      tenantId,
      module: 'support',
      revision,
      apiKey,
      model,
      provider,
      enabled: true,
      priority: provider === supportProvider ? 1 : 2,
      maxRetries: 3,
      timeoutMs: 30000
    };
  }

  /**
   * Check if provider is available (not in cooldown)
   */
  private isProviderAvailable(provider: AiProvider, tenantId = this.tenantService.getTenantId()): boolean {
    const healthKey = this.providerHealthKey(tenantId, provider);
    const failureCount = this.providerFailureCount.get(healthKey) || 0;
    const lastFailure = this.providerLastFailure.get(healthKey) || 0;
    const now = Date.now();

    // If provider has failed too many times, check cooldown
    if (failureCount >= 3) {
      const cooldownPeriod = 300000; // 5 minutes
      if (now - lastFailure < cooldownPeriod) {
        return false;
      } else {
        // Reset failure count after cooldown
        this.providerFailureCount.set(healthKey, 0);
      }
    }

    return true;
  }

  /**
   * Record provider failure for failover logic
   */
  recordProviderFailure(provider: AiProvider, tenantId = this.tenantService.getTenantId()): void {
    const healthKey = this.providerHealthKey(tenantId, provider);
    const currentCount = this.providerFailureCount.get(healthKey) || 0;
    this.providerFailureCount.set(healthKey, currentCount + 1);
    this.providerLastFailure.set(healthKey, Date.now());

    this.logger.warn(`Provider ${provider} failure count: ${currentCount + 1}`);
  }

  /**
   * Reset provider failure count (call on successful request)
   */
  resetProviderFailures(provider: AiProvider, tenantId = this.tenantService.getTenantId()): void {
    const healthKey = this.providerHealthKey(tenantId, provider);
    this.providerFailureCount.set(healthKey, 0);
    this.providerLastFailure.delete(healthKey);
  }

  /**
   * Test all configured providers
   */
  async testAllProviders(): Promise<Array<{
    provider: AiProvider;
    model: AiModel;
    success: boolean;
    responseTime: number;
    error?: string;
  }>> {
    const results: Array<{
      provider: AiProvider;
      model: AiModel;
      success: boolean;
      responseTime: number;
      error?: string;
    }> = [];

    try {
      const tenantId = this.tenantService.getTenantId();
      const { settings: aiSettings } = await this.settingsService.getAiSettingsSnapshot(tenantId);
      const providersToTest = new Set<AiProvider>();
      const supportSettings = this.getEffectiveModuleSettings(aiSettings, 'support');
      if (supportSettings.enabled && supportSettings.apiKey) {
        providersToTest.add(supportSettings.provider ?? this.detectProvider(supportSettings.model));
      }

      // Test each provider
      for (const provider of providersToTest) {
        const startTime = Date.now();
        try {
          const config = await this.getConfigurationForProvider(provider);

          // Test with a simple prompt
          await this.aiService.generateCompletion(
            config.apiKey,
            'Test message',
            {
              model: config.model,
              provider: config.provider,
              credentialContext: {
                tenantId: config.tenantId,
                module: config.module,
                provider: config.provider,
                revision: config.revision,
              },
              maxTokens: 10,
              temperature: 0.1
            }
          );

          results.push({
            provider,
            model: config.model,
            success: true,
            responseTime: Date.now() - startTime
          });

          // Reset failure count on success
          this.resetProviderFailures(provider);

        } catch (error) {
          results.push({
            provider,
            model: AiModel.GPT_4_TURBO, // Default model for error case
            success: false,
            responseTime: Date.now() - startTime,
            error: error.message
          });

          this.recordProviderFailure(provider);
        }
      }

    } catch (error) {
      this.logger.error(`Error testing providers: ${error.message}`, error.stack);
    }

    return results;
  }

  /**
   * Get provider health status
   */
  getProviderHealthStatus(): Array<{
    provider: AiProvider;
    isAvailable: boolean;
    failureCount: number;
    lastFailure?: Date;
    nextAvailableAt?: Date;
  }> {
    const allProviders = Object.values(AiProvider);

    const tenantId = this.tenantService.getTenantId();
    return allProviders.map(provider => {
      const healthKey = this.providerHealthKey(tenantId, provider);
      const failureCount = this.providerFailureCount.get(healthKey) || 0;
      const lastFailure = this.providerLastFailure.get(healthKey);
      const isAvailable = this.isProviderAvailable(provider, tenantId);

      let nextAvailableAt: Date | undefined;
      if (!isAvailable && lastFailure) {
        nextAvailableAt = new Date(lastFailure + 300000); // 5 minutes cooldown
      }

      return {
        provider,
        isAvailable,
        failureCount,
        lastFailure: lastFailure ? new Date(lastFailure) : undefined,
        nextAvailableAt
      };
    });
  }

  /**
   * Detect provider from model name
   */
  private getEffectiveModuleSettings(
    settings: AiSettingsDto,
    module: ChatAiConfiguration['module'],
  ): AiSettingsDto[typeof module] {
    return settings.useSingleApiKey && settings.global ? settings.global : settings[module];
  }

  private getStoredApiKey(value: unknown): string | undefined {
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  }

  private providerHealthKey(tenantId: string, provider: AiProvider): string {
    return `${tenantId}:${provider}`;
  }

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

    return AiProvider.OPENAI; // default fallback
  }

  /**
   * Track AI usage
   */
  async trackUsage(data: CreateAiUsageLogDto): Promise<AiUsageLog> {
    try {
      const log = this.usageLogRepository.create({
        ...data,
        totalTokens: data.tokensInput + data.tokensOutput,
        cost: data.cost || this.calculateEstimatedCost(data.model, data.tokensInput, data.tokensOutput),
        tenantId: data.tenantId || this.tenantService.getTenantId()
      });

      return await this.usageLogRepository.save(log);
    } catch (error) {
      this.logger.error(`Failed to track AI usage: ${error.message}`, error.stack);
      // Don't throw, just log error so main flow isn't interrupted
      return null;
    }
  }

  /**
   * Calculate estimated cost based on model and tokens
   */
  private calculateEstimatedCost(model: string, inputTokens: number, outputTokens: number): number {
    // Pricing per 1K tokens (approximate as of 2024)
    const pricing = {
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
      'claude-3-opus': { input: 0.015, output: 0.075 },
      'claude-3-sonnet': { input: 0.003, output: 0.015 },
      'claude-3-haiku': { input: 0.00025, output: 0.00125 },
    };

    // Find matching model key (partial match)
    const modelKey = Object.keys(pricing).find(k => model.includes(k));

    if (modelKey) {
      const price = pricing[modelKey as keyof typeof pricing];
      return (inputTokens / 1000 * price.input) + (outputTokens / 1000 * price.output);
    }

    return 0;
  }

  /**
   * Get AI usage tracking and analytics
   */
  async getAiUsageAnalytics(timeRange: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<{
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    providerBreakdown: Record<AiProvider, {
      requests: number;
      tokens: number;
      cost: number;
      averageResponseTime: number;
    }>;
    modelBreakdown: Record<AiModel, {
      requests: number;
      tokens: number;
      cost: number;
    }>;
    errorRate: number;
    averageConfidence: number;
  }> {
    const now = new Date();
    let startDate = new Date();

    switch (timeRange) {
      case 'hour': startDate.setHours(now.getHours() - 1); break;
      case 'day': startDate.setDate(now.getDate() - 1); break;
      case 'week': startDate.setDate(now.getDate() - 7); break;
      case 'month': startDate.setMonth(now.getMonth() - 1); break;
    }

    // Get all logs for the period
    const tenantId = this.tenantService.getTenantId();
    const logs = await this.usageLogRepository.find({
      where: {
        tenantId,
        createdAt: Between(startDate, now)
      }
    });

    const totalRequests = logs.length;
    const totalTokens = logs.reduce((sum, log) => sum + log.totalTokens, 0);
    const totalCost = logs.reduce((sum, log) => sum + Number(log.cost), 0);

    // Group by provider
    const providerBreakdown: Record<string, any> = {};
    const modelBreakdown: Record<string, any> = {};

    logs.forEach(log => {
      // Provider Stats
      if (!providerBreakdown[log.provider]) {
        providerBreakdown[log.provider] = { requests: 0, tokens: 0, cost: 0, totalResponseTime: 0 };
      }
      providerBreakdown[log.provider].requests++;
      providerBreakdown[log.provider].tokens += log.totalTokens;
      providerBreakdown[log.provider].cost += Number(log.cost);
      providerBreakdown[log.provider].totalResponseTime += log.responseTimeMs;

      // Model Stats
      if (!modelBreakdown[log.model]) {
        modelBreakdown[log.model] = { requests: 0, tokens: 0, cost: 0 };
      }
      modelBreakdown[log.model].requests++;
      modelBreakdown[log.model].tokens += log.totalTokens;
      modelBreakdown[log.model].cost += Number(log.cost);
    });

    // Format provider breakdown
    const formattedProviderBreakdown = {} as Record<AiProvider, any>;
    Object.keys(providerBreakdown).forEach(key => {
      const data = providerBreakdown[key];
      formattedProviderBreakdown[key as AiProvider] = {
        requests: data.requests,
        tokens: data.tokens,
        cost: data.cost,
        averageResponseTime: Math.round(data.totalResponseTime / data.requests)
      };
    });

    return {
      totalRequests,
      totalTokens,
      totalCost,
      providerBreakdown: formattedProviderBreakdown,
      modelBreakdown: modelBreakdown as Record<AiModel, any>,
      errorRate: 0, // Need to implement error logging to track this
      averageConfidence: 0.85 // Placeholder, would need confidence scoring
    };
  }

  /**
   * Update AI settings with validation
   */
  async updateChatAiSettings(settings: {
    supportApiKey?: string;
    supportModel?: AiModel;
    supportEnabled?: boolean;
    globalApiKey?: string;
    globalModel?: AiModel;
    useSingleApiKey?: boolean;
    tenantId?: string;
  }): Promise<void> {
    try {
      // Validate settings before updating
      if (settings.supportApiKey && settings.supportModel) {
        await this.validateApiKey(settings.supportApiKey, settings.supportModel);
      }

      if (settings.globalApiKey && settings.globalModel) {
        await this.validateApiKey(settings.globalApiKey, settings.globalModel);
      }

      // Update settings through the settings service
      const tenantId = settings.tenantId || this.tenantService.getTenantId();
      const { settings: currentSettings } = await this.settingsService.getAiSettingsSnapshot(tenantId);

      const updatedSettings = {
        ...currentSettings,
        useSingleApiKey: settings.useSingleApiKey ?? currentSettings.useSingleApiKey,
        support: {
          ...currentSettings.support,
          apiKey: settings.supportApiKey ?? currentSettings.support.apiKey,
          model: settings.supportModel ?? currentSettings.support.model,
          enabled: settings.supportEnabled ?? currentSettings.support.enabled,
        },
        global: settings.useSingleApiKey ? {
          ...currentSettings.global,
          apiKey: settings.globalApiKey ?? currentSettings.global?.apiKey,
          model: settings.globalModel ?? currentSettings.global?.model,
          enabled: true,
        } : currentSettings.global
      };

      await this.settingsService.updateAiSettings(updatedSettings, tenantId);

      // Clear AI service cache to use new settings
      this.aiService.clearClientCache(tenantId);

      this.logger.log('Chat AI settings updated successfully');

    } catch (error) {
      this.logger.error(`Failed to update chat AI settings: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Validate API key for a specific model/provider
   */
  private async validateApiKey(apiKey: string, model: AiModel): Promise<boolean> {
    try {
      const provider = this.detectProvider(model);
      return await this.aiService.testApiKey(apiKey, model, provider);
    } catch (error) {
      this.logger.warn(`API key validation failed: ${error.message}`);
      return false;
    }
  }
}
