import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatDataExtractorService } from './chat-data-extractor.service';
import { ChatSession } from '../../chat/entities/chat-session.entity';
import { ChatMessage } from '../../chat/entities/chat-message.entity';
import { DataNormalizerService } from './data-normalizer.service';

describe('ChatDataExtractorService', () => {
    let service: ChatDataExtractorService;
    let chatSessionRepository: Repository<ChatSession>;
    let chatMessageRepository: Repository<ChatMessage>;
    let dataNormalizer: DataNormalizerService;

    const mockChatSessionRepository = {
        find: jest.fn(),
        createQueryBuilder: jest.fn(() => ({
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getMany: jest.fn(),
            getCount: jest.fn(),
            select: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
        })),
        count: jest.fn(),
        findOne: jest.fn(),
    };

    const mockChatMessageRepository = {
        find: jest.fn(),
    };

    const mockDataNormalizer = {
        cleanText: jest.fn(text => text),
        validateDataQuality: jest.fn(() => true),
    };

    const mockSession = {
        id: 'session-123',
        status: 'closed',
        websiteId: 'web-1',
        startedAt: new Date(Date.now() - 3600000), // 1 hour ago
        endedAt: new Date(),
        metadata: {
            satisfactionScore: 5,
            resolved: true
        },
        messages: [
            {
                id: 'msg-1',
                content: 'How do I login?',
                senderType: 'visitor',
                createdAt: new Date(Date.now() - 3000000)
            },
            {
                id: 'msg-2',
                content: 'You can login via the button.',
                senderType: 'agent',
                createdAt: new Date(Date.now() - 2900000)
            }
        ]
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChatDataExtractorService,
                {
                    provide: getRepositoryToken(ChatSession),
                    useValue: mockChatSessionRepository,
                },
                {
                    provide: getRepositoryToken(ChatMessage),
                    useValue: mockChatMessageRepository,
                },
                {
                    provide: DataNormalizerService,
                    useValue: mockDataNormalizer,
                },
            ],
        }).compile();

        service = module.get<ChatDataExtractorService>(ChatDataExtractorService);
        chatSessionRepository = module.get(getRepositoryToken(ChatSession));
        chatMessageRepository = module.get(getRepositoryToken(ChatMessage));
        dataNormalizer = module.get(DataNormalizerService);

        jest.clearAllMocks();
    });

    describe('extract', () => {
        it('should extract data from valid closed sessions', async () => {
            // Mock db response
            mockChatSessionRepository.createQueryBuilder().getMany.mockResolvedValue([mockSession]);

            const result = await service.extract({
                startDate: new Date(Date.now() - 86400000),
                endDate: new Date(),
            });

            expect(result).toHaveLength(1);
            expect(result[0].question).toBe('How do I login?');
            expect(result[0].sourceType).toBe('chat');
        });

        it('should filter sessions based on criteria', async () => {
            mockChatSessionRepository.createQueryBuilder().getMany.mockResolvedValue([]);

            const result = await service.extract({});

            expect(result).toHaveLength(0);
        });
    });

    describe('extractQAPairs', () => {
        it('should pair visitor questions with agent answers', () => {
            const pairs = service.extractQAPairs(mockSession as any);

            expect(pairs).toHaveLength(1);
            expect(pairs[0].question).toBe('How do I login?');
            expect(pairs[0].answer).toBe('You can login via the button.');
        });

        it('should ignore pairs where question is not meaningful', () => {
            const badSession = {
                ...mockSession,
                messages: [
                    { content: 'Hi', senderType: 'visitor' }, // Too short
                    { content: 'Hello', senderType: 'agent' }
                ]
            };

            const pairs = service.extractQAPairs(badSession as any);

            expect(pairs).toHaveLength(0);
        });
    });

    describe('isMeaningfulQuestion', () => {
        it('should identify meaningful questions', () => {
            expect(service.isMeaningfulQuestion('How do I reset password?')).toBe(true);
            expect(service.isMeaningfulQuestion('Hi')).toBe(false);
            expect(service.isMeaningfulQuestion('Thanks')).toBe(false);
        });
    });

    describe('calculatePairConfidence', () => {
        it('should calculate confidence score', () => {
            const pair = { question: 'Q', answer: 'A', isHelpful: true };
            const score = service.calculatePairConfidence(pair, mockSession as any, 5);

            expect(score).toBeGreaterThan(0);
        });
    });

    describe('getExtractionStats', () => {
        it('should return statistics', async () => {
            mockChatSessionRepository.count.mockResolvedValue(100);

            const stats = await service.getExtractionStats();

            expect(stats.totalSessions).toBe(100);
        });
    });

    describe('inferCategory', () => {
        it('should infer category from keywords', () => {
            const category = service.inferCategory('billing issue payment');
            expect(category.toLowerCase()).toContain('billing');
            // Assuming naive implementation returns matched category based on keyword
        });
    });
});
