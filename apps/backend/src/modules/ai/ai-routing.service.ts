import { Injectable, Logger } from '@nestjs/common';
import { AiService, AiGenerationOptions } from './ai.service';
import { TokenMeterService } from './token-meter.service';
import { AiProviderHealthService } from './ai-provider-health.service';
import { AiModel } from '../settings/dto/ai-settings.dto';

export interface ProviderStatus {
  name: string;
  available: boolean;
  responseTime?: number;
  lastChecked?: Date;
  error?: string;
  brain?: string;
}

export interface AiStatusResponse {
  currentProvider: string;
  providers: ProviderStatus[];
  totalProviders: number;
  availableProviders: number;
}

@Injectable()
export class AiRoutingService {
  private readonly logger = new Logger(AiRoutingService.name);

  constructor(
    private readonly aiService: AiService,
    private readonly tokenMeterService: TokenMeterService,
    private readonly healthService: AiProviderHealthService,
  ) { }

  /**
   * Get the status of all configured AI providers.
   */
  async getProviderStatus(tenantId: string): Promise<AiStatusResponse> {
    this.logger.debug(`Checking provider status for tenant: ${tenantId}`);

    // Get real status from Cortex
    const localStatus = await this.healthService.getCortexStatus();

    const providers: ProviderStatus[] = [
      {
        name: 'OpenAI (Cloud)',
        available: true,
        lastChecked: new Date(),
        responseTime: 120, // Mock latency for cloud for now
      },
      {
        name: 'Anthropic (Cloud)',
        available: true,
        lastChecked: new Date(),
        responseTime: 150,
      },
      {
        name: 'Local Llama 3 (Oracle)',
        available: localStatus.available,
        lastChecked: localStatus.lastChecked,
        responseTime: localStatus.responseTime,
        brain: localStatus.brain,
        error: localStatus.error,
      },
    ];

    return {
      currentProvider: localStatus.available ? 'Local Llama 3 (Oracle)' : 'OpenAI (Cloud)',
      providers,
      totalProviders: providers.length,
      availableProviders: providers.filter((p) => p.available).length,
    };
  }

  /**
   * Routes a generic AI request to the best available provider based on cost, performance, and capabilities.
   * Tracks usage via TokenMeterService.
   */
  async routeRequest(
    tenantId: string,
    taskType: 'strategy' | 'content' | 'tagging',
    prompt: string,
    apiKey: string, // In future, this will be fetched from vault if using managed keys
    options: AiGenerationOptions = {},
  ): Promise<string> {
    this.logger.log(`Routing request for tenant ${tenantId}, task: ${taskType} `);

    // Simple Routing Logic (Phase 1): Always use the requested model or default to Cloud
    // In Phase 3+, we will insert logic here:
    // if (taskType === 'tagging' && localAiAvailable) -> use Local

    const result = await this.aiService.generateCompletion(apiKey, prompt, options);

    // Track Consumption
    await this.tokenMeterService.trackUsage(
      tenantId,
      result.provider,
      result.model as AiModel, // Cast might be needed depending on AiGenerationResult
      result.tokensUsed,
      taskType,
    );

    return result.content;
  }
}
