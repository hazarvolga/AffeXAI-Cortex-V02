import type { Request } from 'express';
import { isEmail } from 'class-validator';
import { TenantService } from '../../../core/tenant/tenant.service';
import { Controller, Post, Headers, BadRequestException, Req, RawBodyRequest, ServiceUnavailableException } from '@nestjs/common';
import { Webhook } from 'svix';
import { WebhookService } from '../services/webhook.service';
import type {
  ResendWebhookPayload
} from '../interfaces/webhook-event.interface';
import {
  EmailWebhookEvent,
  EmailWebhookEventType,
  BounceReason
} from '../interfaces/webhook-event.interface';

/**
 * Resend webhook controller
 * Receives webhooks from Resend and processes them
 * 
 * Setup in Resend dashboard:
 * 1. Go to Webhooks section
 * 2. Add endpoint: https://yourdomain.com/api/webhooks/resend
 * 3. Select events: email.delivered, email.bounced, email.complained, email.opened, email.clicked
 * 4. Copy signing secret to environment: RESEND_WEBHOOK_SECRET
 */
@Controller('webhooks/resend')
export class ResendWebhookController {

  constructor(private readonly webhookService: WebhookService, private readonly tenants: TenantService) { }

  private verify(request: RawBodyRequest<Request>, id: string, timestamp: string, signature: string): unknown {
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    if (!secret) throw new ServiceUnavailableException('Webhook verification is not configured');
    if (!request.rawBody || !id || !timestamp || !signature) throw new BadRequestException('Invalid signature');
    try {
      return new Webhook(secret).verify(request.rawBody, { 'svix-id': id, 'svix-timestamp': timestamp, 'svix-signature': signature });
    } catch {
      throw new BadRequestException('Invalid signature');
    }
  }

  private payload(value: unknown): ResendWebhookPayload {
    if (!value || typeof value !== 'object') throw new BadRequestException('Invalid event');
    const event = value as Partial<ResendWebhookPayload>;
    const supported = ['email.delivered', 'email.bounced', 'email.complained', 'email.opened', 'email.clicked', 'email.delivery_delayed'];
    if (!supported.includes(event.type || '') || typeof event.created_at !== 'string' || !Number.isFinite(Date.parse(event.created_at)) ||
      !event.data || typeof event.data.email_id !== 'string' || !event.data.email_id.trim() || event.data.email_id.length > 256 ||
      !Array.isArray(event.data.to) || event.data.to.length !== 1 || typeof event.data.to[0] !== 'string' || !isEmail(event.data.to[0])) {
      throw new BadRequestException('Unsupported or invalid event');
    }
    if (event.data.bounce && (typeof event.data.bounce.message !== 'string' || !['hard', 'soft'].includes(event.data.bounce.type))) throw new BadRequestException('Invalid bounce event');
    return event as ResendWebhookPayload;
  }

  @Post()
  async handleWebhook(
    @Headers('svix-id') id: string,
    @Headers('svix-timestamp') timestamp: string,
    @Headers('svix-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ) {
    const payload = this.payload(this.verify(request, id, timestamp, signature));
    // Temporary single-tenant provider binding. Headers and event fields cannot select authority.
    const tenantId = process.env.RESEND_WEBHOOK_TENANT_ID;
    if (!tenantId || !/^[A-Za-z0-9_-]{1,128}$/.test(tenantId)) throw new ServiceUnavailableException('Webhook tenant binding is not configured');
    const mapped = this.mapResendToGenericEvent(payload);
    const event = { ...mapped, metadata: { ...mapped.metadata, tenantId } };
    await this.tenants.runWithTenant({ tenantId }, () => this.webhookService.processWebhookEvent(event));
    return { success: true };
  }

  @Post('inbound')
  async handleInboundEmail(
    @Headers('svix-id') id: string,
    @Headers('svix-timestamp') timestamp: string,
    @Headers('svix-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ) {
    this.verify(request, id, timestamp, signature);
    // Provider signature authenticates delivery, not a spoofable email From address.
    throw new ServiceUnavailableException('Inbound ticket replies require a verified reply capability; feature unavailable');
  }

  /**
   * Map Resend-specific webhook payload to generic EmailWebhookEvent
   */
  private mapResendToGenericEvent(payload: ResendWebhookPayload): EmailWebhookEvent {
    const eventTypeMap: Record<string, EmailWebhookEventType> = {
      'email.delivered': EmailWebhookEventType.DELIVERED,
      'email.bounced': EmailWebhookEventType.BOUNCED,
      'email.complained': EmailWebhookEventType.COMPLAINED,
      'email.opened': EmailWebhookEventType.OPENED,
      'email.clicked': EmailWebhookEventType.CLICKED,
      'email.delivery_delayed': EmailWebhookEventType.DEFERRED,
    };

    const event: EmailWebhookEvent = {
      provider: 'resend',
      eventType: payload.type === 'email.bounced' && payload.data.bounce?.type === 'soft'
        ? EmailWebhookEventType.SOFT_BOUNCED : eventTypeMap[payload.type],
      email: payload.data.to[0], // Resend sends array, we take first
      messageId: payload.data.email_id,
      timestamp: new Date(payload.created_at),
      rawPayload: payload,
    };

    // Map bounce reason if present
    if (payload.data.bounce) {
      event.reason = this.mapResendBounceReason(payload.data.bounce.message);
      event.metadata = {
        bounceType: payload.data.bounce.type,
        bounceMessage: payload.data.bounce.message,
      };
    }

    // Add click/open metadata
    if (payload.data.click) {
      event.metadata = {
        link: payload.data.click.link,
        ipAddress: payload.data.click.ipAddress,
        userAgent: payload.data.click.userAgent,
      };
    }

    if (payload.data.open) {
      event.metadata = {
        ipAddress: payload.data.open.ipAddress,
        userAgent: payload.data.open.userAgent,
      };
    }

    return event;
  }

  /**
   * Map Resend bounce message to normalized bounce reason
   */
  private mapResendBounceReason(message: string): BounceReason {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('mailbox') && lowerMessage.includes('not found')) {
      return BounceReason.MAILBOX_NOT_FOUND;
    }
    if (lowerMessage.includes('domain') && lowerMessage.includes('not found')) {
      return BounceReason.DOMAIN_NOT_FOUND;
    }
    if (lowerMessage.includes('mailbox full')) {
      return BounceReason.MAILBOX_FULL;
    }
    if (lowerMessage.includes('message too large')) {
      return BounceReason.MESSAGE_TOO_LARGE;
    }
    if (lowerMessage.includes('rejected')) {
      return BounceReason.RECIPIENT_REJECTED;
    }
    if (lowerMessage.includes('blocked')) {
      return BounceReason.BLOCKED;
    }

    return BounceReason.UNKNOWN;
  }
}
