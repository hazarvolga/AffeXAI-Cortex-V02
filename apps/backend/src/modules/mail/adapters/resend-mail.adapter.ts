import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { htmlToText } from 'html-to-text';
import {
  IMailService,
  SendMailOptions,
  SendMailResult,
  BulkSendOptions,
  MailRecipient,
  UnsubscribeConfig,
} from '../interfaces/mail-service.interface';

/**
 * Resend Email Service Adapter
 * Implements IMailService using Resend API
 */
@Injectable()
export class ResendMailAdapter implements IMailService {
  private readonly logger = new Logger(ResendMailAdapter.name);
  private resend: Resend;
  private readonly providerName = 'resend';

  constructor(private readonly apiKey: string) {
    this.resend = new Resend(apiKey);
    this.logger.log('Resend mail adapter initialized');
  }

  /**
   * Send a single email via Resend
   */
  async sendMail(options: SendMailOptions): Promise<SendMailResult> {
    try {
      const {
        to,
        cc,
        bcc,
        from,
        replyTo,
        subject,
        html,
        text,
        attachments,
        headers,
        tracking,
        unsubscribe,
        tags,
      } = options;

      // Prepare recipients
      const toAddresses = this.formatRecipients(to);
      const ccAddresses = cc ? this.formatRecipients(cc) : undefined;
      const bccAddresses = bcc ? this.formatRecipients(bcc) : undefined;

      // Prepare plain text version
      const plainText = text || (html ? this.htmlToText(html) : '');

      // Prepare custom headers
      const customHeaders: Record<string, string> = {
        ...headers,
        ...this.buildTrackingHeaders(tracking),
        ...this.buildUnsubscribeHeaders(unsubscribe),
      };

      // Prepare attachments
      const resendAttachments = attachments?.map((att) => ({
        filename: att.filename,
        content: att.content,
        path: att.path,
        content_type: att.contentType,
      }));

      // Send via Resend API
      const sendOptions: any = {
        to: toAddresses,
        subject,
        html,
        text: plainText,
      };

      if (from) sendOptions.from = this.formatRecipient(from);
      if (ccAddresses) sendOptions.cc = ccAddresses;
      if (bccAddresses) sendOptions.bcc = bccAddresses;
      if (replyTo) sendOptions.reply_to = this.formatRecipient(replyTo);
      if (resendAttachments) sendOptions.attachments = resendAttachments;
      if (Object.keys(customHeaders).length > 0) sendOptions.headers = customHeaders;
      if (tags) sendOptions.tags = tags.map((tag) => ({ name: tag, value: 'true' }));
      if (options.metadata) {
        // Map metadata to headers for Resend (X-Metadata-Key) or use Resend tags
        // Resend officially supports tags. Custom headers are भी possible.
        // Let's use headers for explicit metadata tracking since we want it back in webhooks
        Object.entries(options.metadata).forEach(([key, value]) => {
          customHeaders[`X-Metadata-${key}`] = String(value);
        });
        sendOptions.headers = customHeaders;
      }

      const response = await this.resend.emails.send(sendOptions);

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data) {
        throw new Error('No data returned from Resend API');
      }

      this.logger.log(`Email sent successfully via Resend: ${response.data.id}`);

      return {
        success: true,
        messageId: response.data.id,
        provider: this.providerName,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to send email via Resend: ${error.message}`, error.stack);

      return {
        success: false,
        error: error.message,
        provider: this.providerName,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Send multiple emails in bulk
   */
  async sendBulk(options: BulkSendOptions): Promise<SendMailResult[]> {
    const { emails, batchSize = 10, delayBetweenBatches = 1000 } = options;
    const results: SendMailResult[] = [];

    // Process in batches
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map((emailOptions) => this.sendMail(emailOptions))
      );

      results.push(...batchResults);

      // Delay between batches to respect rate limits
      if (i + batchSize < emails.length) {
        await this.delay(delayBetweenBatches);
      }
    }

    const successCount = results.filter((r) => r.success).length;
    this.logger.log(`Bulk send completed: ${successCount}/${results.length} successful`);

    return results;
  }

  /**
   * Validate email address format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Convert HTML to plain text
   */
  htmlToText(html: string): string {
    return htmlToText(html, {
      wordwrap: 80,
      selectors: [
        { selector: 'a', options: { ignoreHref: false } },
        { selector: 'img', format: 'skip' },
      ],
    });
  }

  /**
   * Test connection to Resend API
   */
  async testConnection(): Promise<boolean> {
    try {
      // Resend doesn't have a dedicated ping endpoint
      // We'll check if the API key is valid by checking domains
      const response = await this.resend.domains.list();
      return !response.error;
    } catch (error) {
      this.logger.error(`Resend connection test failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Format a single recipient
   */
  private formatRecipient(recipient: MailRecipient): string {
    if (recipient.name) {
      return `${recipient.name} <${recipient.email}>`;
    }
    return recipient.email;
  }

  /**
   * Format multiple recipients
   */
  private formatRecipients(recipients: MailRecipient | MailRecipient[]): string | string[] {
    if (Array.isArray(recipients)) {
      return recipients.map((r) => this.formatRecipient(r));
    }
    return this.formatRecipient(recipients);
  }

  /**
   * Build tracking headers
   */
  private buildTrackingHeaders(tracking?: { clickTracking?: boolean; openTracking?: boolean }): Record<string, string> {
    const headers: Record<string, string> = {};

    if (tracking) {
      if (tracking.clickTracking === false) {
        headers['X-Click-Tracking'] = 'false';
      }
      if (tracking.openTracking === false) {
        headers['X-Open-Tracking'] = 'false';
      }
    }

    return headers;
  }

  /**
   * Build List-Unsubscribe headers
   */
  private buildUnsubscribeHeaders(unsubscribe?: UnsubscribeConfig): Record<string, string> {
    const headers: Record<string, string> = {};

    if (unsubscribe) {
      const unsubscribeValues: string[] = [];

      if (unsubscribe.email) {
        unsubscribeValues.push(`<mailto:${unsubscribe.email}>`);
      }

      if (unsubscribe.url) {
        unsubscribeValues.push(`<${unsubscribe.url}>`);
      }

      if (unsubscribeValues.length > 0) {
        headers['List-Unsubscribe'] = unsubscribeValues.join(', ');
      }

      // RFC 8058 one-click unsubscribe
      if (unsubscribe.oneClick && unsubscribe.url) {
        headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
      }
    }

    return headers;
  }

  /**
   * Delay helper for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
