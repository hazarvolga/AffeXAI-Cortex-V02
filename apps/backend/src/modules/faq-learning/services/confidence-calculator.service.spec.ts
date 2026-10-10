import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfidenceCalculatorService } from './confidence-calculator.service';
import { FaqLearningConfig } from '../entities/faq-learning-config.entity';
import { ExtractedData } from '../interfaces/data-extraction.interface';

describe('ConfidenceCalculatorService', () => {
    let service: ConfidenceCalculatorService;
    let configRepository: Repository<FaqLearningConfig>;

    const mockConfig: Partial<FaqLearningConfig> = {
        id: 'config-123',
        minConfidenceScore: 0.7,
        learningRate: 0.1,
        reviewThreshold: 0.9,
        weights: {
            sourceQuality: 0.2,
            patternFrequency: 0.2,
            resolutionSuccess: 0.1,
            userSatisfaction: 0.1,
            contextClarity: 0.1,
            answerCompleteness: 0.1,
            similarityToExisting: 0.1,
            aiConfidence: 0.1
        }
    };

    const mockRepository = {
        findOne: jest.fn(),
    };

    const mockData: ExtractedData = {
        sourceId: 'ticket-1',
        sourceType: 'ticket',
        content: 'How to login?',
        metadata: {
            resolutionStatus: 'resolved',
            satisfactionScore: 5,
            hasAttachments: false,
            messageCount: 5
        },
        timestamp: new Date()
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ConfidenceCalculatorService,
                {
                    provide: getRepositoryToken(FaqLearningConfig),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<ConfidenceCalculatorService>(ConfidenceCalculatorService);
        configRepository = module.get(getRepositoryToken(FaqLearningConfig));

        jest.clearAllMocks();
    });

    describe('calculateConfidence', () => {
        it('should calculate overall confidence score', async () => {
            mockRepository.findOne.mockResolvedValue(mockConfig);

            const result = await service.calculateConfidence(mockData, 10, 0.95, 0.0);

            expect(result.overallConfidence).toBeGreaterThan(0);
            expect(result.overallConfidence).toBeLessThanOrEqual(1);
            expect(result.factors).toBeDefined();
            expect(result.recommendation).toBeDefined();
        });

        it('should use default weights if config missing', async () => {
            mockRepository.findOne.mockResolvedValue({ ...mockConfig, weights: null });

            const result = await service.calculateConfidence(mockData);

            expect(result.overallConfidence).toBeDefined();
        });
    });

    describe('adjustConfidenceBasedOnFeedback', () => {
        it('should increase confidence for positive feedback', async () => {
            mockRepository.findOne.mockResolvedValue(mockConfig);

            const newScore = await service.adjustConfidenceBasedOnFeedback(0.5, 'helpful', 1);

            expect(newScore).toBeGreaterThan(0.5);
        });

        it('should decrease confidence for negative feedback', async () => {
            mockRepository.findOne.mockResolvedValue(mockConfig);

            const newScore = await service.adjustConfidenceBasedOnFeedback(0.5, 'not_helpful', 1);

            expect(newScore).toBeLessThan(0.5);
        });

        it('should cap confidence at 1.0', async () => {
            mockRepository.findOne.mockResolvedValue(mockConfig);

            const newScore = await service.adjustConfidenceBasedOnFeedback(0.99, 'helpful', 10);

            expect(newScore).toBeLessThanOrEqual(1.0);
        });
    });

    describe('Scoring Methods', () => {
        it('should calculate source quality score', () => {
            const score = service.calculateSourceQuality(mockData);
            expect(score).toBeGreaterThan(0);
        });

        it('should calculate pattern frequency score', () => {
            const score = service.calculatePatternFrequencyScore(100);
            expect(score).toBe(1); // Capped at high frequency
        });

        it('should calculate resolution success score', () => {
            const score = service.calculateResolutionSuccess(mockData);
            expect(score).toBe(1); // Resolved
        });

        it('should calculate user satisfaction score', () => {
            const score = service.calculateUserSatisfactionScore(mockData);
            expect(score).toBe(1); // 5/5 score
        });

        it('should calculate context clarity', () => {
            const score = service.calculateContextClarity(mockData);
            expect(score).toBeDefined();
        });

        it('should calculate answer completeness', () => {
            const score = service.calculateAnswerCompleteness(mockData);
            expect(score).toBeDefined();
        });
    });

    describe('getRecommendation', () => {
        it('should recommend auto_publish for very high confidence', async () => {
            mockRepository.findOne.mockResolvedValue(mockConfig);

            const rec = await service.getRecommendation(0.95);

            expect(rec).toBe('auto_publish');
        });

        it('should recommend rejection for low confidence', async () => {
            mockRepository.findOne.mockResolvedValue(mockConfig);

            const rec = await service.getRecommendation(0.2);

            expect(rec).toBe('reject');
        });
    });

    describe('generateReasoning', () => {
        it('should generate human-readable reasoning', () => {
            const factors = {
                sourceQuality: 0.9,
                patternFrequency: 0.8,
                resolutionSuccess: 1,
                userSatisfaction: 1,
                contextClarity: 0.5,
                answerCompleteness: 0.5,
                similarityToExisting: 0,
                aiConfidence: 0.9
            };

            const reasons = service.generateReasoning(factors);

            expect(reasons).toBeInstanceOf(Array);
            expect(reasons.length).toBeGreaterThan(0);
            expect(reasons.some(r => r.includes('Source quality'))).toBe(true);
        });
    });

    describe('getConfidenceConfig', () => {
        it('should return merged config with defaults', async () => {
            mockRepository.findOne.mockResolvedValue(mockConfig);

            const config = await service.getConfidenceConfig();

            expect(config.weights).toBeDefined();
            expect(config.weights.sourceQuality).toBe(0.2);
        });
    });
});
