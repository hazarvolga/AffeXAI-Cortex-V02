import { BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource } from 'typeorm';
import { ModuleSource, PlatformEvent, PlatformEventType } from '../entities/platform-event.entity';
import { EventBusService } from './event-bus.service';

describe('EventBusService', () => {
  const query = {
    where: jest.fn().mockReturnThis(), andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  };
  const eventRepo = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({ id: 'event-1', ...value })),
    find: jest.fn(), update: jest.fn(), createQueryBuilder: jest.fn(() => query),
  };
  const emitter = { emit: jest.fn(), on: jest.fn() };
  const manager = {
    getRepository: jest.fn(() => ({
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({ id: 'event-1', ...value })),
    })),
    query: jest.fn().mockResolvedValue([]),
  };
  const dataSource = { transaction: jest.fn(async (callback) => callback(manager)) };
  let service: EventBusService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({ providers: [
      EventBusService,
      { provide: getRepositoryToken(PlatformEvent), useValue: eventRepo },
      { provide: EventEmitter2, useValue: emitter },
      { provide: DataSource, useValue: dataSource },
    ] }).compile();
    service = module.get(EventBusService);
    jest.clearAllMocks();
    manager.query.mockResolvedValue([]);
  });

  it('persists and broadcasts a tenant-scoped event', async () => {
    const result = await service.publish(
      ModuleSource.CMS, PlatformEventType.PAGE_PUBLISHED,
      { pageId: 'page-1' }, 'tenant-a',
    );
    expect(dataSource.transaction).toHaveBeenCalled();
    expect(manager.query).toHaveBeenCalledWith(
      expect.stringContaining('automation_dispatch_outbox'),
      ['event-1', 'tenant-a', PlatformEventType.PAGE_PUBLISHED],
    );
    expect(emitter.emit).toHaveBeenCalledWith(PlatformEventType.PAGE_PUBLISHED, expect.anything());
    expect(result.id).toBe('event-1');
  });

  it('rejects invalid tenant identifiers for event statistics', async () => {
    await expect(service.getEventStats('../tenant')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('registers explicit subscribers', () => {
    const callback = jest.fn();
    service.subscribe(PlatformEventType.PAGE_PUBLISHED, callback);
    expect(emitter.on).toHaveBeenCalledWith(PlatformEventType.PAGE_PUBLISHED, callback);
  });
});
