import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocialPost } from '../entities/social-post.entity';
import { SocialPostStatus } from '../enums/post-status.enum';
import { SocialMediaService } from '../social-media.service';

@Processor('social_dispatch')
export class SocialDispatchProcessor extends WorkerHost {
    private readonly logger = new Logger(SocialDispatchProcessor.name);

    constructor(
        @InjectRepository(SocialPost)
        private readonly postRepository: Repository<SocialPost>,
        private readonly socialMediaService: SocialMediaService,
    ) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        const { postId } = job.data;
        this.logger.log(`Processing social dispatch job for post ${postId}`);

        const post = await this.postRepository.findOne({
            where: { id: postId },
            relations: ['account'],
        });

        if (!post) {
            this.logger.error(`Post ${postId} not found`);
            return;
        }

        if (post.status === SocialPostStatus.PUBLISHED) {
            this.logger.warn(`Post ${postId} already published, skipping.`);
            return;
        }

        try {
            // 1. Get Decrypted Tokens
            const tokens = await this.socialMediaService.getDecryptedTokens(post.accountId, post.tenantId);

            // 2. Get Provider Integration
            const provider = this.socialMediaService.getProvider(post.account.provider);

            // 3. Dispatch Content
            this.logger.log(`Dispatching to ${post.account.provider}...`);
            const result = await provider.postStatus(tokens.access_token, {
                content: post.content,
                mediaUrls: post.mediaUrls,
                providerAccountId: post.account.providerAccountId
            });


            // 4. Update Post Status
            post.status = SocialPostStatus.PUBLISHED;
            post.publishedAt = new Date();
            post.platformPostId = result.id;
            await this.postRepository.save(post);

            this.logger.log(`Post ${postId} published successfully!`);
            return result;
        } catch (error) {
            this.logger.error(`Failed to dispatch post ${postId}: ${error.message}`, error.stack);

            // Update status to FAILED
            post.status = SocialPostStatus.FAILED;
            // Optionally store error message in a metadata field if available
            await this.postRepository.save(post);

            throw error; // Let BullMQ handle retries if configured
        }
    }
}
