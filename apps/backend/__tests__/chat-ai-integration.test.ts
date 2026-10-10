import { Test, TestingModule } from '@nestjs/testing';
import { ChatAiService } from '../src/modules/chat/services/chat-ai.service';
import { ChatAiSettingsService } from '../src/modules/chat/services/chat-ai-settings.service';
import { AiService } from '../src/modules/ai/ai.service';
import { SettingsService } from '../src/modules/settings/settings.service';
import { ChatContextEngineService } from '../src/modules/chat/services/chat-context-engine.service';
import { AiProvider, AiModel } from '../src/modules/settings/dto/ai-settings.dto';

describe('ChatAiService Integration', () => {
  let chatAiService: ChatAiService;
  let chatAiSettingsService: ChatAiSettingsService;
  let mockAiService: jest.Mocked<AiService>;
  let mockSettingsService: jest.Mocked<SettingsService>;
  let mockContextEngine: jest.Mocked<ChatContextEngineService>;

  beforeEach(async () => {
    // Create mocks
    mockAiService = {
      generateCompletion: jest.fn(),
      testApiKey: jest.fn(),
      clearClientCache: jest.fn(),
      getSupportedModels: jest.fn(),
    } as any;

    mockSettingsService = {
      getAiApiKeyForModule: jest.fn(),
      getAiModelForModule: jest.fn(),
      getAiSettings: jest.fn(),
    } as any;

    mockContextEngine = {
      buildContext: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatAiService,
        ChatAiSettingsService,
        {
          provide: AiService,
          useValue: mockAiService,
        },
        {
          provide: SettingsService,
          useValue: mockSettingsService,
        },
        {
          provide: ChatContextEngineService,
          useValue: mockContextEngine,
        },
      ],
    }).compile();

    chatAiService = module.get<ChatAiService>(ChatAiService);
    chatAiSettingsService = module.get<ChatAiSettingsService>(ChatAiSettingsService);
  });

  describe('generateChatResponse', () => {
    it('should generate AI response with context integration', async () => {
      // Arrange
      const mockApiKey = 'test-api-key';
      const mockModel = AiModel.GPT_4_TURBO;
      const mockProvider = AiProvider.OPENAI;
      
      mockSettingsService.getAiApiKeyForModule.mockResolvedValue(mockApiKey);
      mockSettingsService.getAiModelForModule.mockResolvedValue(mockModel);
      
      mockContextEngine.buildContext.mockResolvedValue({
        sources: [
          {
            id: '1',
            type: 'knowledge_base' as any,
            title: 'Test Article',
            content: 'Test content',
            relevanceScore: 0.8,
            metadata: {}
          }
        ],
        totalRelevanceScore: 0.8,
        searchQuery: 'test query',
        processingTime: 100
      });

      mockAiService.generateCompletion.mockResolvedValue({
        content: 'Test AI response with [1] citation',
        model: mockModel,
        provider: mockProvider,
        tokensUsed: 50,
        finishReason: 'stop'
      });

      // Act
      const result = await chatAiService.generateChatResponse('test prompt', {
        includeContext: true,
        sessionId: 'test-session-id'
      });

      // Assert
      expect(result.content).toBe('Test AI response with [1] citation');
      expect(result.contextUsed).toBeDefined();
      expect(result.contextSources).toHaveLength(1);
      expect(result.confidenceScore).toBeGreaterThan(0);
      expect(result.citations).toContain('Test Article');
      expect(mockContextEngine.buildContext).toHaveBeenCalledWith(
        'test prompt',
        'test-session-id',
        undefined
      );
    });

    it('should handle AI generation without context', async () => {
      // Arrange
      const mockApiKey = 'test-api-key';
      const mockModel = AiModel.GPT_4_TURBO;
      const mockProvider = AiProvider.OPENAI;
      
      mockSettingsService.getAiApiKeyForModule.mockResolvedValue(mockApiKey);
      mockSettingsService.getAiModelForModule.mockResolvedValue(mockModel);

      mockAiService.generateCompletion.mockResolvedValue({
        content: 'Test AI response without context',
        model: mockModel,
        provider: mockProvider,
        tokensUsed: 30,
        finishReason: 'stop'
      });

      // Act
      const result = await chatAiService.generateChatResponse('test prompt', {
        includeContext: false
      });

      // Assert
      expect(result.content).toBe('Test AI response without context');
      expect(result.contextUsed).toBeUndefined();
      expect(result.contextSources).toBeUndefined();
      expect(mockContextEngine.buildContext).not.toHaveBeenCalled();
    });
  });

  describe('testChatAiConfiguration', () => {
    it('should test AI configuration successfully', async () => {
      // Arrange
      const mockApiKey = 'test-api-key';
      const mockModel = AiModel.GPT_4_TURBO;
      const mockProvider = AiProvider.OPENAI;
      
      mockSettingsService.getAiApiKeyForModule.mockResolvedValue(mockApiKey);
      mockSettingsService.getAiModelForModule.mockResolvedValue(mockModel);

      mockAiService.generateCompletion.mockResolvedValue({
        content: 'Test successful',
        model: mockModel,
        provider: mockProvider,
        tokensUsed: 10,
        finishReason: 'stop'
      });

      // Act
      const result = await chatAiService.testChatAiConfiguration();

      // Assert
      expect(result.success).toBe(true);
      expect(result.provider).toBe(mockProvider);
      expect(result.model).toBe(mockModel);
      expect(result.streamingSupported).toBe(true); // OpenAI supports streaming
      expect(result.responseTime).toBeGreaterThan(0);
    });

    it('should handle configuration test failure', async () => {
      // Arrange
      mockSettingsService.getAiApiKeyForModule.mockResolvedValue(null);

      // Act
      const result = await chatAiService.testChatAiConfiguration();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('AI API key not configured');
    });
  });
});

