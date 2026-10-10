/**
 * FAQ Learning Service
 * Handles all API calls for FAQ Learning system
 */

import { httpClient } from '@/lib/api/http-client';

// Types
export interface DashboardStats {
  totalFaqs: number;
  newFaqsToday: number;
  pendingReview: number;
  averageConfidence: number;
  processingStatus: 'running' | 'stopped' | 'error';
  lastRun?: Date;
  nextRun?: Date;
}

export interface ProviderStatus {
  name: string;
  available: boolean;
  responseTime?: number;
  lastChecked: Date;
}

export interface RecentActivity {
  id: string;
  type: 'faq_generated' | 'review_completed' | 'feedback_received';
  description: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'error';
}

export interface LearningProgress {
  fromChat: number;
  fromTickets: number;
  fromSuggestions: number;
  fromKnowledgeBase: number;
  fromKnowledgeSources: number;
}

export interface QualityMetrics {
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
}

export interface DashboardData {
  stats: DashboardStats;
  learningProgress: LearningProgress;
  qualityMetrics: QualityMetrics;
  providers: ProviderStatus[];
  recentActivity: RecentActivity[];
}

export class FaqLearningService {
  private static readonly BASE_URL = '/faq-learning';

  /**
   * Get dashboard statistics and data
   */
  static async getDashboardStats(): Promise<DashboardData> {
    console.log('🔗 Calling dashboard API:', `${this.BASE_URL}/dashboard`);
    const response = await httpClient.get<any>(`${this.BASE_URL}/dashboard`);

    console.log('🔗 Raw response:', response);

    // Handle wrapped response (success, data, meta structure)
    const data = response.data || response;

    console.log('🔗 Extracted data:', data);

    // Convert date strings to Date objects with null checks
    if (data.stats && data.stats.lastRun) {
      data.stats.lastRun = new Date(data.stats.lastRun);
    }
    if (data.stats && data.stats.nextRun) {
      data.stats.nextRun = new Date(data.stats.nextRun);
    }

    if (data.providers && Array.isArray(data.providers)) {
      data.providers = data.providers.map((p: any) => ({
        ...p,
        lastChecked: new Date(p.lastChecked)
      }));
    }

    if (data.recentActivity && Array.isArray(data.recentActivity)) {
      data.recentActivity = data.recentActivity.map((a: any) => ({
        ...a,
        timestamp: new Date(a.timestamp)
      }));
    }

    return data as DashboardData;
  }

  /**
   * Start the learning pipeline
   */
  static async startPipeline(): Promise<{
    success: boolean;
    message: string;
    status: string;
  }> {
    return await httpClient.post(`${this.BASE_URL}/pipeline/start`, {});
  }

  /**
   * Stop the learning pipeline
   */
  static async stopPipeline(): Promise<{
    success: boolean;
    message: string;
    status: string;
  }> {
    return await httpClient.post(`${this.BASE_URL}/pipeline/stop`, {});
  }

  /**
   * Get pipeline status
   */
  static async getPipelineStatus(): Promise<{
    isProcessing: boolean;
    dailyProcessingCount: number;
    lastRun?: Date;
    nextScheduledRun?: Date;
  }> {
    const response = await httpClient.get<{
      isProcessing: boolean;
      dailyProcessingCount: number;
      lastRun?: string;
      nextScheduledRun?: string;
    }>(`${this.BASE_URL}/status`);

    return {
      isProcessing: response.isProcessing,
      dailyProcessingCount: response.dailyProcessingCount,
      lastRun: response.lastRun ? new Date(response.lastRun) : undefined,
      nextScheduledRun: response.nextScheduledRun ? new Date(response.nextScheduledRun) : undefined
    };
  }

