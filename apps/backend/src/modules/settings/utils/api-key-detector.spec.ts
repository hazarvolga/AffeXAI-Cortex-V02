import 'reflect-metadata';
import { AiModel, AiProvider } from '../dto/ai-settings.dto';
import { ApiKeyDetector } from './api-key-detector';

describe('ApiKeyDetector', () => {
  it('detects the specific OpenRouter prefix before generic sk keys', () => {
    expect(ApiKeyDetector.detect('sk-or-v1-12345678901234567890')).toEqual(expect.objectContaining({
      provider: AiProvider.OPENROUTER,
      defaultModel: AiModel.OPENROUTER_GPT_4,
      isValid: true,
    }));
  });
});
