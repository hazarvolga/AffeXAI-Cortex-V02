import { EmailDispatchPolicy } from "./email-dispatch-policy";
import { Module, OnModuleInit, forwardRef, Inject } from "@nestjs/common";
import { EmailMarketingService } from "./email-marketing.service";
import { EmailMarketingController } from "./email-marketing.controller";
import { BullModule } from "@nestjs/bullmq";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { bullConfig } from "../../config/bull.config";
import { EmailProcessor } from "./processors/email.processor";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EmailCampaign } from "./entities/email-campaign.entity";
import { EmailCampaignVariant } from "./entities/email-campaign-variant.entity";
import { EmailLog } from "./entities/email-log.entity";
import { Subscriber } from "./entities/subscriber.entity";
import { Segment } from "./entities/segment.entity";
import { Group } from "./entities/group.entity";
import { EmailTemplate } from "./entities/email-template.entity";
import { EmailBlockLibrary } from "./entities/email-block-library.entity";
import { EmailCampaignService } from "./email-campaign.service";
import { EmailCampaignController } from "./email-campaign.controller";
import { SubscriberService } from "./subscriber.service";
import { SubscriberController } from "./subscriber.controller";
import { SegmentService } from "./segment.service";
import { SegmentController } from "./segment.controller";
import { GroupService } from "./group.service";
import { GroupController } from "./group.controller";
import { TemplateService } from "./template.service";
import { TemplateController } from "./template.controller";
import { TemplatePreviewService } from "./services/template-preview.service";
import { MjmlRendererService } from "./services/mjml-renderer.service";
import { UnifiedTemplateService } from "./services/unified-template.service";
import { EmailValidationService } from "./services/email-validation.service";
import { AdvancedEmailValidationService } from "./services/advanced-email-validation.service";
import { IpReputationService } from "./services/ip-reputation.service";
import { IpReputationController } from "./ip-reputation.controller";
import { AbTestService } from "./services/ab-test.service";
import { AbTestStatisticsService } from "./services/ab-test-statistics.service";
import { AbTestController } from "./controllers/ab-test.controller";
import { TriggerEvaluatorService } from "./services/trigger-evaluator.service";
import { AutomationService } from "./services/automation.service";
import { AutomationQueueService } from "./services/automation-queue.service";
import { WorkflowExecutorService } from "./services/workflow-executor.service";
import { AutomationSchedulerService } from "./services/automation-scheduler.service";
import { AutomationProcessor } from "./processors/automation.processor";
import { AutomationController } from "./controllers/automation.controller";
import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";
import { TrackingController } from "./tracking.controller";
import { TrackingService } from "./tracking.service";
import { CampaignSchedulerService } from "./campaign-scheduler.service";
import { EmailAutomation } from "./entities/email-automation.entity";
import { AutomationTrigger } from "./entities/automation-trigger.entity";
import { AutomationExecution } from "./entities/automation-execution.entity";
import { AutomationSchedule } from "./entities/automation-schedule.entity";
import { ImportJob } from "./entities/import-job.entity";
import { ExportJob } from "./entities/export-job.entity";
import { ImportResult } from "./entities/import-result.entity";
import { CustomField } from "./entities/custom-field.entity";
import { ConsentRecord } from "./entities/consent-record.entity";
import { DataSubjectRequest } from "./entities/data-subject-request.entity";
import { EmailOpenHistory } from "./entities/email-open-history.entity";
import { FileProcessingService } from "./services/file-processing.service";
import { FileUploadService } from "./services/file-upload.service";
import { EnhancedFileSecurityService } from "./services/enhanced-file-security.service";
import { CustomFieldService } from "./services/custom-field.service";
import { GdprComplianceService } from "./services/gdpr-compliance.service";
import { BulkOperationsComplianceService } from "./services/bulk-operations-compliance.service";
import { FileUploadController } from "./controllers/file-upload.controller";
import { BulkExportController } from "./controllers/bulk-export.controller";
import { BulkImportController } from "./controllers/bulk-import.controller";
import { JobManagementController } from "./controllers/job-management.controller";
import { CustomFieldController } from "./controllers/custom-field.controller";
import { GdprComplianceController } from "./controllers/gdpr-compliance.controller";
import { BulkImportService } from "./services/bulk-import.service";
import { BulkExportService } from "./services/bulk-export.service";
import { ExportCleanupService } from "./services/export-cleanup.service";
import { ExportJobProcessor } from "./processors/export-job.processor";
import { ImportIntegrationService } from "./services/import-integration.service";
import { BatchProcessingService } from "./services/batch-processing.service";
import { ImportJobProcessor } from "./processors/import-job.processor";
import { ValidationJobProcessor } from "./processors/validation-job.processor";
import { ValidationJob } from "./entities/validation-job.entity";
import { SharedModule } from "../../core/shared/shared.module";
import { SettingsModule } from "../settings/settings.module";
import { ScheduleModule } from "@nestjs/schedule";
import { UsersModule } from "../users/users.module";
import { PlatformIntegrationModule } from "../platform-integration/platform-integration.module";
import { MailModule } from "../mail/mail.module";
import { MailService } from "../mail/mail.service";
import { MediaModule } from "../media/media.module";

