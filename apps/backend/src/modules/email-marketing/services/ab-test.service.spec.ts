import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ABTestService } from '../services/ab-test.service';
import { ABTest } from '../entities/ab-test.entity';
import { EmailCampaign } from '../entities/email-campaign.entity';

describe('ABTestService', () => {
    let service: ABTestService;
    let abTestRepository: Repository<ABTest>;
    let campaignRepository: Repository<EmailCampaign>;

    const mockABTest: Partial<ABTest> = {
        id: '123',
        name: 'Subject Line Test',
        campaignId: 'campaign-123',
        variants: [
            { id: 'A', name: 'Variant A', percentage: 50 },
            { id: 'B', name: 'Variant B', percentage: 50 },
        ],
        status: 'running',
        winnerCriteria: 'open_rate',
    };

    const mockRepository = {
        create: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ABTestService,
                {
                    provide: getRepositoryToken(ABTest),
                    useValue: mockRepository,
                },
                {
                    provide: getRepositoryToken(EmailCampaign),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<ABTestService>(ABTestService);
        abTestRepository = module.get(getRepositoryToken(ABTest));
        campaignRepository = module.get(getRepositoryToken(EmailCampaign));

        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create a new A/B test', async () => {
            mockRepository.create.mockReturnValue(mockABTest);
            mockRepository.save.mockResolvedValue(mockABTest);

            const result = await service.create({
                name: 'Subject Line Test',
                campaignId: 'campaign-123',
                variants: mockABTest.variants,
                winnerCriteria: 'open_rate',
            });

            expect(mockRepository.create).toHaveBeenCalled();
            expect(mockRepository.save).toHaveBeenCalled();
            expect(result).toEqual(mockABTest);
        });

        it('should validate variant percentages sum to 100', async () => {
            const invalidVariants = [
                { id: 'A', name: 'Variant A', percentage: 60 },
                { id: 'B', name: 'Variant B', percentage: 60 },
            ];

            await expect(
                service.create({
                    name: 'Test',
                    campaignId: 'campaign-123',
                    variants: invalidVariants,
                    winnerCriteria: 'open_rate',
                }),
            ).rejects.toThrow();
        });
    });

    describe('findAll', () => {
        it('should return all A/B tests', async () => {
            mockRepository.find.mockResolvedValue([mockABTest]);

            const result = await service.findAll();

            expect(mockRepository.find).toHaveBeenCalled();
            expect(result).toEqual([mockABTest]);
        });
    });

    describe('findOne', () => {
        it('should return an A/B test by id', async () => {
            mockRepository.findOne.mockResolvedValue(mockABTest);

            const result = await service.findOne('123');

            expect(mockRepository.findOne).toHaveBeenCalled();
            expect(result).toEqual(mockABTest);
        });
    });

    describe('getResults', () => {
        it('should return A/B test results', async () => {
            mockRepository.findOne.mockResolvedValue(mockABTest);

            const result = await service.getResults('123');

            expect(result).toHaveProperty('testId');
            expect(result).toHaveProperty('variants');
            expect(result).toHaveProperty('winner');
        });
    });

    describe('determineWinner', () => {
        it('should determine winner based on open rate', async () => {
            const testWithStats = {
                ...mockABTest,
                variants: [
                    { id: 'A', openRate: 25, clickRate: 10 },
                    { id: 'B', openRate: 30, clickRate: 8 },
                ],
                winnerCriteria: 'open_rate',
            };

            mockRepository.findOne.mockResolvedValue(testWithStats);

            const result = await service.determineWinner('123');

            expect(result.winnerId).toBe('B');
        });

        it('should determine winner based on click rate', async () => {
            const testWithStats = {
                ...mockABTest,
                variants: [
                    { id: 'A', openRate: 25, clickRate: 12 },
                    { id: 'B', openRate: 30, clickRate: 8 },
                ],
                winnerCriteria: 'click_rate',
            };

            mockRepository.findOne.mockResolvedValue(testWithStats);

            const result = await service.determineWinner('123');

            expect(result.winnerId).toBe('A');
        });
    });

    describe('stop', () => {
        it('should stop a running A/B test', async () => {
            mockRepository.findOne.mockResolvedValue(mockABTest);
            mockRepository.save.mockResolvedValue({ ...mockABTest, status: 'stopped' });

            const result = await service.stop('123');

            expect(result.status).toBe('stopped');
        });
    });
});
