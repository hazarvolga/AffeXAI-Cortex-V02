import { HttpService } from '@nestjs/axios';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { Webhook } from '../entities/webhook.entity';
import { WebhookService } from './webhook.service';
import { BadRequestException } from '@nestjs/common';
import { lookup } from 'node:dns/promises';

jest.mock('node:dns/promises', () => ({ lookup: jest.fn() }));

describe('WebhookService', () => {
  const repository = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => value),
    findOne: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(), andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    })),
  };
  const http = { post: jest.fn() };
  let service: WebhookService;
  const webhook = () => ({
    id: '1c06d65a-096e-4f19-acf8-eaf0cb49ba85', tenantId: 'tenant-a',
    name: 'CRM receiver', url: 'https://example.test/hook', retryCount: 0,
    retryDelay: 0, timeout: 1000, customHeaders: {},
    getAuthHeaders: jest.fn(() => ({})), recordCall: jest.fn(),
  }) as any;
  const event = {
    id: '8f890f69-7e27-4a7f-a80c-89f3b6799301', tenantId: 'tenant-a',
    eventType: 'crm.lead.captured', source: 'crm', payload: {}, createdAt: new Date(),
  } as any;

  beforeEach(async () => {
    process.env.WEBHOOK_ALLOWED_HOSTS = 'example.test,hooks.example.com';
    const module = await Test.createTestingModule({ providers: [
      WebhookService,
      { provide: getRepositoryToken(Webhook), useValue: repository },
      { provide: HttpService, useValue: http },
    ] }).compile();
    service = module.get(WebhookService);
    jest.clearAllMocks();
    (lookup as jest.MockedFunction<typeof lookup>).mockResolvedValue([
      { address: '8.8.8.8', family: 4 },
    ] as any);
  });

  it('records a successful delivery', async () => {
    const target = webhook();
    http.post.mockReturnValue(of({ status: 202 }));
    await service.triggerWebhook(target, event, 'evt-rule-action');
    expect(target.recordCall).toHaveBeenCalledWith(true, 202);
    expect(repository.save).toHaveBeenCalledWith(target);
    expect(http.post).toHaveBeenCalledWith(
      target.url,
      expect.any(Object),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Idempotency-Key': 'evt-rule-action',
          'User-Agent': 'AffeXAI-Cortex-Webhook/1.0',
        }),
        maxRedirects: 0,
        proxy: false,
        httpsAgent: expect.any(Object),
      }),
    );
  });

  it('rejects non-HTTPS and non-allowlisted destinations before any request', async () => {
    await expect(service.triggerWebhook({ ...webhook(), url: 'http://example.test/hook' }, event))
      .rejects.toBeInstanceOf(BadRequestException);
    await expect(service.triggerWebhook({ ...webhook(), url: 'https://metadata.internal/hook' }, event))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(http.post).not.toHaveBeenCalled();
  });

  it('rejects non-standard ports and private or mixed DNS answers before sending', async () => {
    await expect(service.triggerWebhook({ ...webhook(), url: 'https://example.test:8443/hook' }, event))
      .rejects.toBeInstanceOf(BadRequestException);

    (lookup as jest.MockedFunction<typeof lookup>).mockResolvedValueOnce([
      { address: '127.0.0.1', family: 4 },
    ] as any);
    await expect(service.triggerWebhook(webhook(), event))
      .rejects.toThrow('private or reserved');

    (lookup as jest.MockedFunction<typeof lookup>).mockResolvedValueOnce([
      { address: '8.8.8.8', family: 4 },
      { address: '10.0.0.1', family: 4 },
    ] as any);
    await expect(service.triggerWebhook(webhook(), event))
      .rejects.toThrow('private or reserved');
    expect(http.post).not.toHaveBeenCalled();
  });

  it('pins the validated DNS address in the HTTPS agent', async () => {
    http.post.mockImplementation((_url, _payload, config) => {
      const pinnedLookup = config.httpsAgent.options.lookup;
      const callback = jest.fn();
      pinnedLookup('example.test', { all: false }, callback);
      expect(callback).toHaveBeenCalledWith(null, '8.8.8.8', 4);
      return of({ status: 204 });
    });

    await service.triggerWebhook(webhook(), event);
    expect(lookup).toHaveBeenCalledWith('example.test', { all: true, verbatim: true });
  });

  it('projects event payload fields and excludes PII and metadata', async () => {
    const target = webhook();
    http.post.mockReturnValue(of({ status: 202 }));
    await service.triggerWebhook(target, {
      ...event,
      payload: {
        schemaVersion: 1,
        leadId: 'lead-1',
        customerId: 'customer-1',
        formId: 'form-1',
        submissionId: 'submission-1',
        email: 'person@example.test',
        profile: { phone: '+90 555 000 0000' },
      },
      metadata: { ipAddress: '203.0.113.10', userAgent: 'secret-agent' },
    });

    const sentPayload = http.post.mock.calls[0][1];
    expect(sentPayload.data).toEqual({
      schemaVersion: 1,
      leadId: 'lead-1',
      customerId: 'customer-1',
      formId: 'form-1',
      submissionId: 'submission-1',
    });
    expect(sentPayload).not.toHaveProperty('metadata');
    expect(JSON.stringify(sentPayload)).not.toContain('person@example.test');
  });

  it('emits the versioned cancellation contract with its documented reason', async () => {
    http.post.mockReturnValue(of({ status: 202 }));
    await service.triggerWebhook(webhook(), {
      ...event,
      eventType: 'event.cancelled',
      source: 'events',
      payload: {
        eventId: 'event-1',
        reason: 'venue unavailable',
        organizerEmail: 'organizer@example.test',
      },
    });

    expect(http.post.mock.calls[0][1]).toEqual({
      event: {
        schemaVersion: 2,
        id: event.id,
        type: 'event.cancelled',
        source: 'events',
        timestamp: event.createdAt,
      },
      data: {
        eventId: 'event-1',
        reason: 'venue unavailable',
      },
    });
  });

  it('redacts persisted authentication and custom-header values from API responses', () => {
    const redacted = service.redactForResponse({
      ...webhook(),
      authType: 'api_key',
      authConfig: { apiKey: 'secret-key', headerName: 'X-Partner-Key' },
      customHeaders: { 'X-Workspace-Token': 'workspace-secret' },
    });

    expect(redacted.authConfig).toEqual({ configured: true, headerName: 'X-Partner-Key' });
    expect(redacted.customHeaders).toEqual({ 'X-Workspace-Token': '[REDACTED]' });
    expect(JSON.stringify(redacted)).not.toContain('secret-key');
    expect(JSON.stringify(redacted)).not.toContain('workspace-secret');
  });

  it('preserves stored secrets when a redacted API response is PUT back', async () => {
    const current = {
      ...webhook(),
      authType: 'api_key',
      authConfig: { apiKey: 'secret-key', headerName: 'X-Partner-Key' },
      customHeaders: { 'X-Workspace-Token': 'workspace-secret' },
    };
    repository.findOne.mockResolvedValue(current);

    await service.update(current.id, {
      authConfig: { configured: true, headerName: 'X-Partner-Key' },
      customHeaders: { 'X-Workspace-Token': '[REDACTED]' },
    }, current.tenantId);

    expect(repository.update).toHaveBeenCalledWith(
      { id: current.id, tenantId: current.tenantId },
      { customHeaders: { 'X-Workspace-Token': 'workspace-secret' } },
    );
  });

  it('supports explicit secret replacement and clearing', async () => {
    const current = {
      ...webhook(),
      authType: 'api_key',
      authConfig: { apiKey: 'old-secret', headerName: 'X-Partner-Key' },
    };
    repository.findOne.mockResolvedValue(current);

    await service.update(current.id, {
      authConfig: { apiKey: 'new-secret', headerName: 'X-Partner-Key' },
    }, current.tenantId);
    expect(repository.update).toHaveBeenLastCalledWith(
      { id: current.id, tenantId: current.tenantId },
      { authConfig: { apiKey: 'new-secret', headerName: 'X-Partner-Key' } },
    );

    await service.update(current.id, {
      authType: 'none',
      authConfig: null,
    }, current.tenantId);
    expect(repository.update).toHaveBeenLastCalledWith(
      { id: current.id, tenantId: current.tenantId },
      { authType: 'none', authConfig: null },
    );
  });

  it('sanitizes persisted create fields and rejects unsafe custom headers', async () => {
    await expect(service.create({
      name: 'Receiver',
      url: 'https://example.test/hook',
      subscribedEvents: [event.eventType],
      customHeaders: { Host: 'internal', 'X-Safe': 'yes' },
      tenantId: 'attacker',
      totalCalls: 999,
    } as any, 'tenant-a')).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('persists only allowlisted fields and always stamps the authenticated tenant', async () => {
    await service.create({
      name: ' Receiver ',
      url: 'https://example.test/hook',
      subscribedEvents: [event.eventType],
      tenantId: 'attacker',
      totalCalls: 999,
    } as any, 'tenant-a');

    expect(repository.create).toHaveBeenCalledWith({
      name: 'Receiver',
      url: 'https://example.test/hook',
      subscribedEvents: [event.eventType],
      isActive: true,
      authType: 'none',
      tenantId: 'tenant-a',
    });
  });

  it('propagates exhausted delivery failure to the durable dispatcher', async () => {
    const target = webhook();
    http.post.mockReturnValue(throwError(() => new Error('provider unavailable')));
    await expect(service.triggerWebhook(target, event)).rejects.toThrow('Webhook failed');
    expect(target.recordCall).toHaveBeenCalledWith(false, undefined, 'provider unavailable');
  });

  it('does not retry permanent 4xx responses', async () => {
    const target = { ...webhook(), retryCount: 10 };
    const error = Object.assign(new Error('bad request'), {
      response: { status: 400, headers: {} },
    });
    http.post.mockReturnValue(throwError(() => error));

    await expect(service.triggerWebhook(target, event)).rejects.toThrow(
      'Webhook failed after 1 attempt: bad request',
    );
    expect(http.post).toHaveBeenCalledTimes(1);
    expect(target.recordCall).toHaveBeenCalledWith(false, 400, 'bad request');
  });

  it('does not retry permanent TLS certificate failures', async () => {
    const target = { ...webhook(), retryCount: 3 };
    const error = Object.assign(new Error('certificate has expired'), {
      code: 'CERT_HAS_EXPIRED',
    });
    http.post.mockReturnValue(throwError(() => error));

    await expect(service.triggerWebhook(target, event)).rejects.toThrow(
      'Webhook failed after 1 attempt: certificate has expired',
    );
    expect(http.post).toHaveBeenCalledTimes(1);
    expect(target.recordCall).toHaveBeenCalledWith(
      false,
      undefined,
      'certificate has expired',
    );
  });

  it('does not fail or resend a successful POST when success bookkeeping fails', async () => {
    const target = { ...webhook(), retryCount: 3 };
    http.post.mockReturnValue(of({ status: 202 }));
    repository.save.mockRejectedValueOnce(new Error('database unavailable'));

    await expect(service.triggerWebhook(target, event)).resolves.toBeUndefined();
    expect(http.post).toHaveBeenCalledTimes(1);
    expect(target.recordCall).toHaveBeenCalledWith(true, 202);
  });

  it('subtracts DNS time from the outbound request budget', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(0);
    (lookup as jest.MockedFunction<typeof lookup>).mockImplementationOnce(async () => {
      jest.setSystemTime(44_999);
      return [{ address: '8.8.8.8', family: 4 }] as any;
    });
    http.post.mockReturnValue(of({ status: 202 }));

    try {
      await service.triggerWebhook({ ...webhook(), timeout: 60_000 }, event);
      expect(http.post.mock.calls[0][2].timeout).toBe(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('subtracts DNS time from the test endpoint request budget', async () => {
    const target = { ...webhook(), timeout: 60_000 };
    repository.findOne.mockResolvedValue(target);
    jest.useFakeTimers();
    jest.setSystemTime(0);
    (lookup as jest.MockedFunction<typeof lookup>).mockImplementationOnce(async () => {
      jest.setSystemTime(44_999);
      return [{ address: '8.8.8.8', family: 4 }] as any;
    });
    http.post.mockReturnValue(of({ status: 204 }));

    try {
      await expect(service.testWebhook(target.id, target.tenantId)).resolves.toEqual({
        success: true,
        status: 204,
        duration: 44_999,
      });
      expect(http.post.mock.calls[0][2].timeout).toBe(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('fails fast when retry delay cannot fit inside the delivery lease budget', async () => {
    const target = { ...webhook(), retryCount: 10, retryDelay: 300_000 };
    http.post.mockReturnValue(throwError(() => Object.assign(
      new Error('provider unavailable'),
      { code: 'ECONNRESET' },
    )));

    await expect(service.triggerWebhook(target, event)).rejects.toThrow(
      'delivery budget exhausted before retry',
    );
    expect(http.post).toHaveBeenCalledTimes(1);
    expect(target.recordCall).toHaveBeenCalledWith(
      false,
      undefined,
      'Webhook delivery budget exhausted before retry',
    );
  });
});
