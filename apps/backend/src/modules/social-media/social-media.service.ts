import { Injectable, Logger, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocialAccount } from './entities/social-account.entity';
import { SocialPost } from './entities/social-post.entity';
import { SocialPostFeedback } from './entities/social-post-feedback.entity';
import { InjectQueue } from '@nestjs/bullmq';

import { Queue } from 'bullmq';
import { SocialPostStatus } from './enums/post-status.enum';
import { SocialProvider } from './enums/social-provider.enum';
import { TwitterProvider } from './providers/twitter.provider';
import { LinkedInProvider } from './providers/linkedin.provider';
import { FacebookProvider } from './providers/facebook.provider';
import { InstagramProvider } from './providers/instagram.provider';
import { SocialProviderIntegration, SocialAuthResult } from './interfaces/social-provider-integration.interface';
import { ConnectAccountDto } from './dto/connect-account.dto';
import { KeyManagementService } from '../../core/shared/services/key-management.service';
import { S3Service } from '../media/s3.service';
import type { User } from '../users/entities/user.entity';
import { StrategyService } from '../strategy/services/strategy.service';
import { CommerceService } from '../commerce/services/commerce.service';
import { BccService } from '../bcc/bcc.service';
import { SignalType, SignalSource } from '../bcc/interfaces/signal.interface';


@Injectable()
export class SocialMediaService {
    private readonly logger = new Logger(SocialMediaService.name);
    private readonly providers: Map<SocialProvider, SocialProviderIntegration> = new Map();

    constructor(
        @InjectRepository(SocialAccount)
        private readonly accountRepository: Repository<SocialAccount>,
        @InjectRepository(SocialPost)
        private readonly postRepository: Repository<SocialPost>,
        @InjectRepository(SocialPostFeedback)
        private readonly feedbackRepository: Repository<SocialPostFeedback>,
        @InjectQueue('social_dispatch') private readonly dispatchQueue: Queue,
        private readonly configService: ConfigService,
        private readonly commerceService: CommerceService,
        private readonly strategyService: StrategyService, // Added Injection
        private readonly twitterProvider: TwitterProvider,
        private readonly linkedinProvider: LinkedInProvider,
        private readonly facebookProvider: FacebookProvider,
        private readonly instagramProvider: InstagramProvider,
        private readonly keyManagementService: KeyManagementService,
        private readonly s3Service: S3Service,
        private readonly bccService: BccService,
        private readonly eventEmitter: EventEmitter2,
    ) {
        this.providers.set(SocialProvider.TWITTER, twitterProvider);
        this.providers.set(SocialProvider.LINKEDIN, linkedinProvider);
        this.providers.set(SocialProvider.FACEBOOK, facebookProvider);
        this.providers.set(SocialProvider.INSTAGRAM, instagramProvider);
    }

    getProvider(provider: SocialProvider): SocialProviderIntegration {
        const integration = this.providers.get(provider);
        if (!integration) {
            throw new BadRequestException(`Provider ${provider} is not supported`);
        }
        return integration;
    }

    getAuthUrl(provider: SocialProvider, redirectUri?: string): string {
        return this.getProvider(provider).getAuthUrl(redirectUri);
    }

    async connectAccount(user: User, dto: ConnectAccountDto): Promise<SocialAccount> {
        const provider = this.getProvider(dto.provider);

        // 1. Exchange code for tokens
        const authResult = await provider.authenticate({
            code: dto.code,
            redirectUri: dto.redirectUri,
        });

        // Encrypt both tokens as JSON
        // 2. Upsert SocialAccount (Personal Profile)
        const account = await this.upsertSocialAccount(user.id, user.tenantId, authResult, dto.provider);

        // 3. Organization Discovery (LinkedIn Specific for Phase 9)
        if (provider.getOrganizations) {
            const orgs = await provider.getOrganizations(authResult.accessToken);
            if (orgs.length > 0) {
                this.logger.log(`Found ${orgs.length} organizations for user ${user.id}`);

                for (const org of orgs) {
                    await this.upsertSocialAccount(user.id, user.tenantId, {
                        ...authResult,
                        providerAccountId: org.id,
                        accessToken: org.accessToken || authResult.accessToken, // Override with Page Token if available (Facebook)
                        profileData: {
                            ...authResult.profileData,
                            name: org.name,
                            username: org.username || org.id,
                            avatarUrl: org.picture || authResult.profileData.avatarUrl,
                            isOrganization: true
                        }
                    }, dto.provider);
                }
            }
        }

        return account;
    }

