/**
 * Mail Channel Types
 * Defines different types of emails for routing and rate limiting
 */
export enum MailChannel {
  TRANSACTIONAL = 'transactional',  // Password resets, confirmations, etc.
  MARKETING = 'marketing',           // Newsletters, campaigns
  CERTIFICATE = 'certificate',       // Certificate delivery emails
  EVENT = 'event',                   // Event notifications
  SUPPORT = 'support',               // Support ticket notifications
  SYSTEM = 'system',                 // System notifications
}

/**
 * Email Priority Levels
 */
export enum MailPriority {
  HIGH = 'high',       // Immediate delivery (e.g., password resets)
  NORMAL = 'normal',   // Standard delivery
  LOW = 'low',         // Can be delayed (e.g., marketing)
}

/**
 * Email Recipient Interface
 */
export interface MailRecipient {
  email: string;
  name?: string;
}

/**
 * Email Attachment Interface
 */
export interface MailAttachment {
  filename: string;
  content?: Buffer | string;  // Buffer or base64 string
  path?: string;              // File path (alternative to content)
  contentType?: string;       // MIME type
}

/**
 * Custom Email Headers
 */
export interface MailHeaders {
  [key: string]: string;
}

/**
 * Email Tracking Options
 */
export interface TrackingOptions {
  clickTracking?: boolean;
  openTracking?: boolean;
}

/**
 * List-Unsubscribe Header Configuration
 */
export interface UnsubscribeConfig {
  email?: string;              // Unsubscribe via email
  url?: string;                // Unsubscribe via URL
  oneClick?: boolean;          // RFC 8058 one-click unsubscribe
}

/**
 * Main Email Options Interface
 */
export interface SendMailOptions {
  // Recipients
  to: MailRecipient | MailRecipient[];
  cc?: MailRecipient | MailRecipient[];
  bcc?: MailRecipient | MailRecipient[];

  // Sender (optional - uses settings default if not provided)
  from?: MailRecipient;
  replyTo?: MailRecipient;

  // Content
  subject: string;
  html?: string;              // HTML version (required unless using template)
  text?: string;              // Plain text version (auto-generated if not provided)

  // Template support (alternative to html)
  template?: string;          // Template name to render
  context?: Record<string, any>; // Template variables

  // Metadata
  channel: MailChannel;      // Required for routing and rate limiting
  priority?: MailPriority;   // Defaults to NORMAL

  // Attachments
  attachments?: MailAttachment[];

  // Headers and tracking
  headers?: MailHeaders;
  tracking?: TrackingOptions;
  unsubscribe?: UnsubscribeConfig;

  // Tags and metadata for analytics
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * Email Send Result
 */
export interface SendMailResult {
  success: boolean;
  messageId?: string;         // Provider message ID
  error?: string;
  provider: string;           // Which provider was used
  timestamp: Date;
}

/**
 * Bulk Email Send Options
 */
export interface BulkSendOptions {
  emails: SendMailOptions[];
  batchSize?: number;         // Send in batches
  delayBetweenBatches?: number; // Delay in ms
}

/**
 * Mail Service Interface
 * All email providers must implement this interface
 */
export interface IMailService {
  /**
   * Send a single email
   */
  sendMail(options: SendMailOptions): Promise<SendMailResult>;

  /**
   * Send multiple emails
   */
  sendBulk(options: BulkSendOptions): Promise<SendMailResult[]>;

  /**
   * Verify email address syntax
   */
  validateEmail(email: string): boolean;

  /**
   * Generate plain text version from HTML
   */
  htmlToText(html: string): string;

  /**
   * Test connection to email provider
   */
  testConnection(): Promise<boolean>;
}