import { StatsController } from "./controllers/stats.controller";
import { StatsService } from "./services/stats.service";
import { SendTimeOptimizationService } from "./services/send-time-optimization.service";
import { SendTimeOptimizationController } from "./controllers/send-time-optimization.controller";
import { PredictiveAnalyticsService } from "./services/predictive-analytics.service";
import { PredictiveAnalyticsController } from "./controllers/predictive-analytics.controller";
import { OptInOutService } from "./services/opt-in-out.service";
import { OptInOutController } from "./controllers/opt-in-out.controller";
import { BlockRendererService } from "./services/block-renderer.service";
import { VirtualSegmentService } from "./services/virtual-segment.service";
import { CrmCustomer } from "../crm/entities/crm-customer.entity";
import { StrategyModule } from "../strategy/strategy.module";
import { CommerceModule } from "../commerce/commerce.module";
import { OrganizationsModule } from "../organizations/organizations.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmailCampaign,
      EmailCampaignVariant,
      EmailLog,
      Subscriber,
      Segment,
      Group,
      EmailTemplate,
      EmailBlockLibrary,
      EmailAutomation,
      AutomationTrigger,
      AutomationExecution,
      AutomationSchedule,
      ImportJob,
      ExportJob,
      ImportResult,
      CustomField,
      ConsentRecord,
      DataSubjectRequest,
      EmailOpenHistory,
      ValidationJob,
      CrmCustomer,
    ]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: bullConfig,
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: "email",
    }),
    BullModule.registerQueue({
      name: "automation",
    }),
    BullModule.registerQueue({
      name: "import",
    }),
    BullModule.registerQueue({
      name: "validation",
    }),
    BullModule.registerQueue({
      name: "export",
    }),
    SettingsModule,
    SharedModule,
    ScheduleModule.forRoot(),
    forwardRef(() => PlatformIntegrationModule),
    MediaModule,
    forwardRef(() => UsersModule), // Required for JwtAuthGuard, use forwardRef due to circular dependency
    forwardRef(() => MailModule), // Forward reference to avoid circular dependency
    StrategyModule,
    CommerceModule,
    OrganizationsModule,
  ],
  controllers: [
    EmailMarketingController,
    EmailCampaignController,
    SubscriberController,
    SegmentController,
    GroupController,
    TemplateController,
    IpReputationController,
    AbTestController,
    AutomationController,
    AnalyticsController,
    TrackingController,
    FileUploadController,
    BulkImportController,
    BulkExportController,
    JobManagementController,
    CustomFieldController,
    GdprComplianceController,
    StatsController,
    SendTimeOptimizationController,
    PredictiveAnalyticsController,
    OptInOutController,
    // ValidationController is not registered: it only simulated progress and random
    // logs, and its table was never migrated. Single-address checks use
    // GET /email-marketing/subscribers/validate-email.
  ],
  providers: [
    EmailMarketingService,
    EmailDispatchPolicy,
    EmailProcessor,
    EmailCampaignService,
    SubscriberService,
    SegmentService,
    GroupService,
    TemplateService,
    TemplatePreviewService,
    MjmlRendererService,
    UnifiedTemplateService,
    EmailValidationService,
    AdvancedEmailValidationService,
    IpReputationService,
    AbTestService,
    AbTestStatisticsService,
    TriggerEvaluatorService,
    AutomationService,
    AutomationQueueService,
    WorkflowExecutorService,
    AutomationSchedulerService,
    AutomationProcessor,
    AnalyticsService,
    TrackingService,
    CampaignSchedulerService,
    FileProcessingService,
    FileUploadService,
    BulkImportService,
    BulkExportService,
    ExportCleanupService,
    ImportIntegrationService,
    BatchProcessingService,
    ImportJobProcessor,
    ValidationJobProcessor,
    ExportJobProcessor,
    EnhancedFileSecurityService,
    CustomFieldService,
    GdprComplianceService,
    BulkOperationsComplianceService,
    OptInOutService,
    StatsService,
    SendTimeOptimizationService,
    PredictiveAnalyticsService,
    BlockRendererService,
    VirtualSegmentService,
  ],
  exports: [
    BullModule,
    EmailCampaignService,
    SubscriberService,
    SegmentService,
    GroupService,
    TemplateService,
    TemplatePreviewService,
    UnifiedTemplateService,
    EmailValidationService,
    AdvancedEmailValidationService,
    IpReputationService,
    FileProcessingService,
    FileUploadService,
    BulkImportService,
    BulkExportService,
    ImportIntegrationService,
    BatchProcessingService,
    EnhancedFileSecurityService,
    CustomFieldService,
    GdprComplianceService,
    BulkOperationsComplianceService,
    BlockRendererService,
    VirtualSegmentService,
    PredictiveAnalyticsService,
  ],
})
export class EmailMarketingModule implements OnModuleInit {
  constructor(
    private readonly unifiedTemplateService: UnifiedTemplateService,
    @Inject(forwardRef(() => MailService))
    private readonly mailService: MailService,
  ) {}

  /**
   * Initialize module - inject UnifiedTemplateService into MailService
   * This enables database-first template rendering for all email types
   */
  onModuleInit() {
    this.mailService.setUnifiedTemplateService(this.unifiedTemplateService);
  }
}
