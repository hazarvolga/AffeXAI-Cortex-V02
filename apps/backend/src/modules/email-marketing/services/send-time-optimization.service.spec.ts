import { Test, TestingModule } from '@nestjs/testing';
import { SendTimeOptimizationService } from './send-time-optimization.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscriber } from '../entities/subscriber.entity';
import { EmailLog } from '../entities/email-log.entity';

describe('SendTimeOptimizationService', () => {
    let service: SendTimeOptimizationService;
    let subscriberRepository: Repository<Subscriber>;
    let emailLogRepository: Repository<EmailLog>;

    const mockRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        createQueryBuilder: jest.fn(() => ({
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            getRawMany: jest.fn(),
        })),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SendTimeOptimizationService,
                {
                    provide: getRepositoryToken(Subscriber),
                    useValue: mockRepository,
                },
                {
                    provide: getRepositoryToken(EmailLog),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<SendTimeOptimizationService>(SendTimeOptimizationService);
        subscriberRepository = module.get(getRepositoryToken(Subscriber));
        emailLogRepository = module.get(getRepositoryToken(EmailLog));

        jest.clearAllMocks();
    });

    describe('getOptimalSendTime', () => {
        it('should return optimal send time for subscriber', async () => {
            const openData = [
                { hour: 9, openRate: 0.3 },
                { hour: 14, openRate: 0.5 },
                { hour: 18, openRate: 0.4 },
            ];
            mockRepository.createQueryBuilder().getRawMany.mockResolvedValue(openData);

            const result = await service.getOptimalSendTime('sub-123');

            expect(result.hour).toBe(14);
            expect(result.openRate).toBe(0.5);
        });

        it('should return default time if no data', async () => {
            mockRepository.createQueryBuilder().getRawMany.mockResolvedValue([]);

            const result = await service.getOptimalSendTime('sub-123');

            expect(result.hour).toBe(10); // Default morning time
        });
    });

    describe('analyzeEngagementPatterns', () => {
        it('should analyze subscriber engagement by time', async () => {
            const logs = [
                { openedAt: new Date('2024-01-01T09:00:00') },
                { openedAt: new Date('2024-01-02T09:30:00') },
                { openedAt: new Date('2024-01-03T14:00:00') },
            ];
            mockRepository.find.mockResolvedValue(logs);

            const result = await service.analyzeEngagementPatterns('sub-123');

            expect(result).toHaveProperty('peakHours');
            expect(result).toHaveProperty('peakDays');
        });
    });

    describe('predictBestSendTime', () => {
        it('should predict best send time using ML model', async () => {
            const features = {
                timezone: 'America/New_York',
                industry: 'tech',
                subscriberBehavior: {},
            };

            const result = await service.predictBestSendTime(features);

            expect(result).toHaveProperty('hour');
            expect(result).toHaveProperty('confidence');
        });
    });
});
