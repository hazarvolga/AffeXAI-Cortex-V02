import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { SocialMediaService } from './social-media.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import type { User } from '../users/entities/user.entity';

@Controller('social-media/posts')
@UseGuards(JwtAuthGuard)
export class SocialPostController {
    constructor(private readonly socialMediaService: SocialMediaService) { }

    @Post()
    create(@CurrentUser() user: User, @Body() dto: CreatePostDto) {
        return this.socialMediaService.createPost(user, dto);
    }

    @Get()
    findAll(@CurrentUser() user: User) {
        return this.socialMediaService.findAllPosts(user.id, user.tenantId);
    }

    @Delete(':id')
    async remove(@CurrentUser() user: User, @Param('id') id: string) {
        return this.socialMediaService.deletePost(user.id, id, user.tenantId);
    }

    @Post(':id/retry')
    retry(@CurrentUser() user: User, @Param('id') id: string) {
        return this.socialMediaService.retryPost(user.id, id, user.tenantId);
    }


    @Post('optimize')
    async optimizePost(
        @Request() req,
        @Body() body: { content: string; platform: string }
    ) {
        return this.socialMediaService.optimizeContent(req.user.tenantId, body.content, body.platform);
    }

    @Post(':id/sync-comments')
    syncComments(@CurrentUser() user: User, @Param('id') id: string) {
        return this.socialMediaService.syncComments(id, user.tenantId);
    }
}

