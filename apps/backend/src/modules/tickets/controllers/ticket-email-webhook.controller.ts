import {
  Controller,
  CanActivate,
  UseGuards,
  ServiceUnavailableException,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TicketEmailParserService } from '../services/ticket-email-parser.service';
import type { ParsedEmail } from '../services/ticket-email-parser.service';

/**
 * Ticket Email Webhook Controller
 * Receives inbound emails from email service providers
 *
 * Supported providers:
 * - SendGrid Inbound Parse
 * - Mailgun Routes
 * - Postmark Inbound
 * - Custom SMTP forwarding
 */

/** Provider signatures alone cannot authorize a ticket author or thread. */
class TicketInboundUnavailableGuard implements CanActivate {
  canActivate(): never {
    throw new ServiceUnavailableException('Inbound ticket reply capability is not configured');
  }
}

@ApiTags('Ticket Email Webhooks')
@Controller('webhooks/tickets/email')
@UseGuards(TicketInboundUnavailableGuard)
export class TicketEmailWebhookController {
  private readonly logger = new Logger(TicketEmailWebhookController.name);

  constructor(
    private readonly emailParserService: TicketEmailParserService,
  ) {}

  /**
   * SendGrid Inbound Parse Webhook
   * https://docs.sendgrid.com/for-developers/parsing-email/setting-up-the-inbound-parse-webhook
   */
  @Post('sendgrid')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'SendGrid inbound email webhook' })
  @ApiResponse({ status: 200, description: 'Email processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid email data' })
  async handleSendGridWebhook(@Body() payload: any): Promise<{ success: boolean; ticketId?: string }> {
    try {
      this.logger.log('Received SendGrid webhook');

      const parsedEmail: ParsedEmail = {
        from: payload.from,
        fromName: payload.from_name,
        to: payload.to,
        subject: payload.subject,
        textBody: payload.text,
        htmlBody: payload.html,
        messageId: payload.headers?.['Message-ID'] || payload.message_id,
        inReplyTo: payload.headers?.['In-Reply-To'],
        references: payload.headers?.References?.split(' '),
        receivedAt: new Date(),
        attachments: this.parseSendGridAttachments(payload),
      };

      const ticket = await this.emailParserService.processInboundEmail(parsedEmail);

      return {
        success: true,
        ticketId: ticket.id,
      };
    } catch (error) {
      this.logger.error(`SendGrid webhook error: ${error.message}`, error.stack);
      return { success: false };
    }
  }

  /**
   * Mailgun Inbound Webhook
   * https://documentation.mailgun.com/en/latest/user_manual.html#routes
   */
  @Post('mailgun')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mailgun inbound email webhook' })
  @ApiResponse({ status: 200, description: 'Email processed successfully' })
  async handleMailgunWebhook(@Body() payload: any): Promise<{ success: boolean; ticketId?: string }> {
    try {
      this.logger.log('Received Mailgun webhook');

      const parsedEmail: ParsedEmail = {
        from: payload.sender || payload.from,
        to: payload.recipient || payload.to,
        subject: payload.subject,
        textBody: payload['body-plain'] || payload.text,
        htmlBody: payload['body-html'] || payload.html,
        messageId: payload['Message-Id'] || payload.message_id,
        inReplyTo: payload['In-Reply-To'],
        references: payload.References?.split(' '),
        receivedAt: new Date(payload.timestamp * 1000),
        attachments: this.parseMailgunAttachments(payload),
      };

      const ticket = await this.emailParserService.processInboundEmail(parsedEmail);

      return {
        success: true,
        ticketId: ticket.id,
      };
    } catch (error) {
      this.logger.error(`Mailgun webhook error: ${error.message}`, error.stack);
      return { success: false };
    }
  }

  /**
   * Postmark Inbound Webhook
   * https://postmarkapp.com/developer/webhooks/inbound-webhook
   */
  @Post('postmark')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Postmark inbound email webhook' })
  @ApiResponse({ status: 200, description: 'Email processed successfully' })
  async handlePostmarkWebhook(@Body() payload: any): Promise<{ success: boolean; ticketId?: string }> {
    try {
      this.logger.log('Received Postmark webhook');

      const parsedEmail: ParsedEmail = {
        from: payload.From,
        fromName: payload.FromName,
        to: payload.To,
        subject: payload.Subject,
        textBody: payload.TextBody,
        htmlBody: payload.HtmlBody,
        messageId: payload.MessageID,
        inReplyTo: payload.Headers?.find((h: any) => h.Name === 'In-Reply-To')?.Value,
        references: payload.Headers?.find((h: any) => h.Name === 'References')?.Value?.split(' '),
        receivedAt: new Date(payload.Date),
        attachments: this.parsePostmarkAttachments(payload.Attachments),
      };

      const ticket = await this.emailParserService.processInboundEmail(parsedEmail);

      return {
        success: true,
        ticketId: ticket.id,
      };
    } catch (error) {
      this.logger.error(`Postmark webhook error: ${error.message}`, error.stack);
      return { success: false };
    }
  }

  /**
   * Resend Inbound Webhook
   * https://resend.com/docs/api-reference/emails/webhooks
   */
  @Post('resend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend inbound email webhook' })
  @ApiResponse({ status: 200, description: 'Email processed successfully' })
  async handleResendWebhook(@Body() payload: any): Promise<{ success: boolean; ticketId?: string }> {
    try {
      this.logger.log('Received Resend webhook');

      const parsedEmail: ParsedEmail = {
        from: payload.from,
        fromName: payload.from_name,
        to: payload.to,
        subject: payload.subject,
        textBody: payload.text || payload.body_text,
        htmlBody: payload.html || payload.body_html,
        messageId: payload.message_id || payload.headers?.['message-id'],
        inReplyTo: payload.headers?.['in-reply-to'],
        references: payload.headers?.references?.split(' '),
        receivedAt: new Date(),
        attachments: payload.attachments || [],
      };

      const ticket = await this.emailParserService.processInboundEmail(parsedEmail);

      return {
        success: true,
        ticketId: ticket.id,
      };
    } catch (error) {
      this.logger.error(`Resend webhook error: ${error.message}`, error.stack);
      return { success: false };
    }
  }

  /**
   * Generic webhook for custom email forwarding
   */
  @Post('generic')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generic inbound email webhook' })
  @ApiResponse({ status: 200, description: 'Email processed successfully' })
  async handleGenericWebhook(
    @Body() payload: ParsedEmail,
  ): Promise<{ success: boolean; ticketId?: string }> {
    try {
      this.logger.log('Received generic webhook');

      const ticket = await this.emailParserService.processInboundEmail(payload);

      return {
        success: true,
        ticketId: ticket.id,
      };
    } catch (error) {
      this.logger.error(`Generic webhook error: ${error.message}`, error.stack);
      return { success: false };
    }
  }

  /**
   * Parse SendGrid attachments
   */
  private parseSendGridAttachments(payload: any): any[] {
    if (!payload.attachments) return [];

    return Object.keys(payload.attachments).map((key) => {
      const attachment = payload.attachments[key];
      return {
        filename: attachment.filename,
        contentType: attachment.type,
        content: Buffer.from(attachment.content, 'base64'),
        size: attachment.content.length,
      };
    });
  }

  /**
   * Parse Mailgun attachments
   */
  private parseMailgunAttachments(payload: any): any[] {
    if (!payload.attachments) return [];

    return payload.attachments.map((attachment: any) => ({
      filename: attachment.name,
      contentType: attachment['content-type'],
      content: Buffer.from(attachment.content, 'base64'),
      size: attachment.size,
    }));
  }

  /**
   * Parse Postmark attachments
   */
  private parsePostmarkAttachments(attachments: any[]): any[] {
    if (!attachments || attachments.length === 0) return [];

    return attachments.map((attachment: any) => ({
      filename: attachment.Name,
      contentType: attachment.ContentType,
      content: Buffer.from(attachment.Content, 'base64'),
      size: attachment.ContentLength,
    }));
  }
}
