import { Injectable, Logger, Inject, forwardRef, ServiceUnavailableException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EmailWebhookEvent, EmailWebhookEventType, BounceReason } from '../interfaces/webhook-event.interface';
import { EmailSuppression } from '../entities/email-suppression.entity';
import { SubscriberService } from '../../email-marketing/subscriber.service';
import { EmailCampaignService } from '../../email-marketing/email-campaign.service';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { TicketMessage } from '../../tickets/entities/ticket-message.entity';
import { TenantService } from '../../../core/tenant/tenant.service';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(EmailSuppression)
    private suppressionRepository: Repository<EmailSuppression>,

    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,

    @InjectRepository(TicketMessage)
    private ticketMessageRepository: Repository<TicketMessage>,

    @Inject(forwardRef(() => SubscriberService))
    private subscriberService: SubscriberService,

    @Inject(forwardRef(() => EmailCampaignService))
    private emailCampaignService: EmailCampaignService,

    private readonly tenantService: TenantService,

    private eventEmitter: EventEmitter2,
  ) { }

  private getTenantId(): string {
    const tenantId = this.tenantService.getTenantId();
    if (!tenantId || !/^[A-Za-z0-9_-]{1,128}$/.test(tenantId)) throw new BadRequestException('Verified webhook tenant required');
    return tenantId;
  }

  /**
   * Process incoming webhook event
   * Provider-agnostic - works with any email provider
   */
  async processWebhookEvent(event: EmailWebhookEvent): Promise<void> {
    const tenantId = this.getTenantId();
    if (event.metadata?.tenantId !== tenantId) throw new BadRequestException('Webhook tenant mismatch');
    this.logger.log(
      `Processing webhook event: ${event.eventType} for ${event.email} from ${event.provider}`,
    );

    switch (event.eventType) {
      case EmailWebhookEventType.BOUNCED:
      case EmailWebhookEventType.SOFT_BOUNCED:
        await this.handleBounce(event);
        break;

      case EmailWebhookEventType.COMPLAINED:
      case EmailWebhookEventType.SPAM:
        await this.handleComplaint(event);
        break;

      case EmailWebhookEventType.UNSUBSCRIBED:
        await this.handleUnsubscribe(event);
        break;

      case EmailWebhookEventType.DELIVERED:
        await this.handleDelivery(event);
        break;

      case EmailWebhookEventType.OPENED:
      case EmailWebhookEventType.CLICKED:
        await this.handleEngagement(event);
        break;

      default:
        this.logger.debug(
          `Unhandled event type: ${event.eventType} for ${event.email}`,
        );
    }
  }

  /**
   * Handle bounce events
   * Hard bounces -> permanent suppression + update subscriber
   * Soft bounces -> log but don't suppress yet
   */
  private async handleBounce(event: EmailWebhookEvent): Promise<void> {
    const isHardBounce = event.eventType === EmailWebhookEventType.BOUNCED;

    this.logger.warn(
      `${isHardBounce ? 'Hard' : 'Soft'} bounce detected for ${event.email}: ${event.reason}`,
    );

    if (isHardBounce) {
      // Hard bounce - permanent suppression
      await this.addToSuppressionList({
        email: event.email,
        reason: `Hard bounce: ${event.reason || 'unknown'}`,
        provider: event.provider,
        eventType: event.eventType,
        bounceReason: event.reason,
        suppressedAt: event.timestamp,
        metadata: event.metadata,
      });

      // Update subscriber status to 'bounced'
      try {
        const subscriber = await this.subscriberService.updateStatusFromWebhook(
          event.email,
          'bounced',
          event.metadata,
          event.metadata?.tenantId,
        );
        if (subscriber) {
          this.logger.log(`Updated subscriber ${event.email} status to 'bounced'`);
        } else {
          this.logger.debug(`No subscriber found for ${event.email}, skipping status update`);
        }
      } catch (error) {
        this.logger.error('Subscriber suppression update failed');
        throw error;
      }

      // Update campaign bounce count if campaignId is present
      const campaignId = event.metadata?.campaignId;
      if (campaignId) {
        try {
          await this.emailCampaignService.incrementBouncedCount(campaignId);
          this.logger.debug(`Updated bounce count for campaign ${campaignId}`);
        } catch (error) {
          this.logger.warn(`Failed to update bounce count for campaign ${campaignId}: ${error.message}`);
        }
      }
    } else {
      // Soft bounce - just log for now
      this.logger.debug(
        `Soft bounce logged for ${event.email}, will monitor for repeated bounces`,
      );
    }
  }

  /**
   * Handle complaint/spam events
   * Always add to suppression list + update subscriber
   */
  private async handleComplaint(event: EmailWebhookEvent): Promise<void> {
    this.logger.warn(
      `Complaint/spam reported for ${event.email} from ${event.provider}`,
    );

    await this.addToSuppressionList({
      email: event.email,
      reason: `Complaint: ${event.eventType}`,
      provider: event.provider,
      eventType: event.eventType,
      suppressedAt: event.timestamp,
      metadata: event.metadata,
    });

    // Update subscriber status to 'complained'
    try {
      const subscriber = await this.subscriberService.updateStatusFromWebhook(
        event.email,
        'complained',
        event.metadata,
        event.metadata?.tenantId,
      );
      if (subscriber) {
        this.logger.log(`Updated subscriber ${event.email} status to 'complained'`);
      }
    } catch (error) {
      this.logger.error('Subscriber suppression update failed');
        throw error;
    }

    // Update campaign complaint count if campaignId is present
    const campaignId = event.metadata?.campaignId;
    if (campaignId) {
      try {
        await this.emailCampaignService.incrementComplainedCount(campaignId);
        this.logger.debug(`Updated complaint count for campaign ${campaignId}`);
      } catch (error) {
        this.logger.warn(`Failed to update complaint count for campaign ${campaignId}: ${error.message}`);
      }
    }
  }

  /**
   * Handle unsubscribe events
   */
  private async handleUnsubscribe(event: EmailWebhookEvent): Promise<void> {
    this.logger.log(`Unsubscribe detected for ${event.email}`);

    await this.addToSuppressionList({
      email: event.email,
      reason: 'Unsubscribed via email link',
      provider: event.provider,
      eventType: event.eventType,
      suppressedAt: event.timestamp,
      metadata: event.metadata,
    });

    // Update subscriber status to 'unsubscribed'
    try {
      const subscriber = await this.subscriberService.updateStatusFromWebhook(
        event.email,
        'unsubscribed',
        event.metadata,
        event.metadata?.tenantId,
      );
      if (subscriber) {
        this.logger.log(`Updated subscriber ${event.email} status to 'unsubscribed'`);
      }
    } catch (error) {
      this.logger.error('Subscriber suppression update failed');
        throw error;
    }
  }

  /**
   * Handle successful delivery
   */
  private async handleDelivery(event: EmailWebhookEvent): Promise<void> {
    this.logger.debug(`Email delivered successfully to ${event.email}`);

    // Update campaign delivery count if campaignId is present
    const campaignId = event.metadata?.campaignId;
    if (campaignId) {
      try {
        await this.emailCampaignService.incrementDeliveredCount(campaignId);
        this.logger.debug(`Updated delivery count for campaign ${campaignId}`);
      } catch (error) {
        this.logger.warn(`Failed to update delivery count for campaign ${campaignId}: ${error.message}`);
      }
    }
  }

  /**
   * Handle engagement events (open, click)
   * Note: Open and Click tracking is handled in resend-webhook.controller.ts
   * This method serves as a fallback/extension point
   */
  private async handleEngagement(event: EmailWebhookEvent): Promise<void> {
    this.logger.debug(
      `${event.eventType} event for ${event.email} at ${event.timestamp}`,
    );
    // Engagement metrics are already tracked in resend-webhook.controller.ts
    // This handler can be extended for additional processing if needed
  }

  /**
   * Add email to suppression list
   * Prevents future emails to this address
   */
  private async addToSuppressionList(
    data: Partial<EmailSuppression>,
  ): Promise<void> {
    try {
      // Extract tenantId from metadata if not explicitly provided
      const safeTenantId = this.getTenantId();
      if (data.metadata?.tenantId !== safeTenantId) throw new BadRequestException('Webhook tenant mismatch');

      const safeData = { ...data, tenantId: safeTenantId };

      // Check if already suppressed
      const existing = await this.suppressionRepository.findOne({
        where: {
          email: data.email,
          tenantId: safeTenantId,
        },
      });

      if (existing) {
        this.logger.debug(
          `Email ${data.email} already in suppression list for tenant ${safeTenantId}, updating...`,
        );
        await this.suppressionRepository.update({ id: existing.id, tenantId: safeTenantId }, safeData);
      } else {
        this.logger.log(`Adding ${data.email} to suppression list for tenant ${safeTenantId}`);
        await this.suppressionRepository.save(safeData);
      }
    } catch (error) {
      this.logger.error(
        `Failed to add suppression record`,
      );
      throw error;
    }
  }

  /**
   * Check if email is suppressed
   * Use this before sending any email
   */
  async isEmailSuppressed(email: string, tenantId: string): Promise<boolean> {
    const suppressed = await this.suppressionRepository.findOne({
      where: {
        email,
        tenantId,
      },
    });

    return !!suppressed;
  }

  /**
   * Get suppression details for an email
   */
  async getSuppressionDetails(email: string, tenantId: string): Promise<EmailSuppression | null> {
    return await this.suppressionRepository.findOne({
      where: {
        email,
        tenantId,
      },
    });
  }

  /**
   * Remove email from suppression list (admin override)
   */
  async removeFromSuppressionList(email: string, tenantId: string): Promise<void> {
    await this.suppressionRepository.delete({ email, tenantId });
    this.logger.log(`Removed ${email} from suppression list for tenant ${tenantId}`);
  }

  /**
   * Get all suppressed emails for a specific tenant
   */
  async getAllSuppressedEmails(tenantId: string): Promise<EmailSuppression[]> {
    return await this.suppressionRepository.find({
      where: { tenantId },
      order: { suppressedAt: 'DESC' },
    });
  }

  /**
   * Handle inbound emails (email replies to tickets)
   * Parse ticket ID from recipient address and create ticket message
   */
  async handleInboundEmail(inboundData: {
    from: string;
    to: string;
    subject: string;
    text: string;
    html: string;
    messageId: string;
    inReplyTo?: string;
    references?: string;
    headers: any;
  }): Promise<void> {
    // Disabled until persisted tenant-ticket-author reply capabilities, expiry and replay
    // checks exist. Signed provider delivery does not authenticate a sender's From header.
    throw new ServiceUnavailableException('Inbound ticket replies require a verified reply capability; feature unavailable');
  }
}
