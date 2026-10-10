import { EventBusService } from './event-bus.service';
import { PageService } from '../../cms/services/page.service';
import { EventsService } from '../../events/events.service';

describe('integration tenant boundaries', () => {
 it('filters statistics by tenant and fails before querying when scope is absent', async () => {
  const query = { where: jest.fn().mockReturnThis(), andWhere: jest.fn().mockReturnThis(), getMany: jest.fn().mockResolvedValue([]) };
  const repo = { createQueryBuilder: jest.fn().mockReturnValue(query) };
  const service = new EventBusService(repo as never, {} as never, {} as never);
  await service.getEventStats('tenant-a');
  expect(query.where).toHaveBeenCalledWith('event.tenantId = :tenantId', { tenantId: 'tenant-a' });
  repo.createQueryBuilder.mockClear();
  await expect(service.getEventStats('')).rejects.toThrow();
  expect(repo.createQueryBuilder).not.toHaveBeenCalled();
 });
 it('publishes page updates under the actual tenant', async () => {
  const page = { id: 'owned', slug: 'owned', tenantId: 'tenant-a', components: [{ id: 'component' }] };
  const repo = { findOne: jest.fn().mockResolvedValue(page), save: jest.fn().mockImplementation(async value => value) };
  const bus = { publishPagePublished: jest.fn() };
  const service = new PageService(repo as never, bus as never, { getTenantId: () => 'tenant-a' } as never);
  await service.publish('owned');
  expect(bus.publishPagePublished).toHaveBeenCalledWith('owned', 'owned', 'tenant-a');
 });
 it('bulk publish emits only rows actually updated, not foreign or missing requested IDs', async () => {
  const builder = { update: jest.fn().mockReturnThis(), set: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), andWhere: jest.fn().mockReturnThis(), returning: jest.fn().mockReturnThis(), execute: jest.fn().mockResolvedValue({ affected: 1, raw: [{ id: 'owned', slug: 'owned' }] }) };
  const repo = { createQueryBuilder: () => builder, update: jest.fn().mockResolvedValue({ affected: 1 }) };
  const bus = { publishPagePublished: jest.fn() };
  const service = new PageService(repo as never, bus as never, { getTenantId: () => 'tenant-a' } as never);
  expect(await service.bulkPublish(['owned', 'foreign', 'missing'])).toEqual({ successCount: 1, failedCount: 2 });
  expect(bus.publishPagePublished).toHaveBeenCalledTimes(1);
  expect(bus.publishPagePublished).toHaveBeenCalledWith('owned', 'owned', 'tenant-a');
  expect(builder.andWhere).toHaveBeenCalledWith('tenantId = :tenantId', { tenantId: 'tenant-a' });
 });
 it('event creation preserves producer tenant', async () => {
  const repo = { create: jest.fn().mockImplementation(value => value), findOne: jest.fn().mockResolvedValue(null), save: jest.fn().mockImplementation(async value => ({ ...value, id: 'event-1' })) };
  const bus = { publishEventCreated: jest.fn() };
  const service = new EventsService(repo as never, {} as never, { del: jest.fn() } as never, {} as never, bus as never, { getTenantId: () => 'tenant-a' } as never, { emitSignal: jest.fn().mockResolvedValue({}) } as never, { checkLimit: jest.fn().mockResolvedValue({ allowed: true }) } as never);
  await service.create({ title: 'Example' } as never);
  expect(bus.publishEventCreated).toHaveBeenCalledWith('event-1', expect.any(Object), 'tenant-a');
 });
 it('event publication preserves tenant on status transition', async () => {
  const event = { id: 'event-1', tenantId: 'tenant-a', title: 'Example' };
  const repo = { findOne: jest.fn().mockResolvedValue(event), update: jest.fn() };
  const bus = { publishEventPublished: jest.fn() };
  const service = new EventsService(repo as never, {} as never, { del: jest.fn(), get: jest.fn(), set: jest.fn() } as never, {} as never, bus as never, { getTenantId: () => 'tenant-a' } as never, {} as never, {} as never);
  await service.update('event-1', { status: 'published' } as never);
  expect(bus.publishEventPublished).toHaveBeenCalledWith('event-1', expect.any(Object), 'tenant-a');
 });

});
