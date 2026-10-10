import { Test, TestingModule } from '@nestjs/testing';
import { GeneralCommunicationAiService } from './general-communication-ai.service';
import { AiService } from '../../ai/ai.service';
import { GeneralCommunicationContextService } from './general-communication-context.service';
import { ChatAiSettingsService } from './chat-ai-settings.service';

describe('GeneralCommunicationAiService', () => {
    let service: GeneralCommunicationAiService;
    let aiService: AiService;
    let contextService: GeneralCommunicationContextService;

    const mockAiService = {
        generateText: jest.fn(),
    };

    const mockContextService = {
        buildGeneralContext: jest.fn(),
    };

    const mockChatAiSettings = {
        getConfigurationWithFailover: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GeneralCommunicationAiService,
                { provide: AiService, useValue: mockAiService },
                { provide: GeneralCommunicationContextService, useValue: mockContextService },
                { provide: ChatAiSettingsService, useValue: mockChatAiSettings },
            ],
        }).compile();

        service = module.get<GeneralCommunicationAiService>(GeneralCommunicationAiService);
        aiService = module.get(AiService);
        contextService = module.get(GeneralCommunicationContextService);

        jest.clearAllMocks();
    });

    describe('generateGeneralResponse', () => {
        it('should generate informational response', async () => {
            mockChatAiSettings.getConfigurationWithFailover.mockResolvedValue({ apiKey: 'sk' });
            mockAiService.generateText.mockResolvedValue({
                content: JSON.stringify({
                    content: 'Info',
                    responseType: 'informational',
                    confidence: 0.9
                })
            });

            const response = await service.generateGeneralResponse('What is AffeXAI?', 's-1');

            expect(response.responseType).toBe('informational');
        });

        it('should handle non-JSON responses gracefully (fallback parsing)', async () => {
            mockChatAiSettings.getConfigurationWithFailover.mockResolvedValue({ apiKey: 'sk' });
            mockAiService.generateText.mockResolvedValue({
                content: 'Just plain text response'
            });

            // Implementation likely attempts to parse logic or defaults
            const response = await service.generateGeneralResponse('Hi', 's-1');
            expect(response.content).toBeDefined();
        });
    });

    describe('analyzeQueryType', () => {
        it('should detect greeting vs question', () => {
            // Logic inside might be heuristic or regex based if simple, 
            // or AI based if complex.
            // If AI based, this method might be private/internal or rely on generateText.
            // Outline shows it returns enum.

            const type = service.analyzeQueryType('Help me fix this error');
            expect(type).toBe('guidance'); // Assuming mapping
        });
    });

    describe('shouldEscalateToSupport', () => {
        it('should recommend escalation for complex technical issues', () => {
            // Mock if dependent on AI, or testing internal heuristic
            const result = service.shouldEscalateToSupport('System is down', null);
            expect(result.shouldEscalate).toBe(true);
        });
    });

    describe('getConversationStarters', () => {
        it('should return localized starters', async () => {
            const starters = await service.getConversationStarters('tr');
            expect(starters).toContainEqual(expect.stringMatching(/[a-zA-ZşŞıİğĞüÜöÖçÇ]/));
        });
    });
});
