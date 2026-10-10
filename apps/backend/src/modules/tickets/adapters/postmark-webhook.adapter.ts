import { Injectable } from '@nestjs/common';
import { EmailWebhookAdapter } from '../interfaces/email-webhook-adapter.interface';
import { ParsedEmail } from '../services/ticket-email-parser.service';

/**
 * Postmark Email Provider Webhook Adapter
 * Converts Postmark Inbound webhook format to standardized ParsedEmail
 *
 * Postmark Webhook Documentation:
 * https://postmarkapp.com/developer/webhooks/inbound-webhook
 */
@Injectable()
export class PostmarkWebhookAdapter implements EmailWebhookAdapter {

  /**
   * Convert Postmark webhook payload to ParsedEmail
   * Postmark format: { From, To, Subject, TextBody, HtmlBody, MessageID, Headers, Attachments }
   */
  convertToStandardFormat(payload: any): ParsedEmail {
    return {
      from: payload.From || payload.FromFull?.Email,
      fromName: payload.FromFull?.Name || payload.FromName,
      to: payload.To || payload.ToFull?.[0]?.Email,
      subject: payload.Subject || '',
      textBody: payload.TextBody || payload.StrippedTextReply || '',
      htmlBody: payload.HtmlBody,
      inReplyTo: this.getHeader(payload.Headers, 'In-Reply-To'),
      references: this.parseReferences(this.getHeader(payload.Headers, 'References')),
      messageId: payload.MessageID || `<postmark-${Date.now()}@affexai.com>`,
      receivedAt: payload.Date ? new Date(payload.Date) : new Date(),
      attachments: this.convertAttachments(payload.Attachments || []),
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
   * Validate Postmark webhook (optional)
   */
  validateWebhook(payload: any, headers: Record<string, string>): boolean {
    // Postmark doesn't provide signature validation for inbound webhooks
    // You can add custom validation here if needed
    return true;
  }

  /**
   * Get header value from Postmark Headers array
   * Headers format: [{ Name: 'In-Reply-To', Value: '<...>' }]
   */
  private getHeader(headers: any[], name: string): string | undefined {
    if (!Array.isArray(headers)) return undefined;
    const header = headers.find(h => h.Name?.toLowerCase() === name.toLowerCase());
    return header?.Value;
  }

  /**
   * Parse References header (space-separated message IDs)
   */
  private parseReferences(referencesString?: string): string[] {
    if (!referencesString) return [];
    return referencesString.split(/\s+/).filter(ref => ref.length > 0);
  }

  /**
   * Convert Postmark attachments to ParsedAttachment format
   */
  private convertAttachments(attachments: any[]): any[] {
    return attachments.map(att => ({
      filename: att.Name,
      contentType: att.ContentType,
      content: att.Content ? Buffer.from(att.Content, 'base64') : Buffer.from(''),
      size: att.ContentLength || 0,
    }));
  }
}
