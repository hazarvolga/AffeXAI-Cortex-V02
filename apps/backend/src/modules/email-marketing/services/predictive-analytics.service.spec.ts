import { Test, TestingModule } from '@nestjs/testing';
import { PredictiveAnalyticsService } from './predictive-analytics.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailCampaign } from '../entities/email-campaign.entity';
import { Subscriber } from '../entities/subscriber.entity';

describe('PredictiveAnalyticsService', () => {
    let service: PredictiveAnalyticsService;
    let campaignRepository: Repository<EmailCampaign>;
    let subscriberRepository: Repository<Subscriber>;

    const mockRepository = {
        find: jest.fn(),
        createQueryBuilder: jest.fn(() => ({
            where: jest.fn().mockReturnThis(),
            getRawMany: jest.fn(),
        })),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PredictiveAnalyticsService,
                {
                    provide: getRepositoryToken(EmailCampaign),
                    useValue: mockRepository,
                },
                {
                    provide: getRepositoryToken(Subscriber),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<PredictiveAnalyticsService>(PredictiveAnalyticsService);
        campaignRepository = module.get(getRepositoryToken(EmailCampaign));
        subscriberRepository = module.get(getRepositoryToken(Subscriber));

        jest.clearAllMocks();
    });

    describe('predictCampaignPerformance', () => {
        it('should predict campaign open rate', async () => {
            const historicalData = [
                { openRate: 0.25, clickRate: 0.10 },
                { openRate: 0.30, clickRate: 0.12 },
            ];
            mockRepository.find.mockResolvedValue(historicalData);

            const result = await service.predictCampaignPerformance({
                subject: 'Test Subject',
                sendTime: new Date(),
            });

            expect(result).toHaveProperty('predictedOpenRate');
            expect(result).toHaveProperty('predictedClickRate');
            expect(result).toHaveProperty('confidence');
        });
    });

    describe('predictChurnRisk', () => {
        it('should predict subscriber churn risk', async () => {
            const subscriber = {
                lastOpenedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
                totalOpens: 5,
                totalClicks: 2,
            };

            const result = await service.predictChurnRisk(subscriber);

            expect(result).toHaveProperty('riskScore');
            expect(result).toHaveProperty('riskLevel');
            expect(result.riskScore).toBeGreaterThanOrEqual(0);
            expect(result.riskScore).toBeLessThanOrEqual(1);
        });
    });

    describe('recommendSubjectLine', () => {
        it('should recommend subject line variations', async () => {
            const result = await service.recommendSubjectLine({
                industry: 'tech',
                audience: 'developers',
                goal: 'engagement',
            });

            expect(result).toBeInstanceOf(Array);
            expect(result.length).toBeGreaterThan(0);
            expect(result[0]).toHaveProperty('subject');
            expect(result[0]).toHaveProperty('predictedOpenRate');
        });
    });
});
