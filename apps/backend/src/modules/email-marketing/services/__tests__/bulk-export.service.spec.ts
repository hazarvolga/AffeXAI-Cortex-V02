import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { Repository } from 'typeorm';
import { Queue } from 'bullmq';
import { BulkExportService } from '../bulk-export.service';
import { ExportJob } from '../../entities/export-job.entity';
import { Subscriber } from '../../entities/subscriber.entity';
import { Group } from '../../entities/group.entity';
import { Segment } from '../../entities/segment.entity';
import { SubscriberStatus } from '@affexai/shared-types';

describe('BulkExportService', () => {
  let service: BulkExportService;
  let exportJobRepository: Repository<ExportJob>;
  let subscriberRepository: Repository<Subscriber>;
  let groupRepository: Repository<Group>;
  let segmentRepository: Repository<Segment>;
  let exportQueue: Queue;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findByIds: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BulkExportService,
        {
          provide: getRepositoryToken(ExportJob),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Subscriber),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Group),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Segment),
          useValue: mockRepository,
        },
        {
          provide: getQueueToken('export'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<BulkExportService>(BulkExportService);
    exportJobRepository = module.get<Repository<ExportJob>>(getRepositoryToken(ExportJob));
    subscriberRepository = module.get<Repository<Subscriber>>(getRepositoryToken(Subscriber));
    groupRepository = module.get<Repository<Group>>(getRepositoryToken(Group));
    segmentRepository = module.get<Repository<Segment>>(getRepositoryToken(Segment));
    exportQueue = module.get<Queue>(getQueueToken('export'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAvailableFields', () => {
    it('should return list of available export fields', () => {
      const fields = service.getAvailableFields();
      
      expect(fields).toContain('email');
      expect(fields).toContain('firstName');
      expect(fields).toContain('lastName');
      expect(fields).toContain('status');
      expect(fields).toContain('groups');
      expect(fields).toContain('segments');
    });
  });

  describe('formatSubscriberData', () => {
    it('should format subscriber data correctly', async () => {
      const mockSubscriber = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        status: SubscriberStatus.ACTIVE,
        groups: ['group1', 'group2'],
        segments: ['segment1'],
        sent: 5,
        opens: 3,
        clicks: 1,
        subscribedAt: new Date('2023-01-01'),
        lastUpdated: new Date('2023-01-02'),
      } as Subscriber;

      const options = {
        fields: ['email', 'firstName', 'lastName', 'status', 'groups'],
        format: 'csv' as const,
        includeMetadata: false,
        batchSize: 1000,
      };

      const result = await service.formatSubscriberData([mockSubscriber], options);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        status: SubscriberStatus.ACTIVE,
        groups: 'group1;group2',
      });
    });

    it('should handle empty groups and segments', async () => {
      const mockSubscriber = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        status: SubscriberStatus.ACTIVE,
        groups: null,
        segments: null,
      } as Subscriber;

      const options = {
        fields: ['email', 'groups', 'segments'],
        format: 'csv' as const,
        includeMetadata: false,
        batchSize: 1000,
      };

      const result = await service.formatSubscriberData([mockSubscriber], options);

      expect(result[0].groups).toBe('');
      expect(result[0].segments).toBe('');
    });
  });

  describe('createExportJob', () => {
    it('should create export job successfully', async () => {
      const filters = {
        status: [SubscriberStatus.ACTIVE],
      };

      const options = {
        fields: ['email', 'firstName'],
        format: 'csv' as const,
        includeMetadata: false,
        batchSize: 1000,
      };

      const mockExportJob = {
        id: '1',
        fileName: 'test-export.csv',
        status: 'pending',
      };

      mockRepository.create.mockReturnValue(mockExportJob);
      mockRepository.save.mockResolvedValue(mockExportJob);
      mockRepository.findByIds.mockResolvedValue([]);

      const result = await service.createExportJob(filters, options, 'user1');

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockQueue.add).toHaveBeenCalledWith('process-export', expect.any(Object), expect.any(Object));
      expect(result).toEqual(mockExportJob);
    });
  });
});