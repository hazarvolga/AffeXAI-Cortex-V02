import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatContextEngineService } from '../src/modules/chat/services/chat-context-engine.service';
import { ChatContextSource } from '../src/modules/chat/entities/chat-context-source.entity';
import { ChatDocument } from '../src/modules/chat/entities/chat-document.entity';
import { KnowledgeBaseArticle } from '../src/modules/tickets/entities/knowledge-base-article.entity';
import { LearnedFaqEntry } from '../src/modules/faq-learning/entities/learned-faq-entry.entity';
import { LearningPattern } from '../src/modules/faq-learning/entities/learning-pattern.entity';
import { FaqEnhancedSearchService } from '../src/modules/faq-learning/services/faq-enhanced-search.service';

describe('ChatContextEngineService', () => {
  let service: ChatContextEngineService;
  let contextSourceRepository: Repository<ChatContextSource>;
  let documentRepository: Repository<ChatDocument>;
  let knowledgeBaseRepository: Repository<KnowledgeBaseArticle>;
  let faqRepository: Repository<LearnedFaqEntry>;
  let patternRepository: Repository<LearningPattern>;
  let faqEnhancedSearchService: FaqEnhancedSearchService;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    })),
  };

  const mockFaqEnhancedSearchService = {
    search: jest.fn().mockResolvedValue({
      results: [],
      total: 0,
      page: 1,
      limit: 10,
      query: '',
      suggestions: [],
      relatedFaqs: [],
      processingTime: 0
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatContextEngineService,
        {
          provide: getRepositoryToken(ChatContextSource),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(ChatDocument),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(KnowledgeBaseArticle),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(LearnedFaqEntry),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(LearningPattern),
          useValue: mockRepository,
        },
        {
          provide: FaqEnhancedSearchService,
          useValue: mockFaqEnhancedSearchService,
        },
      ],
    }).compile();

    service = module.get<ChatContextEngineService>(ChatContextEngineService);
    contextSourceRepository = module.get<Repository<ChatContextSource>>(getRepositoryToken(ChatContextSource));
    documentRepository = module.get<Repository<ChatDocument>>(getRepositoryToken(ChatDocument));
    knowledgeBaseRepository = module.get<Repository<KnowledgeBaseArticle>>(getRepositoryToken(KnowledgeBaseArticle));
    faqRepository = module.get<Repository<LearnedFaqEntry>>(getRepositoryToken(LearnedFaqEntry));
    patternRepository = module.get<Repository<LearningPattern>>(getRepositoryToken(LearningPattern));
    faqEnhancedSearchService = module.get<FaqEnhancedSearchService>(FaqEnhancedSearchService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('buildContext', () => {
    it('should build context from multiple sources', async () => {
      const query = 'test query';
      const sessionId = 'test-session-id';

      // Mock empty results for all sources
      jest.spyOn(service, 'searchKnowledgeBase').mockResolvedValue([]);
      jest.spyOn(service, 'searchFaqLearning').mockResolvedValue([]);
      jest.spyOn(service, 'searchDocuments').mockResolvedValue([]);

      const result = await service.buildContext(query, sessionId);

      expect(result).toBeDefined();
      expect(result.sources).toEqual([]);
      expect(result.searchQuery).toBe(query);
      expect(result.totalRelevanceScore).toBe(0);
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should filter sources by minimum relevance score', async () => {
      const query = 'test query';
      const sessionId = 'test-session-id';
      const minRelevanceScore = 0.5;

      // Mock results with different relevance scores
      const mockKbResults = [{
        article: { id: '1', title: 'Test Article', content: 'Test content' } as any,
        relevanceScore: 0.3, // Below threshold
        matchedContent: 'Test content'
      }];

      const mockFaqResults = [{
        faqEntry: { id: '2', question: 'Test Question', answer: 'Test answer' } as any,
        relevanceScore: 0.7, // Above threshold
        matchedContent: 'Test answer',
        confidence: 80
      }];

      jest.spyOn(service, 'searchKnowledgeBase').mockResolvedValue(mockKbResults);
      jest.spyOn(service, 'searchFaqLearning').mockResolvedValue(mockFaqResults);
      jest.spyOn(service, 'searchDocuments').mockResolvedValue([]);

      const result = await service.buildContext(query, sessionId, { minRelevanceScore });

      expect(result.sources).toHaveLength(1);
      expect(result.sources[0].relevanceScore).toBeGreaterThanOrEqual(minRelevanceScore);
    });
  });

  describe('searchKnowledgeBase', () => {
    it('should search knowledge base articles', async () => {
      const query = 'test query';
      const mockArticles = [
        {
          id: '1',
          title: 'Test Article',
          content: 'Test content with test query',
          summary: 'Test summary',
          tags: ['test'],
          viewCount: 10,
          helpfulCount: 5,
          notHelpfulCount: 1,
          searchScore: 80
        }
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockArticles),
      };

      jest.spyOn(knowledgeBaseRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const results = await service.searchKnowledgeBase(query, 5);

      expect(results).toBeDefined();
      expect(results).toHaveLength(1);
      expect(results[0].article.id).toBe('1');
      expect(results[0].relevanceScore).toBeGreaterThan(0);
    });
  });

  describe('searchFaqLearning', () => {
    it('should use enhanced search service', async () => {
      const query = 'test query';
      const mockSearchResponse = {
        results: [{
          id: '1',
          type: 'faq' as const,
          title: 'Test Question',
          content: 'Test answer',
          snippet: 'Test snippet',
          relevanceScore: 85,
          confidence: 80,
          category: 'test',
          tags: ['test'],
          url: '/help/faq/1',
          metadata: {
            usageCount: 5,
            helpfulCount: 3,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        }],
        total: 1,
        page: 1,
        limit: 5,
        query,
        suggestions: [],
        relatedFaqs: [],
        processingTime: 10
      };

      const mockFaqEntry = {
        id: '1',
        question: 'Test Question',
        answer: 'Test answer',
        confidence: 80
      };

      mockFaqEnhancedSearchService.search.mockResolvedValue(mockSearchResponse);
      jest.spyOn(faqRepository, 'findOne').mockResolvedValue(mockFaqEntry as any);

      const results = await service.searchFaqLearning(query, 5);

      expect(results).toBeDefined();
      expect(results).toHaveLength(1);
      expect(results[0].faqEntry.id).toBe('1');
      expect(results[0].relevanceScore).toBe(0.85); // Normalized from 85 to 0.85
    });
  });

  describe('searchDocuments', () => {
    it('should search documents in session', async () => {
      const query = 'test query';
      const sessionId = 'test-session-id';
      const mockDocuments = [
        {
          id: '1',
          filename: 'test.pdf',
          fileType: 'pdf',
          fileSize: 1024,
          extractedContent: 'This is test content with test query',
          createdAt: new Date()
        }
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockDocuments),
      };

      jest.spyOn(documentRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const results = await service.searchDocuments(query, sessionId, 3);

      expect(results).toBeDefined();
      expect(results).toHaveLength(1);
      expect(results[0].document.id).toBe('1');
      expect(results[0].relevanceScore).toBeGreaterThan(0);
    });
  });

  describe('getContextStatistics', () => {
    it('should return context statistics', async () => {
      const mockSources = [
        {
          sourceType: 'knowledge_base',
          relevanceScore: 0.8,
          metadata: { category: 'Technical' }
        },
        {
          sourceType: 'faq_learning',
          relevanceScore: 0.6,
          metadata: { category: 'General' }
        }
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockSources),
      };

      jest.spyOn(contextSourceRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const stats = await service.getContextStatistics();

      expect(stats).toBeDefined();
      expect(stats.totalSources).toBe(2);
      expect(stats.averageRelevanceScore).toBe(0.7);
      expect(stats.sourcesByType).toBeDefined();
      expect(stats.topCategories).toBeDefined();
    });
  });
});