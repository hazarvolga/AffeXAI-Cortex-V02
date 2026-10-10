import { randomUUID } from 'node:crypto';
import { ServiceUnavailableException } from '@nestjs/common';
import { TicketEmailService } from './ticket-email.service';

describe('TicketEmailService delivery behavior', () => {
  const tenantId = 'tenant-fixture';
  const customer = { id: randomUUID(), tenantId, email: 'customer@example.test', firstName: 'XYZ', lastName: 'Customer', isActive: true };
  const agent = { id: randomUUID(), tenantId, email: 'agent@example.test', firstName: 'Support', lastName: 'Agent', isActive: true };
  const ticket = {
    id: randomUUID(), tenantId, userId: customer.id, user: customer, assignedTo: agent,
    displayNumber: 'SUP-FIXTURE', subject: 'Fixture ticket', description: 'Fixture',
    priority: 'medium', status: 'open', createdAt: new Date(), category: { name: 'Support' },
  };
  const message = {
    id: randomUUID(), tenantId, ticketId: ticket.id, content: 'Fixture reply',
    isInternal: false, author: agent,
  };
  const mail = { sendMail: jest.fn() };
  const settings = {
    getSiteSettings: jest.fn().mockResolvedValue({ siteName: 'AffeXAI Cortex' }),
    getDomain: jest.fn().mockResolvedValue('example.test'),
  };
  const ticketRepository = { findOne: jest.fn() };
  const messageRepository = { findOne: jest.fn() };
  const userRepository = { findOne: jest.fn() };
  let service: TicketEmailService;

  beforeEach(() => {
    jest.clearAllMocks();
    mail.sendMail.mockResolvedValue({ success: true });
    ticketRepository.findOne.mockResolvedValue(ticket);
    messageRepository.findOne.mockResolvedValue(message);
    userRepository.findOne.mockImplementation(async ({ where }) => [customer, agent].find(user => user.id === where.id && user.tenantId === where.tenantId));
    service = new TicketEmailService(mail as never, settings as never, ticketRepository as never, messageRepository as never, userRepository as never);
  });

  it('sends the created notification with the stored customer and explicit tenant', async () => {
    await service.sendTicketCreatedEmail(ticket as never, customer as never);
    expect(mail.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: expect.objectContaining({ email: customer.email }),
      template: 'ticket-created-customer',
    }), tenantId);
  });

  it('reloads the message before choosing customer visibility', async () => {
    messageRepository.findOne.mockResolvedValue({ ...message, isInternal: true });
    await expect(service.sendNewMessageEmail(ticket as never, { ...message, isInternal: false } as never, customer as never, false))
      .rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(mail.sendMail).not.toHaveBeenCalled();
  });

  it('rejects a message that is not stored under the ticket and tenant', async () => {
    messageRepository.findOne.mockResolvedValue(null);
    await expect(service.sendNewMessageEmail(ticket as never, message as never, customer as never, false))
      .rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('fails truthfully when the provider rejects delivery', async () => {
    mail.sendMail.mockResolvedValue({ success: false });
    await expect(service.sendTicketAssignedEmail(ticket as never, agent as never, agent as never))
      .rejects.toMatchObject({ status: 503, message: 'Ticket email delivery unavailable' });
  });

  it('reloads the resolved ticket customer before sending a survey', async () => {
    await service.sendTicketResolved(ticket as never, 'survey-token');
    expect(ticketRepository.findOne).toHaveBeenCalled();
    expect(userRepository.findOne).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: customer.id, tenantId }) }));
    expect(mail.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: expect.objectContaining({ email: customer.email }),
      template: 'csat-survey',
    }), tenantId);
  });

  it('does not use a global mailbox for an unassigned SLA alert', async () => {
    ticketRepository.findOne.mockResolvedValue({ ...ticket, assignedTo: null });
    await expect(service.sendSLABreachAlert(ticket as never, 'resolution'))
      .rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(mail.sendMail).not.toHaveBeenCalled();
  });
});
