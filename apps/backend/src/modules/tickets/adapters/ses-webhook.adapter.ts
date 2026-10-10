import { Injectable } from '@nestjs/common';
import { EmailWebhookAdapter } from '../interfaces/email-webhook-adapter.interface';
import { ParsedEmail } from '../services/ticket-email-parser.service';

/**
 * AWS SES Email Provider Webhook Adapter
 * Converts AWS SES SNS notification format to standardized ParsedEmail
 *
 * AWS SES Webhook Documentation:
 * https://docs.aws.amazon.com/ses/latest/dg/receiving-email-notifications.html
 */
@Injectable()
export class SESWebhookAdapter implements EmailWebhookAdapter {

  /**
   * Convert SES SNS notification payload to ParsedEmail
   * SES format: { Message: { mail: {...}, content: "..." } }
   */
  convertToStandardFormat(payload: any): ParsedEmail {
    // AWS SES sends data via SNS, need to parse Message JSON
    let messageData = payload;

    // If payload contains SNS Message, parse it
    if (payload.Message && typeof payload.Message === 'string') {
      try {
        messageData = JSON.parse(payload.Message);
      } catch (error) {
        // If parsing fails, use payload as is
      }
    }

    const mail = messageData.mail || {};
    const commonHeaders = mail.commonHeaders || {};

    // Parse email content (usually base64 encoded)
    const content = messageData.content || '';
    const parsedContent = this.parseEmailContent(content);

    return {
      from: commonHeaders.from?.[0] || mail.source,
      fromName: this.extractName(commonHeaders.from?.[0]),
      to: commonHeaders.to?.[0] || mail.destination?.[0],
      subject: commonHeaders.subject || '',
      textBody: parsedContent.text || '',
      htmlBody: parsedContent.html,
      inReplyTo: commonHeaders.inReplyTo,
      references: this.parseReferences(commonHeaders.references),
      messageId: commonHeaders.messageId || mail.messageId || `<ses-${Date.now()}@affexai.com>`,
      receivedAt: mail.timestamp ? new Date(mail.timestamp) : new Date(),
      attachments: [], // SES doesn't provide parsed attachments in webhook, would need to parse MIME
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
   * Validate SES webhook (SNS signature verification)
   */
  validateWebhook(payload: any, headers: Record<string, string>): boolean {
    // AWS SNS provides signature verification
    // For production, you should verify SNS signature
    // https://docs.aws.amazon.com/sns/latest/dg/sns-verify-signature-of-message.html

    // Basic validation: check if it's from SNS
    if (payload.Type && (payload.Type === 'Notification' || payload.Type === 'SubscriptionConfirmation')) {
      return true;
    }

    return false;
  }

  /**
   * Parse email content (may be base64 encoded MIME)
   */
  private parseEmailContent(content: string): { text?: string; html?: string } {
    // SES provides raw MIME content, basic parsing
    // For full MIME parsing, would need a library like mailparser

    if (!content) return {};

    // Simple extraction (not comprehensive)
    const textMatch = content.match(/Content-Type: text\/plain[\s\S]*?\n\n([\s\S]*?)(?=\n--)/);
    const htmlMatch = content.match(/Content-Type: text\/html[\s\S]*?\n\n([\s\S]*?)(?=\n--)/);

    return {
      text: textMatch ? textMatch[1].trim() : undefined,
      html: htmlMatch ? htmlMatch[1].trim() : undefined,
    };
  }

  /**
   * Parse References header (space or comma-separated message IDs)
   */
  private parseReferences(referencesString?: string): string[] {
    if (!referencesString) return [];
    return referencesString.split(/[\s,]+/).filter(ref => ref.length > 0);
  }

  /**
   * Extract name from email address
   * "John Doe <john@example.com>" -> "John Doe"
   */
  private extractName(emailString?: string): string | undefined {
    if (!emailString) return undefined;
    const match = emailString.match(/^([^<]+)<(.+)>$/);
    return match ? match[1].trim() : undefined;
  }
}
