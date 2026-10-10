import { SocialProvider } from '../enums/social-provider.enum';

export interface SocialAuthParams {
    code: string;
    redirectUri?: string;
}

export interface SocialAuthResult {
    providerAccountId: string;
    accessToken: string;
    refreshToken?: string;
    tokenExpiresAt?: Date;
    profileData: {
        name: string;
        username: string;
        avatarUrl?: string;
        followersCount?: number;
        [key: string]: any;
    };
}

export interface SocialPostParams {
    content: string;
    mediaUrls?: string[];
    providerAccountId?: string; // Added for URN support
}

export interface SocialPostResult {
    id: string; // The platform-specific post ID
    url?: string;
}

export interface SocialProviderIntegration {
    provider: SocialProvider;
    getAuthUrl(redirectUri?: string): string;
    authenticate(params: SocialAuthParams): Promise<SocialAuthResult>;
    postStatus(accessToken: string, params: { content: string; mediaUrls?: string[]; providerAccountId?: string }): Promise<SocialPostResult>;
    getAnalytics(accessToken: string): Promise<{
        followers: number;
        impressions: number;
        engagements: number;
        topPosts: any[];
    }>;
    getOrganizations?(accessToken: string): Promise<any[]>; // Optional as not all providers support it
}
