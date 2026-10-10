/**
 * Email Marketing Module Types
 * Shared types for email campaigns, subscribers, groups, segments, and templates
 */

// ============================================================================
// Enums
// ============================================================================

export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  SENDING = 'sending',
  SENT = 'sent',
  FAILED = 'failed',
  PAUSED = 'paused',
}

export enum SubscriberStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  UNSUBSCRIBED = 'unsubscribed',
  BOUNCED = 'bounced',
  COMPLAINED = 'complained', // Added for spam complaint tracking
}

export enum TemplateType {
  FILE_BASED = 'file_based',
  CUSTOM = 'custom',
}

// ============================================================================
// Campaign Types
// ============================================================================

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  status: CampaignStatus | string;
  scheduledAt: Date | null;
  sentAt: Date | null;
  slug: string;
  totalRecipients: number;
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  metadata: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCampaignDto {
  name: string;
  subject: string;
  content: string;
  slug?: string;
  scheduledAt?: Date;
  status?: string;
}

export interface UpdateCampaignDto {
  name?: string;
  subject?: string;
  content?: string;
  slug?: string;
  scheduledAt?: Date;
  status?: string;
  totalRecipients?: number;
  sentCount?: number;
  openedCount?: number;
  clickedCount?: number;
  metadata?: Record<string, any>;
}

// ============================================================================
// Subscriber Types
// ============================================================================

export interface Subscriber {
  id: string;
  email: string;
  status: SubscriberStatus | string;
  groups: string[];
  segments: string[];
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  phone: string | null;
  customerStatus: string | null;
  subscriptionType: string | null;
  mailerCheckResult: string | null;
  location: string | null;
  sent: number;
  opens: number;
  clicks: number;
  subscribedAt: Date;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
  customFields?: Record<string, any>;
}

export interface CreateSubscriberDto {
  email: string;
  status?: string;
  groups?: string[];
  segments?: string[];
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  customerStatus?: string;
  subscriptionType?: string;
  mailerCheckResult?: string;
  location?: string;
  sent?: number;
  opens?: number;
  clicks?: number;
  customFields?: Record<string, any>;
}

export interface UpdateSubscriberDto {
  email?: string;
  status?: string;
  groups?: string[];
  segments?: string[];
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  customerStatus?: string;
  subscriptionType?: string;
  mailerCheckResult?: string;
  location?: string;
  sent?: number;
  opens?: number;
  clicks?: number;
  customFields?: Record<string, any>;
}

// ============================================================================
// Group Types
// ============================================================================

