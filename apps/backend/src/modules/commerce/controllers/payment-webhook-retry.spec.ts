import { PaymentWebhookController } from './payment.webhook.controller';

describe('PaymentWebhookController retry contract', () => {
  const previousSecret = process.env.STRIPE_WEBHOOK_SECRET;
  afterAll(() => { if (previousSecret === undefined) delete process.env.STRIPE_WEBHOOK_SECRET; else process.env.STRIPE_WEBHOOK_SECRET = previousSecret; });

  it('propagates provisioning failures so Stripe can retry', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'fixture-secret';
    const failure = new Error('transient database outage');
    const stripe = { constructEvent: jest.fn().mockReturnValue({ type: 'checkout.session.completed', data: { object: { id: 'session' } } }) };
    const provisioning = { provisionTenantFromCheckout: jest.fn().mockRejectedValue(failure) };
    const controller = new PaymentWebhookController(stripe as never, {} as never, provisioning as never);
    await expect(controller.handleStripeWebhook('signature', { rawBody: Buffer.from('{}') } as never)).rejects.toBe(failure);
  });
});
