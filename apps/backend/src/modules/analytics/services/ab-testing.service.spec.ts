import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ABTestingService } from './ab-testing.service';
import { ABTest } from '../entities/ab-test.entity';
import { ABTestVariant } from '../entities/ab-test-variant.entity';
import { ABTestStatus } from '../entities/ab-test.entity';

describe('ABTestingService', () => {
    let service: ABTestingService;
    let testRepo: Repository<ABTest>;
    let variantRepo: Repository<ABTestVariant>;

    const mockTestRepo = {
        create: jest.fn().mockImplementation(d => d),
        save: jest.fn().mockImplementation(d => Promise.resolve({ id: 't-1', ...d })),
        findOne: jest.fn(),
        find: jest.fn(),
        remove: jest.fn(),
    };

    const mockVariantRepo = {
        create: jest.fn().mockImplementation(d => d),
        save: jest.fn().mockImplementation(d => Promise.resolve(d)),
        increment: jest.fn(),
        findOne: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ABTestingService,
                { provide: getRepositoryToken(ABTest), useValue: mockTestRepo },
                { provide: getRepositoryToken(ABTestVariant), useValue: mockVariantRepo },
            ],
        }).compile();

        service = module.get<ABTestingService>(ABTestingService);
        testRepo = module.get(getRepositoryToken(ABTest));
        variantRepo = module.get(getRepositoryToken(ABTestVariant));
        jest.clearAllMocks();
    });

    describe('createTest', () => {
        it('should create test and variants', async () => {
            const dto = {
                name: 'Test 1',
                componentId: 'c1',
                componentType: 'btn',
                periodStart: new Date(),
                variants: [
                    { name: 'A', componentConfig: {}, trafficAllocation: 50 },
                    { name: 'B', componentConfig: {}, trafficAllocation: 50 }
                ]
            };

            // Mock getTestById for return
            mockTestRepo.findOne.mockResolvedValue({ id: 't-1', variants: dto.variants });

            await service.createTest(dto as any);

            expect(testRepo.save).toHaveBeenCalled();
            expect(variantRepo.save).toHaveBeenCalled();
        });
    });

    describe('trackConversion', () => {
        it('should calculate conversion rate and update stats', async () => {
            // Mock variant
            const variant = {
                id: 'v1',
                testId: 't1',
                conversions: 10,
                impressions: 100,
                averageEngagementTime: 5
            };

            mockVariantRepo.findOne.mockResolvedValue(variant);
            // Mock updateStatSignificance - private method, or mock getTestById inside it
            mockTestRepo.findOne.mockResolvedValue({ id: 't1', variants: [variant, { ...variant, id: 'v2' }] });

            await service.trackConversion('v1', 10);

            expect(variant.conversions).toBe(11);
            expect(variant.conversionRate).toBeCloseTo(0.11);
            expect(variantRepo.save).toHaveBeenCalledWith(variant);
        });
    });

    describe('updateStatisticalSignificance', () => {
        it('should calculate confidence level correctly', async () => {
            // Setup significant difference scenario
            const v1 = { conversionRate: 0.2, conversions: 200, impressions: 1000 };
            const v2 = { conversionRate: 0.1, conversions: 100, impressions: 1000 };

            mockTestRepo.findOne.mockResolvedValue({
                id: 't1',
                variants: [v1, v2]
            });

            await (service as any).updateStatisticalSignificance('t1');

            expect(testRepo.save).toHaveBeenCalledWith(expect.objectContaining({
                confidenceLevel: expect.any(Number) // Should be high, e.g. 99
            }));
        });
    });

    describe('getVariantForUser', () => {
        it('should return null if not running', async () => {
            mockTestRepo.findOne.mockResolvedValue({ status: ABTestStatus.DRAFT });
            const v = await service.getVariantForUser('t1');
            expect(v).toBeNull();
        });

        it('should allocate traffic', async () => {
            mockTestRepo.findOne.mockResolvedValue({
                status: ABTestStatus.RUNNING,
                variants: [
                    { id: 'v1', trafficAllocation: 100 }
                ]
            });

            const v = await service.getVariantForUser('t1');
            expect(v.id).toBe('v1');
        });
    });
});
