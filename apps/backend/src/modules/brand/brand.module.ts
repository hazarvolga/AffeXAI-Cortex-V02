import { Module, forwardRef } from '@nestjs/common';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';
import { SocialMediaModule } from '../social-media/social-media.module';
import { EmailMarketingModule } from '../email-marketing/email-marketing.module';
import { TicketsModule } from '../tickets/tickets.module';
import { AuthModule } from '../../core/auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        SocialMediaModule,
        EmailMarketingModule,
        TicketsModule,
        forwardRef(() => AuthModule),
        forwardRef(() => UsersModule),
    ],
    controllers: [BrandController],
    providers: [BrandService],
    exports: [BrandService],
})
export class BrandModule { }