export interface Group {
  id: string;
  name: string;
  description: string | null;
  subscriberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGroupDto {
  name: string;
  description?: string;
}

export interface UpdateGroupDto {
  name?: string;
  description?: string;
  subscriberCount?: number;
}

// ============================================================================
// Segment Types
// ============================================================================

export interface Segment {
  id: string;
  name: string;
  description: string | null;
  subscriberCount: number;
  criteria: string | null;
  openRate: number;
  clickRate: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSegmentDto {
  name: string;
  description?: string;
  criteria?: string;
  openRate?: number;
  clickRate?: number;
}

export interface UpdateSegmentDto {
  name?: string;
  description?: string;
  criteria?: string;
  openRate?: number;
  clickRate?: number;
  subscriberCount?: number;
}

// ============================================================================
// Template Types
// ============================================================================

export interface EmailTemplate {
  id: string;
  name: string;
  description: string | null;
  content: string;
  thumbnailUrl: string | null;
  isDefault: boolean;
  type: TemplateType | string;
  fileTemplateName: string | null;
  variables: Record<string, any> | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTemplateDto {
  name: string;
  description?: string;
  content?: string; // Optional: Email Builder templates use structure instead
  thumbnailUrl?: string;
  isDefault?: boolean;
  type?: TemplateType | string;
  fileTemplateName?: string;
  variables?: Record<string, any>;
  isActive?: boolean;
  structure?: any; // Email Builder structure (JSONB)
}

export interface UpdateTemplateDto {
  name?: string;
  description?: string;
  content?: string;
  thumbnailUrl?: string;
  isDefault?: boolean;
  type?: TemplateType | string;
  fileTemplateName?: string;
  variables?: Record<string, any>;
  isActive?: boolean;
  structure?: any; // Email Builder structure (JSONB)
}

// ============================================================================
// Email Log Types
// ============================================================================

export interface EmailLog {
  id: string;
  campaignId: string;
  recipientEmail: string;
  status: string;
  sentAt: Date | null;
  openedAt: Date | null;
  clickedAt: Date | null;
  error: string | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Dashboard & Stats Types
// ============================================================================

export interface EmailMarketingStats {
  totalSubscribers: number;
  activeSubscribers: number;
  totalCampaigns: number;
  sentCampaigns: number;
  totalGroups: number;
  totalSegments: number;
  totalTemplates: number;
  averageOpenRate: number;
  averageClickRate: number;
}

export interface CampaignStats {
  id: string;
  campaignId: string;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  unsubscribedCount: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

// ============================================================================
// Bulk Import/Export Types
// ============================================================================

export enum ImportJobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum ExportJobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum ImportResultStatus {
  VALID = 'valid',
  INVALID = 'invalid',
  RISKY = 'risky',
  DUPLICATE = 'duplicate',
}

export interface ImportOptions {
  groupIds?: string[];
  segmentIds?: string[];
  duplicateHandling: 'skip' | 'update' | 'replace';
  validationThreshold: number;
  batchSize: number;
  columnMapping: Record<string, string>;
}

export interface ExportFilters {
  status?: SubscriberStatus[];
  groupIds?: string[];
  segmentIds?: string[];
  dateRange?: { start: Date; end: Date };
  validationStatus?: string[];
}

export interface ExportOptions {
  fields: string[];
  format: 'csv' | 'xlsx';
  includeMetadata: boolean;
  batchSize: number;
}

export interface ValidationSummary {
  totalProcessed: number;
  validEmails: number;
  invalidEmails: number;
  riskyEmails: number;
  duplicates: number;
  averageConfidenceScore: number;
  processingTimeMs: number;
}

export interface ValidationDetails {
  syntaxValid: boolean;
  domainExists: boolean;
  mxRecordExists: boolean;
  isDisposable: boolean;
  isRoleAccount: boolean;
  hasTypos: boolean;
  ipReputation: 'good' | 'poor' | 'unknown';
  confidenceScore: number;
  validationProvider: string;
  validatedAt: Date;
}

export interface ImportJob {
  id: string;
  fileName: string;
  originalFileName: string;
  filePath: string;
  status: ImportJobStatus;
  totalRecords: number;
  processedRecords: number;
  validRecords: number;
  invalidRecords: number;
  riskyRecords: number;
  duplicateRecords: number;
  options: ImportOptions | null;
  columnMapping: Record<string, string> | null;
  validationSummary: ValidationSummary | null;
  error: string | null;
  completedAt: Date | null;
  userId: string | null;
  progressPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExportJob {
  id: string;
  fileName: string;
  filePath: string;
  status: ExportJobStatus;
  totalRecords: number;
  processedRecords: number;
  filters: ExportFilters;
  options: ExportOptions;
  error: string | null;
  completedAt: Date | null;
  expiresAt: Date;
  userId: string | null;
  progressPercentage: number;
  fileSizeBytes: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImportResult {
  id: string;
  importJobId: string;
  email: string;
  status: ImportResultStatus;
  confidenceScore: number;
  validationDetails: ValidationDetails | null;
  issues: string[] | null;
  suggestions: string[] | null;
  imported: boolean;
  error: string | null;
  originalData: Record<string, any> | null;
  rowNumber: number | null;
  subscriberId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Query Params Types
// ============================================================================

export interface SubscriberQueryParams {
  status?: SubscriberStatus | string;
  groupId?: string;
  segmentId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CampaignQueryParams {
  status?: CampaignStatus | string;
  search?: string;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}
