import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SocialProvider } from '../enums/social-provider.enum';
import {
    SocialAuthParams,
    SocialAuthResult,
    SocialPostParams,
    SocialPostResult,
    SocialProviderIntegration,
} from '../interfaces/social-provider-integration.interface';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class InstagramProvider implements SocialProviderIntegration {
    private readonly logger = new Logger(InstagramProvider.name);
    public readonly provider = SocialProvider.INSTAGRAM;
    private readonly GRAPH_URL = 'https://graph.facebook.com/v18.0';

    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
    ) { }

    getAuthUrl(redirectUri?: string): string {
        // Instagram Business Login via Facebook
        const clientId = this.configService.get('FACEBOOK_APP_ID');
        const scopes = 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement';
        return `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes}&state=state&response_type=code`;
    }

    async authenticate(params: SocialAuthParams): Promise<SocialAuthResult> {
        this.logger.log(`Authenticating with Instagram Business...`);

        try {
            // 1. Exchange Code for User Access Token
            const { data: tokenData } = await firstValueFrom(
                this.httpService.get(`${this.GRAPH_URL}/oauth/access_token`, {
                    params: {
                        client_id: this.configService.get('FACEBOOK_APP_ID'),
                        client_secret: this.configService.get('FACEBOOK_APP_SECRET'),
                        redirect_uri: params.redirectUri,
                        code: params.code,
                    },
                }),
            );

            const userAccessToken = tokenData.access_token;

            // 2. Get User's Pages
            const { data: pagesData } = await firstValueFrom(
                this.httpService.get(`${this.GRAPH_URL}/me/accounts`, {
                    params: { access_token: userAccessToken },
                }),
            );

            if (!pagesData.data || pagesData.data.length === 0) {
                throw new Error('No Facebook Pages found for this user.');
            }

            // 3. Find Page with Connected Instagram Account
            let instagramAccountId: string | null = null;
            let pageAccessToken: string | null = null;

            for (const page of pagesData.data) {
                const { data: pageDetails } = await firstValueFrom(
                    this.httpService.get(`${this.GRAPH_URL}/${page.id}`, {
                        params: {
                            fields: 'instagram_business_account',
                            access_token: page.access_token,
                        },
                    }),
                );

                if (pageDetails.instagram_business_account) {
                    instagramAccountId = pageDetails.instagram_business_account.id;
                    pageAccessToken = page.access_token; // We use Page Token to act on behalf of IG
                    break;
                }
            }

            if (!instagramAccountId) {
                throw new Error('No Instagram Business Account connected to any Page.');
            }

            // 4. Get IG Profile Info
            const { data: igProfile } = await firstValueFrom(
                this.httpService.get(`${this.GRAPH_URL}/${instagramAccountId}`, {
                    params: {
                        fields: 'name,username,profile_picture_url,followers_count,website',
                        access_token: pageAccessToken,
                    },
                }),
            );

            return {
                providerAccountId: instagramAccountId,
                accessToken: pageAccessToken!, // Store Page Token
                profileData: {
                    name: igProfile.name,
                    username: igProfile.username,
                    avatarUrl: igProfile.profile_picture_url,
                    followersCount: igProfile.followers_count,
                    website: igProfile.website,
                },
            };

        } catch (error) {
            this.logger.error('Instagram Auth Failed', error.response?.data || error.message);
            throw new Error('Failed to authenticate with Instagram');
        }
    }

    async postStatus(accessToken: string, params: { content: string; mediaUrls?: string[] }): Promise<SocialPostResult> {
        // Only supports Media Publishing (Container -> Publish)
        // Text-only is not supported on IG Graph API directly without media.
        if (!params.mediaUrls || params.mediaUrls.length === 0) {
            throw new Error('Instagram requires at least one image or video.');
        }

        const imageUrl = params.mediaUrls[0]; // Single image for MVP
        const caption = params.content;

        try {
            // 1. Create Media Container
            const { data: container } = await firstValueFrom(
                this.httpService.post(`${this.GRAPH_URL}/me/media`, null, {
                    params: {
                        image_url: imageUrl,
                        caption: caption,
                        access_token: accessToken,
                    },
                }),
            );

            // 2. Publish Container
            const { data: publishResult } = await firstValueFrom(
                this.httpService.post(`${this.GRAPH_URL}/me/media_publish`, null, {
                    params: {
                        creation_id: container.id,
                        access_token: accessToken,
                    },
                }),
            );

            return {
                id: publishResult.id,
                url: `https://instagram.com/p/${publishResult.id}` // Placeholder, real URL requires another fetch
            };

        } catch (error) {
            this.logger.error('Instagram Post Failed', error.response?.data || error.message);
            throw new Error('Failed to post to Instagram');
        }
    }

    async getAnalytics(accessToken: string): Promise<{
        followers: number;
        impressions: number;
        engagements: number;
        topPosts: any[];
    }> {
        // NOTE: Instagram Graph API requires the IG Business ID, not just the Access Token.
        let instagramAccountId: string;
        try {
            const { data: me } = await firstValueFrom(
                this.httpService.get(`${this.GRAPH_URL}/me`, {
                    params: {
                        fields: 'instagram_business_account',
                        access_token: accessToken
                    }
                })
            );
            instagramAccountId = me.instagram_business_account?.id;
        } catch (e) {
            this.logger.warn(`Could not resolve IG ID from token: ${e.message}`);
            return { followers: 0, impressions: 0, engagements: 0, topPosts: [] };
        }

        if (!instagramAccountId) {
            return { followers: 0, impressions: 0, engagements: 0, topPosts: [] };
        }

        // 2. Get Account Stats
        const { data: accountStats } = await firstValueFrom(
            this.httpService.get(`${this.GRAPH_URL}/${instagramAccountId}`, {
                params: {
                    fields: 'followers_count,media_count',
                    access_token: accessToken
                }
            })
        );

        // 3. Get Media for Engagement
        let mediaData = [];
        try {
            const { data: media } = await firstValueFrom(
                this.httpService.get(`${this.GRAPH_URL}/${instagramAccountId}/media`, {
                    params: {
                        fields: 'id,caption,media_type,timestamp,like_count,comments_count,permalink',
                        limit: 10,
                        access_token: accessToken
                    }
                })
            );
            mediaData = media?.data || [];
        } catch (e) {
            this.logger.error(`IG Media fetch failed: ${e.message}`);
        }

        let totalEngagements = 0;
        const posts = mediaData.map(m => {
            const eng = (m.like_count || 0) + (m.comments_count || 0);
            totalEngagements += eng;
            return {
                id: m.id,
                content: m.caption,
                publishedAt: m.timestamp,
                likes: m.like_count,
                comments: m.comments_count,
                shares: 0, // Not available publicly on IG Graph API easily
                engagement: eng,
                url: m.permalink
            };
        });

        // 4. Impressions (Insights)
        let impressions = 0;
        try {
            const { data: insights } = await firstValueFrom(
                this.httpService.get(`${this.GRAPH_URL}/${instagramAccountId}/insights`, {
                    params: {
                        metric: 'impressions',
                        period: 'day', // Simple daily snapshot
                        access_token: accessToken
                    }
                })
            );
            // Sum up the returned values
            if (insights.data && insights.data.length > 0) {
                impressions = insights.data[0].values.reduce((acc, v) => acc + (v.value || 0), 0);
            }
        } catch (e) {
            // Often fails if account is small (<100 followers)
            this.logger.debug(`IG Insights failed (likely audience size): ${e.message}`);
        }

        return {
            followers: accountStats.followers_count || 0,
            impressions,
            engagements: totalEngagements,
            topPosts: posts
        };
    }
}