  /**
   * Get system health status
   */
  static async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    components: {
      pipeline: 'up' | 'down';
      aiProviders: 'up' | 'down' | 'partial';
      database: 'up' | 'down';
    };
    lastHealthCheck: Date;
  }> {
    const response = await httpClient.get<{
      status: 'healthy' | 'degraded' | 'unhealthy';
      components: {
        pipeline: 'up' | 'down';
        aiProviders: 'up' | 'down' | 'partial';
        database: 'up' | 'down';
      };
      lastHealthCheck: string;
    }>(`${this.BASE_URL}/health`);

    return {
      ...response,
      lastHealthCheck: new Date(response.lastHealthCheck)
    };
  }

  // ============================================================================
  // Review Queue Methods
  // ============================================================================

  /**
   * Get review queue with filters
   */
  static async getReviewQueue(filters: {
    status?: string[];
    confidence?: { min?: number; max?: number };
    source?: string[];
    category?: string[];
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    items: Array<{
      id: string;
      question: string;
      answer: string;
      confidence: number;
      status: 'pending_review' | 'approved' | 'rejected' | 'published';
      source: 'chat' | 'ticket';
      sourceId: string;
      category?: string;
      keywords: string[];
      usageCount: number;
      helpfulCount: number;
      notHelpfulCount: number;
      createdAt: Date;
      creator?: {
        id: string;
        name: string;
        email: string;
      };
    }>;
    total: number;
    page: number;
    totalPages: number;
  }> {
    const params = new URLSearchParams();

    if (filters.status && filters.status.length > 0) {
      params.append('status', filters.status.join(','));
    }
    if (filters.confidence?.min !== undefined) {
      params.append('confidence_min', filters.confidence.min.toString());
    }
    if (filters.confidence?.max !== undefined) {
      params.append('confidence_max', filters.confidence.max.toString());
    }
    if (filters.source && filters.source.length > 0) {
      params.append('source', filters.source.join(','));
    }
    if (filters.category && filters.category.length > 0) {
      params.append('category', filters.category.join(','));
    }
    if (filters.search?.trim()) params.append('search', filters.search.trim());
    if (filters.page) {
      params.append('page', filters.page.toString());
    }
    if (filters.limit) {
      params.append('limit', filters.limit.toString());
    }

    const data = await httpClient.getWrapped<any>(`/review/queue?${params.toString()}`);
    return { ...data, items: data.items.map((item: any) => ({ ...item, createdAt: new Date(item.createdAt) })) };
  }

  /**
   * Review a single FAQ
   */
  static async reviewFaq(
    faqId: string,
    action: 'approve' | 'reject' | 'publish' | 'edit',
    data: {
      reason?: string;
      editedAnswer?: string;
      editedCategory?: string;
      editedKeywords?: string[];
    }
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    return await httpClient.postWrapped(`/review/${encodeURIComponent(faqId)}/review`, {
      action, reason: data.reason, editedAnswer: data.editedAnswer,
      editedCategory: data.editedCategory, editedKeywords: data.editedKeywords
    });
  }

  /**
   * Bulk review multiple FAQs
   */
  static async bulkReview(
    faqIds: string[],
    action: 'approve' | 'reject' | 'publish',
    reason?: string
  ): Promise<{
    success: boolean;
    message: string;
    results: {
      successful: string[];
      failed: Array<{ faqId: string; error: string }>;
    };
  }> {
    return await httpClient.postWrapped('/review/bulk-review', {
      faqIds,
      action,
      reason
    });
  }

  /**
   * Get review queue statistics
   */
  static async getReviewStats(): Promise<{
    total: number;
    pendingReview: number;
    approved: number;
    rejected: number;
    published: number;
    averageConfidence: number;
  }> {
    return httpClient.getWrapped('/review/stats');
  }

  /**
   * Get current AI provider information
   */
  static async getAiProviderInfo(): Promise<{
    currentProvider: string;
    currentModel: string;
    available: boolean;
    isReadOnly: boolean;
    globalSettingsUrl: string;
  }> {
    const response = await httpClient.get<any>(`${this.BASE_URL}/ai-provider-info`);

    console.log('🤖 AI Provider info response:', response);

    // Handle wrapped response
    const data = response.data || response;

    return data;
  }

  /**
   * Get AI usage statistics for FAQ Learning
   */
  static async getAiUsageStats(): Promise<{
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    totalTokens: number;
    estimatedCost: number;
    last24Hours: {
      requests: number;
      tokens: number;
      cost: number;
    };
  }> {
    return await httpClient.get(`${this.BASE_URL}/ai-usage-stats`);
  }

  /**
   * Get FAQ Learning performance metrics
   */
  static async getPerformanceMetrics(): Promise<{
    faqsGenerated: number;
    averageConfidence: number;
    processingTime: number;
    errorRate: number;
  }> {
    return await httpClient.get(`${this.BASE_URL}/performance-metrics`);
  }

  // ============================================================================
  // Configuration Methods
  // ============================================================================

  /**
   * Get all configuration sections
   */
  static async getConfig(): Promise<{
    configurations: Array<{
      key: string;
      value: any;
      description?: string;
      category?: string;
      isActive: boolean;
      updatedAt: Date;
    }>;
  }> {
    const response = await httpClient.get<any>(`${this.BASE_URL}/config`);

    console.log('🔧 Config response:', response);

    // Handle wrapped response (success, data, meta structure)
    const data = response.data || response;

    console.log('🔧 Extracted config data:', data);

    // Handle both response formats: { configurations: [] } or direct array
    const configs = data.configurations || data || [];

    return {
      configurations: Array.isArray(configs) ? configs.map((c: any) => ({
        ...c,
        updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date()
      })) : []
    };
  }

  /**
   * Update configuration
   */
  static async updateConfig(config: {
    configKey: string;
    configValue: any;
    description?: string;
    category?: string;
  }): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await httpClient.put<any>(`${this.BASE_URL}/config`, config);

    // Handle wrapped response
    const data = response.data || response;
    return data;
  }

  /**
   * Bulk update configurations
   */
  static async bulkUpdateConfig(configs: Array<{
    configKey: string;
    configValue: any;
    description?: string;
    category?: string;
  }>): Promise<{
    success: boolean;
    message: string;
    results?: {
      successful: string[];
      failed: Array<{ configKey: string; error: string }>;
    };
  }> {
    const response = await httpClient.put<any>(`${this.BASE_URL}/config/bulk`, { configs });

    console.log('💾 Bulk config update response:', response);

    // Handle wrapped response
    const data = response.data || response;
    return data;
  }

  /**
   * Reset configuration section to defaults
   */
  static async resetConfigSection(sectionKey: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return await httpClient.post(`${this.BASE_URL}/config/reset/${sectionKey}`, {});
  }
}
