import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsDashboardService } from './analytics-dashboard.service';
import { AnalyticsEvent } from '../entities/analytics-event.entity';
import { AnalyticsSession } from '../entities/analytics-session.entity';
import { ABTest } from '../entities/ab-test.entity';

describe('AnalyticsDashboardService', () => {
    let service: AnalyticsDashboardService;
    let eventRepo: Repository<AnalyticsEvent>;
    let sessionRepo: Repository<AnalyticsSession>;

    const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawOne: jest.fn(),
        getRawMany: jest.fn(),
        getCount: jest.fn(),
    };

    const mockRepo = {
        createQueryBuilder: jest.fn(() => mockQueryBuilder),
        count: jest.fn(),
        find: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AnalyticsDashboardService,
                { provide: getRepositoryToken(AnalyticsEvent), useValue: mockRepo },
                { provide: getRepositoryToken(AnalyticsSession), useValue: mockRepo },
                { provide: getRepositoryToken(ABTest), useValue: mockRepo },
            ],
        }).compile();

        service = module.get<AnalyticsDashboardService>(AnalyticsDashboardService);
        eventRepo = module.get(getRepositoryToken(AnalyticsEvent));
        sessionRepo = module.get(getRepositoryToken(AnalyticsSession));

        jest.clearAllMocks();
    });

    describe('getDashboardData', () => {
        it('should aggregate all metrics', async () => {
            // Mock sub-calls
            jest.spyOn(service, 'getOverview').mockResolvedValue({} as any);
            jest.spyOn(service, 'getTopComponents').mockResolvedValue([]);
            jest.spyOn(service, 'getTimeline').mockResolvedValue([]);
            jest.spyOn(service, 'getDeviceDistribution').mockResolvedValue({ mobile: 0, tablet: 0, desktop: 0 });
            jest.spyOn(service, 'getRecentSessions').mockResolvedValue([]);

            const result = await service.getDashboardData({ timeRange: 'day' } as any);

            expect(result).toHaveProperty('overview');
            expect(result).toHaveProperty('topComponents');
        });
    });

    describe('getOverview', () => {
        it('should calculate stats and deltas', async () => {
            // Mock counts
            // Current Period
            mockQueryBuilder.getRawOne
                .mockResolvedValueOnce({ count: 100 }) // Views
                .mockResolvedValueOnce({ count: 50 }); // Interactions

            // We need averages too but let's assume getAverageEngagement and getConversionRate are mocked
            jest.spyOn(service, 'getAverageEngagement').mockResolvedValue(30);
            jest.spyOn(service, 'getConversionRate').mockResolvedValue(5);

            const result = await service.getOverview(
                new Date(), new Date(), new Date(), new Date(), {} as any
            );

            // Implementation details: calls countEvents multiple times for diff types
            // Verification strategy: Check structure
            expect(result).toHaveProperty('totalViews');
            expect(result).toHaveProperty('changeFromPrevious');
        });
    });

    describe('getTopComponents', () => {
        it('should return top performers', async () => {
            mockQueryBuilder.getRawMany.mockResolvedValue([
                { componentId: 'c1', type: 'btn', url: '/home', interactions: 10, conversions: 2 }
            ]);

            const result = await service.getTopComponents(new Date(), new Date(), {} as any);

            expect(result.length).toBe(1);
            expect(result[0].componentId).toBe('c1');
        });
    });

    describe('getDeviceDistribution', () => {
        it('should calculate distribution ratios', async () => {
            mockQueryBuilder.getRawMany.mockResolvedValue([
                { deviceType: 'mobile', count: 6 },
                { deviceType: 'desktop', count: 4 }
            ]);
            // Total 10. mobile 60%, desktop 40%

            const result = await service.getDeviceDistribution(new Date(), new Date(), {} as any);

            expect(result.mobile).toBe(60);
            expect(result.desktop).toBe(40);
            expect(result.tablet).toBe(0);
        });
    });

    describe('calculatePercentageChange', () => {
        it('should handle zero previous', () => {
            const change = service.calculatePercentageChange(10, 0);
            expect(change).toBe(100);
        });

        it('should calculate increase', () => {
            const change = service.calculatePercentageChange(20, 10);
            expect(change).toBe(100);
        });

        it('should calculate decrease', () => {
            const change = service.calculatePercentageChange(5, 10);
            expect(change).toBe(-50);
        });
    });
});
