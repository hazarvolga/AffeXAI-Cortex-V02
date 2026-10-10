import { StrategyService } from './strategy.service';
import { AiProvider, AiModel } from '../../settings/dto/ai-settings.dto';
import * as transport from '../../../core/cortex/signed-request';
import { AiService } from '../../ai/ai.service';
import { VectorStoreService } from '../../../core/vector-store/vector-store.service';
import { CommerceService } from '../../commerce/services/commerce.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from '../../settings/settings.service';
import { FeedbackAction } from '../dto/create-feedback.dto';

describe('tenant strategy provider and memory boundaries', () => {
  const ai = { generateCompletion: jest.fn() };
  const commerce = { checkLimit: jest.fn(), logUsage: jest.fn() };
  const settings = { getAiSettings: jest.fn() };
  const service = new StrategyService(ai as unknown as AiService, {} as VectorStoreService,
    commerce as unknown as CommerceService, {} as HttpService, { get: () => 'http://cortex:8000' } as unknown as ConfigService, settings as unknown as SettingsService);
  let post: jest.SpyInstance;
  beforeEach(() => {
    jest.clearAllMocks();
    post = jest.spyOn(transport, 'postToCortex').mockResolvedValue({ results: [] });
    commerce.checkLimit.mockResolvedValue({ allowed: true });
    settings.getAiSettings.mockResolvedValue({ useSingleApiKey: false,
      emailMarketing: { enabled: true, apiKey: 'tenant-specific-test-key', provider: AiProvider.ANTHROPIC, model: AiModel.CLAUDE_3_5_SONNET } });
    ai.generateCompletion.mockResolvedValue({ content: 'Tenant-specific insight', tokensUsed: 12 });
  });
  afterEach(() => jest.restoreAllMocks());

  it('passes verified tenant settings and selected provider instead of global/local fallback', async () => {
    await expect(service.getInsight('tenant-a', 'email_composer', 'Draft')).resolves.toMatchObject({ insight: 'Tenant-specific insight' });
    expect(settings.getAiSettings).toHaveBeenCalledWith('tenant-a');
    expect(ai.generateCompletion).toHaveBeenCalledWith('tenant-specific-test-key', expect.any(String),
      expect.objectContaining({ provider: AiProvider.ANTHROPIC, model: AiModel.CLAUDE_3_5_SONNET }));
    expect(post).toHaveBeenCalledWith(expect.anything(), expect.anything(), '/retrieve', expect.objectContaining({ tenantId: 'tenant-a' }));
  });

  it('honors a tenant explicitly selecting their single provider configuration', async () => {
    settings.getAiSettings.mockResolvedValue({ useSingleApiKey: true,
      global: { enabled: true, apiKey: 'tenant-global-test-key', provider: AiProvider.GOOGLE, model: AiModel.GEMINI_2_5_FLASH } });
    await service.executeStrategy({ tenantId: 'tenant-b', context: 'analysis', type: 'analyst', parameters: { text: 'Analyze this', instruction: 'Explain' } });
    expect(settings.getAiSettings).toHaveBeenCalledWith('tenant-b');
    expect(ai.generateCompletion).toHaveBeenCalledWith('tenant-global-test-key', 'Analyze this',
      expect.objectContaining({ provider: AiProvider.GOOGLE, model: AiModel.GEMINI_2_5_FLASH }));
  });

  it('does not fabricate insight when memory retrieval fails', async () => {
    post.mockRejectedValue(new Error('private-storage-detail'));
    await expect(service.getInsight('tenant-a', 'email_composer')).rejects.toMatchObject({ status: 503 });
    expect(ai.generateCompletion).not.toHaveBeenCalled();
  });

  it.each([{ enabled: false }, { enabled: true, provider: AiProvider.OPENAI, model: AiModel.GPT_4O },
    { enabled: true, provider: AiProvider.LOCAL, model: AiModel.LOCAL_MISTRAL }])('requires a usable tenant provider configuration %j', async config => {
    settings.getAiSettings.mockResolvedValue({ useSingleApiKey: false, emailMarketing: config });
    await expect(service.getInsight('tenant-a', 'email_composer')).rejects.toMatchObject({ status: 503 });
    expect(ai.generateCompletion).not.toHaveBeenCalled();
  });

  it('does not report feedback success after failed persistence', async () => {
    post.mockRejectedValue(new Error('storage unavailable'));
    await expect(service.recordFeedback('tenant-a', { action: FeedbackAction.THUMBS_UP, contextId: 'ctx' })).rejects.toMatchObject({ status: 503 });
  });
  it('rejects malformed input before provider or storage calls', async () => {
    await expect(service.getInsight('', 'email')).rejects.toMatchObject({ status: 400 });
    await expect(service.getInsight('tenant-a', '', 'draft')).rejects.toMatchObject({ status: 400 });
    expect(post).not.toHaveBeenCalled();
  });
  it('enforces quota before generation', async () => {
    commerce.checkLimit.mockResolvedValue({ allowed: false });
    await expect(service.getInsight('tenant-a', 'email')).rejects.toMatchObject({ status: 429 });
    expect(ai.generateCompletion).not.toHaveBeenCalled();
  });
  it('rejects malformed memory response and provider outage', async () => {
    post.mockResolvedValue({ unexpected: true });
    await expect(service.getInsight('tenant-a', 'email')).rejects.toMatchObject({ status: 503 });
    post.mockResolvedValue({ results: [{ content: 'Earlier pattern', score: 0.5, type: 'feedback' }] });
    ai.generateCompletion.mockRejectedValue(new Error('private-provider-error'));
    await expect(service.getInsight('tenant-a', 'email')).rejects.toMatchObject({ status: 503 });
  });
  it('records acknowledged feedback and rejects unacknowledged writes', async () => {
    post.mockResolvedValue({ status: 'ingested', id: 'stored-id' });
    await expect(service.recordFeedback('tenant-a', { action: FeedbackAction.COPY, contextId: 'ctx' })).resolves.toEqual({ success: true, score: 0.5 });
    post.mockResolvedValue({ status: 'pending' });
    await expect(service.emitSignal('tenant-a', 'test', {})).rejects.toMatchObject({ status: 503 });
  });
  it('rejects invalid strategy parameters and sanitizes generation failure', async () => {
    await expect(service.executeStrategy({ tenantId: 'tenant-a', type: 'analyst', context: 'email', parameters: { instruction: 'x'.repeat(8193) } })).rejects.toMatchObject({ status: 400 });
    ai.generateCompletion.mockRejectedValue(new Error('private-provider-error'));
    await expect(service.executeStrategy({ tenantId: 'tenant-a', type: 'analyst', context: 'email', parameters: {} })).rejects.toMatchObject({ status: 503 });
  });

});
