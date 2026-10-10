import { PublicKnowledgeBaseCategoryController } from './controllers/public-knowledge-base-category.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { TicketAttachmentEntity } from './entities/ticket-attachment.entity';
import { CortexOutboxModule } from '../../core/cortex/cortex-outbox.module';
import { SocketIdentityService, SocketAuthGuard, SocketTenantInterceptor } from '../../core/auth/socket/socket-identity';
import { jwtConfiguration } from '../../core/auth/jwt-configuration';
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './entities/ticket.entity';
import { TicketMessage } from './entities/ticket-message.entity';
import { TicketCategory } from './entities/ticket-category.entity';
// Import chat entities from chat module to avoid duplicates
import { ChatSession } from '../chat/entities/chat-session.entity';
import { ChatMessage } from '../chat/entities/chat-message.entity';
import { TicketAssignmentRule } from './entities/ticket-assignment-rule.entity';
import { TicketEscalationRule } from './entities/ticket-escalation-rule.entity';
import { TicketAuditLog } from './entities/ticket-audit-log.entity';
import { TicketTemplate } from './entities/ticket-template.entity';
import { TicketCSAT } from './entities/ticket-csat.entity';
import { KnowledgeBaseArticle } from './entities/knowledge-base-article.entity';
import { KnowledgeBaseCategory } from './entities/knowledge-base-category.entity';
import { TicketMacro } from './entities/ticket-macro.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { TicketAssignmentRulesController } from './controllers/ticket-assignment-rules.controller';
import { TicketEscalationRulesController } from './controllers/ticket-escalation-rules.controller';
import { TicketAttachmentsController } from './controllers/ticket-attachments.controller';
import { TicketTemplatesController } from './controllers/ticket-templates.controller';
import { TicketAnalyticsController } from './controllers/ticket-analytics.controller';
import { TicketEmailWebhookController } from './controllers/ticket-email-webhook.controller';
import { TicketCSATController } from './controllers/ticket-csat.controller';
import { KnowledgeBaseController } from './controllers/knowledge-base.controller';
import { KnowledgeBaseCategoryController } from './controllers/knowledge-base-category.controller';
import { TicketCategoryController } from './controllers/ticket-category.controller';
import { TicketMacroController } from './controllers/ticket-macro.controller';
import { AICategorizationController } from './controllers/ai-categorization.controller';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { AuthModule } from '../../core/auth/auth.module';
import { MediaModule } from '../media/media.module';
import { TicketAutomationService } from './services/ticket-automation.service';
import { TicketAssignmentRulesService } from './services/ticket-assignment-rules.service';
import { TicketEscalationRulesService } from './services/ticket-escalation-rules.service';
import { TicketAttachmentService } from './services/ticket-attachment.service';
import { SlaService } from './services/sla.service';
import { TicketEmailService } from './services/ticket-email.service';
import { TicketTemplatesService } from './services/ticket-templates.service';
import { TicketAnalyticsService } from './services/ticket-analytics.service';
import { TicketEmailParserService } from './services/ticket-email-parser.service';
import { TicketCSATService } from './services/ticket-csat.service';
import { TicketAutoTaggingService } from './services/ticket-auto-tagging.service';
import { BusinessHoursService } from './services/business-hours.service';
import { KnowledgeBaseService } from './services/knowledge-base.service';
import { KnowledgeBaseCategoryService } from './services/knowledge-base-category.service';
import { TicketCategoryService } from './services/ticket-category.service';
import { TicketMacroService } from './services/ticket-macro.service';
import { AICategorizationService } from './services/ai-categorization.service';
import { TicketNotificationsGateway } from './gateways/ticket-notifications.gateway';
import { ScheduleModule } from '@nestjs/schedule';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SettingsModule } from '../settings/settings.module';
import { AiModule } from '../ai/ai.module';
import { FaqLearningModule } from '../faq-learning/faq-learning.module';
import { EmailWebhookAdapterFactory } from './services/email-webhook-adapter-factory.service';
import { ResendWebhookAdapter } from './adapters/resend-webhook.adapter';
import { SendGridWebhookAdapter } from './adapters/sendgrid-webhook.adapter';
import { MailgunWebhookAdapter } from './adapters/mailgun-webhook.adapter';
import { PostmarkWebhookAdapter } from './adapters/postmark-webhook.adapter';
import { SESWebhookAdapter } from './adapters/ses-webhook.adapter';
import { TenantModule } from '../../core/tenant/tenant.module';
import { StrategyModule } from '../strategy/strategy.module';


/**
 * Tickets Module
 * Handles support ticket management, messages, and categories
 */
@Module({
  imports: [
    CortexOutboxModule,
    NotificationsModule,
    TypeOrmModule.forFeature([
      TicketAttachmentEntity,
      Ticket,
      TicketMessage,
      TicketCategory,
      ChatSession,
      ChatMessage,
      TicketAssignmentRule,
      TicketEscalationRule,
      TicketAuditLog,
      TicketTemplate,
      TicketCSAT,
      KnowledgeBaseArticle,
      KnowledgeBaseCategory,
      TicketMacro,
      Organization,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => jwtConfiguration(configService.get<string>('JWT_SECRET')),
      inject: [ConfigService],
    }),
    forwardRef(() => UsersModule), // For user authentication and support team lookup
    MailModule, // For email notifications
    forwardRef(() => AuthModule), // For authentication guards - use forwardRef to avoid circular dependency
    MediaModule, // For media management
    SettingsModule, // For AI settings
    AiModule, // For AI services
    FaqLearningModule, // For FAQ and Knowledge Base search
    ScheduleModule.forRoot(), // Enable scheduling for automation
    ScheduleModule.forRoot(), // Enable scheduling for automation
    TenantModule, // For automated multi-tenancy
    StrategyModule,
  ],

  controllers: [
    TicketsController,
    TicketAssignmentRulesController,
    TicketEscalationRulesController,
    TicketAttachmentsController,
    TicketTemplatesController,
    TicketAnalyticsController,
    TicketEmailWebhookController,
    TicketCSATController,
    KnowledgeBaseController,
    KnowledgeBaseCategoryController,
    PublicKnowledgeBaseCategoryController,
    TicketCategoryController,
    TicketMacroController,
    AICategorizationController,
  ],
  providers: [SocketIdentityService, SocketAuthGuard, SocketTenantInterceptor,
    TicketsService,
    TicketAutomationService,
    TicketAssignmentRulesService,
    TicketEscalationRulesService,
    TicketAttachmentService,
    SlaService,
    TicketEmailService,
    TicketEmailParserService,
    TicketCSATService,
    TicketAutoTaggingService,
    BusinessHoursService,
    KnowledgeBaseService,
    KnowledgeBaseCategoryService,
    TicketCategoryService,
    TicketMacroService,
    AICategorizationService,
    TicketTemplatesService,
    TicketAnalyticsService,
    TicketNotificationsGateway,
    // Email webhook adapters
    EmailWebhookAdapterFactory,
    ResendWebhookAdapter,
    SendGridWebhookAdapter,
    MailgunWebhookAdapter,
    PostmarkWebhookAdapter,
    SESWebhookAdapter,
  ],
  exports: [
    TicketsService,
    TicketAutomationService,
    TicketAssignmentRulesService,
    TicketEscalationRulesService,
    TicketAttachmentService,
    SlaService,
    TicketEmailService,
    TicketTemplatesService,
    TicketNotificationsGateway,
  ],
})
export class TicketsModule { }