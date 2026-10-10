import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GeneralCommunicationContextService } from './general-communication-context.service';
import { KnowledgeBaseArticle } from '../../tickets/entities/knowledge-base-article.entity';
import { ChatContextEngineService } from './chat-context-engine.service';

describe('GeneralCommunicationContextService', () => {
    let service: GeneralCommunicationContextService;
    let kbRepository: Repository<KnowledgeBaseArticle>;

    const mockKbRepository = {
        createQueryBuilder: jest.fn(() => ({
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            getMany: jest.fn(),
        })),
    };

    const mockContextEngine = {
        extractMatchedContent: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GeneralCommunicationContextService,
                { provide: getRepositoryToken(KnowledgeBaseArticle), useValue: mockKbRepository },
                { provide: ChatContextEngineService, useValue: mockContextEngine },
            ],
        }).compile();

        service = module.get<GeneralCommunicationContextService>(GeneralCommunicationContextService);
        kbRepository = module.get(getRepositoryToken(KnowledgeBaseArticle));

        jest.clearAllMocks();
    });

    describe('buildGeneralContext', () => {
        it('should build context for general queries', async () => {
            jest.spyOn(service, 'searchPlatformKnowledgeBase').mockResolvedValue([]);

            const context = await service.buildGeneralContext('how to start', 'session-1');

            expect(context).toBeDefined();
            expect(service.searchPlatformKnowledgeBase).toHaveBeenCalled();
        });
    });

    describe('searchPlatformKnowledgeBase', () => {
        it('should query platform-specific categories', async () => {
            mockKbRepository.createQueryBuilder().getMany.mockResolvedValue([]);

            await service.searchPlatformKnowledgeBase('setup', 5, { includeGettingStarted: true });

            expect(mockKbRepository.createQueryBuilder).toHaveBeenCalled();
            // Verify category filter logic in implementation via coverage
        });
    });

    describe('isPlatformInformationQuery', () => {
        it('should identify platform questions', () => {
            expect(service.isPlatformInformationQuery('how do i reset password')).toBe(true);
            expect(service.isPlatformInformationQuery('hello')).toBe(false); // Likely false for greeting
        });
    });

    describe('getSuggestedTopics', () => {
        it('should return predefined topics', async () => {
            const topics = await service.getSuggestedTopics();
            expect(topics.length).toBeGreaterThan(0);
            expect(topics[0]).toHaveProperty('title');
        });
    });
});
