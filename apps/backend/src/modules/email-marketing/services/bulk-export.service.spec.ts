import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { Repository } from 'typeorm';
import { Queue } from 'bullmq';
import { BulkExportService } from './bulk-export.service';
import { Subscriber } from '../entities/subscriber.entity';
import { BulkExportJob } from '../entities/bulk-export-job.entity';

describe('BulkExportService', () => {
    let service: BulkExportService;
    let subscriberRepository: Repository<Subscriber>;
    let jobRepository: Repository<BulkExportJob>;
    let exportQueue: Queue;

    const mockRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        createQueryBuilder: jest.fn(() => ({
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getMany: jest.fn(),
        })),
    };

    const mockQueue = {
        add: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BulkExportService,
                {
                    provide: getRepositoryToken(Subscriber),
                    useValue: mockRepository,
                },
                {
                    provide: getRepositoryToken(BulkExportJob),
                    useValue: mockRepository,
                },
                {
                    provide: getQueueToken('bulk-export'),
                    useValue: mockQueue,
                },
            ],
        }).compile();

        service = module.get<BulkExportService>(BulkExportService);
        subscriberRepository = module.get(getRepositoryToken(Subscriber));
        jobRepository = module.get(getRepositoryToken(BulkExportJob));
        exportQueue = module.get(getQueueToken('bulk-export'));

        jest.clearAllMocks();
    });

    describe('startExport', () => {
        it('should create export job and add to queue', async () => {
            const mockJob = { id: 'job-123', status: 'pending' };
            mockRepository.create.mockReturnValue(mockJob);
            mockRepository.save.mockResolvedValue(mockJob);
            mockQueue.add.mockResolvedValue({ id: 'queue-job-123' });

            const result = await service.startExport({ format: 'csv' });

            expect(mockRepository.create).toHaveBeenCalled();
            expect(mockQueue.add).toHaveBeenCalled();
            expect(result).toEqual(mockJob);
        });
    });

    describe('exportToCSV', () => {
        it('should export subscribers to CSV format', async () => {
            const subscribers = [
                { email: 'test1@example.com', name: 'User 1' },
                { email: 'test2@example.com', name: 'User 2' },
            ];
            mockRepository.find.mockResolvedValue(subscribers);

            const result = await service.exportToCSV();

            expect(result).toContain('email,name');
            expect(result).toContain('test1@example.com');
        });
    });

    describe('exportToExcel', () => {
        it('should export subscribers to Excel format', async () => {
            const subscribers = [{ email: 'test@example.com' }];
            mockRepository.find.mockResolvedValue(subscribers);

            const result = await service.exportToExcel();

            expect(result).toBeInstanceOf(Buffer);
        });
    });

    describe('getJobStatus', () => {
        it('should return export job status', async () => {
            const mockJob = { id: 'job-123', status: 'completed', downloadUrl: 'https://example.com/file.csv' };
            mockRepository.findOne.mockResolvedValue(mockJob);

            const result = await service.getJobStatus('job-123');

            expect(result).toEqual(mockJob);
        });
    });
});