    private async upsertSocialAccount(userId: string, tenantId: string, authResult: SocialAuthResult, provider: SocialProvider) {
        let account = await this.accountRepository.findOne({
            where: {
                providerAccountId: authResult.providerAccountId,
                provider: provider
            }
        });

        const encryptedAccessToken = await this.encryptToken(authResult.accessToken);
        let encryptedRefreshToken: { encryptedApiKey: string; encryptedDek: string } | undefined;
        if (authResult.refreshToken) {
            encryptedRefreshToken = await this.encryptToken(authResult.refreshToken);
        }

        if (account) {
            // Update Token
            account.accessToken = encryptedAccessToken.encryptedApiKey;
            account.tokenDek = encryptedAccessToken.encryptedDek;
            if (encryptedRefreshToken) {
                account.refreshToken = encryptedRefreshToken.encryptedApiKey;
                account.refreshTokenDek = encryptedRefreshToken.encryptedDek;
            }
            account.tokenExpiresAt = authResult.tokenExpiresAt;
            // Update Profile Info
            account.username = authResult.profileData.username;
            account.profileData = authResult.profileData;

            // If reassigned to a different user/tenant? For now assume strict binding or update ownership
            // account.userId = userId; 
        } else {
            // Create New
            account = new SocialAccount();
            account.userId = userId;
            account.tenantId = tenantId;
            account.provider = provider;
            account.providerAccountId = authResult.providerAccountId;
            account.username = authResult.profileData.username;
            account.accessToken = encryptedAccessToken.encryptedApiKey;
            account.tokenDek = encryptedAccessToken.encryptedDek;
            if (encryptedRefreshToken) {
                account.refreshToken = encryptedRefreshToken.encryptedApiKey;
                account.refreshTokenDek = encryptedRefreshToken.encryptedDek;
            }
            account.tokenExpiresAt = authResult.tokenExpiresAt;
            account.profileData = authResult.profileData;
            account.isActive = true;
        }

        return this.accountRepository.save(account);
    }

    private async encryptToken(token: string): Promise<{ encryptedApiKey: string; encryptedDek: string }> {
        const tokensToEncrypt = JSON.stringify({ token }); // Wrap in object for consistency with original encryption
        return this.keyManagementService.encryptApiKey(tokensToEncrypt, 'social');
    }


    async findAllAccounts(userId: string, tenantId: string) {
        this.logger.log(`Fetching all accounts for user ${userId} in tenant ${tenantId}`);
        const accounts = await this.accountRepository.find({
            where: { userId, tenantId },
        });
        this.logger.log(`Found ${accounts.length} accounts for user ${userId}`);
        return accounts;
    }

    async deleteAccount(userId: string, accountId: string, tenantId: string) {
        const account = await this.accountRepository.findOne({
            where: { id: accountId, userId, tenantId },
        });

        if (!account) {
            throw new NotFoundException('Account not found');
        }

        return this.accountRepository.remove(account);
    }

    // --- Post Management ---

    async createPost(user: User, dto: any): Promise<SocialPost[]> {
        const { content, mediaUrls, accountIds, scheduledAt } = dto;
        const posts: SocialPost[] = [];

        // Validate accounts belong to user AND tenant
        const accounts = await this.accountRepository.find({
            where: accountIds.map(id => ({ id, userId: user.id, tenantId: user.tenantId }))
        });
        if (accounts.length !== accountIds.length) {
            throw new BadRequestException('One or more accounts not found or do not belong to user');
        }

        // 0. Governance Check (Unified Quota)
        // Ensure tenant has enough "Action Tokens" to post.
        // We check limit ONCE per batch request, or we could check per post.
        // For now, simple check: If you are over limit, you can't post.
        const limitCheck = await this.commerceService.checkLimit(user.tenantId);
        if (!limitCheck.allowed) {
            this.logger.warn(`Social Post Blocked: Rate limit exceeded for tenant ${user.tenantId}`);
            throw new BadRequestException('Plan Limit Exceeded. Please upgrade to publish posts.');
        }

        for (const account of accounts) {
            const post = new SocialPost();
            post.userId = user.id;
            post.accountId = account.id;
            post.content = content;
            post.mediaUrls = mediaUrls || [];
            post.tenantId = user.tenantId;

            if (scheduledAt) {
                post.scheduledAt = new Date(scheduledAt);
                post.status = SocialPostStatus.SCHEDULED;
            } else {
                post.status = SocialPostStatus.PENDING;
            }

            const savedPost = await this.postRepository.save(post);
            posts.push(savedPost);

            // 2. Enqueue for background processing
            const delay = post.scheduledAt
                ? Math.max(0, post.scheduledAt.getTime() - Date.now())
                : 0;

            await this.dispatchQueue.add('dispatch_post',
                { postId: savedPost.id },
                { delay }
            );

            this.logger.log(`Post ${savedPost.id} enqueued for dispatch with delay ${delay}ms`);

            // 3. 🧠 NEURAL GRID SIGNAL: Post Created
            this.eventEmitter.emit('neural.signal', {
                tenantId: user.tenantId,
                source: 'social',
                type: 'post.created',
                context: `New social post created for ${account.provider}: ${savedPost.content}`,
                data: { postId: savedPost.id, platform: account.provider }
            });
        }

        return posts;
    }

