import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { SocialProvider } from '../enums/social-provider.enum';
import {
    SocialAuthParams,
    SocialAuthResult,
    SocialPostParams,
    SocialPostResult,
    SocialProviderIntegration,
} from '../interfaces/social-provider-integration.interface';

@Injectable()
export class FacebookProvider implements SocialProviderIntegration {
    private readonly logger = new Logger(FacebookProvider.name);
    public readonly provider = SocialProvider.FACEBOOK;

    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
    ) { }

    getAuthUrl(redirectUri?: string): string {
        const clientId = this.configService.get('FACEBOOK_APP_ID');
        // Scopes for pages management and publishing
        const scopes = 'pages_manage_posts,pages_read_engagement,read_insights';
        return `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes}&state=state`;
    }

    async authenticate(params: SocialAuthParams): Promise<SocialAuthResult> {
        this.logger.log(`Authenticating with Facebook User... Code: ${params.code}`);
        const clientId = this.configService.get('FACEBOOK_APP_ID');
        const clientSecret = this.configService.get('FACEBOOK_APP_SECRET');
        const redirectUri = params.redirectUri;

        try {
            // 1. Exchange Code for User Access Token
            const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token`;
            const tokenResponse = await firstValueFrom(
                this.httpService.get(tokenUrl, {
                    params: {
                        client_id: clientId,
                        client_secret: clientSecret,
                        redirect_uri: redirectUri,
                        code: params.code,
                    },
                }),
            );

            const userAccessToken = tokenResponse.data.access_token;

            // 2. Get User Profile (Me)
            const meUrl = `https://graph.facebook.com/v18.0/me`;
            const meResponse = await firstValueFrom(
                this.httpService.get(meUrl, {
                    params: {
                        access_token: userAccessToken,
                        fields: 'id,name,picture'
                    }
                })
            );
            const me = meResponse.data;

            return {
                providerAccountId: me.id,
                accessToken: userAccessToken,
                tokenExpiresAt: undefined, // User tokens vary, usually short-lived unless exchanged.
                profileData: {
                    name: me.name,
                    username: me.id,
                    avatarUrl: me.picture?.data?.url,
                    isOrganization: false
                },
            };
        } catch (error) {
            this.logger.error(`Facebook Authentication Failed: ${error.response?.data?.error?.message || error.message}`);
            throw new Error('Failed to connect Facebook account');
        }
    }

    async getOrganizations(userAccessToken: string): Promise<any[]> {
        try {
            const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts`;
            const pagesResponse = await firstValueFrom(
                this.httpService.get(pagesUrl, {
                    params: {
                        access_token: userAccessToken,
                        fields: 'id,name,access_token,category,fan_count,picture,username',
                        limit: 100
                    },
                }),
            );

            const pages = pagesResponse.data.data || [];

            return pages.map(page => ({
                id: page.id,
                name: page.name,
                username: page.username || page.name.replace(/\s+/g, '').toLowerCase(),
                accessToken: page.access_token, // Crucial for Facebook Page management
                picture: page.picture?.data?.url,
                category: page.category
            }));

        } catch (error) {
            this.logger.error(`Failed to fetch Facebook Pages: ${error.message}`);
            return [];
        }
    }

    async postStatus(accessToken: string, params: { content: string; mediaUrls?: string[] }): Promise<SocialPostResult> {
        this.logger.log(`Posting to Facebook...`);

        try {
            // Determine if this is a text post or media post
            const isMediaPost = params.mediaUrls && params.mediaUrls.length > 0;

            if (isMediaPost) {
                // For MVP: Handle single photo upload.
                // Facebook Graph API for Photos: POST /{page-id}/photos
                // In a future iteration, we will handle albums or multi-photo stories.

                const mediaUrl = params.mediaUrls[0];
                const endpoint = `https://graph.facebook.com/v18.0/me/photos`;

                const response = await firstValueFrom(
                    this.httpService.post(endpoint, null, {
                        params: {
                            url: mediaUrl,
                            caption: params.content,
                            access_token: accessToken,
                            published: true,
                        },
                    }),
                );

                return {
                    id: response.data.id,
                    url: `https://facebook.com/${response.data.post_id}`, // 'post_id' is returned for photos published to feed
                };

            } else {
                // Text-only Post
                // API: POST /{page-id}/feed
                const endpoint = `https://graph.facebook.com/v18.0/me/feed`;

                const response = await firstValueFrom(
                    this.httpService.post(endpoint, null, {
                        params: {
                            message: params.content,
                            access_token: accessToken,
                        },
                    }),
                );

                return {
                    id: response.data.id,
                    url: `https://facebook.com/${response.data.id}`,
                };
            }

        } catch (error) {
            this.logger.error(`Facebook Post Failed: ${error.response?.data?.error?.message || error.message}`);
            throw new Error(`Failed to post to Facebook: ${error.response?.data?.error?.message || error.message}`);
        }
    }

    async getAnalytics(accessToken: string): Promise<{
        followers: number;
        impressions: number;
        engagements: number;
        topPosts: any[];
    }> {
        // 1. Page Stats (Followers)
        const pageUrl = `https://graph.facebook.com/v18.0/me`;
        const pageResponse = await firstValueFrom(
            this.httpService.get(pageUrl, {
                params: {
                    fields: 'fan_count,new_like_count', // fan_count = Total Likes/Followers
                    access_token: accessToken
                }
            })
        );

        // 2. Page Insights (Impressions - 28 days)
        // Metric: page_impressions_unique_days_28
        const insightsUrl = `https://graph.facebook.com/v18.0/me/insights/page_impressions_unique_days_28`;
        let impressions = 0;
        try {
            const insights = await firstValueFrom(
                this.httpService.get(insightsUrl, {
                    params: { access_token: accessToken }
                })
            );
            // Take the value from the last entry (most recent day's 28-day sum)
            const values = insights.data?.data?.[0]?.values;
            if (values && values.length > 0) {
                impressions = values[values.length - 1].value || 0;
            }
        } catch (e) {
            this.logger.warn(`Failed to fetch FB Insights: ${e.message}`);
        }

        // 3. Recent Feed Engagement
        const feedUrl = `https://graph.facebook.com/v18.0/me/feed`;
        const feedResponse = await firstValueFrom(
            this.httpService.get(feedUrl, {
                params: {
                    fields: 'id,message,created_time,shares,comments.summary(true),likes.summary(true),insights.metric(post_impressions_unique)',
                    limit: 10,
                    access_token: accessToken
                }
            })
        );

        let engagements = 0;
        const posts = feedResponse.data.data.map(p => {
            const likes = p.likes?.summary?.total_count || 0;
            const comments = p.comments?.summary?.total_count || 0;
            const shares = p.shares?.count || 0;
            const postEng = likes + comments + shares;

            engagements += postEng;

            return {
                id: p.id,
                content: p.message,
                publishedAt: p.created_time,
                likes,
                comments,
                shares,
                engagement: postEng
            };
        });

        return {
            followers: pageResponse.data.fan_count || 0,
            impressions,
            engagements,
            topPosts: posts
        };
    }
}
