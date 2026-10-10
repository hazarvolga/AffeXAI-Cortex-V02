import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { Ticket } from '../entities/ticket.entity';

export interface ParsedEmail {
  from: string;
  fromName?: string;
  to: string;
  subject: string;
  textBody: string;
  htmlBody?: string;
  inReplyTo?: string; // For threading
  references?: string[]; // For threading
  messageId: string;
  receivedAt: Date;
  attachments?: ParsedAttachment[];
}

export interface ParsedAttachment {
  filename: string;
  contentType: string;
  content: Buffer;
  size: number;
}

/** Inbound mutation is unavailable until a persisted, scoped reply capability exists. */
@Injectable()
export class TicketEmailParserService {
  async processInboundEmail(_email: ParsedEmail): Promise<Ticket> {
    // Provider signature alone cannot authorize a From/header-selected ticket.
    throw new ServiceUnavailableException('Inbound ticket reply capability is not configured');
  }

  validateEmail(email: string): boolean {
    return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
