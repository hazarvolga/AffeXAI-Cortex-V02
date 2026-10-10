import { ChatSessionGuard, ChatSessionRooms } from './gateways/chat-session.guard';
import { SocketIdentityService, SocketAuthGuard, SocketTenantInterceptor } from '../../core/auth/socket/socket-identity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { jwtConfiguration } from '../../core/auth/jwt-configuration';

// External modules
import { UsersModule } from '../users/users.module';
import { AiModule } from '../ai/ai.module';
import { SettingsModule } from '../settings/settings.module';
import { FaqLearningModule } from '../faq-learning/faq-learning.module';
import { TenantModule } from '../../core/tenant/tenant.module';

// Entities
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatDocument } from './entities/chat-document.entity';
import { ChatContextSource } from './entities/chat-context-source.entity';
import { ChatSupportAssignment } from './entities/chat-support-assignment.entity';

import { ChatUrlCache } from './entities/chat-url-cache.entity';
import { AiUsageLog } from './entities/ai-usage-log.entity';

// Services
import { ChatSessionService } from './services/chat-session.service';
import { ChatMessageService } from './services/chat-message.service';
import { DocumentProcessorService } from './services/document-processor.service';
import { FileValidatorService } from './services/file-validator.service';
import { ChatContextEngineService } from './services/chat-context-engine.service';
import { UrlProcessorService } from './services/url-processor.service';
import { UrlCacheService } from './services/url-cache.service';
import { ChatAiService } from './services/chat-ai.service';
import { ChatAiSettingsService } from './services/chat-ai-settings.service';
import { ChatSupportAssignmentService } from './services/chat-support-assignment.service';
import { ChatHandoffService } from './services/chat-handoff.service';
import { SupportDashboardService } from './services/support-dashboard.service';
import { GeneralCommunicationContextService } from './services/general-communication-context.service';
import { GeneralCommunicationAiService } from './services/general-communication-ai.service';
import { ChatEscalationService } from './services/chat-escalation.service';

// Controllers
import { DocumentUploadController } from './controllers/document-upload.controller';
import { UrlProcessingController } from './controllers/url-processing.controller';
import { ChatAiController } from './controllers/chat-ai.controller';
import { SupportAssignmentController } from './controllers/support-assignment.controller';
import { ChatHandoffController } from './controllers/chat-handoff.controller';
import { SupportDashboardController } from './controllers/support-dashboard.controller';
import { GeneralCommunicationController } from './controllers/general-communication.controller';

// Gateways
import { ChatGateway } from './gateways/chat.gateway';

// External entities
import { User } from '../users/entities/user.entity';
import { KnowledgeBaseArticle } from '../tickets/entities/knowledge-base-article.entity';
import { LearnedFaqEntry } from '../faq-learning/entities/learned-faq-entry.entity';
import { LearningPattern } from '../faq-learning/entities/learning-pattern.entity';

// External services
import { FaqEnhancedSearchService } from '../faq-learning/services/faq-enhanced-search.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Chat entities
      ChatSession,
      ChatMessage,
      ChatDocument,
      ChatContextSource,
      ChatSupportAssignment,

      ChatUrlCache,
      AiUsageLog,
      // External entities
      User,
      KnowledgeBaseArticle,
      LearnedFaqEntry,
      LearningPattern,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => jwtConfiguration(config.get<string>('JWT_SECRET')),
    }),
    // External modules
    UsersModule,
    AiModule,
    SettingsModule,
    FaqLearningModule,
    TenantModule,
  ],
  controllers: [
    DocumentUploadController,
    UrlProcessingController,
    ChatAiController,
    SupportAssignmentController,
    ChatHandoffController,
    SupportDashboardController,
    GeneralCommunicationController,
  ],
  providers: [ChatSessionRooms, ChatSessionGuard, SocketIdentityService, SocketAuthGuard, SocketTenantInterceptor,
    ChatSessionService,
    ChatMessageService,
    DocumentProcessorService,
    FileValidatorService,
    ChatContextEngineService,
    UrlProcessorService,
    UrlCacheService,
    ChatAiService,
    ChatAiSettingsService,
    ChatSupportAssignmentService,
    ChatHandoffService,
    SupportDashboardService,
    GeneralCommunicationContextService,
    GeneralCommunicationAiService,
    ChatEscalationService,
    FaqEnhancedSearchService,
    ChatGateway,
  ],
  exports: [
    ChatSessionService,
    ChatMessageService,
    DocumentProcessorService,
    FileValidatorService,
    ChatContextEngineService,
    UrlProcessorService,
    UrlCacheService,
    ChatAiService,
    ChatAiSettingsService,
    ChatSupportAssignmentService,
    ChatHandoffService,
    SupportDashboardService,
    GeneralCommunicationContextService,
    GeneralCommunicationAiService,
    ChatEscalationService,
    ChatGateway,
  ],
})
export class ChatModule { }