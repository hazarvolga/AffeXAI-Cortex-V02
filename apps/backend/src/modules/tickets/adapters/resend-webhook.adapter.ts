import { Injectable } from '@nestjs/common';
import { EmailWebhookAdapter } from '../interfaces/email-webhook-adapter.interface';
import { ParsedEmail } from '../services/ticket-email-parser.service';

/**
 * Resend Email Provider Webhook Adapter
 * Converts Resend webhook format to standardized ParsedEmail
 *
 * Resend Webhook Documentation:
 * https://resend.com/docs/api-reference/emails/receive-email
 */
@Injectable()
export class ResendWebhookAdapter implements EmailWebhookAdapter {

  /**
   * Convert Resend webhook payload to ParsedEmail
   * Resend format: { from, to, subject, text, html, in_reply_to, references, message_id, received_at, attachments }
   */
  convertToStandardFormat(payload: any): ParsedEmail {
    return {
      from: payload.from || payload.from_email,
      fromName: payload.from_name,
      to: payload.to,
      subject: payload.subject || '',
      textBody: payload.text || '',
      htmlBody: payload.html,
      inReplyTo: payload.in_reply_to || payload.inReplyTo,
      references: payload.references || [],
      messageId: payload.message_id || payload.messageId || `<resend-${Date.now()}@affexai.com>`,
      receivedAt: payload.received_at ? new Date(payload.received_at) : new Date(),
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
   * Validate Resend webhook signature (optional, if configured)
   */
  validateWebhook(payload: any, headers: Record<string, string>): boolean {
    // Resend currently doesn't provide webhook signature validation
    // You can add custom validation here if needed
    return true;
  }

  /**
   * Convert Resend attachments to ParsedAttachment format
   */
  private convertAttachments(attachments: any[]): any[] {
    return attachments.map(att => ({
      filename: att.filename || att.name,
      contentType: att.content_type || att.contentType,
      content: att.content ? Buffer.from(att.content, 'base64') : Buffer.from(''),
      size: att.size || 0,
    }));
  }
}
