
import { BaseApiService } from './base-service';

export interface InsightRequest {
    context: string;
    draftContent?: string;
    contextId?: string;
    contextType?: 'ticket' | 'general';
}

export interface FeedbackRequest {
    contextId: string;
    action: 'THUMBS_UP' | 'THUMBS_DOWN' | 'COPY' | 'EDIT';
    signalId?: string;
    comment?: string;
}

export interface InsightResponse {
    insight: string;
    source?: string;
    score?: number;
}

class StrategyService extends BaseApiService<any> {
    constructor() {
        super({ endpoint: '/strategy' });
    }

    async getInsight(data: InsightRequest): Promise<InsightResponse> {
        // Handle specialized endpoints based on contextType if needed, 
        // essentially mirroring the logic that was inside AiCoPilot
        if (data.contextType === 'ticket' && data.contextId) {
            // Note: This endpoint might belong to TicketService ideally, but keeping here for AI cohesion
            return this.client.get<InsightResponse>(`/tickets/${data.contextId}/neural-context`);
        }

        return this.client.post<InsightResponse>(`${this.endpoint}/insight`, {
            context: data.context,
            draftContent: data.draftContent
        });
    }

    async recordFeedback(data: FeedbackRequest): Promise<void> {
        return this.client.post<void>(`${this.endpoint}/feedback`, data);
    }
}

export const strategyService = new StrategyService();
