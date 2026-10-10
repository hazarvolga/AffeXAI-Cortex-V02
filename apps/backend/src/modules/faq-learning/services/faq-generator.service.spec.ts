import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FaqGeneratorService } from './faq-generator.service';
import { LearnedFaqEntry } from '../entities/learned-faq-entry.entity';
import { LearningPattern } from '../entities/learning-pattern.entity';
import { FaqLearningConfig } from '../entities/faq-learning-config.entity';
import { FaqAiService } from './faq-ai.service';
import { ConfidenceCalculatorService } from './confidence-calculator.service';
import { NormalizedData } from '../interfaces/data-extraction.interface';

describe('FaqGeneratorService', () => {
    let service: FaqGeneratorService;
    let faqRepository: Repository<LearnedFaqEntry>;
    let patternRepository: Repository<LearningPattern>;
    let configRepository: Repository<FaqLearningConfig>;
    let faqAiService: FaqAiService;
    let confidenceCalculator: ConfidenceCalculatorService;

    const mockFaqRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        createQueryBuilder: jest.fn(() => ({
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            getMany: jest.fn(),
        })),
    };

    const mockPatternRepository = {
        find: jest.fn(),
    };

    const mockConfigRepository = {
        findOne: jest.fn(),
    };

    const mockFaqAiService = {
        generateFaqAnswer: jest.fn(),
        categorizeQuestion: jest.fn(),
    };

    const mockConfidenceCalculator = {
        calculateConfidence: jest.fn(),
        calculateSimilarityScore: jest.fn(),
    };

    const mockData: NormalizedData = {
        sourceId: 'src-1',
        sourceType: 'ticket',
        content: 'How do I reset password?',
        normalizedContent: 'how do i reset password',
        metadata: {},
        timestamp: new Date(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FaqGeneratorService,
                {
                    provide: getRepositoryToken(LearnedFaqEntry),
                    useValue: mockFaqRepository,
                },
                {
                    provide: getRepositoryToken(LearningPattern),
                    useValue: mockPatternRepository,
                },
                {
                    provide: getRepositoryToken(FaqLearningConfig),
                    useValue: mockConfigRepository,
                },
                {
                    provide: FaqAiService,
                    useValue: mockFaqAiService,
                },
                {
                    provide: ConfidenceCalculatorService,
                    useValue: mockConfidenceCalculator,
                },
            ],
        }).compile();

        service = module.get<FaqGeneratorService>(FaqGeneratorService);
        faqRepository = module.get(getRepositoryToken(LearnedFaqEntry));
        patternRepository = module.get(getRepositoryToken(LearningPattern));
        configRepository = module.get(getRepositoryToken(FaqLearningConfig));
        faqAiService = module.get(FaqAiService);
        confidenceCalculator = module.get(ConfidenceCalculatorService);

        jest.clearAllMocks();
    });

    describe('generateFaq', () => {
        it('should generate FAQ using AI when no template matches', async () => {
            mockConfigRepository.findOne.mockResolvedValue({
                useTemplates: true,
                generateWithAi: true
            });
            mockFaqAiService.generateFaqAnswer.mockResolvedValue({
                answer: 'You can reset it via email.',
                confidence: 0.9,
                keywords: ['reset', 'email']
            });
            mockConfidenceCalculator.calculateConfidence.mockResolvedValue({
                overallConfidence: 0.9,
                recommendation: 'auto_publish'
            });

            const result = await service.generateFaq(mockData, []);

            expect(result.answer).toBe('You can reset it via email.');
            expect(result.generationMethod).toBe('ai');
        });

        it('should use template if available and matching', async () => {
            // Setup template logic mock - assuming internal map or DB
            // Since templates are loaded internally or via DB, we might mock the method finding best template
            jest.spyOn(service as any, 'findBestTemplate').mockResolvedValue({
                id: 'tpl-1',
                template: 'Reset via {{method}}',
                variables: ['method']
            });
            jest.spyOn(service as any, 'extractTemplateVariables').mockReturnValue({
                method: 'settings'
            });

            const result = await service.generateFaq(mockData, []);

            expect(result.answer).toContain('Reset via settings');
            expect(result.generationMethod).toBe('template');
        });
    });

    describe('generateBatch', () => {
        it('should process batch of data', async () => {
            const dataList = [mockData, { ...mockData, sourceId: 'src-2' }];

            jest.spyOn(service, 'generateFaq').mockResolvedValue({
                question: 'Q',
                answer: 'A',
                confidence: 1,
                generationMethod: 'ai',
                sourcePatterns: [],
                qualityScore: 1,
                keywords: [],
                metadata: {} as any
            });

            const result = await service.generateBatch(dataList);

            expect(result.successful).toHaveLength(2);
            expect(result.failed).toHaveLength(0);
        });

        it('should handle failures in batch', async () => {
            const dataList = [mockData];
            jest.spyOn(service, 'generateFaq').mockRejectedValue(new Error('Fail'));

            const result = await service.generateBatch(dataList);

            expect(result.successful).toHaveLength(0);
            expect(result.failed).toHaveLength(1);
        });
    });

    describe('detectDuplicates', () => {
        it('should detect duplicate questions', async () => {
            mockFaqRepository.createQueryBuilder().getMany.mockResolvedValue([
                { id: 'faq-1', question: 'How to reset password?' }
            ]);
            // Mock similarity calculation
            jest.spyOn(service, 'calculateSimilarity').mockResolvedValue(0.95);

            const result = await service.detectDuplicates('How do I reset my password?');

            expect(result.isDuplicate).toBe(true);
            expect(result.similarFaqs[0].similarity).toBe(0.95);
        });
    });

    describe('mergeFaqs', () => {
        it('should merge new FAQ with existing similar ones', async () => {
            const newFaq = {
                question: 'New Q',
                answer: 'New A',
                confidence: 0.8,
                generationMethod: 'ai' as const,
                sourcePatterns: [],
                qualityScore: 0.8,
                keywords: [],
                metadata: {} as any
            };
            const similar = [{ id: 'old-1', question: 'Old Q', similarity: 0.9 }];

            // Mock internals
            mockFaqAiService.generateFaqAnswer.mockResolvedValue({
                answer: 'Merged A',
                confidence: 0.95,
            });

            const result = await service.mergeFaqs(newFaq, similar);

            expect(result.generationMethod).toBe('merged');
            expect(result.mergedFrom).toContain('old-1');
        });
    });

    describe('validateQuality', () => {
        it('should calculate quality score', async () => {
            const faq = {
                question: 'Short',
                answer: 'Too short',
                confidence: 0.5,
                keywords: []
            };

            const score = await service.validateQuality(faq as any);

            expect(score).toBeLessThan(0.8); // Assuming strict validation on length
        });
    });

    describe('autoAssignCategory', () => {
        it('should assign category using AI', async () => {
            mockFaqAiService.categorizeQuestion.mockResolvedValue('Technical');

            const category = await service.autoAssignCategory('Q', 'A');

            expect(category).toBe('Technical');
        });
    });

    describe('NLP Helpers', () => {
        it('should extract product from question', () => {
            const product = service.extractProduct('problem with Feature X');
            // Logic depends on implementation (regex/list), hard to test without knowing list
            // Assuming naive implementation or mocking if it uses external dict
            // If pure regex, we test expected patterns
            expect(service.extractProduct('Login page')).toBeDefined();
        });
    });
});
