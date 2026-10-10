import { Injectable, BadRequestException } from '@nestjs/common';
import { EmailWebhookAdapter } from '../interfaces/email-webhook-adapter.interface';
import { ResendWebhookAdapter } from '../adapters/resend-webhook.adapter';
import { SendGridWebhookAdapter } from '../adapters/sendgrid-webhook.adapter';
import { MailgunWebhookAdapter } from '../adapters/mailgun-webhook.adapter';
import { PostmarkWebhookAdapter } from '../adapters/postmark-webhook.adapter';
import { SESWebhookAdapter } from '../adapters/ses-webhook.adapter';
import { EmailProvider } from '../../settings/dto/email-settings.dto';

// Add AUTO for auto-detection
export const PROVIDER_AUTO = 'auto';

/**
 * Email Webhook Adapter Factory
 * Automatically detects email provider and returns appropriate adapter
 */
@Injectable()
export class EmailWebhookAdapterFactory {
  private adapters: Map<EmailProvider, EmailWebhookAdapter>;

  constructor(
    private readonly resendAdapter: ResendWebhookAdapter,
    private readonly sendgridAdapter: SendGridWebhookAdapter,
    private readonly mailgunAdapter: MailgunWebhookAdapter,
    private readonly postmarkAdapter: PostmarkWebhookAdapter,
    private readonly sesAdapter: SESWebhookAdapter,
  ) {
    this.adapters = new Map<EmailProvider, EmailWebhookAdapter>([
      [EmailProvider.RESEND, this.resendAdapter as EmailWebhookAdapter],
      [EmailProvider.SENDGRID, this.sendgridAdapter as EmailWebhookAdapter],
      [EmailProvider.MAILGUN, this.mailgunAdapter as EmailWebhookAdapter],
      [EmailProvider.POSTMARK, this.postmarkAdapter as EmailWebhookAdapter],
      [EmailProvider.SES, this.sesAdapter as EmailWebhookAdapter],
      // Note: SMTP doesn't support inbound webhooks
    ]);
  }

  /**
   * Get adapter for specified provider
   * If AUTO, will attempt to detect provider from payload structure
   */
  getAdapter(provider: EmailProvider | string, payload?: any): EmailWebhookAdapter {
    // If provider specified, use it
    if (provider !== PROVIDER_AUTO && provider !== 'auto') {
      const adapter = this.adapters.get(provider as EmailProvider);
      if (!adapter) {
        throw new BadRequestException(`Unsupported email provider: ${provider}`);
      }
      return adapter;
    }

    // Auto-detect provider from payload
    if (!payload) {
      throw new BadRequestException('Cannot auto-detect provider without payload');
    }

    return this.detectProvider(payload);
  }

  /**
   * Auto-detect email provider from webhook payload structure
   * Each provider has unique field patterns
   */
  private detectProvider(payload: any): EmailWebhookAdapter {
    // Postmark detection: has 'From', 'To', 'MessageID', 'TextBody' (capitalized fields)
    if (payload.MessageID && payload.From && payload.To && payload.TextBody !== undefined) {
      return this.postmarkAdapter;
    }

    // AWS SES detection: has 'Message' (SNS format) or 'mail' (direct format)
    if (payload.Type === 'Notification' || payload.Message || payload.mail) {
      return this.sesAdapter;
    }

    // Mailgun detection: has 'sender', 'recipient', 'body-plain', 'body-html'
    if (payload.sender && payload.recipient && (payload['body-plain'] || payload['body-html'])) {
      return this.mailgunAdapter;
    }

    // SendGrid detection: has 'from', 'to', 'headers' (string), 'text', 'html'
    if (payload.headers && typeof payload.headers === 'string' && payload.text) {
      return this.sendgridAdapter;
    }

    // Resend detection: has 'from', 'to', 'message_id' fields (lowercase)
    if (payload.message_id && payload.from && payload.to) {
      return this.resendAdapter;
    }

    throw new BadRequestException('Cannot detect email provider from payload');
  }

  /**
   * Get all supported providers
   */
  getSupportedProviders(): EmailProvider[] {
    return Array.from(this.adapters.keys());
  }
}
