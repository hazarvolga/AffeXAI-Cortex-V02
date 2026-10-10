import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { Repository } from 'typeorm';
import { Queue } from 'bullmq';
import { BulkImportService } from './bulk-import.service';
import { Subscriber } from '../entities/subscriber.entity';
import { BulkImportJob } from '../entities/bulk-import-job.entity';

describe('BulkImportService', () => {
    let service: BulkImportService;
    let subscriberRepository: Repository<Subscriber>;
    let jobRepository: Repository<BulkImportJob>;
    let importQueue: Queue;

    const mockRepository = {
        create: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
    };

    const mockQueue = {
        add: jest.fn(),
        getJob: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BulkImportService,
                {
                    provide: getRepositoryToken(Subscriber),
                    useValue: mockRepository,
                },
                {
                    provide: getRepositoryToken(BulkImportJob),
                    useValue: mockRepository,
                },
                {
                    provide: getQueueToken('bulk-import'),
                    useValue: mockQueue,
                },
            ],
        }).compile();

        service = module.get<BulkImportService>(BulkImportService);
        subscriberRepository = module.get(getRepositoryToken(Subscriber));
        jobRepository = module.get(getRepositoryToken(BulkImportJob));
        importQueue = module.get(getQueueToken('bulk-import'));

        jest.clearAllMocks();
    });

    describe('validateCSV', () => {
        it('should validate correct CSV format', async () => {
            const csvData = 'email,name\ntest@example.com,Test User';

            const result = await service.validateCSV(csvData);

            expect(result.isValid).toBe(true);
            expect(result.rowCount).toBe(1);
        });

        it('should reject CSV without email column', async () => {
            const csvData = 'name,phone\nTest User,123456';

            const result = await service.validateCSV(csvData);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Missing required column: email');
        });

        it('should detect invalid email addresses', async () => {
            const csvData = 'email,name\ninvalid-email,Test User';

            const result = await service.validateCSV(csvData);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });

    describe('startImport', () => {
        it('should create import job and add to queue', async () => {
            const csvData = 'email,name\ntest@example.com,Test User';
            const mockJob = { id: 'job-123', status: 'pending' };

            mockRepository.create.mockReturnValue(mockJob);
            mockRepository.save.mockResolvedValue(mockJob);
            mockQueue.add.mockResolvedValue({ id: 'queue-job-123' });

            const result = await service.startImport(csvData, {
                duplicateHandling: 'skip',
            });

            expect(mockRepository.create).toHaveBeenCalled();
            expect(mockRepository.save).toHaveBeenCalled();
            expect(mockQueue.add).toHaveBeenCalled();
            expect(result).toEqual(mockJob);
        });
    });

    describe('getJobStatus', () => {
        it('should return job status', async () => {
            const mockJob = {
                id: 'job-123',
                status: 'processing',
                progress: 50,
                totalRows: 100,
                processedRows: 50,
            };

            mockRepository.findOne.mockResolvedValue(mockJob);

            const result = await service.getJobStatus('job-123');

            expect(result).toEqual(mockJob);
        });
    });

    describe('processImport', () => {
        it('should process import and create subscribers', async () => {
            const subscribers = [
                { email: 'test1@example.com', name: 'User 1' },
                { email: 'test2@example.com', name: 'User 2' },
            ];

            mockRepository.save.mockResolvedValue({});

            await service.processImport('job-123', subscribers);

            expect(mockRepository.save).toHaveBeenCalled();
        });

        it('should skip duplicates when configured', async () => {
            const subscribers = [{ email: 'existing@example.com' }];

            mockRepository.findOne.mockResolvedValue({ email: 'existing@example.com' });

            await service.processImport('job-123', subscribers, {
                duplicateHandling: 'skip',
            });

            expect(mockRepository.save).not.toHaveBeenCalled();
        });

        it('should update duplicates when configured', async () => {
            const subscribers = [{ email: 'existing@example.com', name: 'Updated' }];
            const existing = { email: 'existing@example.com', name: 'Old' };

            mockRepository.findOne.mockResolvedValue(existing);
            mockRepository.save.mockResolvedValue({ ...existing, name: 'Updated' });

            await service.processImport('job-123', subscribers, {
                duplicateHandling: 'update',
            });

            expect(mockRepository.save).toHaveBeenCalled();
        });
    });
});
