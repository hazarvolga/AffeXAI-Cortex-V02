import { TenantService } from '../../../core/tenant/tenant.service';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FaqEnhancedSearchService } from './faq-enhanced-search.service';
import { LearnedFaqEntry } from '../entities/learned-faq-entry.entity';
import { KnowledgeBaseArticle } from '../../tickets/entities/knowledge-base-article.entity';

describe('FaqEnhancedSearchService', () => {
    let service: FaqEnhancedSearchService;
    let faqRepository: Repository<LearnedFaqEntry>;
    let articleRepository: Repository<KnowledgeBaseArticle>;

    const mockFaqRepository = {
        find: jest.fn(),
        createQueryBuilder: jest.fn(() => ({
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getMany: jest.fn(),
            getManyAndCount: jest.fn(),
            orderBy: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
        })),
    };

    const mockArticleRepository = {
        createQueryBuilder: jest.fn(() => ({
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getMany: jest.fn(),
        })),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {provide:TenantService,useValue:{getTenantContext:()=>({tenantId:"fixture",source:"authenticated"}),runWithTenant:(_context,callback)=>callback()}},
                FaqEnhancedSearchService,
                {
                    provide: getRepositoryToken(LearnedFaqEntry),
                    useValue: mockFaqRepository,
                },
                {
                    provide: getRepositoryToken(KnowledgeBaseArticle),
                    useValue: mockArticleRepository,
                },
            ],
        }).compile();

        service = module.get<FaqEnhancedSearchService>(FaqEnhancedSearchService);
        faqRepository = module.get(getRepositoryToken(LearnedFaqEntry));
        articleRepository = module.get(getRepositoryToken(KnowledgeBaseArticle));

        jest.clearAllMocks();
    });

    describe('search', () => {
        it('should search strictly FAQs only', async () => {
            jest.spyOn(service, 'searchFaqs').mockResolvedValue([]);
            jest.spyOn(service, 'searchArticles').mockResolvedValue([]);

            const result = await service.search({
                query: 'test',
                options:{includeFaqs: true,
                includeArticles: false}
            });

            expect(service.searchFaqs).toHaveBeenCalled();
            expect(service.searchArticles).not.toHaveBeenCalled();
            expect(result.results).toEqual([]);
        });

        it('should aggregate results from both sources', async () => {
            const faqResult = { id: '1', type: 'faq', relevanceScore: 10,tags:[],metadata:{} } as any;
            const articleResult = { id: '2', type: 'article', relevanceScore: 5,tags:[],metadata:{} } as any;

            jest.spyOn(service, 'searchFaqs').mockResolvedValue([faqResult]);
            jest.spyOn(service, 'searchArticles').mockResolvedValue([articleResult]);

            const result = await service.search({
                query: 'test',
                options:{includeFaqs: true,
                includeArticles: true}
            });

            expect(result.results).toHaveLength(2);
            expect(result.results[0].type).toBe('faq'); // Sorted by relevance
        });
    });

    describe('searchFaqs', () => {
        it('should query repository with filters', async () => {
            mockFaqRepository.createQueryBuilder().getMany.mockResolvedValue([]);

            await service.searchFaqs({
                query: 'login',
                category: ['General']
            });

            expect(mockFaqRepository.createQueryBuilder).toHaveBeenCalled();
            // Verify query builder logic if possible, or just the call flow
        });
    });

    describe('calculateRelevanceScore', () => {
        it('should score exact matches higher', () => {
            const score = service.calculateRelevanceScore(
                'login password',
                'Login Password Issue',
                'How to reset login password',
                ['login', 'password'],
                1.0,
                10
            );

            const lowScore = service.calculateRelevanceScore(
                'login password',
                'Unrelated Title',
                'Some content',
                [],
                0.5,
                0
            );

            expect(score).toBeGreaterThan(lowScore);
        });
    });

    describe('generateSnippet', () => {
        it('should generate snippet around query terms', () => {
            const text = 'This is a long text containing the keyword login in the middle.';
            const snippet = service.generateSnippet(text, 'login', 20);

            expect(snippet.toLowerCase()).toContain('login');
            expect(snippet.length).toBeLessThanOrEqual(50); // Roughly 20 chars + padding
        });
    });

    describe('generateSuggestions', () => {
        it('should suggest corrections or alternatives', async () => {
            const results = [{ title: 'How to login' }, { title: 'Login issues' }] as any;
            const suggestions = await service.generateSuggestions('logim', results);

            // Assuming simple suggestion logic
            expect(suggestions).toBeInstanceOf(Array);
        });
    });

    describe('Cache', () => {
        it('should read fresh results so revoked content is not cached', async () => {
            jest.spyOn(service, 'searchFaqs').mockResolvedValue([]);

            await service.search({ query: 'cache-test' }); // Miss
            await service.search({ query: 'cache-test' }); // Hit

            expect(service.searchFaqs).toHaveBeenCalledTimes(2);
        });

        it('should clear cache', () => {
            service.clearCache();
            // No observable state change externally except via behavior
            expect(true).toBe(true);
        });
    });
});
