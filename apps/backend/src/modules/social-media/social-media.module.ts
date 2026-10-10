import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { SocialMediaService } from './social-media.service';
import { SocialMediaController } from './social-media.controller';
import { SocialPostController } from './social-post.controller';
import { SocialAccount } from './entities/social-account.entity';
import { SocialPost } from './entities/social-post.entity';
import { PostAnalytics } from './entities/post-analytics.entity';
import { SocialPostFeedback } from './entities/social-post-feedback.entity';


import { TwitterProvider } from './providers/twitter.provider';
import { LinkedInProvider } from './providers/linkedin.provider';
import { FacebookProvider } from './providers/facebook.provider';
import { InstagramProvider } from './providers/instagram.provider';
import { SocialDispatchProcessor } from './processors/social-dispatch.processor';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../../core/auth/auth.module';
import { SharedModule } from '../../core/shared/shared.module';
import { MediaModule } from '../media/media.module';
import { StrategyModule } from '../strategy/strategy.module';
import { CommerceModule } from '../commerce/commerce.module';
import { BccModule } from '../bcc/bcc.module';


@Module({
    imports: [
        TypeOrmModule.forFeature([SocialAccount, SocialPost, PostAnalytics, SocialPostFeedback]),

        BullModule.registerQueue({
            name: 'social_dispatch',
        }),
        UsersModule,
        AuthModule,
        SharedModule,
        MediaModule,
        HttpModule,
        StrategyModule,
        CommerceModule,
        BccModule,
    ],
    controllers: [SocialMediaController, SocialPostController],
    providers: [
        SocialMediaService,
        TwitterProvider,
        LinkedInProvider,
        FacebookProvider,
        InstagramProvider,
        SocialDispatchProcessor,
    ],
    exports: [SocialMediaService],
})
export class SocialMediaModule { }