    async findAllPosts(userId: string, tenantId: string) {
        return this.postRepository.find({
            where: { userId, tenantId },
            relations: ['account'],
            order: { id: 'DESC' },
        });
    }

    async getAnalytics(userId: string, tenantId: string) {
        // Fetch posts for the user within tenant
        const posts = await this.postRepository.find({
            where: { userId, tenantId },
            order: { publishedAt: 'DESC' },
            take: 30
        });

        let totalImpressions = 0;
        let totalEngagements = 0;

        posts.forEach(post => {
            const analytics = post.analytics || {};
            const imp = analytics.impressions || 0;
            const eng = (analytics.likes || 0) + (analytics.comments || 0) + (analytics.shares || 0);

            totalImpressions += imp;
            totalEngagements += eng;
        });

        return {
            totalPosts: posts.length,
            totalImpressions,
            totalEngagements,
            engagementRate: totalImpressions > 0 ? (totalEngagements / totalImpressions) * 100 : 0,
            recentPosts: posts.map(p => ({
                id: p.id,
                content: p.content,
                platform: p.account?.provider,
                analytics: p.analytics
            }))
        };
    }

    async deletePost(userId: string, postId: string, tenantId: string) {
        const post = await this.postRepository.findOne({ where: { id: postId, userId, tenantId } });
        if (!post) {
            throw new NotFoundException('Post not found');
        }
        return this.postRepository.remove(post);
    }

