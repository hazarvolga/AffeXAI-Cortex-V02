/**
 * Automation API Client
 * Refactored to use unified HttpClient for consistent config and auth
 */

import { httpClient } from './http-client';
import type {
  Automation,
  CreateAutomationDto,
  UpdateAutomationDto,
  GetExecutionsQuery,
  ExecutionsResponse,
  AutomationAnalytics,
  AnalyticsQuery,
  QueueMetrics,
} from '@/types/automation';

const ENDPOINT = '/email-marketing/automations';

export const automationApi = {
  /**
   * Get all automations
   */
  async getAll(): Promise<Automation[]> {
    return httpClient.getWrapped<Automation[]>(ENDPOINT);
  },

  /**
   * Get automation by ID
   */
  async getById(id: string): Promise<Automation> {
    return httpClient.getWrapped<Automation>(`${ENDPOINT}/${id}`);
  },

  /**
   * Create automation
   */
  async create(dto: CreateAutomationDto): Promise<Automation> {
    return httpClient.postWrapped<Automation>(ENDPOINT, dto);
  },

  /**
   * Update automation
   */
  async update(id: string, dto: UpdateAutomationDto): Promise<Automation> {
    return httpClient.putWrapped<Automation>(`${ENDPOINT}/${id}`, dto);
  },

  /**
   * Delete automation
   */
  async delete(id: string): Promise<void> {
    await httpClient.delete(`${ENDPOINT}/${id}`);
  },

  /**
   * Activate automation
   */
  async activate(id: string, registerExisting: boolean = false): Promise<Automation> {
    return httpClient.postWrapped<Automation>(`${ENDPOINT}/${id}/activate`, {
      automationId: id,
      registerExistingSubscribers: registerExisting,
    });
  },

  /**
   * Pause automation
   */
  async pause(id: string, cancelPending: boolean = false): Promise<Automation> {
    return httpClient.postWrapped<Automation>(`${ENDPOINT}/${id}/pause`, {
      automationId: id,
      cancelPendingExecutions: cancelPending,
    });
  },

  /**
   * Get executions
   */
  async getExecutions(query: GetExecutionsQuery): Promise<ExecutionsResponse> {
    return httpClient.getWrapped<ExecutionsResponse>(`${ENDPOINT}/executions/list`, {
      params: query,
    });
  },

  /**
   * Get analytics
   */
  async getAnalytics(id: string, query?: AnalyticsQuery): Promise<AutomationAnalytics> {
    return httpClient.getWrapped<AutomationAnalytics>(`${ENDPOINT}/${id}/analytics`, {
      params: query,
    });
  },

  /**
   * Test automation
   */
  async test(
    id: string,
    subscriberId: string,
    dryRun: boolean = true,
  ): Promise<{
    automation: Automation;
    subscriber: any;
    steps: any[];
    message: string;
  }> {
    return httpClient.postWrapped(`${ENDPOINT}/${id}/test`, {
      automationId: id,
      subscriberId,
      dryRun,
    });
  },

  /**
   * Get queue metrics
   */
  async getQueueMetrics(): Promise<QueueMetrics> {
    return httpClient.getWrapped<QueueMetrics>(`${ENDPOINT}/queue/metrics`);
  },

  /**
   * Get queue jobs
   */
  async getQueueJobs(
    status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed',
    start: number = 0,
    end: number = 10,
  ): Promise<any[]> {
    return httpClient.getWrapped<any[]>(`${ENDPOINT}/queue/jobs/${status}`, {
      params: { start, end },
    });
  },
};
