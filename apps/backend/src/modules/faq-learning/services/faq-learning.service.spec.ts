import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FaqLearningService } from './faq-learning.service';
import { LearnedFaqEntry } from '../entities/learned-faq-entry.entity';
import { LearningPattern } from '../entities/learning-pattern.entity';
import { PatternRecognitionService } from './pattern-recognition.service';
import { FaqAiService } from './faq-ai.service';
import { ConfidenceCalculatorService } from './confidence-calculator.service';
import { BatchProcessorService } from './batch-processor.service';

// Mock Entities
class MockLearnedFaqEntry { }
class MockLearningPattern { }

describe('FaqLearningService', () => {
    let service: FaqLearningService;
    let faqRepository: Repository<LearnedFaqEntry>;
    let patternRepository: Repository<LearningPattern>;
    let patternRecognition: PatternRecognitionService;
    let faqAiService: FaqAiService;
    let confidenceCalculator: ConfidenceCalculatorService;
    let batchProcessor: BatchProcessorService;

    const mockRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        count: jest.fn(),
        createQueryBuilder: jest.fn(() => ({
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            getMany: jest.fn(),
            getRawOne: jest.fn(),
            select: jest.fn().mockReturnThis(),
        })),
    };

    const mockPatternRecognition = {
        identifyPatterns: jest.fn(),
    };

    const mockFaqAiService = {
        generateFaqCandidates: jest.fn(),
    };

    const mockConfidenceCalculator = {
        calculateConfidence: jest.fn(),
    };

    const mockBatchProcessor = {
        processBatch: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FaqLearningService,
                {
                    provide: getRepositoryToken(LearnedFaqEntry),
                    useValue: mockRepository,
                },
                {
                    provide: getRepositoryToken(LearningPattern),
                    useValue: mockRepository,
                },
                {
                    provide: PatternRecognitionService,
                    useValue: mockPatternRecognition,
                },
                {
                    provide: FaqAiService,
                    useValue: mockFaqAiService,
                },
                {
                    provide: ConfidenceCalculatorService,
                    useValue: mockConfidenceCalculator,
                },
                {
                    provide: BatchProcessorService,
                    useValue: mockBatchProcessor,
                },
            ],
        }).compile();

        service = module.get<FaqLearningService>(FaqLearningService);
        faqRepository = module.get(getRepositoryToken(LearnedFaqEntry));
        patternRepository = module.get(getRepositoryToken(LearningPattern));
        patternRecognition = module.get(PatternRecognitionService);
        faqAiService = module.get(FaqAiService);
        confidenceCalculator = module.get(ConfidenceCalculatorService);
        batchProcessor = module.get(BatchProcessorService);

        jest.clearAllMocks();
    });

    describe('runLearningPipeline', () => {
        it('should execute full learning pipeline successfully', async () => {
            // Setup successful pipeline execution
            const mockResult = {
                processedItems: 10,
                newFaqs: 2,
                updatedPatterns: 1,
                errors: [],
                processingTime: 100,
                status: 'completed',
            };

            jest.spyOn(service as any, 'checkDailyLimit').mockResolvedValue(true);
            jest.spyOn(service as any, 'extractData').mockResolvedValue([{}]);
            jest.spyOn(service as any, 'normalizeData').mockResolvedValue([{}]);
            jest.spyOn(service as any, 'identifyPatterns').mockResolvedValue([{}]);
            jest.spyOn(service as any, 'generateFaqs').mockResolvedValue([]);
            jest.spyOn(service as any, 'saveResults').mockResolvedValue(undefined);
            jest.spyOn(service as any, 'updateProcessingStats').mockResolvedValue(undefined);

            const result = await service.runLearningPipeline();

            expect(result.status).toBe('completed');
        });

        it('should stop if currently processing', async () => {
            // Simulate processing state
            (service as any).isProcessing = true;

            const result = await service.runLearningPipeline();

            expect(result.status).toBe('failed');
            expect(result.errors).toContain('Pipeline is already running');
        });

        it('should stop if daily limit reached', async () => {
            jest.spyOn(service as any, 'checkDailyLimit').mockResolvedValue(false);

            const result = await service.runLearningPipeline();

            expect(result.status).toBe('failed');
            expect(result.errors).toContain('Daily processing limit reached');
        });

        it('should handle errors during execution', async () => {
            jest.spyOn(service as any, 'checkDailyLimit').mockResolvedValue(true);
            jest.spyOn(service as any, 'extractData').mockRejectedValue(new Error('Extraction failed'));

            const result = await service.runLearningPipeline();

            expect(result.status).toBe('failed');
            expect(result.errors).toContain('Extraction failed');
            expect((service as any).isProcessing).toBe(false);
        });
    });

    describe('scheduledLearning', () => {
        it('should trigger pipeline', async () => {
            const runSpy = jest.spyOn(service, 'runLearningPipeline').mockResolvedValue({
                status: 'completed',
                processedItems: 0,
                newFaqs: 0,
                updatedPatterns: 0,
                errors: [],
                processingTime: 0
            });

            await service.scheduledLearning();

            expect(runSpy).toHaveBeenCalled();
        });
    });

    describe('resetDailyCounters', () => {
        it('should reset processing count', async () => {
            (service as any).dailyProcessingCount = 100;

            await service.resetDailyCounters();

            expect((service as any).dailyProcessingCount).toBe(0);
        });
    });

    describe('processRealTimeData', () => {
        it('should process chat data instantly if realtime enabled', async () => {
            jest.spyOn(service as any, 'getPipelineConfig').mockResolvedValue({
                enableRealTimeProcessing: true,
            });
            const runSpy = jest.spyOn(service, 'runLearningPipeline');

            await service.processRealTimeData('chat', 'chat-123');

            expect(runSpy).toHaveBeenCalledWith(expect.objectContaining({
                sourceId: 'chat-123',
                sourceType: 'chat'
            }));
        });

        it('should skip if realtime processing disabled', async () => {
            jest.spyOn(service as any, 'getPipelineConfig').mockResolvedValue({
                enableRealTimeProcessing: false,
            });
            const runSpy = jest.spyOn(service, 'runLearningPipeline');

            await service.processRealTimeData('chat', 'chat-123');

            expect(runSpy).not.toHaveBeenCalled();
        });
    });

    describe('Dashboard Metrics', () => {
        describe('getTotalFaqCount', () => {
            it('should return total count', async () => {
                mockRepository.count.mockResolvedValue(42);

                const count = await service.getTotalFaqCount();

                expect(count).toBe(42);
            });
        });

        describe('getNewFaqsToday', () => {
            it('should return count for today', async () => {
                mockRepository.count.mockResolvedValue(5);

                const count = await service.getNewFaqsToday();

                expect(mockRepository.count).toHaveBeenCalled();
                expect(count).toBe(5);
            });
        });

        describe('getPendingReviewCount', () => {
            it('should return count of draft/pending items', async () => {
                mockRepository.count.mockResolvedValue(10);

                const count = await service.getPendingReviewCount();

                expect(mockRepository.count).toHaveBeenCalledWith(expect.objectContaining({
                    where: expect.objectContaining({ status: 'draft' })
                }));
                expect(count).toBe(10);
            });
        });

        describe('getQualityMetrics', () => {
            it('should calculate confidence distribution', async () => {
                mockRepository.count
                    .mockResolvedValueOnce(10) // high
                    .mockResolvedValueOnce(5)  // medium
                    .mockResolvedValueOnce(2); // low

                const metrics = await service.getQualityMetrics();

                expect(metrics).toEqual({
                    highConfidence: 10,
                    mediumConfidence: 5,
                    lowConfidence: 2
                });
            });
        });
    });

    describe('Pipeline Status', () => {
        it('should return current status', async () => {
            const status = await service.getPipelineStatus();

            expect(status).toHaveProperty('isProcessing');
            expect(status).toHaveProperty('dailyProcessingCount');
            expect(status).toHaveProperty('lastRun');
        });
    });
});
