import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatContextEngineService } from './chat-context-engine.service';
import { ChatContextSource } from '../entities/chat-context-source.entity';
import { KnowledgeBaseArticle } from '../../tickets/entities/knowledge-base-article.entity';
import { LearnedFaqEntry } from '../../faq-learning/entities/learned-faq-entry.entity';
import { LearningPattern } from '../../faq-learning/entities/learning-pattern.entity';
import { ChatDocument } from '../entities/chat-document.entity';
import { FaqEnhancedSearchService } from '../../faq-learning/services/faq-enhanced-search.service';

describe('ChatContextEngineService', () => {
    let service: ChatContextEngineService;
    let contextSourceRepository: Repository<ChatContextSource>;
    let knowledgeBaseRepository: Repository<KnowledgeBaseArticle>;
    let faqRepository: Repository<LearnedFaqEntry>;
    let documentRepository: Repository<ChatDocument>;
    let faqEnhancedSearchService: FaqEnhancedSearchService;

    const mockContextSourceRepository = { create: jest.fn(), save: jest.fn() };
    const mockKnowledgeBaseRepository = {
        createQueryBuilder: jest.fn(() => ({
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            getMany: jest.fn(),
        })),
    };
    const mockFaqRepository = {
        createQueryBuilder: jest.fn(() => ({
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            getMany: jest.fn(),
        })),
    };
    const mockDocumentRepository = {
        createQueryBuilder: jest.fn(() => ({
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            getMany: jest.fn(),
        })),
    };
    const mockLearningPatternRepository = { find: jest.fn() };
    const mockFaqEnhancedSearchService = {
        search: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChatContextEngineService,
                { provide: getRepositoryToken(ChatContextSource), useValue: mockContextSourceRepository },
                { provide: getRepositoryToken(KnowledgeBaseArticle), useValue: mockKnowledgeBaseRepository },
                { provide: getRepositoryToken(LearnedFaqEntry), useValue: mockFaqRepository },
                { provide: getRepositoryToken(LearningPattern), useValue: mockLearningPatternRepository },
                { provide: getRepositoryToken(ChatDocument), useValue: mockDocumentRepository },
                { provide: FaqEnhancedSearchService, useValue: mockFaqEnhancedSearchService },
            ],
        }).compile();

        service = module.get<ChatContextEngineService>(ChatContextEngineService);
        contextSourceRepository = module.get(getRepositoryToken(ChatContextSource));
        knowledgeBaseRepository = module.get(getRepositoryToken(KnowledgeBaseArticle));
        faqRepository = module.get(getRepositoryToken(LearnedFaqEntry));
        documentRepository = module.get(getRepositoryToken(ChatDocument));
        faqEnhancedSearchService = module.get(FaqEnhancedSearchService);

        jest.clearAllMocks();
    });

    describe('buildContext', () => {
        it('should aggregate context from enabled sources', async () => {
            // Mock sub-methods
            jest.spyOn(service, 'searchKnowledgeBase').mockResolvedValue([]);
            jest.spyOn(service, 'searchFaqLearning').mockResolvedValue([]);
            jest.spyOn(service, 'searchDocuments').mockResolvedValue([]);

            const context = await service.buildContext('query', 'session-1', {
                includeKnowledgeBase: true,
                includeFaqLearning: true,
                includeDocuments: true
            });

            expect(context).toBeDefined();
            expect(service.searchKnowledgeBase).toHaveBeenCalled();
            expect(service.searchFaqLearning).toHaveBeenCalled();
        });

        it('should respect max sources limit', async () => {
            jest.spyOn(service, 'searchKnowledgeBase').mockResolvedValue([]);
            jest.spyOn(service, 'rankSources').mockResolvedValue(new Array(5).fill({}));

            const context = await service.buildContext('query', 'session-1', { maxSources: 3 });

            expect(context.sources.length).toBeLessThanOrEqual(3);
        });
    });

    describe('searchKnowledgeBase', () => {
        it('should query KBA repository', async () => {
            mockKnowledgeBaseRepository.createQueryBuilder().getMany.mockResolvedValue([]);

            await service.searchKnowledgeBase('test');

            expect(mockKnowledgeBaseRepository.createQueryBuilder).toHaveBeenCalled();
        });
    });

    describe('searchFaqLearning', () => {
        it('should use enhanced search service', async () => {
            mockFaqEnhancedSearchService.search.mockResolvedValue({ results: [] });

            await service.searchFaqLearning('test');

            expect(mockFaqEnhancedSearchService.search).toHaveBeenCalled();
        });
    });

    describe('calculateRelevance', () => {
        it('should calculate KB relevance', async () => {
            const article = { title: 'Test Title', content: 'Test Content' } as any;
            const score = await service.calculateKnowledgeBaseRelevance(article, 'test');
            expect(score).toBeGreaterThan(0);
        });

        it('should calculate FAQ relevance', async () => {
            const faq = { question: 'Q', answer: 'A' } as any;
            const score = await service.calculateFaqLearningRelevance(faq, 'Q');
            expect(score).toBeGreaterThan(0);
        });
    });

    describe('extractMatchedContent', () => {
        it('should return context window around match', () => {
            const content = 'Pre ... Match ... Post';
            const result = service.extractMatchedContent(content, 'Match');
            expect(result).toContain('Match');
        });
    });
});
