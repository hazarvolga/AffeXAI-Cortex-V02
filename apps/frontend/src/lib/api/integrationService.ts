import { httpClient } from './http-client';
import { ApiResponse } from '@affexai/shared-types';

export interface PlatformEvent {
  id: string;
  source: string;
  eventType: string;
  payload: Record<string, unknown>;
  triggeredRules: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface EventStats {
  // ... (keep same but keep it in file)
}

export const integrationService = {
  /**
   * Get all platform events
   */
  async getEvents(limit?: number): Promise<PlatformEvent[]> {
    const response = await httpClient.get<ApiResponse<PlatformEvent[]>>('/integration/events', {
      params: { limit },
    });
    return response.data || [];
  },

  /**
   * Get events by type
   */
  async getEventsByType(eventType: string, limit?: number): Promise<PlatformEvent[]> {
    const response = await httpClient.get<ApiResponse<PlatformEvent[]>>(`/integration/events/type/${eventType}`, {
      params: { limit },
    });
    return response.data || [];
  },

  /**
   * Get events by source
   */
  async getEventsBySource(
    source: 'events' | 'email-marketing' | 'cms' | 'certificates' | 'media',
    limit?: number
  ): Promise<PlatformEvent[]> {
    const response = await httpClient.get<ApiResponse<PlatformEvent[]>>(`/integration/events/source/${source}`, {
      params: { limit },
    });
    return response.data || [];
  },

  /**
   * Get events that triggered automation
   */
  async getEventsWithAutomation(limit?: number): Promise<PlatformEvent[]> {
    const response = await httpClient.get<ApiResponse<PlatformEvent[]>>('/integration/events/automated', {
      params: { limit },
    });
    return response.data || [];
  },

  /**
   * Get event statistics
   */
  async getStats(startDate?: string, endDate?: string): Promise<EventStats> {
    const response = await httpClient.get<ApiResponse<EventStats>>('/integration/events/stats', {
      params: { startDate, endDate },
    });
    return response.data!;
  },
};
