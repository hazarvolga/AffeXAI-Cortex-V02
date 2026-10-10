import { Injectable } from '@nestjs/common';
import { EmailWebhookAdapter } from '../interfaces/email-webhook-adapter.interface';
import { ParsedEmail } from '../services/ticket-email-parser.service';

/**
 * SendGrid Email Provider Webhook Adapter
 * Converts SendGrid Inbound Parse webhook format to standardized ParsedEmail
 *
 * SendGrid Webhook Documentation:
 * https://docs.sendgrid.com/for-developers/parsing-email/setting-up-the-inbound-parse-webhook
 */
@Injectable()
export class SendGridWebhookAdapter implements EmailWebhookAdapter {

  /**
   * Convert SendGrid webhook payload to ParsedEmail
   * SendGrid format: { from, to, subject, text, html, headers, attachments }
   */
  convertToStandardFormat(payload: any): ParsedEmail {
    // SendGrid sends headers as a string, parse it
    const headers = this.parseHeaders(payload.headers || '');

    return {
      from: payload.from,
      fromName: this.extractName(payload.from),
      to: payload.to,
      subject: payload.subject || '',
      textBody: payload.text || '',
      htmlBody: payload.html,
      inReplyTo: headers['in-reply-to'] || headers['In-Reply-To'],
      references: this.parseReferences(headers['references'] || headers['References']),
      messageId: headers['message-id'] || headers['Message-ID'] || `<sendgrid-${Date.now()}@affexai.com>`,
      receivedAt: new Date(),
      attachments: this.convertAttachments(payload.attachments || payload.attachment_info || []),
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
   * Validate SendGrid webhook (optional)
   */
  validateWebhook(payload: any, headers: Record<string, string>): boolean {
    // SendGrid doesn't provide signature validation for Inbound Parse
    // You can add custom validation here if needed
    return true;
  }

  /**
   * Parse email headers from SendGrid format
   * SendGrid sends headers as multiline string
   */
  private parseHeaders(headersString: string): Record<string, string> {
    const headers: Record<string, string> = {};
    const lines = headersString.split('\n');

    lines.forEach(line => {
      const match = line.match(/^([^:]+):\s*(.+)$/);
      if (match) {
        headers[match[1].trim()] = match[2].trim();
      }
    });

    return headers;
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
   * Convert SendGrid attachments to ParsedAttachment format
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
      contentType: att.type || att.content_type || att.contentType,
      content: att.content ? Buffer.from(att.content, 'base64') : Buffer.from(''),
      size: att.content_length || att.size || 0,
    }));
  }
}