    async retryPost(userId: string, postId: string, tenantId: string) {
        const post = await this.postRepository.findOne({
            where: { id: postId, userId, tenantId },
            relations: ['account']
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        if (post.status !== SocialPostStatus.FAILED) {
            throw new BadRequestException('Only failed posts can be retried');
        }

        post.status = SocialPostStatus.PENDING;
        post.errorMessage = null;
        const savedPost = await this.postRepository.save(post);

        await this.dispatchQueue.add('dispatch_post', { postId: savedPost.id });
        this.logger.log(`Post ${savedPost.id} re-queued for retry`);

        return savedPost;
    }

    async getDecryptedTokens(accountId: string, tenantId: string) {
        const account = await this.accountRepository.findOne({
            where: { id: accountId, tenantId },
            select: ['accessToken', 'tokenDek', 'provider'],
        });

        if (!account || !account.accessToken || !account.tokenDek) {
            throw new NotFoundException('Account not found or invalid tokens');
        }

        const decryptedJson = await this.keyManagementService.decryptApiKey(
            account.accessToken,
            account.tokenDek,
            'social'
        );

        return JSON.parse(decryptedJson);
    }

    // --- Brand Intelligence (Real-time Provider Stats) ---

    async getPlatformAnalytics(userId: string, tenantId: string) {
        const accounts = await this.accountRepository.find({ where: { userId, tenantId } });

        const platformStats = await Promise.all(accounts.map(async (account) => {
            try {
                if (!account.accessToken || !account.tokenDek) return null;

                const tokens = await this.keyManagementService.decryptApiKey(
                    account.accessToken,
                    account.tokenDek,
                    'social'
                );
                const { access_token } = JSON.parse(tokens);
                const provider = this.getProvider(account.provider);

                const stats = await provider.getAnalytics(access_token);

                return {
                    provider: account.provider,
                    ...stats
                };
            } catch (error) {
                this.logger.error(`Failed to fetch stats for ${account.provider}: ${error.message}`);
                return null;
            }
        }));

        const validStats = platformStats.filter(s => s !== null);

        const totalFollowers = validStats.reduce((acc, s) => acc + s.followers, 0);
        const totalImpressions = validStats.reduce((acc, s) => acc + s.impressions, 0);
        const totalEngagements = validStats.reduce((acc, s) => acc + s.engagements, 0);

        return {
            overview: {
                totalFollowers,
                totalImpressions,
                totalEngagements,
                connectedPlatforms: validStats.length
            },
            platforms: validStats
        };
    }

    // --- Global Analytics for Brand Intelligence (TENANT-AWARE) ---

    async getGlobalEngagementStats(tenantId: string) {
        // CRITICAL FIX: Filter by tenantId
        const result = await this.postRepository.createQueryBuilder('post')
            .select('COUNT(post.id)', 'totalPosts')
            .addSelect("SUM(CAST(post.analytics ->> 'impressions' AS INT))", 'totalImpressions')
            .addSelect("SUM(CAST(post.analytics ->> 'likes' AS INT))", 'totalLikes')
            .addSelect("SUM(CAST(post.analytics ->> 'comments' AS INT))", 'totalComments')
            .addSelect("SUM(CAST(post.analytics ->> 'shares' AS INT))", 'totalShares')
            .where('post.tenantId = :tenantId', { tenantId })
            .getRawOne();

        const totalPosts = parseInt(result.totalPosts, 10) || 0;
        const totalImpressions = parseInt(result.totalImpressions, 10) || 0;
        const totalEngagements = (parseInt(result.totalLikes, 10) || 0) +
            (parseInt(result.totalComments, 10) || 0) +
            (parseInt(result.totalShares, 10) || 0);

        const engagementRate = totalImpressions > 0 ? (totalEngagements / totalImpressions) * 100 : 0;

        return {
            totalPosts,
            totalImpressions,
            totalEngagements,
            engagementRate
        };
    }

    async getEngagementHistory(days = 14, tenantId: string) {
        // CRITICAL FIX: Filter by tenantId
        const result = await this.postRepository.createQueryBuilder('post')
            .select("DATE_TRUNC('day', COALESCE(post.publishedAt, post.createdAt))", 'date')
            .addSelect("SUM(CAST(post.analytics ->> 'likes' AS INT) + CAST(post.analytics ->> 'comments' AS INT) + CAST(post.analytics ->> 'shares' AS INT))", 'engagement')
            .where("COALESCE(post.publishedAt, post.createdAt) > NOW() - INTERVAL ':days days'", { days })
            .andWhere('post.tenantId = :tenantId', { tenantId })
            .groupBy('date')
            .orderBy('date', 'ASC')
            .getRawMany();

        return result.map(r => ({
            date: r.date,
            value: parseInt(r.engagement, 10) || 0
        }));
    }

    // --- Media Upload ---

    async uploadMedia(file: Express.Multer.File, tenantId: string): Promise<{ url: string; mimeType: string }> {
        if (!file) {
            throw new BadRequestException('File is missing');
        }

        const allowedMimes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'video/mp4', 'video/quicktime'
        ];
        if (!allowedMimes.includes(file.mimetype)) {
            throw new BadRequestException(`Unsupported file type: ${file.mimetype}`);
        }

        const ext = file.originalname.split('.').pop();
        const filename = `social-media/${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;

        try {
            const url = await this.s3Service.uploadFile(
                `social-${Math.round(Math.random() * 1e6)}.${ext}`,
                file.buffer,
                file.mimetype,
                tenantId,
                {
                    path: 'social-media',
                    acl: 'public-read',
                    metadata: {
                        originalName: file.originalname,
                        module: 'social-media'
                    }
                }
            );

            return {
                url,
                mimeType: file.mimetype
            };
        } catch (error) {
            this.logger.error(`Media Upload Failed: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Failed to upload media');
        }
    }

    // --- Trend Analytics for Dashboard ---

    async getEngagementTrend(userId: string, tenantId: string, days = 7) {
        // Query to aggregate engagement by date and platform
        // This is complex because we need to parse the JSONB analytics field and join with accounts

        // We'll fetch posts from the last N days
        const rawPosts = await this.postRepository.createQueryBuilder('post')
            .leftJoinAndSelect('post.account', 'account')
            .where('post.tenantId = :tenantId', { tenantId })
            .andWhere("COALESCE(post.publishedAt, post.createdAt) > NOW() - INTERVAL ':days days'", { days })
            .select([
                "DATE_TRUNC('day', COALESCE(post.publishedAt, post.createdAt)) as date",
                'account.provider as provider',
                "SUM(CAST(post.analytics ->> 'likes' AS INT)) as likes",
                "SUM(CAST(post.analytics ->> 'comments' AS INT)) as comments",
                "SUM(CAST(post.analytics ->> 'shares' AS INT)) as shares"
            ])
            .groupBy('date, provider')
            .orderBy('date', 'ASC')
            .getRawMany();

        // Initialize date map for the last N days
        const dateMap = new Map<string, { date: string, twitter: number, facebook: number, instagram: number, linkedin: number }>();

        for (let i = 0; i < days; i++) {
            const d = new Date();
            d.setDate(d.getDate() - (days - 1 - i));
            const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
            // Format for frontend display: '14 Oct' (Turkish locale handled in frontend or here)
            // Ideally keep ISO for transport, format in frontend. But existing chart expects specifics.
            // Let's return standard ISO date key, and let frontend format it.
            dateMap.set(dateStr, {
                date: dateStr,
                twitter: 0,
                facebook: 0,
                instagram: 0,
                linkedin: 0
            });
        }

        rawPosts.forEach(row => {
            const dateKey = new Date(row.date).toISOString().split('T')[0];
            const entry = dateMap.get(dateKey);
            if (entry) {
                const engagement = (parseInt(row.likes) || 0) + (parseInt(row.comments) || 0) + (parseInt(row.shares) || 0);
                const provider = row.provider?.toLowerCase();
                if (provider && entry.hasOwnProperty(provider)) {
                    (entry as any)[provider] += engagement;
                }
            }
        });

        return Array.from(dateMap.values());
    }