describe('ChatAiSettingsService', () => {
  let chatAiSettingsService: ChatAiSettingsService;
  let mockSettingsService: jest.Mocked<SettingsService>;
  let mockAiService: jest.Mocked<AiService>;

  beforeEach(async () => {
    mockSettingsService = {
      getAiApiKeyForModule: jest.fn(),
      getAiModelForModule: jest.fn(),
      getAiSettings: jest.fn(),
      updateAiSettings: jest.fn(),
    } as any;

    mockAiService = {
      testApiKey: jest.fn(),
      clearClientCache: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatAiSettingsService,
        {
          provide: SettingsService,
          useValue: mockSettingsService,
        },
        {
          provide: AiService,
          useValue: mockAiService,
        },
      ],
    }).compile();

    chatAiSettingsService = module.get<ChatAiSettingsService>(ChatAiSettingsService);
  });

  describe('getChatAiConfiguration', () => {
    it('should get support-specific configuration', async () => {
      // Arrange
      const mockApiKey = 'support-api-key';
      const mockModel = AiModel.GPT_4_TURBO;
      
      mockSettingsService.getAiApiKeyForModule.mockResolvedValue(mockApiKey);
      mockSettingsService.getAiModelForModule.mockResolvedValue(mockModel);

      // Act
      const result = await chatAiSettingsService.getChatAiConfiguration();

      // Assert
      expect(result.apiKey).toBe(mockApiKey);
      expect(result.model).toBe(mockModel);
      expect(result.provider).toBe(AiProvider.OPENAI);
      expect(result.enabled).toBe(true);
      expect(result.priority).toBe(1);
    });

    it('should fallback to global configuration', async () => {
      // Arrange
      mockSettingsService.getAiApiKeyForModule.mockResolvedValue(null);
      mockSettingsService.getAiSettings.mockResolvedValue({
        useSingleApiKey: true,
        global: {
          apiKey: 'global-api-key',
          model: AiModel.CLAUDE_3_5_SONNET,
          enabled: true,
          provider: AiProvider.ANTHROPIC
        },
        support: { enabled: false },
        emailMarketing: { enabled: false },
        social: { enabled: false },
        analytics: { enabled: false }
      } as any);

      // Act
      const result = await chatAiSettingsService.getChatAiConfiguration();

      // Assert
      expect(result.apiKey).toBe('global-api-key');
      expect(result.model).toBe(AiModel.CLAUDE_3_5_SONNET);
      expect(result.provider).toBe(AiProvider.ANTHROPIC);
      expect(result.priority).toBe(2);
    });
  });

  describe('getFailoverConfiguration', () => {
    it('should build failover configuration', async () => {
      // Arrange
      mockSettingsService.getAiModelForModule.mockResolvedValue(AiModel.GPT_4_TURBO);
      mockSettingsService.getAiSettings.mockResolvedValue({
        useSingleApiKey: true,
        global: {
          apiKey: 'global-key',
          model: AiModel.CLAUDE_3_5_SONNET,
          enabled: true,
          provider: AiProvider.ANTHROPIC
        },
        support: { enabled: true },
        emailMarketing: { 
          enabled: true, 
          apiKey: 'email-key',
          model: AiModel.GEMINI_PRO
        },
        social: { enabled: false },
        analytics: { enabled: false }
      } as any);

      // Act
      const result = await chatAiSettingsService.getFailoverConfiguration();

      // Assert
      expect(result.primaryProvider).toBe(AiProvider.OPENAI);
      expect(result.fallbackProviders).toContain(AiProvider.ANTHROPIC);
      expect(result.fallbackProviders).toContain(AiProvider.GOOGLE);
      expect(result.maxFailuresBeforeFailover).toBe(3);
    });
  });
});