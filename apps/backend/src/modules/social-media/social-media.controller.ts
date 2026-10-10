import { Controller, Get, Post, Delete, Body, UseGuards, Query, Req, Param, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SocialMediaService } from './social-media.service';
import { ConnectAccountDto } from './dto/connect-account.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import type { User } from '../users/entities/user.entity';
import { SocialProvider } from './enums/social-provider.enum';
import { Throttle } from '@nestjs/throttler';

@Controller('social-media')
@UseGuards(JwtAuthGuard)
export class SocialMediaController {
    constructor(private readonly socialMediaService: SocialMediaService) { }

    @Get('auth-url')
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    getAuthUrl(
        @Query('provider') provider: SocialProvider,
        @Query('redirectUri') redirectUri?: string,
    ) {
        try {
            const url = this.socialMediaService.getAuthUrl(provider, redirectUri);
            return { url };
        } catch (error) {
            console.error(`[SocialMediaController] Error generating URL:`, error);
            throw error;
        }
    }

    @Post('connect')
    @Throttle({ default: { limit: 3, ttl: 60000 } })
    async connectAccount(
        @CurrentUser() user: User,
        @Body() dto: ConnectAccountDto,
    ) {
        return this.socialMediaService.connectAccount(user, dto);
    }

    @Delete('accounts/:id')
    async deleteAccount(
        @CurrentUser() user: User,
        @Param('id') accountId: string,
    ) {
        return this.socialMediaService.deleteAccount(user.id, accountId, user.tenantId);
    }

    @Get('accounts')
    findAllAccounts(@CurrentUser() user: User) {
        return this.socialMediaService.findAllAccounts(user.id, user.tenantId);
    }

    @Get('analytics')
    getAnalytics(@CurrentUser() user: User) {
        return this.socialMediaService.getAnalytics(user.id, user.tenantId);
    }

    @Get('brand-health')
    getBrandHealth(@CurrentUser() user: User) {
        return this.socialMediaService.getPlatformAnalytics(user.id, user.tenantId);
    }

    @Get('analytics/trend')
    async getEngagementTrend(@CurrentUser() user: User) {
        const trend = await this.socialMediaService.getEngagementTrend(user.id, user.tenantId);
        return {
            success: true,
            data: trend
        };
    }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadMedia(
        @CurrentUser() user: any,
        @UploadedFile() file: Express.Multer.File
    ) {
        return this.socialMediaService.uploadMedia(file, user.tenantId);
    }

    @Get('posts')
    findAllPosts(@CurrentUser() user: User) {
        return this.socialMediaService.findAllPosts(user.id, user.tenantId);
    }

    @Post('post')
    async createPost(
        @CurrentUser() user: User,
        @Body() dto: CreatePostDto,
    ) {
        return this.socialMediaService.createPost(user, dto);
    }

    @Post('optimize')
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    async optimizePost(@Body() body: { content: string; platform: string; tone?: string }) {
        const prefixes = {
            twitter: '🐦',
            linkedin: '💼',
            instagram: '📸',
            facebook: '📘'
        };

        const hashtags = {
            twitter: '#trending #update',
            linkedin: '#professional #growth',
            instagram: '#instadaily #life',
            facebook: '#community'
        };

        const platform = body.platform?.toLowerCase() || 'twitter';
        const prefix = prefixes[platform] || '✨';
        const tag = hashtags[platform] || '';

        return {
            content: `${prefix} ${body.content} ${tag} (AI Optimized)`
        };
    }
}
