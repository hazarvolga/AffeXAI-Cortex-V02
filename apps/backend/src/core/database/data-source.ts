import { TicketAttachmentEntity } from '../../modules/tickets/entities/ticket-attachment.entity';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { activeMigrations } from './migration-catalog';
import { User } from '../../modules/users/entities/user.entity';
import { UserRole } from '../../modules/users/entities/user-role.entity';
import { Role } from '../../modules/roles/entities/role.entity';
import { RoleTemplate } from '../../modules/roles/entities/role-template.entity';
import { Organization } from '../../modules/organizations/entities/organization.entity';
import { OrganizationAuditLog } from '../../modules/organizations/entities/organization-audit-log.entity';
import { Notification } from '../../modules/notifications/entities/notification.entity';
import { Subscriber } from '../../modules/email-marketing/entities/subscriber.entity';
import { EmailCampaign } from '../../modules/email-marketing/entities/email-campaign.entity';
import { EmailCampaignVariant } from '../../modules/email-marketing/entities/email-campaign-variant.entity';
import { EmailLog } from '../../modules/email-marketing/entities/email-log.entity';
import { Group } from '../../modules/email-marketing/entities/group.entity';
import { Segment } from '../../modules/email-marketing/entities/segment.entity';
import { EmailAutomation } from '../../modules/email-marketing/entities/email-automation.entity';
import { AutomationTrigger } from '../../modules/email-marketing/entities/automation-trigger.entity';
import { AutomationExecution } from '../../modules/email-marketing/entities/automation-execution.entity';
import { AutomationSchedule } from '../../modules/email-marketing/entities/automation-schedule.entity';
import { ImportJob } from '../../modules/email-marketing/entities/import-job.entity';
import { ExportJob } from '../../modules/email-marketing/entities/export-job.entity';
import { ImportResult } from '../../modules/email-marketing/entities/import-result.entity';
import { Page } from '../../modules/cms/entities/page.entity';
import { Component } from '../../modules/cms/entities/component.entity';
import { Category } from '../../modules/cms/entities/category.entity';
import { Menu } from '../../modules/cms/entities/menu.entity';
import { MenuItem } from '../../modules/cms/entities/menu-item.entity';
import { CmsMetric } from '../../modules/cms/entities/cms-metric.entity';
import { Ticket } from '../../modules/tickets/entities/ticket.entity';
import { TicketMessage } from '../../modules/tickets/entities/ticket-message.entity';
import { TicketCategory } from '../../modules/tickets/entities/ticket-category.entity';
import { TicketAuditLog } from '../../modules/tickets/entities/ticket-audit-log.entity';
import { TicketAssignmentRule } from '../../modules/tickets/entities/ticket-assignment-rule.entity';
import { TicketEscalationRule } from '../../modules/tickets/entities/ticket-escalation-rule.entity';
import { ChatSession } from '../../modules/chat/entities/chat-session.entity';
import { ChatMessage } from '../../modules/chat/entities/chat-message.entity';
import { ChatDocument } from '../../modules/chat/entities/chat-document.entity';
import { ChatContextSource } from '../../modules/chat/entities/chat-context-source.entity';
import { ChatSupportAssignment } from '../../modules/chat/entities/chat-support-assignment.entity';
import { ChatUrlCache } from '../../modules/chat/entities/chat-url-cache.entity';
import { CompanyKnowledgeSource } from '../../modules/knowledge-sources/entities/company-knowledge-source.entity';
import { BccSignal } from '../../modules/bcc/entities/bcc-signal.entity';
import { Form } from '../../modules/forms/entities/form.entity';
import { FormSubmission } from '../../modules/forms/entities/form-submission.entity';
import { CrmCustomer } from '../../modules/crm/entities/crm-customer.entity';
import { CrmLead } from '../../modules/crm/entities/crm-lead.entity';
// Email Marketing - Missing entities
import { EmailTemplate } from '../../modules/email-marketing/entities/email-template.entity';
import { EmailBlockLibrary } from '../../modules/email-marketing/entities/email-block-library.entity';
import { EmailOpenHistory } from '../../modules/email-marketing/entities/email-open-history.entity';
import { CustomField } from '../../modules/email-marketing/entities/custom-field.entity';
import { ConsentRecord } from '../../modules/email-marketing/entities/consent-record.entity';
import { DataSubjectRequest } from '../../modules/email-marketing/entities/data-subject-request.entity';
// Analytics - Missing entities
import { ABTest } from '../../modules/analytics/entities/ab-test.entity';
import { ABTestVariant } from '../../modules/analytics/entities/ab-test-variant.entity';
import { AnalyticsEvent } from '../../modules/analytics/entities/analytics-event.entity';
import { AnalyticsHeatmap } from '../../modules/analytics/entities/analytics-heatmap.entity';
import { AnalyticsSession } from '../../modules/analytics/entities/analytics-session.entity';
import { ComponentPerformance } from '../../modules/analytics/entities/component-performance.entity';
// Tickets - Missing entities
import { TicketCSAT } from '../../modules/tickets/entities/ticket-csat.entity';
import { TicketMacro } from '../../modules/tickets/entities/ticket-macro.entity';
import { TicketTemplate } from '../../modules/tickets/entities/ticket-template.entity';
import { KnowledgeBaseArticle } from '../../modules/tickets/entities/knowledge-base-article.entity';
import { KnowledgeBaseCategory } from '../../modules/tickets/entities/knowledge-base-category.entity';
// CMS - Missing entities
import { PageTemplate } from '../../modules/cms/entities/page-template.entity';
import { ReusableComponent } from '../../modules/cms/entities/reusable-component.entity';
import { ReusableSection } from '../../modules/cms/entities/reusable-section.entity';
import { SectionComponent } from '../../modules/cms/entities/section-component.entity';
import { ComponentFavorite } from '../../modules/cms/entities/component-favorite.entity';
import { ComponentUsageHistory } from '../../modules/cms/entities/component-usage-history.entity';
// Platform Integration - Missing entities
import { Webhook } from '../../modules/platform-integration/entities/webhook.entity';
import { AutomationRule } from '../../modules/platform-integration/entities/automation-rule.entity';
import { AutomationApproval } from '../../modules/platform-integration/entities/automation-approval.entity';
import { PlatformEvent } from '../../modules/platform-integration/entities/platform-event.entity';
// Events - Missing entities
import { Event } from '../../modules/events/entities/event.entity';
import { EventRegistration } from '../../modules/events/entities/event-registration.entity';
// FAQ Learning - Missing entities
import { FaqLearningConfig } from '../../modules/faq-learning/entities/faq-learning-config.entity';
import { LearnedFaqEntry } from '../../modules/faq-learning/entities/learned-faq-entry.entity';
import { LearningPattern } from '../../modules/faq-learning/entities/learning-pattern.entity';
// Certificates - Missing entities
import { Certificate } from '../../modules/certificates/entities/certificate.entity';
import { CertificateTemplate } from '../../modules/certificates/entities/certificate-template.entity';
// Media - Missing entities
import { Media } from '../../modules/media/entities/media.entity';
// Settings - Missing entities
import { Setting } from '../../modules/settings/entities/setting.entity';
import { SettingAuditLog } from '../../modules/settings/entities/setting-audit-log.entity';
import { SettingRevision } from '../../modules/settings/entities/setting-revision.entity';
// Mail - Missing entities
import { EmailSuppression } from '../../modules/mail/entities/email-suppression.entity';
// Backup - Missing entities
import { Backup } from '../../modules/backup/entities/backup.entity';
import { BackupConfig } from '../../modules/backup/entities/backup-config.entity';

