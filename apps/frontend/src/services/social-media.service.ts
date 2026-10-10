
export interface SocialPost {
    id: string;
    content: string;
    platforms: string[];
    scheduledAt?: string;
    status: 'draft' | 'scheduled' | 'published' | 'failed';
    mediaUrls?: string[];
    errorMessage?: string;
    account?: {
        id: string;
        provider: string;
        username: string;
    };
    stats?: {
        likes: number;
        shares: number;
        comments: number;
        reach: number;
    };
    createdAt: string;
}

export interface SocialStats {
    totalPosts: number;
    totalReach: number;
    engagementRate: number;
    linkedInConnected: boolean;
    twitterConnected: boolean;
}

export const socialMediaService = {
    async getStats(): Promise<SocialStats> {
        // Phase 1: Mock data
        return Promise.resolve({
            totalPosts: 142,
            totalReach: 15400,
            engagementRate: 4.2,
            linkedInConnected: true,
            twitterConnected: false
        });
    },

    async getPosts(): Promise<SocialPost[]> {
        // Phase 1: Mock data
        return Promise.resolve([
            {
                id: '1',
                content: 'Excited to announce our new feature launch! #tech #startup',
                platforms: ['twitter', 'linkedin'],
                status: 'published',
                createdAt: new Date().toISOString(),
                stats: { likes: 45, shares: 12, comments: 5, reach: 1200 },
                account: { id: 'acc1', provider: 'twitter', username: '@affexai' }
            },
            {
                id: '2',
                content: 'Behind the scenes at our annual retreat.',
                platforms: ['instagram'],
                status: 'scheduled',
                scheduledAt: new Date(Date.now() + 86400000).toISOString(),
                createdAt: new Date().toISOString(),
                account: { id: 'acc2', provider: 'instagram', username: '@affex.life' }
            },
            {
                id: '3',
                content: 'Server maintenance scheduled for tonight. Expect brief downtime.',
                platforms: ['twitter'],
                status: 'failed',
                errorMessage: 'Rate limit exceeded',
                scheduledAt: new Date(Date.now() - 3600000).toISOString(),
                createdAt: new Date().toISOString(),
                account: { id: 'acc1', provider: 'twitter', username: '@affexai' }
            }
        ]);
    },

    async createPost(data: Partial<SocialPost>): Promise<SocialPost> {
        console.log('Creating post:', data);
        return Promise.resolve({
            id: Math.random().toString(36).substr(2, 9),
            ...data,
            status: 'scheduled',
            createdAt: new Date().toISOString()
        } as SocialPost);
    },

    async deletePost(id: string): Promise<void> {
        console.log('Deleting post:', id);
        return Promise.resolve();
    },

    async retryPost(id: string): Promise<void> {
        console.log('Retrying post:', id);
        return Promise.resolve();
    },

    async connectAccount(provider: string, code: string, state?: string): Promise<void> {
        console.log('Connecting account:', { provider, code, state });
        return Promise.resolve();
    }
};
