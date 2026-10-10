import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatFaqIntegrationService } from './chat-faq-integration.service';
import { LearnedFaqEntry } from '../entities/learned-faq-entry.entity';
import { FaqEnhancedSearchService } from './faq-enhanced-search.service';

describe('ChatFaqIntegrationService', () => {
    let service: ChatFaqIntegrationService;
    let faqRepository: Repository<LearnedFaqEntry>;
    let searchService: FaqEnhancedSearchService;

    const mockRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
    };

    const mockSearchService = {
        search: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChatFaqIntegrationService,
                {
                    provide: getRepositoryToken(LearnedFaqEntry),
                    useValue: mockRepository,
                },
                {
                    provide: FaqEnhancedSearchService,
                    useValue: mockSearchService,
                },
            ],
        }).compile();

        service = module.get<ChatFaqIntegrationService>(ChatFaqIntegrationService);
        faqRepository = module.get(getRepositoryToken(LearnedFaqEntry));
        searchService = module.get(FaqEnhancedSearchService);

        jest.clearAllMocks();
    });

    describe('suggestFaqsForMessage', () => {
        it('should return suggestions based on search', async () => {
            mockSearchService.search.mockResolvedValue({
                results: [{
                    id: '1',
                    type: 'faq',
                    title: 'Q',
                    content: 'A',
                    relevanceScore: 90,
                    confidence: 0.9,
                    tags: [] // Assuming missing fields are fine or mocked fully
                }]
            });

            const suggestions = await service.suggestFaqsForMessage('Help', 'session-1');

            expect(suggestions).toHaveLength(1);
            expect(suggestions[0].faqId).toBe('1');
        });

        it('should return empty if no relevant results', async () => {
            mockSearchService.search.mockResolvedValue({ results: [] });

            const suggestions = await service.suggestFaqsForMessage('Help', 'session-1');

            expect(suggestions).toHaveLength(0);
        });
    });

    describe('getAutoResponse', () => {
        it('should respond if confidence meets threshold', async () => {
            mockSearchService.search.mockResolvedValue({
                results: [{
                    id: '1',
                    type: 'faq',
                    title: 'Q',
                    content: 'The answer is 42',
                    relevanceScore: 95,
                    confidence: 0.95,
                    tags: []
                }]
            });

            const result = await service.getAutoResponse('What is the answer?', 'session-1', {
                enabled: true,
                minConfidence: 0.9,
                minRelevance: 90,
                maxSuggestions: 1,
                requireUserConfirmation: false
            });

            expect(result.shouldRespond).toBe(true);
            expect(result.response).toBe('The answer is 42');
        });

        it('should not respond if confidence low', async () => {
            mockSearchService.search.mockResolvedValue({
                results: [{
                    id: '1',
                    type: 'faq',
                    relevanceScore: 50, // Low
                    confidence: 0.5,
                    tags: []
                }]
            });

            const result = await service.getAutoResponse('Huh?', 'session-1', {
                enabled: true,
                minConfidence: 0.9,
                minRelevance: 90,
                maxSuggestions: 1,
                requireUserConfirmation: false
            });

            expect(result.shouldRespond).toBe(false);
        });
    });

    describe('processFeedback', () => {
        it('should record helpful feedback', async () => {
            mockRepository.findOne.mockResolvedValue({ id: '1', helpfulCount: 0 });

            await service.processFeedback({
                faqId: '1',
                sessionId: 's-1',
                wasHelpful: true,
                timestamp: new Date()
            });

            expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                helpfulCount: 1
            }));
        });
    });

    describe('Chat Context', () => {
        it('should maintain session context', async () => {
            await service.updateChatContext('s-1', { currentTopic: 'billing' });

            const context = await service.getChatContext('s-1');

            expect(context.currentTopic).toBe('billing');
        });

        it('should clear context', async () => {
            await service.updateChatContext('s-1', { currentTopic: 'billing' });
            await service.clearChatContext('s-1');

            const context = await service.getChatContext('s-1');
            expect(context).toBeNull();
        });
    });

    describe('getRealtimeSuggestions', () => {
        it('should return autocomplete suggestions', async () => {
            // Mock search service suggestions
            mockSearchService.search.mockResolvedValue({
                results: [],
                suggestions: ['How to login']
            } as any);

            const suggestions = await service.getRealtimeSuggestions('How to', 's-1');

            expect(suggestions).toHaveLength(1);
            expect(suggestions[0].type).toBe('completion');
        });
    });
});