// Production-ready data source configuration
// Automatically uses DATABASE_URL environment variable if available
// Falls back to individual environment variables or development defaults
const AppDataSource = new DataSource({
  type: 'postgres',
  // Use DATABASE_URL if available (production), otherwise use individual variables
  url: process.env.DATABASE_URL,
  host: process.env.DATABASE_URL ? undefined : (process.env.DATABASE_HOST || 'localhost'),
  port: process.env.DATABASE_URL ? undefined : parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_URL ? undefined : (process.env.DATABASE_USERNAME || 'postgres'),
  password: process.env.DATABASE_URL ? undefined : (process.env.DATABASE_PASSWORD || 'postgres'),
  database: process.env.DATABASE_URL ? undefined : (process.env.DATABASE_NAME || 'affexai_dev'),
  // CRITICAL: Never use synchronize in production
  // Migrations should handle schema changes
  synchronize: false,
  invalidWhereValuesBehavior: { undefined: 'throw', null: 'sql-null' },
  logging: process.env.NODE_ENV === 'development',
  entities: [
    TicketAttachmentEntity,
    // Users & Roles
    User,
    UserRole,
    Role,
    RoleTemplate,
    Organization,
    OrganizationAuditLog,
    // Notifications
    Notification,
    // Email Marketing (complete)
    Subscriber,
    EmailCampaign,
    EmailCampaignVariant,
    EmailLog,
    EmailTemplate,
    EmailBlockLibrary,
    EmailOpenHistory,
    Group,
    Segment,
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
    // CMS (complete)
    Page,
    PageTemplate,
    Component,
    Category,
    Menu,
    MenuItem,
    CmsMetric,
    ReusableComponent,
    ReusableSection,
    SectionComponent,
    ComponentFavorite,
    ComponentUsageHistory,
    // Tickets (complete)
    Ticket,
    TicketMessage,
    TicketCategory,
    TicketAuditLog,
    TicketAssignmentRule,
    TicketEscalationRule,
    TicketCSAT,
    TicketMacro,
    TicketTemplate,
    KnowledgeBaseArticle,
    KnowledgeBaseCategory,
    // Chat (complete)
    ChatSession,
    ChatMessage,
    ChatDocument,
    ChatContextSource,
    ChatSupportAssignment,
    ChatUrlCache,
    // Knowledge Sources
    CompanyKnowledgeSource,
    BccSignal,
    Form,
    FormSubmission,
    CrmCustomer,
    CrmLead,
    // Analytics (complete)
    ABTest,
    ABTestVariant,
    AnalyticsEvent,
    AnalyticsHeatmap,
    AnalyticsSession,
    ComponentPerformance,
    // Platform Integration (complete)
    Webhook,
    AutomationRule,
    AutomationApproval,
    PlatformEvent,
    // Events (complete)
    Event,
    EventRegistration,
    // FAQ Learning (complete)
    FaqLearningConfig,
    LearnedFaqEntry,
    LearningPattern,
    // Certificates (complete)
    Certificate,
    CertificateTemplate,
    // Media
    Media,
    // Settings
    Setting,
    SettingAuditLog,
    SettingRevision,
    // Mail
    EmailSuppression,
    // Backup
    Backup,
    BackupConfig,
  ],
  migrations: activeMigrations,
  subscribers: [],
});

export default AppDataSource;
