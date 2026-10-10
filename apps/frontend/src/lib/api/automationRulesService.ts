import { httpClient } from './http-client';
import { ApiResponse } from '@affexai/shared-types';

export interface AutomationRule {
  // ... (keep same but keep it in file)
}

export const automationRulesService = {
  /**
   * Get all automation rules
   */
  async getAll(): Promise<AutomationRule[]> {
    const response = await httpClient.get<ApiResponse<AutomationRule[]>>('/automation/rules');
    return response.data || [];
  },

  /**
   * Get active automation rules
   */
  async getActive(): Promise<AutomationRule[]> {
    const response = await httpClient.get<ApiResponse<AutomationRule[]>>('/automation/rules/active');
    return response.data || [];
  },

  /**
   * Get a single automation rule
   */
  async getOne(id: string): Promise<AutomationRule> {
    const response = await httpClient.get<ApiResponse<AutomationRule>>(`/automation/rules/${id}`);
    return response.data!;
  },

  /**
   * Create a new automation rule
   */
  async create(data: Partial<AutomationRule>): Promise<AutomationRule> {
    const response = await httpClient.post<ApiResponse<AutomationRule>>('/automation/rules', data);
    return response.data!;
  },

  /**
   * Update an automation rule
   */
  async update(id: string, data: Partial<AutomationRule>): Promise<AutomationRule> {
    const response = await httpClient.put<ApiResponse<AutomationRule>>(`/automation/rules/${id}`, data);
    return response.data!;
  },

  /**
   * Delete an automation rule
   */
  async delete(id: string): Promise<void> {
    await httpClient.delete(`/automation/rules/${id}`);
  },

  /**
   * Toggle automation rule active status
   */
  async toggle(id: string): Promise<AutomationRule> {
    const response = await httpClient.put<ApiResponse<AutomationRule>>(`/automation/rules/${id}/toggle`);
    return response.data!;
  },
};
