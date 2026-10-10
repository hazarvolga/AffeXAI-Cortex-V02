import { Test, TestingModule } from '@nestjs/testing';
import { ChatAiService } from './chat-ai.service';
import { AiService } from '../../ai/ai.service';
import { SettingsService } from '../../settings/settings.service';
import { ChatContextEngineService } from './chat-context-engine.service';
import { ChatAiSettingsService, ChatAiConfiguration } from './chat-ai-settings.service';
import { AiProvider, AiModel } from '../../settings/dto/ai-settings.dto';
import { TenantService } from '../../../core/tenant/tenant.service';

describe('ChatAiService', () => {
    let service: ChatAiService;
    let aiService: AiService;
    let contextEngine: ChatContextEngineService;

    const mockAiService = {
        generateCompletion: jest.fn(),
    };

    const mockSettingsService = {
        getSettings: jest.fn(),
    };

    const mockContextEngine = {
        buildContext: jest.fn(),
    };

    const mockChatAiSettings = {
        getConfigurationWithFailover: jest.fn(),
        validateApiKey: jest.fn(),
        resetProviderFailures: jest.fn(),
        recordProviderFailure: jest.fn(),
    };

    const mockConfig: ChatAiConfiguration = {
        tenantId: 'tenant-a',
        module: 'support',
        revision: 1,
        apiKey: 'sk-test',
        model: AiModel.GPT_4,
        provider: AiProvider.OPENAI,
        enabled: true,
        priority: 1,
        maxRetries: 0,
        timeoutMs: 1000,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChatAiService,
                { provide: AiService, useValue: mockAiService },
                { provide: SettingsService, useValue: mockSettingsService },
                { provide: ChatContextEngineService, useValue: mockContextEngine },
                { provide: ChatAiSettingsService, useValue: mockChatAiSettings },
                { provide: TenantService, useValue: { getTenantId: jest.fn(() => 'tenant-a') } },
            ],
        }).compile();

        service = module.get<ChatAiService>(ChatAiService);
        aiService = module.get<AiService>(AiService);
        contextEngine = module.get<ChatContextEngineService>(ChatContextEngineService);

        jest.clearAllMocks();
    });

    describe('generateChatResponse', () => {
        it('should generate response with context', async () => {
            mockChatAiSettings.getConfigurationWithFailover.mockResolvedValue(mockConfig);
            mockContextEngine.buildContext.mockResolvedValue({
                sources: [{ type: 'knowledge', title: 'Fixture', content: 'Context', relevanceScore: 0.9 }],
                totalRelevanceScore: 10
            } as any);
            mockAiService.generateCompletion.mockResolvedValue({
                content: 'Response', model: AiModel.GPT_4, provider: AiProvider.OPENAI,
                tokensUsed: 4, finishReason: 'stop',
            });

            const result = await service.generateChatResponse('Hello', { includeContext: true, sessionId: 'session-a' });

            expect(result.contextUsed).toBeDefined();
            expect(mockAiService.generateCompletion).toHaveBeenCalled();
        });

        it('should handle AI service failure', async () => {
            mockChatAiSettings.getConfigurationWithFailover.mockResolvedValue(mockConfig);
            mockAiService.generateCompletion.mockRejectedValue(new Error('AI Error'));

            await expect(service.generateChatResponse('Hello')).rejects.toThrow();
        });
    });

    describe('generateStreamingChatResponse', () => {
        it('should yield chunks', async () => {
            mockChatAiSettings.getConfigurationWithFailover.mockResolvedValue(mockConfig);
            async function* mockStream() {
                yield { content: 'He', isComplete: false };
                yield { content: 'llo', isComplete: true };
            }
            jest.spyOn(service as any, 'generateStreamingCompletion').mockImplementation(mockStream);

            const generator = service.generateStreamingChatResponse('Hello');
            let fullContent = '';

            for await (const chunk of generator) {
                fullContent += chunk.content;
            }

            expect(fullContent).toBe('Hello');
        });
    });

    describe('buildContextAwarePrompt', () => {
        it('should embed context into prompt', () => {
            const context = { sources: [{ type: 'document', title: 'Fixture', content: 'Secret info', relevanceScore: 0.9 }] } as any;
            const prompt = (service as any).buildContextAwarePrompt('Q', context);
            expect(prompt).toContain('Secret info');
        });
    });

    describe('calculateConfidenceScore', () => {
        it('should calculate valid score', () => {
            const score = (service as any).calculateConfidenceScore(
                { content: 'A sufficiently detailed response', finishReason: 'stop' },
                { sources: [{ relevanceScore: 0.9 }] } as any
            );
            expect(score).toBeGreaterThan(0.5);
        });
    });
});
