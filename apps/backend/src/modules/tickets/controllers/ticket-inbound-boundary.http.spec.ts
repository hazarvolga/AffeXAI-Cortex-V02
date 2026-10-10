import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { TicketEmailWebhookController } from './ticket-email-webhook.controller';
import { TicketEmailParserService } from '../services/ticket-email-parser.service';

describe('legacy ticket inbound capability boundary', () => {
 let app: INestApplication;
 const parser = { processInboundEmail: jest.fn().mockResolvedValue({ id: 'foreign-ticket' }) };
 beforeAll(async () => { const module = await Test.createTestingModule({ controllers: [TicketEmailWebhookController], providers: [{ provide: TicketEmailParserService, useValue: parser }] }).compile(); app = module.createNestApplication(); await app.init(); });
 afterAll(async () => app.close()); beforeEach(() => jest.clearAllMocks());
 it.each(['sendgrid','mailgun','postmark','resend','generic'])('fails closed before parsing unsigned %s inbound mail', async provider => {
  const response = await request(app.getHttpServer()).post(`/webhooks/tickets/email/${provider}`).set('x-tenant-id','victim-tenant').set('svix-signature','forged').send({ from:'victim@example.test', subject:'[Ticket #foreign-ticket]', inReplyTo:'known-message', textBody:'forged customer reply' }).expect(503);
  expect(response.body.message).toMatch(/reply capability/i); expect(parser.processInboundEmail).not.toHaveBeenCalled();
 });
 it('also rejects direct parser invocation without authority before repository access', async () => {
  const tickets = { findOne: jest.fn() }; const messages = { findOne: jest.fn(), save: jest.fn() };
  const service = new TicketEmailParserService();
  await expect(service.processInboundEmail({ from:'victim@example.test', to:'help@example.test', subject:'reply', messageId:'forged-message', inReplyTo:'known-message', textBody:'forged reply', receivedAt:new Date() })).rejects.toMatchObject({ status:503 });
  expect(tickets.findOne).not.toHaveBeenCalled(); expect(messages.findOne).not.toHaveBeenCalled(); expect(messages.save).not.toHaveBeenCalled();
 });
});
