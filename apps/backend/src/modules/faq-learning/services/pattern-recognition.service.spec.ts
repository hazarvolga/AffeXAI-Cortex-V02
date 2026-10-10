import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatternRecognitionService } from './pattern-recognition.service';
import { LearningPattern, PatternType } from '../entities/learning-pattern.entity';

describe('PatternRecognitionService', () => {
    let service: PatternRecognitionService;
    let repository: Repository<LearningPattern>;

    const mockPattern: Partial<LearningPattern> = {
        id: 'pattern-123',
        pattern: 'how to login',
        type: PatternType.QUESTION,
        frequency: 10,
        confidence: 0.9,
        keywords: ['login', 'how', 'to'],
        relatedPatterns: [],
    };

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

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PatternRecognitionService,
                {
                    provide: getRepositoryToken(LearningPattern),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<PatternRecognitionService>(PatternRecognitionService);
        repository = module.get(getRepositoryToken(LearningPattern));

        jest.clearAllMocks();
    });

    describe('identifyPatterns', () => {
        it('should identify patterns from extracted data', async () => {
            const data = [{
                content: 'How do I reset my password?',
                type: 'message',
                source: 'chat'
            }];

            jest.spyOn(service, 'extractKeywords').mockResolvedValue(['reset', 'password']);
            jest.spyOn(service, 'findSimilarPatterns').mockResolvedValue([]);

            const result = await service.identifyPatterns(data);

            expect(result).toBeInstanceOf(Array);
            expect(result.length).toBeGreaterThan(0);
            expect(result[0].pattern).toContain('reset');
        });
    });

    describe('NLP Methods', () => {
        describe('calculateSimilarityScore', () => {
            it('should return 1 for identical strings', async () => {
                const score = await service.calculateSimilarityScore('test', 'test');
                expect(score).toBe(1);
            });

            it('should return 0 for completely different strings', async () => {
                const score = await service.calculateSimilarityScore('abc', 'xyz');
                expect(score).toBeLessThan(0.1);
            });

            it('should handle case insensitivity', async () => {
                const score = await service.calculateSimilarityScore('Test', 'test');
                expect(score).toBe(1);
            });
        });

        describe('extractKeywords', () => {
            it('should extract significant words', async () => {
                const keywords = await service.extractKeywords('The quick brown fox jumps');
                expect(keywords).toContain('quick');
                expect(keywords).toContain('brown');
                expect(keywords).not.toContain('the'); // stop word
            });
        });

        describe('isQuestion', () => {
            it('should detect questions', () => {
                expect(service.isQuestion('What is this?')).toBe(true);
                expect(service.isQuestion('How to do it')).toBe(true); // often implied
                expect(service.isQuestion('This is a statement.')).toBe(false);
            });
        });

        describe('splitIntoSentences', () => {
            it('should split text into sentences', () => {
                const sentences = service.splitIntoSentences('Hello world. How are you?');
                expect(sentences).toHaveLength(2);
                expect(sentences[0]).toBe('Hello world.');
            });
        });
    });

    describe('findSimilarPatterns', () => {
        it('should find patterns with high similarity', async () => {
            mockRepository.find.mockResolvedValue([mockPattern]);

            const result = await service.findSimilarPatterns('how to login');

            expect(result).toHaveLength(1);
            expect(result[0].pattern).toBe('how to login');
        });
    });

    describe('groupSimilarQuestions', () => {
        it('should group similar questions together', async () => {
            const questions = [
                'How to login?',
                'I cannot login',
                'Different topic completely'
            ];

            const groups = await service.groupSimilarQuestions(questions);

            expect(groups.length).toBeGreaterThan(0);
            // Assuming 'How to login?' and 'I cannot login' share keywords like 'login'
            const loginGroup = groups.find(g => g.representative.includes('login'));
            expect(loginGroup).toBeDefined();
        });
    });

    describe('identifyQuestionAnswerPairs', () => {
        it('should identify Q&A pairs from conversation', async () => {
            const messages = [
                { content: 'How do I pay?', type: 'user' as const, timestamp: new Date() },
                { content: 'You can pay via credit card.', type: 'agent' as const, timestamp: new Date() }
            ];

            const pairs = await service.identifyQuestionAnswerPairs(messages);

            expect(pairs).toHaveLength(1);
            expect(pairs[0].question).toBe('How do I pay?');
            expect(pairs[0].answer).toBe('You can pay via credit card.');
        });
    });

    describe('calculatePatternConfidence', () => {
        it('should calculate confidence based on frequency and validation', async () => {
            const pattern = {
                ...mockPattern,
                frequency: 50,
                validationCount: 10,
                rejectionCount: 1
            } as LearningPattern;

            const confidence = await service.calculatePatternConfidence(pattern);

            expect(confidence).toBeGreaterThan(0.5);
        });
    });

    describe('findDuplicates', () => {
        it('should identify duplicate entries', async () => {
            const questions = [
                'Login issue',
                'Login problem', // duplicate of above likely
                'Unique issue'
            ];

            const result = await service.findDuplicates(questions);

            expect(result.some(r => r.original === 'Login issue')).toBe(true);
        });
    });
});
