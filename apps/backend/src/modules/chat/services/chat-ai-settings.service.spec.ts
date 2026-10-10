import { ChatAiSettingsService } from './chat-ai-settings.service';
import { AiModel, AiProvider, AiSettingsDto } from '../../settings/dto/ai-settings.dto';

describe('ChatAiSettingsService', () => {
  const tenantId = 'tenant-a';
  let activeTenantId: string;
  let settingsService: {
    getAiModuleConfiguration: jest.Mock;
    getAiSettingsSnapshot: jest.Mock;
  };
  let service: ChatAiSettingsService;
  let aiService: { generateCompletion: jest.Mock };

  const distributedSettings = (overrides: Partial<AiSettingsDto> = {}): AiSettingsDto => ({
    useSingleApiKey: false,
    emailMarketing: { enabled: false, provider: AiProvider.OPENAI, model: AiModel.GPT_4_TURBO },
    social: { enabled: false, provider: AiProvider.OPENAI, model: AiModel.GPT_4_TURBO },
    support: { enabled: false, provider: AiProvider.OPENAI, model: AiModel.GPT_4_TURBO },
    analytics: { enabled: false, provider: AiProvider.OPENAI, model: AiModel.GPT_4_TURBO },
    ...overrides,
  });

  beforeEach(() => {
    activeTenantId = tenantId;
    settingsService = {
      getAiModuleConfiguration: jest.fn(),
      getAiSettingsSnapshot: jest.fn(),
    };
    aiService = { generateCompletion: jest.fn() };
    service = new ChatAiSettingsService(
      { create: jest.fn(), save: jest.fn() } as any,
      { getTenantId: jest.fn(() => activeTenantId) } as any,
      settingsService as any,
      aiService as any,
    );
  });

  it('returns the tenant support configuration from the revision snapshot', async () => {
    settingsService.getAiModuleConfiguration.mockResolvedValue({
      apiKey: 'support-key',
      model: AiModel.GPT_4_TURBO,
      provider: AiProvider.OPENAI,
      revision: 7,
    });

    await expect(service.getChatAiConfiguration()).resolves.toEqual(expect.objectContaining({
      tenantId,
      module: 'support',
      apiKey: 'support-key',
      revision: 7,
      enabled: true,
    }));
    expect(settingsService.getAiModuleConfiguration).toHaveBeenCalledWith('support', tenantId);
  });

  it('rejects chat AI when the support configuration has no credential', async () => {
    settingsService.getAiModuleConfiguration.mockResolvedValue({
      apiKey: '',
      model: AiModel.GPT_4_TURBO,
      provider: AiProvider.OPENAI,
      revision: 1,
    });

    await expect(service.getChatAiConfiguration()).rejects.toThrow('No AI configuration available for chat');
  });

  it('does not fail open to email credentials when support AI is disabled', async () => {
    const settings = distributedSettings({
      emailMarketing: {
        enabled: true,
        provider: AiProvider.ANTHROPIC,
        model: AiModel.CLAUDE_3_HAIKU,
        apiKey: 'email-only-key',
      },
    });
    settingsService.getAiModuleConfiguration.mockRejectedValue(new Error('AI module support is disabled'));
    settingsService.getAiSettingsSnapshot.mockResolvedValue({ revision: 4, settings });

    await expect(service.getConfigurationWithFailover()).rejects.toThrow('All AI providers are unavailable');
    await expect(service.getFailoverConfiguration()).resolves.toEqual(expect.objectContaining({
      primaryProvider: AiProvider.OPENAI,
      fallbackProviders: [],
    }));
  });

  it('uses the configured support provider as the primary without cross-module fallbacks', async () => {
    const settings = distributedSettings({
      support: {
        enabled: true,
        provider: AiProvider.ANTHROPIC,
        model: AiModel.CLAUDE_3_HAIKU,
        apiKey: 'support-key',
      },
      emailMarketing: {
        enabled: true,
        provider: AiProvider.OPENAI,
        model: AiModel.GPT_4_TURBO,
        apiKey: 'email-key',
      },
    });
    settingsService.getAiSettingsSnapshot.mockResolvedValue({ revision: 5, settings });

    await expect(service.getFailoverConfiguration()).resolves.toEqual(expect.objectContaining({
      primaryProvider: AiProvider.ANTHROPIC,
      fallbackProviders: [],
    }));
  });

  it('isolates provider cooldowns by tenant and ignores local configuration failures', async () => {
    settingsService.getAiModuleConfiguration.mockRejectedValue(new Error('AI module support is disabled'));
    settingsService.getAiSettingsSnapshot.mockResolvedValue({ revision: 1, settings: distributedSettings() });

    await expect(service.getConfigurationWithFailover()).rejects.toThrow('All AI providers are unavailable');
    expect(service.getProviderHealthStatus().find(item => item.provider === AiProvider.OPENAI)?.failureCount).toBe(0);

    service.recordProviderFailure(AiProvider.OPENAI);
    service.recordProviderFailure(AiProvider.OPENAI);
    service.recordProviderFailure(AiProvider.OPENAI);
    expect(service.getProviderHealthStatus().find(item => item.provider === AiProvider.OPENAI)?.isAvailable).toBe(false);

    activeTenantId = 'tenant-b';
    expect(service.getProviderHealthStatus().find(item => item.provider === AiProvider.OPENAI)).toEqual(expect.objectContaining({
      isAvailable: true,
      failureCount: 0,
    }));
  });

  it('tests only the effective support provider in chat diagnostics', async () => {
    const settings = distributedSettings({
      support: {
        enabled: true,
        provider: AiProvider.ANTHROPIC,
        model: AiModel.CLAUDE_3_HAIKU,
        apiKey: 'support-key',
      },
      emailMarketing: {
        enabled: true,
        provider: AiProvider.OPENAI,
        model: AiModel.GPT_4_TURBO,
        apiKey: 'email-key',
      },
    });
    settingsService.getAiSettingsSnapshot.mockResolvedValue({ revision: 6, settings });
    aiService.generateCompletion.mockResolvedValue({ content: 'ok' });

    await expect(service.testAllProviders()).resolves.toEqual([
      expect.objectContaining({ provider: AiProvider.ANTHROPIC, success: true }),
    ]);
    expect(aiService.generateCompletion).toHaveBeenCalledTimes(1);
    expect(aiService.generateCompletion).toHaveBeenCalledWith(
      'support-key',
      'Test message',
      expect.objectContaining({
        provider: AiProvider.ANTHROPIC,
        credentialContext: expect.objectContaining({ module: 'support', tenantId }),
      }),
    );
  });
});
