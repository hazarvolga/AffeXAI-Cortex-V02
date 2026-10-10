import { Injectable } from '@nestjs/common';
import { EmailWebhookAdapter } from '../interfaces/email-webhook-adapter.interface';
import { ParsedEmail } from '../services/ticket-email-parser.service';
import * as crypto from 'crypto';

/**
 * Mailgun Email Provider Webhook Adapter
 * Converts Mailgun Routes webhook format to standardized ParsedEmail
 *
 * Mailgun Webhook Documentation:
 * https://documentation.mailgun.com/en/latest/user_manual.html#receiving-forwarding-and-storing-messages
 */
@Injectable()
export class MailgunWebhookAdapter implements EmailWebhookAdapter {

  /**
   * Convert Mailgun webhook payload to ParsedEmail
   * Mailgun format: { sender, recipient, subject, body-plain, body-html, In-Reply-To, References, Message-Id, attachments }
   */
  convertToStandardFormat(payload: any): ParsedEmail {
    return {
      from: payload.sender || payload.from,
      fromName: this.extractName(payload.sender || payload.from),
      to: payload.recipient || payload.to,
      subject: payload.subject || payload.Subject || '',
      textBody: payload['body-plain'] || payload['stripped-text'] || '',
      htmlBody: payload['body-html'] || payload['stripped-html'],
      inReplyTo: payload['In-Reply-To'],
      references: this.parseReferences(payload['References']),
      messageId: payload['Message-Id'] || payload['message-id'] || `<mailgun-${Date.now()}@affexai.com>`,
      receivedAt: payload.timestamp ? new Date(parseInt(payload.timestamp) * 1000) : new Date(),
      attachments: this.convertAttachments(payload.attachments || []),
    };
  }

  /**
   * Extract ticket ID from recipient email
   * Format: ticket-{uuid}@affexai.com
   */
  extractTicketId(recipientEmail: string): string | null {
    const match = recipientEmail.match(/ticket-([0-9a-f-]+)@/i);
    return match ? match[1] : null;
  }

  /**
   * Validate Mailgun webhook signature
   * Mailgun provides signature verification for webhook security
   */
  validateWebhook(payload: any, headers: Record<string, string>): boolean {
    const apiKey = process.env.MAILGUN_API_KEY;
    if (!apiKey) {
      // If no API key configured, skip validation (not recommended for production)
      return true;
    }

    const { signature, timestamp, token } = payload;
    if (!signature || !timestamp || !token) {
      return false;
    }

    // Verify timestamp is recent (within 15 minutes)
    const currentTime = Math.floor(Date.now() / 1000);
    if (Math.abs(currentTime - parseInt(timestamp)) > 900) {
      return false;
    }

    // Verify signature
    const hmac = crypto.createHmac('sha256', apiKey);
    hmac.update(timestamp + token);
    const calculatedSignature = hmac.digest('hex');

    return calculatedSignature === signature;
  }

  /**
   * Parse References header (space-separated message IDs)
   */
  private parseReferences(referencesString?: string): string[] {
    if (!referencesString) return [];
    return referencesString.split(/\s+/).filter(ref => ref.length > 0);
  }

  /**
   * Extract name from email address
   * "John Doe <john@example.com>" -> "John Doe"
   */
  private extractName(emailString: string): string | undefined {
    const match = emailString.match(/^([^<]+)<(.+)>$/);
    return match ? match[1].trim() : undefined;
  }

  /**
   * Convert Mailgun attachments to ParsedAttachment format
   */
  private convertAttachments(attachments: any): any[] {
    if (typeof attachments === 'string') {
      try {
        attachments = JSON.parse(attachments);
      } catch {
        return [];
      }
    }

    if (!Array.isArray(attachments)) return [];

    return attachments.map(att => ({
      filename: att.filename || att.name,
      contentType: att['content-type'] || att.contentType,
      content: att.content ? Buffer.from(att.content, 'base64') : Buffer.from(''),
      size: att.size || 0,
    }));
  }
}
