import { Module, Global, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { ResendWebhookController } from './controllers/resend-webhook.controller';
import { WebhookService } from './services/webhook.service';
import { TemplateRendererService } from './template-renderer.service';
import { EmailSuppression } from './entities/email-suppression.entity';
import { SettingsModule } from '../settings/settings.module';
import { Ticket } from '../tickets/entities/ticket.entity';
import { TicketMessage } from '../tickets/entities/ticket-message.entity';
import { UsersModule } from '../users/users.module';

import { EmailMarketingModule } from '../email-marketing/email-marketing.module';
import { EmailEventListener } from './listeners/email-event.listener';
/**
 * Mail Module
 * Provides email sending functionality across the application
 * Marked as @Global so it's available everywhere without imports
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([EmailSuppression, Ticket, TicketMessage]),
    SettingsModule,
    forwardRef(() => EmailMarketingModule), // Forward reference for UnifiedTemplateService
    forwardRef(() => UsersModule), // Required for JwtAuthGuard in controllers
  ],
  controllers: [
    MailController,
    ResendWebhookController,
  ],
  providers: [
    MailService,
    WebhookService,
    TemplateRendererService,
    EmailEventListener,
  ],
  exports: [
    MailService,
    WebhookService,
    TemplateRendererService,
  ],
})
export class MailModule { }
