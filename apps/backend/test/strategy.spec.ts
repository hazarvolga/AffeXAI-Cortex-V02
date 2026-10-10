import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { StrategyService } from '../src/modules/strategy/services/strategy.service';
import { AiService } from '../src/modules/ai/ai.service';
import { VectorStoreService } from '../src/core/vector-store/vector-store.service';
import { CommerceService } from '../src/modules/commerce/services/commerce.service';
import { FeedbackAction } from '../src/modules/strategy/dto/create-feedback.dto';

/**
 * StrategyService unit tests: Cortex RAG retrieval (success + failure
 * fallback), governance rate limiting, and feedback score calculation.
 */
describe('StrategyService', () => {
    let service: StrategyService;

    const mockAi = { generateCompletion: jest.fn() };
    const mockVectorStore = {};
    const mockCommerce = { checkLimit: jest.fn(), logUsage: jest.fn() };
    const mockHttp = { post: jest.fn(), get: jest.fn() };
    const mockConfig = { get: jest.fn().mockReturnValue('http://cortex:8000') };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StrategyService,
                { provide: AiService, useValue: mockAi },
                { provide: VectorStoreService, useValue: mockVectorStore },
                { provide: CommerceService, useValue: mockCommerce },
                { provide: HttpService, useValue: mockHttp },
                { provide: ConfigService, useValue: mockConfig },
            ],
        }).compile();

        service = module.get(StrategyService);
        jest.clearAllMocks();
        mockConfig.get.mockReturnValue('http://cortex:8000');
        mockCommerce.checkLimit.mockResolvedValue({ allowed: true, remaining: 50000, limit: 50000 });
        mockCommerce.logUsage.mockResolvedValue(undefined);
        mockHttp.post.mockReturnValue(of({ data: { results: [] } }));
        mockAi.generateCompletion.mockResolvedValue({ content: 'Ship the new pricing page.' });
    });

    describe('getInsight', () => {
        it('blocks insight generation when the tenant is rate limited', async () => {
            mockCommerce.checkLimit.mockResolvedValue({ allowed: false, remaining: 0, limit: 1000 });

            const result = await service.getInsight('acme', 'launch plan');

            expect(result.source).toBe('governance-guard');
            expect(result.insight).toContain('Token Limit Exceeded');
            expect(mockHttp.post).not.toHaveBeenCalled();
            expect(mockAi.generateCompletion).not.toHaveBeenCalled();
        });

        it('merges Cortex /retrieve results into the prompt, prioritizing success scores', async () => {
            mockHttp.post.mockReturnValue(of({
                data: {
                    results: [
                        { content: 'meh tactic', metadata: { successScore: 1 } },
                        { content: 'winning tactic', metadata: { successScore: 9 } },
                    ],
                },
            }));

            const result = await service.getInsight('acme', 'q4 campaign');

            expect(mockHttp.post).toHaveBeenCalledWith(
                'http://cortex:8000/retrieve',
                expect.objectContaining({ query: 'q4 campaign', tenantId: 'acme' }),
            );
            expect(result).toEqual({ insight: 'Ship the new pricing page.', source: 'hybrid-ai-engine-rag' });

            const systemPrompt = mockAi.generateCompletion.mock.calls[0][2].systemPrompt;
            expect(systemPrompt.indexOf('[SUCCESS_LEVEL: 9]')).toBeLessThan(systemPrompt.indexOf('[SUCCESS_LEVEL: 1]'));
            expect(mockCommerce.logUsage).toHaveBeenCalledWith('acme', expect.any(Number), 'generate_insight', 'strategy_service');
        });

        it('falls back to a neutral memory context when Cortex is down, but still answers', async () => {
            mockHttp.post.mockReturnValue(throwError(() => new Error('ECONNREFUSED')));

            const result = await service.getInsight('acme', 'brand voice');

            expect(result.source).toBe('hybrid-ai-engine-rag');
            const systemPrompt = mockAi.generateCompletion.mock.calls[0][2].systemPrompt;
            expect(systemPrompt).toContain('Cortex Memory unavailable.');
        });

        it('uses an inaugural context when Cortex returns no matches', async () => {
            const result = await service.getInsight('acme', 'first run');
            const systemPrompt = mockAi.generateCompletion.mock.calls[0][2].systemPrompt;
            expect(result.source).toBe('hybrid-ai-engine-rag');
            expect(systemPrompt).toContain('No prior success patterns found.');
        });

        it('returns the static fallback insight when the AI provider fails', async () => {
            mockAi.generateCompletion.mockRejectedValue(new Error('model offline'));

            const result = await service.getInsight('acme', 'anything');

            expect(result).toEqual({
                insight: 'Focus on clear value proposition and audience alignment.',
                source: 'fallback',
            });
        });
    });

    describe('recordFeedback', () => {
        it('scores thumbs_up as +1 and forwards a FEEDBACK_SIGNAL', async () => {
            const spy = jest.spyOn(service, 'emitSignal').mockResolvedValue(undefined);

            const result = await service.recordFeedback('acme', { contextId: 't-1', action: FeedbackAction.THUMBS_UP });

            expect(result).toEqual({ success: true, score: 1 });
            expect(spy).toHaveBeenCalledWith('acme', 'FEEDBACK_SIGNAL', expect.objectContaining({ score: 1 }));
            expect(mockCommerce.logUsage).toHaveBeenCalledWith('acme', 1, 'feedback_submission', 'strategy_service_feedback');
        });

        it('scores thumbs_down as -1', async () => {
            jest.spyOn(service, 'emitSignal').mockResolvedValue(undefined);

            const result = await service.recordFeedback('acme', { contextId: 't-1', action: FeedbackAction.THUMBS_DOWN });

            expect(result).toEqual({ success: true, score: -1 });
        });

        it('error path: a governance logUsage failure escapes recordFeedback (see report)', async () => {
            mockCommerce.logUsage.mockRejectedValue(new Error('ledger down'));

            await expect(
                service.recordFeedback('acme', { contextId: 't-1', action: FeedbackAction.THUMBS_UP }),
            ).rejects.toThrow('ledger down');
        });
    });
});
