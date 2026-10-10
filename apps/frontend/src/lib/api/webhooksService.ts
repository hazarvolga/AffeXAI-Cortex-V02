import { httpClient } from './http-client';
import { ApiResponse } from '@affexai/shared-types';

export interface Webhook {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
  subscribedEvents: string[];
  authType: 'none' | 'bearer' | 'api_key' | 'basic';
  authConfig?: Record<string, any>;
  retryCount: number;
  retryDelay: number;
  timeout: number;
  customHeaders?: Record<string, string>;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  lastCalledAt?: string;
  lastStatus?: number;
  lastError?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookStats {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  successRate: number;
  averageResponseTime?: number;
}

export const webhooksService = {
  /**
   * Get all webhooks
   */
  async getAll(): Promise<Webhook[]> {
    const response = await httpClient.get<ApiResponse<Webhook[]>>('/automation/webhooks');
    return response.data || [];
  },

  /**
   * Get active webhooks
   */
  async getActive(): Promise<Webhook[]> {
    const response = await httpClient.get<ApiResponse<Webhook[]>>('/automation/webhooks/active');
    return response.data || [];
  },

  /**
   * Get a single webhook
   */
  async getOne(id: string): Promise<Webhook> {
    const response = await httpClient.get<ApiResponse<Webhook>>(`/automation/webhooks/${id}`);
    return response.data!;
  },

  /**
   * Create a new webhook
   */
  async create(data: Partial<Webhook>): Promise<Webhook> {
    const response = await httpClient.post<ApiResponse<Webhook>>('/automation/webhooks', data);
    return response.data!;
  },

  /**
   * Update a webhook
   */
  async update(id: string, data: Partial<Webhook>): Promise<Webhook> {
    const response = await httpClient.put<ApiResponse<Webhook>>(`/automation/webhooks/${id}`, data);
    return response.data!;
  },

  /**
   * Delete a webhook
   */
  async delete(id: string): Promise<void> {
    await httpClient.delete(`/automation/webhooks/${id}`);
  },

  /**
   * Test webhook connection
   */
  async test(id: string): Promise<{ success: boolean; message: string; status?: number }> {
    const response = await httpClient.post<ApiResponse<{ success: boolean; message: string; status?: number }>>(`/automation/webhooks/${id}/test`);
    return response.data!;
  },

  /**
   * Get webhook statistics
   */
  async getStats(id: string): Promise<WebhookStats> {
    const response = await httpClient.get<ApiResponse<WebhookStats>>(`/automation/webhooks/${id}/stats`);
    return response.data!;
  },

  /**
   * Get overall webhook statistics
   */
  async getOverallStats(): Promise<WebhookStats> {
    const response = await httpClient.get<ApiResponse<WebhookStats>>('/automation/webhooks/stats/overall');
    return response.data!;
  },
};
