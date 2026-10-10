import { Controller, Post, Body, Headers, HttpCode, HttpStatus, Logger, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { createHmac } from 'crypto';
import { WebhookService } from './services/webhook.service';
import { EmailWebhookEventType, BounceReason } from './interfaces/webhook-event.interface';
import { EmailCampaignService } from '../email-marketing/email-campaign.service';

/**
 * Resend Webhook Events
 */
export enum ResendWebhookEvent {
  EMAIL_SENT = 'email.sent',
  EMAIL_DELIVERED = 'email.delivered',
  EMAIL_DELIVERY_DELAYED = 'email.delivery_delayed',
  EMAIL_COMPLAINED = 'email.complained',
  EMAIL_BOUNCED = 'email.bounced',
  EMAIL_OPENED = 'email.opened',
  EMAIL_CLICKED = 'email.clicked',
}

/**
 * Resend Webhook Payload
 */
interface ResendWebhookPayload {
  type: ResendWebhookEvent;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    // Bounce specific
    bounce_type?: 'hard' | 'soft';
    bounce_reason?: string;
    // Complaint specific
    complaint_feedback_type?: string;
    // Campaign tracking (custom header we add when sending)
    // Campaign tracking
    campaign_id?: string;
    // Custom headers (Resend returns these if sent)
    headers?: Record<string, string>;
  };
}

/**
 * Resend Webhook Controller
 * Handles incoming webhooks from Resend for email events
 */
@Controller('webhooks/resend')
export class ResendWebhookController {
  private readonly logger = new Logger(ResendWebhookController.name);
  private readonly webhookSecret: string;

  constructor(
    @Inject(forwardRef(() => WebhookService))
    private readonly webhookService: WebhookService,
    @Inject(forwardRef(() => EmailCampaignService))
    private readonly emailCampaignService: EmailCampaignService,
  ) {
    this.webhookSecret = process.env.RESEND_WEBHOOK_SECRET || '';
    if (!this.webhookSecret) {
      this.logger.warn('⚠️  RESEND_WEBHOOK_SECRET not set. Webhook signature verification disabled!');
    }
  }

  /**
   * Resend webhook endpoint
   * URL to configure in Resend: https://your-domain.com/api/webhooks/resend
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() payload: ResendWebhookPayload,
    @Headers('resend-signature') signature: string,
  ) {
    this.logger.log(`Received webhook: ${payload.type} for email ${payload.data.email_id}`);

    // Verify webhook signature
    if (this.webhookSecret && !this.verifySignature(payload, signature)) {
      this.logger.error('Invalid webhook signature');
      throw new BadRequestException('Invalid signature');
    }

    // Handle different event types
    try {
      switch (payload.type) {
        case ResendWebhookEvent.EMAIL_SENT:
          await this.handleEmailSent(payload);
          break;

        case ResendWebhookEvent.EMAIL_DELIVERED:
          await this.handleEmailDelivered(payload);
          break;

        case ResendWebhookEvent.EMAIL_DELIVERY_DELAYED:
          await this.handleEmailDelayed(payload);
          break;

        case ResendWebhookEvent.EMAIL_BOUNCED:
          await this.handleEmailBounced(payload);
          break;

        case ResendWebhookEvent.EMAIL_COMPLAINED:
          await this.handleEmailComplained(payload);
          break;

        case ResendWebhookEvent.EMAIL_OPENED:
          await this.handleEmailOpened(payload);
          break;

        case ResendWebhookEvent.EMAIL_CLICKED:
          await this.handleEmailClicked(payload);
          break;

        default:
          this.logger.warn(`Unknown webhook event: ${payload.type}`);
      }

      return { success: true, message: 'Webhook processed' };
    } catch (error) {
      this.logger.error(`Error processing webhook: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Helper to extract tenantId from payload headers
   */
  private extractTenantId(payload: ResendWebhookPayload): string {
    // Try to find X-Metadata-tenantId header
    const headers = payload.data.headers || {};
    return headers['X-Metadata-tenantId'] || headers['x-metadata-tenantid'] || 'default';
  }

  /**
   * Verify webhook signature from Resend
   */
  private verifySignature(payload: ResendWebhookPayload, signature: string): boolean {
    if (!signature) {
      return false;
    }

    try {
      const payloadString = JSON.stringify(payload);
      const expectedSignature = createHmac('sha256', this.webhookSecret)
        .update(payloadString)
        .digest('hex');

      return signature === expectedSignature;
    } catch (error) {
      this.logger.error('Signature verification failed', error);
      return false;
    }
  }

  /**
   * Handle email sent event
   */
  private async handleEmailSent(payload: ResendWebhookPayload) {
    this.logger.log(`Email sent: ${payload.data.email_id} to ${payload.data.to.join(', ')}`);
    // Sent events are informational - no action needed
    // EmailLog tracking would go here if we had that entity
  }