    // --- Feedback & Sentiment Analysis ---

    async syncComments(postId: string, tenantId: string) {
        const post = await this.postRepository.findOne({
            where: { id: postId, tenantId },
            relations: ['account']
        });

        if (!post) throw new NotFoundException('Post not found');

        // TODO: Implement real provider comment fetching
        // const comments = await this.getProvider(post.account.provider).getComments(post.platformPostId);
        const comments: any[] = [];

        for (const comment of comments) {
            // Check if already exists
            const existing = await this.feedbackRepository.findOne({
                where: { externalId: comment.id, platform: post.account.provider }
            });

            if (existing) continue;

            // 2. Analyze Sentiment (AI)
            const analysis = await this.analyzeSentiment(comment.text, tenantId);

            const feedback = new SocialPostFeedback();
            feedback.postId = post.id;
            feedback.tenantId = tenantId;
            feedback.externalId = comment.id;
            feedback.content = comment.text;
            feedback.authorName = comment.author;
            feedback.platform = post.account.provider;
            feedback.sentimentScore = analysis.score;
            feedback.sentimentLabel = analysis.label;

            await this.feedbackRepository.save(feedback);
        }

        return this.feedbackRepository.find({ where: { postId } });
    }

    async optimizeContent(tenantId: string, content: string, platform: string): Promise<string> {
        try {
            const result = await this.strategyService.executeStrategy({
                tenantId,
                type: 'creator', // Using creator persona for writing
                context: 'social_optimization',
                parameters: {
                    content,
                    platform,
                    instruction: `Rewrite the social media post for ${platform}. 
                    - Keep the core message.
                    - Optimize tone and hashtags for ${platform}.
                    - Return ONLY the rewritten text, no explanations.`
                }
            });

            // Clean up response if it contains quotes or markdown
            let optimized = result.content.trim();
            if (optimized.startsWith('"') && optimized.endsWith('"')) {
                optimized = optimized.slice(1, -1);
            }
            return optimized;

        } catch (error) {
            this.logger.error(`AI Optimization Failed: ${error.message}`);
            throw new Error('AI Optimization service unavailable');
        }
    }

    private async analyzeSentiment(text: string, tenantId: string): Promise<{ score: number, label: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' }> {
        try {
            // Use StrategyService (Neural Grid) for AI Analysis
            const result = await this.strategyService.executeStrategy({
                tenantId,
                type: 'analyst',
                context: 'social_sentiment',
                parameters: {
                    text,
                    instruction: "Analyze the sentiment of this social media comment. Return JSON with 'score' (-1 to 1) and 'label' (POSITIVE, NEGATIVE, NEUTRAL)."
                }
            });

            // Parse AI response (Assuming StrategyService returns unstructured text or JSON)
            const content = result.content;

            // Robust JSON parsing: handle markdown code blocks or plain text
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    score: typeof parsed.score === 'number' ? parsed.score : 0,
                    label: ['POSITIVE', 'NEGATIVE', 'NEUTRAL'].includes(parsed.label) ? parsed.label : 'NEUTRAL'
                };
            }

            // Fallback if AI output is not structured JSON
            return { score: 0, label: 'NEUTRAL' };

        } catch (error) {
            this.logger.error(`AI Sentiment Analysis Failed: ${error.message}`);
            // Fallback heuristic
            const lower = text.toLowerCase();
            if (lower.includes('great') || lower.includes('love')) return { score: 0.9, label: 'POSITIVE' };
            if (lower.includes('bad') || lower.includes('wrong')) return { score: -0.8, label: 'NEGATIVE' };
            return { score: 0, label: 'NEUTRAL' };
        }
    }
}
