/**
 * Generic webhook event types - provider-agnostic
 */
export enum EmailWebhookEventType {
  // Delivery events
  DELIVERED = 'delivered',
  BOUNCED = 'bounced',
  SOFT_BOUNCED = 'soft_bounced',
  
  // Engagement events
  OPENED = 'opened',
  CLICKED = 'clicked',
  
  // Complaint events
  COMPLAINED = 'complained',
  SPAM = 'spam',
  UNSUBSCRIBED = 'unsubscribed',
  
  // Other
  DROPPED = 'dropped',
  DEFERRED = 'deferred',
}

/**
 * Bounce reasons - normalized across providers
 */
export enum BounceReason {
  // Hard bounces (permanent)
  MAILBOX_NOT_FOUND = 'mailbox_not_found',
  DOMAIN_NOT_FOUND = 'domain_not_found',
  RECIPIENT_REJECTED = 'recipient_rejected',
  
  // Soft bounces (temporary)
  MAILBOX_FULL = 'mailbox_full',
  MESSAGE_TOO_LARGE = 'message_too_large',
  TEMPORARY_FAILURE = 'temporary_failure',
  
  // Other
  BLOCKED = 'blocked',
  UNKNOWN = 'unknown',
}

/**
 * Provider-agnostic webhook event interface
 * Her provider kendi event'ini bu interface'e map eder
 */
export interface EmailWebhookEvent {
  /** Email provider (resend, sendgrid, etc.) */
  provider: string;
  
  /** Event type */
  eventType: EmailWebhookEventType;
  
  /** Recipient email address */
  email: string;
  
  /** Original message ID from provider */
  messageId: string;
  
  /** Event timestamp */
  timestamp: Date;
  
  /** Bounce/complaint reason (if applicable) */
  reason?: BounceReason;
  
  /** Additional provider-specific data */
  metadata?: Record<string, any>;
  
  /** Raw webhook payload from provider (for debugging) */
  rawPayload: any;
}

/**
 * Resend webhook payload types
 * https://resend.com/docs/dashboard/webhooks/event-types
 */
export interface ResendWebhookPayload {
  type: 'email.sent' | 'email.delivered' | 'email.delivery_delayed' | 
        'email.complained' | 'email.bounced' | 'email.opened' | 'email.clicked';
  created_at: string;
  data: {
    created_at: string;
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    bounce?: {
      type: 'hard' | 'soft';
      message: string;
    };
    click?: {
      ipAddress: string;
      link: string;
      timestamp: string;
      userAgent: string;
    };
    open?: {
      ipAddress: string;
      timestamp: string;
      userAgent: string;
    };
  };
}

/**
 * SendGrid webhook payload types (gelecek için hazırlık)
 * https://docs.sendgrid.com/for-developers/tracking-events/event
 */
export interface SendGridWebhookPayload {
  email: string;
  timestamp: number;
  event: 'processed' | 'delivered' | 'bounce' | 'dropped' | 
         'deferred' | 'open' | 'click' | 'spamreport' | 'unsubscribe';
  'smtp-id': string;
  category?: string[];
  reason?: string;
  status?: string;
  type?: string;
  url?: string;
  ip?: string;
  useragent?: string;
  sg_event_id: string;
  sg_message_id: string;
}