  /**
   * Handle email delivered event
   */
  private async handleEmailDelivered(payload: ResendWebhookPayload) {
    this.logger.log(`Email delivered: ${payload.data.email_id}`);

    // Process through WebhookService for consistent handling
    for (const email of payload.data.to) {
      await this.webhookService.processWebhookEvent({
        email,
        eventType: EmailWebhookEventType.DELIVERED,
        provider: 'resend',
        messageId: payload.data.email_id,
        timestamp: new Date(payload.created_at),
        metadata: {
          emailId: payload.data.email_id,
          subject: payload.data.subject,
          tenantId: this.extractTenantId(payload),
        },
        rawPayload: payload,
      });
    }
  }

  /**
   * Handle email delayed event
   */
  private async handleEmailDelayed(payload: ResendWebhookPayload) {
    this.logger.warn(`Email delivery delayed: ${payload.data.email_id}`);
    // Delay events are informational - logged but no action needed
    // Could implement retry logic here if needed
  }

  /**
   * Handle email bounced event (CRITICAL)
   * Hard bounces -> permanent suppression + update subscriber
   * Soft bounces -> log for monitoring
   */
  private async handleEmailBounced(payload: ResendWebhookPayload) {
    const { email_id, to, bounce_type, bounce_reason } = payload.data;

    this.logger.error(
      `Email bounced: ${email_id} to ${to.join(', ')} | Type: ${bounce_type} | Reason: ${bounce_reason}`
    );

    // Determine event type based on bounce type
    const eventType = bounce_type === 'hard'
      ? EmailWebhookEventType.BOUNCED
      : EmailWebhookEventType.SOFT_BOUNCED;

    // Process each recipient through WebhookService
    // WebhookService handles: suppression list, subscriber status update
    for (const email of to) {
      await this.webhookService.processWebhookEvent({
        email,
        eventType,
        provider: 'resend',
        messageId: email_id,
        timestamp: new Date(payload.created_at),
        reason: BounceReason.UNKNOWN,
        metadata: {
          emailId: email_id,
          bounceType: bounce_type,
          bounceReason: bounce_reason,
          subject: payload.data.subject,
          tenantId: this.extractTenantId(payload),
        },
        rawPayload: payload,
      });
    }
  }

  /**
   * Handle email complained event (CRITICAL)
   * Complaint = spam report -> immediate suppression
   */
  private async handleEmailComplained(payload: ResendWebhookPayload) {
    const { email_id, to, complaint_feedback_type } = payload.data;

    this.logger.error(
      `Email complaint: ${email_id} from ${to.join(', ')} | Feedback: ${complaint_feedback_type}`
    );

    // Process each recipient through WebhookService
    // WebhookService handles: suppression list, subscriber status update to 'complained'
    for (const email of to) {
      await this.webhookService.processWebhookEvent({
        email,
        eventType: EmailWebhookEventType.COMPLAINED,
        provider: 'resend',
        messageId: email_id,
        timestamp: new Date(payload.created_at),
        reason: BounceReason.UNKNOWN,
        metadata: {
          emailId: email_id,
          feedbackType: complaint_feedback_type,
          subject: payload.data.subject,
          tenantId: this.extractTenantId(payload),
        },
        rawPayload: payload,
      });
    }
  }

  /**
   * Handle email opened event
   */
  private async handleEmailOpened(payload: ResendWebhookPayload) {
    this.logger.log(`Email opened: ${payload.data.email_id}`);

    // Track open for analytics via WebhookService
    for (const email of payload.data.to) {
      await this.webhookService.processWebhookEvent({
        email,
        eventType: EmailWebhookEventType.OPENED,
        provider: 'resend',
        messageId: payload.data.email_id,
        timestamp: new Date(payload.created_at),
        metadata: {
          emailId: payload.data.email_id,
          subject: payload.data.subject,
          campaignId: payload.data.campaign_id,
          tenantId: this.extractTenantId(payload),
        },
        rawPayload: payload,
      });
    }

    // Update campaign open count if campaign_id is present
    if (payload.data.campaign_id) {
      try {
        await this.emailCampaignService.incrementOpenedCount(payload.data.campaign_id);
      } catch (error) {
        this.logger.warn(`Failed to increment open count for campaign ${payload.data.campaign_id}: ${error.message}`);
      }
    }
  }

  /**
   * Handle email clicked event
   */
  private async handleEmailClicked(payload: ResendWebhookPayload) {
    this.logger.log(`Email link clicked: ${payload.data.email_id}`);

    // Track click for analytics via WebhookService
    for (const email of payload.data.to) {
      await this.webhookService.processWebhookEvent({
        email,
        eventType: EmailWebhookEventType.CLICKED,
        provider: 'resend',
        messageId: payload.data.email_id,
        timestamp: new Date(payload.created_at),
        metadata: {
          emailId: payload.data.email_id,
          subject: payload.data.subject,
          campaignId: payload.data.campaign_id,
          tenantId: this.extractTenantId(payload),
        },
        rawPayload: payload,
      });
    }

    // Update campaign click count if campaign_id is present
    if (payload.data.campaign_id) {
      try {
        await this.emailCampaignService.incrementClickedCount(payload.data.campaign_id);
      } catch (error) {
        this.logger.warn(`Failed to increment click count for campaign ${payload.data.campaign_id}: ${error.message}`);
      }
    }
  }
}
