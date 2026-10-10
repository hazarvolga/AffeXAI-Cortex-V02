
import { BaseApiService } from './base-service';

export interface SocialPost {
    id: string;
    content: string;
    platforms: string[];
    scheduledDate?: string;
    status: 'draft' | 'scheduled' | 'published' | 'failed';
    mediaUrls?: string[];
    stats?: {
        likes: number;
        shares: number;
        comments: number;
        reach: number;
    };
    feedback?: {
        sentimentScore?: number;
        sentimentLabel?: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    }[];
    createdAt: string;
}

export interface SocialStats {
    totalPosts: number;
    totalReach: number;
    engagementRate: number;
    linkedInConnected: boolean;
    twitterConnected: boolean;
}

export interface SocialAccount {
    id: string;
    userId: string;
    provider: string; // 'twitter' | 'facebook' | 'linkedin' | 'instagram'
    username?: string; // Changed from platformUsername match backend
    profileData?: {
        name?: string;
        username?: string;
        avatarUrl?: string;
        isOrganization?: boolean;
        [key: string]: any;
    };
    isActive: boolean;
    lastSyncAt?: string;
    createdAt: string;
}

export interface ConnectAccountDto {
    provider: string;
    code: string;
    redirectUri: string;
}

class SocialMediaService extends BaseApiService<SocialPost> {
    constructor() {
        super({ endpoint: '/social-media' });
    }

    async getAuthUrl(provider: string, redirectUri?: string): Promise<{ url: string }> {
        const params = new URLSearchParams({ provider });
        if (redirectUri) params.append('redirectUri', redirectUri);
        // Base endpoint is /social-media, so we need to append /auth-url
        return this.client.get<{ url: string }>(`${this.endpoint}/auth-url?${params.toString()}`);
    }

    async connectAccount(data: ConnectAccountDto): Promise<SocialAccount> {
        return this.client.post<SocialAccount>(`${this.endpoint}/connect`, data);
    }

    async getAccounts(): Promise<SocialAccount[]> {
        return this.client.get<SocialAccount[]>(`${this.endpoint}/accounts`);
    }

    async disconnectAccount(accountId: string): Promise<void> {
        return this.client.delete<void>(`${this.endpoint}/accounts/${accountId}`);
    }

    async syncComments(id: string): Promise<any> {
        const response = await this.client.post<any>(`/social-media/posts/${id}/sync-comments`);
        return response;
    }

    async deletePost(id: string): Promise<void> {

        return this.client.delete<void>(`${this.endpoint}/posts/${id}`);
    }

    async retryPost(id: string): Promise<void> {
        return this.client.post<void>(`${this.endpoint}/posts/${id}/retry`, {});
    }

    async getStats(): Promise<SocialStats> {
        // Map backend analytics format to frontend SocialStats
        const response = await this.client.get<any>(`${this.endpoint}/analytics`);
        return {
            totalPosts: response.totalPosts,
            totalReach: response.totalImpressions, // Mapping impressions to reach broadly
            engagementRate: response.engagementRate,
            linkedInConnected: false, // TODO: Derive from account checking if needed
            twitterConnected: false
        };
    }

    async getBrandHealth(): Promise<any> {
        return this.client.get<any>(`${this.endpoint}/brand-health`);
    }

    async getPosts(): Promise<SocialPost[]> {
        // Backend returns entity structure, frontend expects SocialPost interface
        const posts = await this.client.get<any[]>(`${this.endpoint}/posts`);

        if (!Array.isArray(posts)) {
            console.warn('getPosts received non-array response:', posts);
            return [];
        }

        return posts.map(p => ({
            id: p.id,
            content: p.content,
            platforms: [p.account?.provider || 'unknown'],
            scheduledDate: p.scheduledAt,
            status: p.status === 'PENDING' ? 'scheduled' : (p.status || 'published').toLowerCase(),
            createdAt: p.createdAt,
            stats: {
                likes: p.analytics?.likes || 0,
                shares: p.analytics?.shares || 0,
                comments: p.analytics?.comments || 0,
                reach: p.analytics?.impressions || 0
            }
        }));
    }

    async createPost(data: Partial<SocialPost> & { accountIds: string[], scheduledAt?: string }): Promise<SocialPost[]> {
        return this.client.post<SocialPost[]>(`${this.endpoint}/post`, {
            content: data.content,
            mediaUrls: data.mediaUrls,
            accountIds: data.accountIds,
            scheduledAt: data.scheduledAt
        });
    }

    async optimizePost(content: string, platform: string): Promise<string> {
        return this.client.post<string>(`${this.endpoint}/optimize`, { content, platform });
    }

    async uploadMedia(file: File): Promise<{ url: string; mimeType: string }> {
        const formData = new FormData();
        formData.append('file', file);

        // Use client directly to handle FormData
        // Note: axios/fetch typically handle Content-Type for FormData automatically
        return this.client.post<{ url: string; mimeType: string }>(`${this.endpoint}/upload`, formData);
    }

    async getEngagementTrend(): Promise<any[]> {
        return this.client.get<any[]>(`${this.endpoint}/analytics/trend`);
    }
}

export const socialMediaService = new SocialMediaService();
