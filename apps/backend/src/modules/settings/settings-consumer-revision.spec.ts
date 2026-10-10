import 'reflect-metadata';
import { AiEmailService } from '../ai/ai-email.service';
import { S3Service } from '../media/s3.service';
import { AiModel, AiProvider } from './dto/ai-settings.dto';
import { StorageProvider } from './dto/storage-settings.dto';
import { ChatAiSettingsService } from '../chat/services/chat-ai-settings.service';
import { FaqAiService } from '../faq-learning/services/faq-ai.service';

describe('revision-aware settings consumers', () => {
  it('resolves AI key and model from one tenant revision snapshot', async () => {
    const ai = {
      generateCompletion: jest.fn(async () => ({ content: '1. A useful subject', tokensUsed: 4 })),
    };
    const settings = {
      getAiModuleConfiguration: jest.fn(async () => ({
        revision: 9,
        apiKey: 'fixture-key',
        model: AiModel.GPT_4O,
        provider: AiProvider.OPENAI,
      })),
      getAiApiKeyForModule: jest.fn(),
      getAiModelForModule: jest.fn(),
    };
    const service = new AiEmailService(ai as any, settings as any);

    await service.generateSubjectLines({}, 'tenant-a', 1);

    expect(settings.getAiModuleConfiguration).toHaveBeenCalledWith('emailMarketing', 'tenant-a');
    expect(settings.getAiApiKeyForModule).not.toHaveBeenCalled();
    expect(settings.getAiModelForModule).not.toHaveBeenCalled();
    expect(ai.generateCompletion).toHaveBeenCalledWith('fixture-key', expect.any(String), expect.objectContaining({ model: AiModel.GPT_4O }));
  });

  it('passes the complete tenant module provider revision snapshot to the AI client', async () => {
    const ai = { generateCompletion: jest.fn(async () => ({ content: '1. Subject', tokensUsed: 1 })) };
    const settings = {
      getAiModuleConfiguration: jest.fn(async () => ({
        revision: 12,
        apiKey: 'fixture-key',
        model: AiModel.GPT_4O,
        provider: AiProvider.OPENAI,
      })),
    };
    const service = new AiEmailService(ai as any, settings as any);

    await service.generateSubjectLines({}, 'tenant-a', 1);

    expect(ai.generateCompletion).toHaveBeenCalledWith('fixture-key', expect.any(String), expect.objectContaining({
      provider: AiProvider.OPENAI,
      credentialContext: {
        tenantId: 'tenant-a',
        module: 'emailMarketing',
        provider: AiProvider.OPENAI,
        revision: 12,
      },
    }));
  });

  it('loads chat support configuration through one atomic snapshot', async () => {
    const settings = {
      getAiModuleConfiguration: jest.fn(async () => ({
        revision: 3,
        apiKey: 'tenant-a-key',
        model: AiModel.GPT_4O,
        provider: AiProvider.OPENAI,
      })),
      getAiApiKeyForModule: jest.fn(),
      getAiModelForModule: jest.fn(),
      getAiSettings: jest.fn(),
    };
    const service = new ChatAiSettingsService(
      {} as any,
      { getTenantId: () => 'tenant-a' } as any,
      settings as any,
      {} as any,
    );

    await expect(service.getChatAiConfiguration()).resolves.toMatchObject({
      apiKey: 'tenant-a-key',
      model: AiModel.GPT_4O,
      provider: AiProvider.OPENAI,
      revision: 3,
    });
    expect(settings.getAiModuleConfiguration).toHaveBeenCalledWith('support', 'tenant-a');
    expect(settings.getAiApiKeyForModule).not.toHaveBeenCalled();
    expect(settings.getAiModelForModule).not.toHaveBeenCalled();
    expect(settings.getAiSettings).not.toHaveBeenCalled();
  });

  it('keeps FAQ requests isolated to each tenant snapshot', async () => {
    const snapshots = {
      'tenant-a': { revision: 4, apiKey: 'key-a', model: AiModel.GPT_4O, provider: AiProvider.OPENAI },
      'tenant-b': { revision: 7, apiKey: 'key-b', model: AiModel.CLAUDE_3_HAIKU, provider: AiProvider.ANTHROPIC },
    };
    const settings = {
      getAiModuleConfiguration: jest.fn(async (_module: string, tenant: keyof typeof snapshots) => snapshots[tenant]),
    };
    const ai = {
      generateCompletion: jest.fn(async () => ({ content: '{"answer":"ok"}', tokensUsed: 1 })),
    };
    const service = new FaqAiService({} as any, ai as any, settings as any);
    const request = { context: 'context' } as any;

    await service.generateFaqAnswer(request, 'tenant-a');
    await service.generateFaqAnswer(request, 'tenant-b');

    expect(ai.generateCompletion).toHaveBeenNthCalledWith(1, 'key-a', expect.any(String), expect.objectContaining({
      credentialContext: expect.objectContaining({ tenantId: 'tenant-a', revision: 4, provider: AiProvider.OPENAI }),
    }));
    expect(ai.generateCompletion).toHaveBeenNthCalledWith(2, 'key-b', expect.any(String), expect.objectContaining({
      credentialContext: expect.objectContaining({ tenantId: 'tenant-b', revision: 7, provider: AiProvider.ANTHROPIC }),
    }));
  });

  it('resolves storage configuration through the tenant revision snapshot', async () => {
    const settings = {
      getStorageSettingsSnapshot: jest.fn(async () => ({
        revision: 4,
        settings: { provider: StorageProvider.LOCAL, useLocalFallback: true },
      })),
      getStorageSettings: jest.fn(),
    };
    const config = {
      get: jest.fn((key: string, fallback?: string) => ({
        S3_BUCKET_NAME: 'bucket',
        S3_ENDPOINT: 'http://localhost:9000',
        S3_ACCESS_KEY: 'access',
        S3_SECRET_KEY: 'secret',
      })[key] ?? fallback),
    };
    const service = new S3Service(config as any, settings as any);

    await expect(service.isS3Configured('tenant-a')).resolves.toBe(true);
    expect(settings.getStorageSettingsSnapshot).toHaveBeenCalledWith('tenant-a');
    expect(settings.getStorageSettings).not.toHaveBeenCalled();
  });

  it('fails closed when storage has no tenant scope', async () => {
    const settings = { getStorageSettingsSnapshot: jest.fn() };
    const service = new S3Service({ get: jest.fn() } as any, settings as any);

    await expect(service.isS3Configured()).resolves.toBe(false);
    expect(settings.getStorageSettingsSnapshot).not.toHaveBeenCalled();
  });
});
