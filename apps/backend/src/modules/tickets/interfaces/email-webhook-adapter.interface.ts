import { ParsedEmail } from '../services/ticket-email-parser.service';

/**
 * Email Webhook Adapter Interface
 * Converts provider-specific webhook payloads to standardized ParsedEmail format
 */
export interface EmailWebhookAdapter {
  /**
   * Convert provider-specific webhook payload to ParsedEmail
   * @param payload Raw webhook payload from email provider
   * @returns Standardized ParsedEmail object
   */
  convertToStandardFormat(payload: any): ParsedEmail;

  /**
   * Validate webhook signature/authentication (optional)
   * @param payload Raw webhook payload
   * @param headers Request headers (for signature verification)
   * @returns True if valid, false otherwise
   */
  validateWebhook?(payload: any, headers: Record<string, string>): boolean;

  /**
   * Extract ticket ID from recipient email (domain-agnostic)
   * @param recipientEmail Email address (e.g., ticket-{uuid}@{domain})
   * @returns Ticket ID (UUID) or null
   * @example
   * extractTicketId('ticket-123e4567-e89b-12d3-a456-426614174000@affexai.com') // '123e4567-e89b-12d3-a456-426614174000'
   * extractTicketId('ticket-123e4567-e89b-12d3-a456-426614174000@example.com') // '123e4567-e89b-12d3-a456-426614174000'
   */
  extractTicketId(recipientEmail: string): string | null;
}
