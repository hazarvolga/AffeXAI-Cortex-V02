import { CortexOutboxService } from './cortex-outbox.service';

describe('Cortex transactional outbox', () => {
  const input = { eventId: 'ae074b8e-7ec4-4e5a-91c6-8e8252644381', tenantId: 'tenant-a', ticketId: '79b58d64-a80f-4544-8256-59cf22daa820', actorId: '17455437-6cf0-43f5-b009-a897e25fdf4e', occurredAt: new Date('2026-10-07T00:00:00Z'), payload: { successScore: 5, context: 'Resolved', ticketId: '79b58d64-a80f-4544-8256-59cf22daa820', resolutionTime: 1 } };
  it('refuses writes outside the producer transaction', async () => {
    const service = new CortexOutboxService();
    const manager = { queryRunner: { isTransactionActive: false }, save: jest.fn(), query: jest.fn() };
    await expect(service.recordTicketResolved(manager as any, input)).rejects.toThrow();
    expect(manager.save).not.toHaveBeenCalled();
  });
  it('writes event and stable delivery payload using the same transaction', async () => {
    const service = new CortexOutboxService();
    const manager = { queryRunner: { isTransactionActive: true }, save: jest.fn().mockResolvedValue({}), query: jest.fn().mockResolvedValue([]) };
    await service.recordTicketResolved(manager as any, input);
    expect(manager.save).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ id: input.eventId, tenantId: 'tenant-a', eventType: 'ticket.resolved' }));
    const params = manager.query.mock.calls[0][1];
    expect(JSON.parse(params[2])).toEqual(expect.objectContaining({ eventId: input.eventId, tenantId: 'tenant-a', timestamp: input.occurredAt.toISOString() }));
    expect(manager.query.mock.calls[1][0]).toContain('automation_dispatch_outbox');
    expect(manager.query.mock.calls[1][0]).toContain('"triggerEventType"');
  });
  it('propagates persistence failure so the ticket transaction rolls back', async () => {
    const manager = { queryRunner: { isTransactionActive: true }, save: jest.fn().mockResolvedValue({}), query: jest.fn().mockRejectedValue(new Error('db unavailable')) };
    await expect(new CortexOutboxService().recordTicketResolved(manager as any, input)).rejects.toThrow('db unavailable');
  });
  it.each(['', 'tenant/a'])('rejects invalid tenant %s before persistence', async tenantId => {
    const manager = { queryRunner: { isTransactionActive: true }, save: jest.fn() };
    await expect(new CortexOutboxService().recordTicketResolved(manager as any, { ...input, tenantId })).rejects.toThrow('valid tenant');
    expect(manager.save).not.toHaveBeenCalled();
  });
  it('rejects oversized events before writing either record', async () => {
    const manager = { queryRunner: { isTransactionActive: true }, save: jest.fn() };
    await expect(new CortexOutboxService().recordTicketResolved(manager as any, { ...input, payload: { ...input.payload, context: 'x'.repeat(65536) } })).rejects.toThrow('delivery limit');
    expect(manager.save).not.toHaveBeenCalled();
  });
  it('rejects managers without a transaction runner', async () => {
    await expect(new CortexOutboxService().recordTicketResolved({} as any, input)).rejects.toThrow('transaction');
  });

  it('records a versioned CRM lead event without contact PII', async () => {
    const manager = { queryRunner: { isTransactionActive: true }, save: jest.fn(), query: jest.fn() };
    await new CortexOutboxService().recordCrmLeadCaptured(manager as any, {
      eventId: '31b46439-bba8-4c55-9f55-e6b16d9126d3',
      tenantId: 'tenant-a',
      leadId: '09bde21d-59fd-46a8-96eb-7aae82eb32df',
      customerId: '0a73b035-2592-4f53-a92f-40752f9ff164',
      formId: 'dd97c660-b591-45f1-a119-813824b1ecf1',
      submissionId: '816bf01a-0d0e-4ae4-b2c3-012863856d5f',
      occurredAt: new Date('2026-10-08T00:00:00Z'),
    });
    const payload = JSON.parse(manager.query.mock.calls[0][1][2]);
    expect(payload).toEqual(expect.objectContaining({ source: 'crm', type: 'crm.lead.captured' }));
    expect(payload.data).toEqual(expect.objectContaining({ schemaVersion: 1 }));
    expect(JSON.stringify(payload)).not.toMatch(/email|phone|contactName/);
    expect(manager.query.mock.calls[1][0]).toContain('automation_dispatch_outbox');
    expect(manager.query.mock.calls[1][0]).toContain('"isActive"');
  });

  it('records every form submission as a PII-minimized automation event', async () => {
    const manager = { queryRunner: { isTransactionActive: true }, save: jest.fn(), query: jest.fn() };
    await new CortexOutboxService().recordFormSubmitted(manager as any, {
      eventId: '31b46439-bba8-4c55-9f55-e6b16d9126d3',
      tenantId: 'tenant-a',
      formId: 'dd97c660-b591-45f1-a119-813824b1ecf1',
      submissionId: '816bf01a-0d0e-4ae4-b2c3-012863856d5f',
      occurredAt: new Date('2026-10-08T00:00:00Z'),
    });
    expect(manager.save).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      source: 'forms', eventType: 'form.submitted', metadata: { containsPii: false },
    }));
    expect(manager.query).toHaveBeenCalledWith(
      expect.stringContaining('automation_dispatch_outbox'),
      expect.arrayContaining(['tenant-a', 'form.submitted']),
    );
  });

});
