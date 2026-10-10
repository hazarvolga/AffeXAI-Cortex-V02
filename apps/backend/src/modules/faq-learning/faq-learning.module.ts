import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// Entities
import { LearnedFaqEntry } from './entities/learned-faq-entry.entity';
import { LearningPattern } from './entities/learning-pattern.entity';
import { FaqLearningConfig } from './entities/faq-learning-config.entity';
import { PipelineState } from './entities/pipeline-state.entity';
import { ChatSession } from '../chat/entities/chat-session.entity';
import { ChatMessage } from '../chat/entities/chat-message.entity';
import { KnowledgeBaseArticle } from '../tickets/entities/knowledge-base-article.entity';
import { TicketCategory } from '../tickets/entities/ticket-category.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { TicketMessage } from '../tickets/entities/ticket-message.entity';

// Services - Data Extraction
import { ChatDataExtractorService } from './services/chat-data-extractor.service';
import { TicketDataExtractorService } from './services/ticket-data-extractor.service';
import { DataNormalizerService } from './services/data-normalizer.service';
import { BatchProcessorService } from './services/batch-processor.service';

// Services - Pattern Recognition & AI
import { PatternRecognitionService } from './services/pattern-recognition.service';
import { FaqAiService } from './services/faq-ai.service';
import { ConfidenceCalculatorService } from './services/confidence-calculator.service';

// Services - FAQ Management
import { FaqLearningService } from './services/faq-learning.service';
import { FaqGeneratorService } from './services/faq-generator.service';
import { ReviewQueueService } from './services/review-queue.service';
import { FeedbackProcessorService } from './services/feedback-processor.service';

// Services - Integration
import { KnowledgeBaseIntegratorService } from './services/knowledge-base-integrator.service';
import { FaqEnhancedSearchService } from './services/faq-enhanced-search.service';
import { ChatFaqIntegrationService } from './services/chat-faq-integration.service';

// Services - Background Processing
import { ScheduledLearningJobsService } from './services/scheduled-learning-jobs.service';
import { RealTimeProcessorService } from './services/real-time-processor.service';

// Services - Analytics & Monitoring
import { LearningAnalyticsService } from './services/learning-analytics.service';
import { MonitoringAlertingService } from './services/monitoring-alerting.service';

// Services - Security
import { DataPrivacyService } from './services/data-privacy.service';
import { AuditLoggingService } from './services/audit-logging.service';

// Services - Pipeline State
import { PipelineStateService } from './services/pipeline-state.service';

// Controllers
import { FaqLearningController } from './controllers/faq-learning.controller';
import { ReviewManagementController } from './controllers/review-management.controller';

import { LearnedFaqController } from './controllers/learned-faq.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { MonitoringController } from './controllers/monitoring.controller';

// External modules
import { TicketsModule } from '../tickets/tickets.module';
import { MailModule } from '../mail/mail.module';
import { UsersModule } from '../users/users.module';
import { AiModule } from '../ai/ai.module';
import { SettingsModule } from '../settings/settings.module';
import { forwardRef } from '@nestjs/common';
import { StrategyModule } from '../strategy/strategy.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      LearnedFaqEntry,
      LearningPattern,
      FaqLearningConfig,
      PipelineState,
      ChatSession,
      ChatMessage,
      KnowledgeBaseArticle,
      TicketCategory,
      Ticket,
      TicketMessage,
    ]),
    ScheduleModule.forRoot(),
    forwardRef(() => TicketsModule),
    MailModule,
    forwardRef(() => UsersModule),
    forwardRef(() => AiModule),
    SettingsModule,
    StrategyModule,

  ],
  providers: [
    // Data Extraction Services
    ChatDataExtractorService,
    TicketDataExtractorService,
    DataNormalizerService,
    BatchProcessorService,

    // Pattern Recognition & AI Services
    PatternRecognitionService,
    FaqAiService,
    ConfidenceCalculatorService,

    // FAQ Management Services
    FaqLearningService,
    FaqGeneratorService,
    ReviewQueueService,
    FeedbackProcessorService,

    // Integration Services
    KnowledgeBaseIntegratorService,
    FaqEnhancedSearchService,
    ChatFaqIntegrationService,

    // Background Processing Services
    ScheduledLearningJobsService,
    RealTimeProcessorService,

    // Analytics & Monitoring Services
    LearningAnalyticsService,
    MonitoringAlertingService,

    // Security Services
    DataPrivacyService,
    AuditLoggingService,

    // Pipeline State Service
    PipelineStateService,
  ],
  controllers: [
    FaqLearningController,
    ReviewManagementController,

    LearnedFaqController,
    AnalyticsController,
    MonitoringController,
  ],
  exports: [
    // Export services that might be used by other modules
    FaqLearningService,
    FaqEnhancedSearchService,
    ChatFaqIntegrationService,
    RealTimeProcessorService,
    LearningAnalyticsService,
    DataPrivacyService,
    AuditLoggingService,
  ],
})
export class FaqLearningModule { }
