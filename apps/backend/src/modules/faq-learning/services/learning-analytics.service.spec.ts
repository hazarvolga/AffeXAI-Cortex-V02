import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LearningAnalyticsService } from './learning-analytics.service';
import { LearnedFaqEntry } from '../entities/learned-faq-entry.entity';
import { LearningPattern } from '../entities/learning-pattern.entity';
import { FaqLearningConfig } from '../entities/faq-learning-config.entity';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { ChatSession } from '../../chat/entities/chat-session.entity';

describe('LearningAnalyticsService', () => {
    let service: LearningAnalyticsService;
    let faqRepository: Repository<LearnedFaqEntry>;

    const mockRepository = {
        find: jest.fn(),
        count: jest.fn(),
        average: jest.fn(),
        createQueryBuilder: jest.fn(() => ({
            select: jest.fn().mockReturnThis(),
            addSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getRawMany: jest.fn(),
            getMany: jest.fn(),
            getCount: jest.fn(),
        })),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LearningAnalyticsService,
                { provide: getRepositoryToken(LearnedFaqEntry), useValue: mockRepository },
                { provide: getRepositoryToken(LearningPattern), useValue: mockRepository },
                { provide: getRepositoryToken(FaqLearningConfig), useValue: mockRepository },
                { provide: getRepositoryToken(Ticket), useValue: mockRepository },
                { provide: getRepositoryToken(ChatSession), useValue: mockRepository },
            ],
        }).compile();

        service = module.get<LearningAnalyticsService>(LearningAnalyticsService);
        faqRepository = module.get(getRepositoryToken(LearnedFaqEntry));

        jest.clearAllMocks();
    });

    describe('getLearningEffectiveness', () => {
        it('should calculate metrics', async () => {
            // Mock aggregation results
            mockRepository.createQueryBuilder().getRawMany.mockResolvedValue([
                { status: 'published', count: '10' },
                { status: 'rejected', count: '2' }
            ]);
            mockRepository.createQueryBuilder().getCount.mockResolvedValue(12);

            const metrics = await service.getLearningEffectiveness('week');

            expect(metrics.totalFaqsGenerated).toBe(12);
            expect(metrics.approvalRate).toBeDefined();
        });
    });

    describe('getProviderPerformance', () => {
        it('should return performance stats', async () => {
            mockRepository.createQueryBuilder().getRawMany.mockResolvedValue([
                { provider: 'openai', total: '100', success: '90' }
            ]);

            const stats = await service.getProviderPerformance('week');

            expect(stats).toBeDefined();
        });
    });

    describe('getFaqUsageMetrics', () => {
        it('should aggregate usage data', async () => {
            mockRepository.createQueryBuilder().getRawMany.mockResolvedValue([]);

            const metrics = await service.getFaqUsageMetrics('week');

            expect(metrics.totalViews).toBeDefined();
        });
    });

    describe('getROIMetrics', () => {
        it('should estimate savings', async () => {
            // Mock necessary data for ROI calc
            // Typically relies on comparisons or constant estimates derived from counts
            // Assuming naive implementation or mocked queries

            const roi = await service.getROIMetrics('month');

            expect(roi.estimatedCostSavings).toBeDefined();
        });
    });

    describe('getDateRange', () => {
        it('should return correct dates for period', () => {
            const week = service.getDateRange('week');
            expect(week).toBeDefined();
            expect(week!.startDate).toBeInstanceOf(Date);

            const day = service.getDateRange('day');
            expect(day!.label).toBe('Last 24 Hours');
        });
    });
});
