import { JwtAuthGuard } from './core/auth/guards/jwt-auth.guard';
import { createQueueAdminMiddleware } from './core/auth/queue-admin-middleware';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './core/auth/auth.module';
import { ConfigModule } from './core/config/config.module';
import { TenantModule } from './core/tenant/tenant.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from './core/shared/shared.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { EventsModule } from './modules/events/events.module';
import { EmailMarketingModule } from './modules/email-marketing/email-marketing.module';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { MediaModule } from './modules/media/media.module';
import { StrategyModule } from './modules/strategy/strategy.module';

import { NotificationsModule } from './modules/notifications/notifications.module';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { SettingsModule } from './modules/settings/settings.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { CmsModule } from './modules/cms/cms.module';
import { MailModule } from './modules/mail/mail.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { RolesModule } from './modules/roles/roles.module';
import { AiModule } from './modules/ai/ai.module';
import { PlatformIntegrationModule } from './modules/platform-integration/platform-integration.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { FaqLearningModule } from './modules/faq-learning/faq-learning.module';
import { ChatModule } from './modules/chat/chat.module';
import { KnowledgeSourcesModule } from './modules/knowledge-sources/knowledge-sources.module';
import { CrmModule } from './modules/crm/crm.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggingModule } from './common/logging/logging.module';
import { SystemLogsModule } from './modules/system-logs/system-logs.module';
import { BackupModule } from './modules/backup/backup.module';
import { SocialMediaModule } from './modules/social-media/social-media.module';
import { CommerceModule } from './modules/commerce/commerce.module';
import { BrandModule } from './modules/brand/brand.module';
import { TrustDynamicsModule } from './modules/trust-dynamics/trust-dynamics.module';
import { FormsModule } from './modules/forms/forms.module';
import { BccModule } from './modules/bcc/bcc.module';
import { VectorStoreModule } from './core/vector-store/vector-store.module';
import { NeuralGridModule } from './modules/neural-grid/neural-grid.module';
import { NeuralCrawlerModule } from './modules/neural-crawler/neural-crawler.module';
import { InsightEngineModule } from './modules/insight-engine/insight-engine.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule,
    TenantModule,
    LoggingModule, // Add logging module globally
    EventEmitterModule.forRoot({
      // Use this instance across the entire Nest application
      wildcard: true,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),
    CacheModule.register({
      ttl: 60, // seconds
      max: 100, // maximum number of items in cache
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || process.env.DB_PORT || '5432', 10),
      username: process.env.DATABASE_USERNAME || process.env.DB_USERNAME || 'postgres',
      password: process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || process.env.DB_NAME || 'affexai_dev',
      autoLoadEntities: true,

      synchronize: false, // DISABLED: Use migrations for schema changes
      migrationsRun: false, // Set to true in production if auto-migration is desired
      invalidWhereValuesBehavior: { undefined: 'throw', null: 'sql-null' },
      // Prod'da sadece hata logla (query log gürültüsü + performans maliyeti).
      // Tam query log için DB_LOGGING=true tanımlayın.
      logging: process.env.DB_LOGGING === 'true'
        ? ['query', 'error', 'schema']
        : ['error'],
    }),
    BullBoardModule.forRootAsync({
      imports: [AuthModule],
      inject: [JwtAuthGuard],
      useFactory: (guard: JwtAuthGuard) => ({
        route: '/admin/queues',
        adapter: ExpressAdapter,
        middleware: createQueueAdminMiddleware(guard),
      }),
    }),
    ScheduleModule.forRoot(), // Enable scheduling for the entire application
    SharedModule,
    MailModule,
    OrganizationsModule,
    UsersModule,
    AuthModule,
    EventsModule,
    EmailMarketingModule,
    MediaModule,
    SocialMediaModule,
    CommerceModule,
    StrategyModule,

    NotificationsModule,
    SettingsModule,
    CertificatesModule,
    CmsModule,
    TicketsModule,
    RolesModule,
    AiModule,
    PlatformIntegrationModule,
    AnalyticsModule,
    FaqLearningModule,
    ChatModule,
    KnowledgeSourcesModule,
    CrmModule,
    SystemLogsModule, // Add system logs API
    BackupModule, // Backup system with cloud integration
    BrandModule,
    TrustDynamicsModule,
    FormsModule,
    VectorStoreModule,
    BccModule,
    NeuralGridModule, // Phase 1: Neural Backbone
    NeuralCrawlerModule,
    InsightEngineModule, // Phase 5: External Intelligence
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 60,
    }]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
