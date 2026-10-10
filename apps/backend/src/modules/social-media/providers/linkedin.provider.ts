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
import axios from 'axios';

@Injectable()
export class LinkedInProvider implements SocialProviderIntegration {
    private readonly logger = new Logger(LinkedInProvider.name);
    public readonly provider = SocialProvider.LINKEDIN;

    constructor(private readonly configService: ConfigService) { }

    getAuthUrl(redirectUri?: string): string {
        const clientId = this.configService.get('LINKEDIN_CLIENT_ID');
        if (!clientId) throw new InternalServerErrorException('LinkedIn Client ID not configured');

        // Ensure redirectUri is encoded
        const encodedRedirect = encodeURIComponent(redirectUri || '');

        // Creating state for CSRF protection
        const state = Math.random().toString(36).substring(7);

        return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodedRedirect}&scope=w_member_social%20r_liteprofile%20r_emailaddress%20rw_organization_admin%20w_organization_social&state=${state}`;
    }

    async authenticate(params: SocialAuthParams): Promise<SocialAuthResult> {
        this.logger.log(`Authenticating with LinkedIn... Code: ${params.code?.substring(0, 5)}...`);

        const clientId = this.configService.get('LINKEDIN_CLIENT_ID');
        const clientSecret = this.configService.get('LINKEDIN_CLIENT_SECRET');

        if (!clientId || !clientSecret) {
            throw new InternalServerErrorException('LinkedIn credentials not configured');
        }

        try {
            // Exchange authorization code for access token
            const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
                params: {
                    grant_type: 'authorization_code',
                    code: params.code,
                    redirect_uri: params.redirectUri,
                    client_id: clientId,
                    client_secret: clientSecret
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const { access_token, expires_in, refresh_token, refresh_token_expires_in } = tokenResponse.data;

            // Fetch user profile
            const profileResponse = await axios.get('https://api.linkedin.com/v2/me', {
                headers: { Authorization: `Bearer ${access_token}` }
            });

            const profileData = profileResponse.data;
            const firstName = profileData.localizedFirstName || '';
            const lastName = profileData.localizedLastName || '';

            return {
                providerAccountId: profileData.id,
                accessToken: access_token,
                refreshToken: refresh_token, // LinkedIn v2 might not always return refresh tokens for all scopes
                tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
                profileData: {
                    name: `${firstName} ${lastName}`.trim(),
                    username: `${firstName.toLowerCase()}${lastName.toLowerCase()}`, // Mock username generation
                    avatarUrl: '', // Would need efficient Image API call here
                    followersCount: 0, // Requires social metadata API
                },
            };
        } catch (error: any) {
            this.logger.error(`LinkedIn Authentication Failed: ${error.message}`, error.response?.data);
            throw new InternalServerErrorException('Failed to authenticate with LinkedIn');
        }
    }

    async postStatus(accessToken: string, params: { content: string; mediaUrls?: string[]; providerAccountId?: string }): Promise<SocialPostResult> {
        this.logger.log(`Posting to LinkedIn: ${params.content}`);

        try {
            let authorUrn = '';

            // Step 1: Determine Author URN
            if (params.providerAccountId && params.providerAccountId.startsWith('urn:li:')) {
                // Use provided URN (Person or Organization)
                authorUrn = params.providerAccountId;
            } else {
                // Default to creating person URN from "me" call (Personal Profile fallback)
                const profileResponse = await axios.get('https://api.linkedin.com/v2/me', {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                authorUrn = `urn:li:person:${profileResponse.data.id}`;
            }

            // Step 2: Create UGC Post
            const postBody = {
                author: authorUrn,
                lifecycleState: "PUBLISHED",
                specificContent: {
                    "com.linkedin.ugc.ShareContent": {
                        shareCommentary: {
                            text: params.content
                        },
                        shareMediaCategory: "NONE"
                    }
                },
                visibility: {
                    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
                }
            };

            const postResponse = await axios.post('https://api.linkedin.com/v2/ugcPosts', postBody, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'X-Restli-Protocol-Version': '2.0.0'
                }
            });

            return {
                id: postResponse.data.id,
                url: `https://www.linkedin.com/feed/update/${postResponse.data.id}`
            };
        } catch (error: any) {
            this.logger.error(`LinkedIn Post Failed: ${error.message}`, error.response?.data);
            throw new InternalServerErrorException('Failed to post to LinkedIn');
        }
    }

    async getAnalytics(accessToken: string): Promise<{
        followers: number;
        impressions: number;
        engagements: number;
        topPosts: any[];
    }> {
        // LinkedIn API v2 for Personal Profiles is extremely limited for analytics.
        // Detailed engagement stats require 'Organizational' permissions or paid tiers.
        // For MVP, we will attempt to fetch basic profile data again to update followers, 
        // but likely return 0 for deep metrics to avoid breaking limits or errors.

        try {
            // 1. Basic Profile (No follower count in r_liteprofile usually)
            // We can try to fetch posts if we had UGC scopes, but analytics are separate.

            // Stub implementation for stability
            return {
                followers: 0,
                impressions: 0,
                engagements: 0,
                topPosts: []
            };

        } catch (error) {
            this.logger.error(`LinkedIn Analytics Stub Failed? ${error.message}`);
            return { followers: 0, impressions: 0, engagements: 0, topPosts: [] };
        }
    }
}
