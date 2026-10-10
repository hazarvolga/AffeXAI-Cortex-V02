import { BaseApiService } from './base-service';
import { httpClient } from './http-client';

export interface FaqSearchResult {
    id: string;
    question: string; // or Title
    answer: string;   // or Snippet
    category?: string;
    confidence: number;
    type: 'faq' | 'article';
    url?: string;
    usageCount: number;
    helpfulCount: number;
}

export interface SearchFaqsParams {
    query: string;
    category?: string;
    limit?: number;
    offset?: number;
    include_articles?: boolean;
}

class FaqService extends BaseApiService<any, any, any> {
    constructor() {
        super({ endpoint: 'faqs' });
    }

    async search(params: SearchFaqsParams): Promise<{ faqs: FaqSearchResult[]; total: number }> {
        const queryParams = new URLSearchParams();
        if (params.query) queryParams.append('query', params.query);
        if (params.category) queryParams.append('category', params.category);
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.offset) queryParams.append('offset', params.offset.toString());
        if (params.include_articles !== undefined) queryParams.append('include_articles', params.include_articles.toString());

        return httpClient.get<{ faqs: FaqSearchResult[]; total: number }>(`/faqs/search?${queryParams.toString()}`);
    }

    async markHelpful(id: string, isHelpful: boolean): Promise<void> {
        return httpClient.post(`/faqs/${id}/feedback`, {
            feedbackType: isHelpful ? 'helpful' : 'not_helpful'
        });
    }
}

export const faqService = new FaqService();
