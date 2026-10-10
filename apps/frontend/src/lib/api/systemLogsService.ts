import { httpClient } from './http-client';
import { BaseApiService } from './base-service';
import type { ApiResponse, ListResponse, PaginationMeta } from '@affexai/shared-types';

export interface SystemLog {
    id: string;
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
    context: string;
    message: string;
    metadata?: Record<string, any>;
    tenantId?: string;
    userId?: string;
}

export interface LogStats {
    info: number;
    warn: number;
    error: number;
    debug: number;
    total: number;
}

export interface GetLogsParams {
    level?: string;
    context?: string;
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
}

/**
 * System Logs Service
 * Handles operations related to backend system logs.
 */
class SystemLogsService extends BaseApiService<SystemLog> {
    constructor() {
        super({ endpoint: '/system-logs', useWrappedResponses: true });
    }

    /**
     * Get logs with advanced filtering
     */
    async getSystemLogs(params: GetLogsParams): Promise<{ items: SystemLog[]; total: number }> {
        const searchParams = new URLSearchParams();
        if (params.level) searchParams.append('level', params.level);
        if (params.context) searchParams.append('context', params.context);
        if (params.limit) searchParams.append('limit', params.limit.toString());
        if (params.offset) searchParams.append('offset', params.offset.toString());
        if (params.startDate) searchParams.append('startDate', params.startDate);
        if (params.endDate) searchParams.append('endDate', params.endDate);

        const queryString = searchParams.toString();
        const url = `${this.endpoint}${queryString ? `?${queryString}` : ''}`;

        const response = await httpClient.get<ApiResponse<SystemLog[]>>(url);
        return {
            items: response.data || [],
            total: (response as any).total || 0,
        };
    }

    /**
     * Get log statistics
     */
    async getStats(startDate?: string, endDate?: string): Promise<LogStats> {
        const searchParams = new URLSearchParams();
        if (startDate) searchParams.append('startDate', startDate);
        if (endDate) searchParams.append('endDate', endDate);

        const queryString = searchParams.toString();
        const url = `${this.endpoint}/stats${queryString ? `?${queryString}` : ''}`;

        return httpClient.getWrapped<LogStats>(url);
    }

    /**
     * Clear old logs
     */
    async cleanup(daysToKeep: number = 30): Promise<{ deletedCount: number }> {
        const url = `${this.endpoint}/cleanup?daysToKeep=${daysToKeep}`;
        return httpClient.deleteWrapped<{ deletedCount: number }>(url);
    }
}

export const systemLogsService = new SystemLogsService();
export default systemLogsService;
