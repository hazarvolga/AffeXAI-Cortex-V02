import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SocialProvider } from '../enums/social-provider.enum';
import {
    SocialAuthParams,
    SocialAuthResult,
    SocialPostParams,
    SocialPostResult,
    SocialProviderIntegration,
} from '../interfaces/social-provider-integration.interface';
import { TwitterApi } from 'twitter-api-v2';

@Injectable()
export class TwitterProvider implements SocialProviderIntegration {
    private readonly logger = new Logger(TwitterProvider.name);
    public readonly provider = SocialProvider.TWITTER;

    constructor(private readonly configService: ConfigService) { }

    getAuthUrl(redirectUri?: string): string {
        const clientId = this.configService.get('TWITTER_CLIENT_ID');
        if (!clientId) throw new InternalServerErrorException('Twitter Client ID not configured');

        // Twitter OAuth 2.0 PKCE Flow (Simplified for server-side for now, usually requires session for verifier)
        // NOTE: In a real production environment, we should store the codeVerifier in Redis/Session associated with the state
        // For this implementation, we will assume the frontend handles the initial redirect or we use a stateless approach
        // But twitter-api-v2 helper is better.

        // Manual URL construction for stateless init (basic)
        const state = Math.random().toString(36).substring(7);
        const scope = 'tweet.read tweet.write users.read offline.access';

        return `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}&code_challenge=challenge&code_challenge_method=plain`;
    }

    async authenticate(params: SocialAuthParams): Promise<SocialAuthResult> {
        this.logger.log(`Authenticating with Twitter... Code: ${params.code?.substring(0, 5)}...`);

        const clientId = this.configService.get('TWITTER_CLIENT_ID');
        const clientSecret = this.configService.get('TWITTER_CLIENT_SECRET');

        if (!clientId || !clientSecret) {
            throw new InternalServerErrorException('Twitter credentials not configured');
        }

        try {
            // Instantiate client for 3-legged auth
            const client = new TwitterApi({
                clientId,
                clientSecret,
            });

            // Exchange code for tokens
            // NOTE: In production, codeVerifier should be retrieved from session. 
            // For now, using 'challenge' as used in getAuthUrl (plain method)
            const { client: loggedClient, accessToken, refreshToken, expiresIn } = await client.loginWithOAuth2({
                code: params.code,
                codeVerifier: 'challenge',
                redirectUri: params.redirectUri,
            });

            // Get current user info
            const { data: user } = await loggedClient.v2.me();

            return {
                providerAccountId: user.id,
                accessToken: accessToken,
                refreshToken: refreshToken,
                // expiresIn is in seconds
                tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
                profileData: {
                    name: user.name,
                    username: user.username,
                    avatarUrl: user.profile_image_url || '',
                    followersCount: 0, // Requires additional API call: v2.user(user.id, { "user.fields": ["public_metrics"] })
                },
            };
        } catch (error: any) {
            this.logger.error(`Twitter Authentication Failed: ${error.message}`, error);
            throw new InternalServerErrorException('Failed to authenticate with Twitter');
        }
    }

    async postStatus(accessToken: string, params: { content: string; mediaUrls?: string[] }): Promise<SocialPostResult> {
        this.logger.log(`Posting to Twitter: ${params.content}`);

        try {
            // Instantiate - assumes Bearer/OAuth2 token
            const client = new TwitterApi(accessToken);

            // TODO: Handle media uploads if mediaUrls present (requires v1.1 upload usually, or v2 logic)
            // For Phase 3 MVP, text only
            const { data: createdTweet } = await client.v2.tweet(params.content);

            return {
                id: createdTweet.id,
                url: `https://twitter.com/i/web/status/${createdTweet.id}` // Construct URL
            };
        } catch (error: any) {
            this.logger.error(`Twitter Post Failed: ${error.message}`, error);
            throw new InternalServerErrorException('Failed to post to Twitter');
        }
    }
    async getAnalytics(accessToken: string): Promise<{
        followers: number;
        impressions: number;
        engagements: number;
        topPosts: any[];
    }> {
        try {
            const client = new TwitterApi(accessToken);

            // 1. Get User Ops & Public Metrics
            const { data: me } = await client.v2.me({
                "user.fields": ["public_metrics", "created_at"]
            });

            // 2. Get Recent Tweets
            const tweets = await client.v2.userTimeline(me.id, {
                max_results: 10,
                "tweet.fields": ["public_metrics", "created_at", "text"],
                exclude: ["retweets", "replies"] // Focus on original content
            });

            let totalEngagements = 0;
            let totalImpressions = 0; // Requires enterprise/elevated access usually, but v2 public_metrics has 'impression_count' for own tweets?
            // Actually 'impression_count' is in 'non_public_metrics' or 'organic_metrics' which requires OAuth 2.0 user context.
            // We have OAuth 2.0 user context! So let's try requesting it.

            // Note: Pagination handled by library but we just take one page (10 items).
            const topPosts = [];

            for (const tweet of tweets) {
                // public_metrics: retweet_count, reply_count, like_count, quote_count, bookmark_count, impression_count
                // impression_count is technically public metric in v2 for the AUTHOR? No, it's non_public.
                // Let's use public_metrics for standard engagement.

                const metrics = tweet.public_metrics;
                const eng = (metrics.like_count || 0) + (metrics.reply_count || 0) + (metrics.retweet_count || 0);
                totalEngagements += eng;

                // If using expansion/fields correctly, we might get impressions.
                // For now, assume 0 if not available to be safe.
                const imp = metrics['impression_count'] || 0;
                totalImpressions += imp;

                topPosts.push({
                    id: tweet.id,
                    content: tweet.text,
                    publishedAt: tweet.created_at,
                    likes: metrics.like_count,
                    comments: metrics.reply_count,
                    shares: metrics.retweet_count,
                    engagement: eng,
                    impressions: imp
                });
            }

            return {
                followers: me.public_metrics?.followers_count || 0,
                impressions: totalImpressions,
                engagements: totalEngagements,
                topPosts
            };

        } catch (error) {
            this.logger.error(`Twitter Analytics Failed: ${error.message}`);
            // Return empty stats on error to prevent crashing aggregate dashboard
            return { followers: 0, impressions: 0, engagements: 0, topPosts: [] };
        }
    }
}
