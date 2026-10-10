import { EmailEventListener } from './email-event.listener';
describe('email event tenant forwarding', () => {
 const mail = { sendMail: jest.fn().mockResolvedValue({ success: true }) };
 const listener = new EmailEventListener(mail as never, { getFrontendUrl: jest.fn().mockResolvedValue('https://example.test') } as never);
 beforeEach(() => jest.clearAllMocks());
 it('forwards user creation tenant explicitly', async () => {
  await listener.handleUserCreated({ userId: 'u', email: 'u@example.test', firstName: 'A', lastName: 'B', resetToken: 'local-fixture', tenantId: 'tenant-a' });
  expect(mail.sendMail).toHaveBeenCalledWith(expect.any(Object), 'tenant-a');
 });
 it.each([true, false])('forwards ticket notification tenant for customer-origin=%p', async isFromCustomer => {
  await listener.handleTicketMessageCreated({ ticketId: 't', messageId: 'm', isFromCustomer, customerEmail: 'a@example.test', customerName: 'A', supportEmail: 'b@example.test', supportName: 'B', ticketSubject: 'Fixture', messageContent: 'Fixture', tenantId: 'tenant-b' });
  expect(mail.sendMail).toHaveBeenCalledWith(expect.any(Object), 'tenant-b');
 });
});
