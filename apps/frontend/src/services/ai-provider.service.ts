/**
 * AI Provider Service
 * Handles all API calls for AI Provider management
 */

import { httpClient } from '@/lib/api/http-client';

// Types
export interface AiProvider {
  name: string;
  available: boolean;
  responseTime?: number;
  lastChecked: Date;
  error?: string;
}

export interface ProviderConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  retryAttempts?: number;
}

export interface TestResult {
  success: boolean;
  provider: string;
  available: boolean;
  responseTime?: number;
  testResult?: {
    prompt: string;
    response: string;
    tokensUsed?: number;
  };
  error?: string;
}

export class AiProviderService {
  private static readonly BASE_URL = '/ai-providers';

  /**
   * Get status of all AI providers
   */
  static async getProviderStatus(): Promise<{
    currentProvider: string;
    providers: AiProvider[];
    totalProviders: number;
    availableProviders: number;
  }> {
    const response = await httpClient.get<{
      currentProvider: string;
      providers: Array<{
        name: string;
        available: boolean;
        responseTime?: number;
        lastChecked: string;
        error?: string;
      }>;
      totalProviders: number;
      availableProviders: number;
    }>(`${this.BASE_URL}/status`);

    // Ensure providers array exists
    const providers = response.providers || [];

    return {
      ...response,
      providers: Array.isArray(providers) ? providers.map(p => ({
        ...p,
        lastChecked: p.lastChecked ? new Date(p.lastChecked) : new Date()
      })) : []
    };
  }

  /**
   * Switch to a different AI provider
   */
  static async switchProvider(provider: 'openai' | 'anthropic' | 'google' | 'deepseek' | 'openrouter'): Promise<{
    success: boolean;
    previousProvider: string;
    currentProvider: string;
    message: string;
  }> {
    return await httpClient.post(`${this.BASE_URL}/switch`, { provider });
  }

  /**
   * Test connection to a specific AI provider
   */
  static async testProvider(provider: string, testPrompt?: string): Promise<TestResult> {
    return await httpClient.post(`${this.BASE_URL}/test`, {
      provider,
      testPrompt
    });
  }

  /**
   * Test all providers
   */
  static async testAllProviders(testPrompt?: string): Promise<TestResult[]> {
    const { providers } = await this.getProviderStatus();
    const results: TestResult[] = [];

    for (const provider of providers) {
      try {
        const result = await this.testProvider(provider.name, testPrompt);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          provider: provider.name,
          available: false,
          error: error instanceof Error ? error.message : 'Test failed'
        });
      }
    }

    return results;
  }

  /**
   * Update provider configuration
   */
  static async updateProviderConfig(
    provider: 'openai' | 'anthropic' | 'google' | 'deepseek' | 'openrouter',
    config: ProviderConfig
  ): Promise<{
    success: boolean;
    message: string;
    provider: string;
    updatedConfig: ProviderConfig;
  }> {
    return await httpClient.put(`${this.BASE_URL}/config`, {
      provider,
      config
    });
  }

  /**
   * Get available models for each provider
   */
  static async getAvailableModels(): Promise<{
    providers: Array<{
      name: string;
      models: Array<{
        id: string;
        name: string;
        description?: string;
        isDefault: boolean;
        capabilities: string[];
      }>;
    }>;
  }> {
    return await httpClient.get(`${this.BASE_URL}/models`);
  }

  /**
   * Test FAQ generation with a specific provider
   */
  static async testFaqGeneration(
    question: string,
    context?: string,
    category?: string,
    provider?: string
  ): Promise<{
    success: boolean;
    provider: string;
    question: string;
    result?: {
      answer: string;
      confidence: number;
      category?: string;
      keywords: string[];
      processingTime: number;
      tokensUsed?: number;
    };
    error?: string;
  }> {
    return await httpClient.post(`${this.BASE_URL}/test-faq-generation`, {
      question,
      context,
      category,
      provider
    });
  }

  /**
   * Compare FAQ generation across multiple providers
   */
  static async compareProviders(
    question: string,
    context?: string,
    providers?: string[]
  ): Promise<{
    success: boolean;
    question: string;
    results: Array<{
      provider: string;
      success: boolean;
      answer?: string;
      confidence?: number;
      processingTime?: number;
      tokensUsed?: number;
      error?: string;
    }>;
    recommendation?: {
      bestProvider: string;
      reason: string;
    };
  }> {
    return await httpClient.post(`${this.BASE_URL}/compare`, {
      question,
      context,
      providers
    });
  }

  /**
   * Get AI provider usage statistics
   */
  static async getUsageStats(period: 'day' | 'week' | 'month' | 'year' = 'week'): Promise<{
    period: string;
    totalRequests: number;
    totalTokens: number;
    averageResponseTime: number;
    providerBreakdown: Array<{
      provider: string;
      requests: number;
      tokens: number;
      averageResponseTime: number;
      successRate: number;
    }>;
    costEstimate?: {
      total: number;
      currency: string;
      breakdown: Array<{
        provider: string;
        cost: number;
      }>;
    };
  }> {
    return await httpClient.get(`${this.BASE_URL}/usage-stats?period=${period}`);
  }

  /**
   * Perform health check on all providers
   */
  static async performHealthCheck(): Promise<{
    success: boolean;
    timestamp: Date;
    results: Array<{
      provider: string;
      healthy: boolean;
      responseTime?: number;
      error?: string;
    }>;
    overallHealth: 'healthy' | 'degraded' | 'unhealthy';
  }> {
    const response = await httpClient.post<{
      success: boolean;
      timestamp: string;
      results: Array<{
        provider: string;
        healthy: boolean;
        responseTime?: number;
        error?: string;
      }>;
      overallHealth: 'healthy' | 'degraded' | 'unhealthy';
    }>(`${this.BASE_URL}/health-check`, {});

    return {
      ...response,
      timestamp: new Date(response.timestamp)
    };
  }
}
