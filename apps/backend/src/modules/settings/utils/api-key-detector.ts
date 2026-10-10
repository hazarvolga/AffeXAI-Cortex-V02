import { AiProvider, AiModel } from '../dto/ai-settings.dto';

/**
 * API Key Detection Result
 */
export interface ApiKeyDetectionResult {
  provider: AiProvider;
  defaultModel: AiModel;
  isValid: boolean; // Format validation only, not API validation
  detectionMethod: 'prefix' | 'pattern' | 'unknown';
}

/**
 * Detect AI provider from API key format
 * This provides automatic provider detection for better UX
 */
export class ApiKeyDetector {
  /**
   * Detect provider and suggest default model from API key
   */
  static detect(apiKey: string): ApiKeyDetectionResult {
    if (!apiKey || apiKey.trim().length === 0) {
      return {
        provider: AiProvider.OPENAI,
        defaultModel: AiModel.GPT_4O,
        isValid: false,
        detectionMethod: 'unknown',
      };
    }

    const trimmedKey = apiKey.trim();

    // IMPORTANT: Check more specific prefixes first!
    // Anthropic: sk-ant-... (must be before generic "sk-" check)
    if (trimmedKey.startsWith('sk-ant-')) {
      return {
        provider: AiProvider.ANTHROPIC,
        defaultModel: AiModel.CLAUDE_3_5_SONNET,
        isValid: trimmedKey.length > 20,
        detectionMethod: 'prefix',
      };
    }

    // DeepSeek: Usually starts with 'sk-' but we can't distinguish from OpenAI by prefix alone
    // So we'll check OpenRouter first (sk-or-v1-), then assume OpenAI for generic sk-
    // Users should select DeepSeek provider manually or use OpenRouter

    if (trimmedKey.startsWith('sk-or-v1-')) {
      return {
        provider: AiProvider.OPENROUTER,
        defaultModel: AiModel.OPENROUTER_GPT_4,
        isValid: trimmedKey.length > 20,
        detectionMethod: 'prefix',
      };
    }

    // OpenAI: sk-... or sk-proj-... (after more specific checks)
    if (trimmedKey.startsWith('sk-proj-') || trimmedKey.startsWith('sk-')) {
      return {
        provider: AiProvider.OPENAI,
        defaultModel: AiModel.GPT_4O,
        isValid: trimmedKey.length > 20,
        detectionMethod: 'prefix',
      };
    }

    // Google AI: AIzaSy...
    if (trimmedKey.startsWith('AIzaSy')) {
      return {
        provider: AiProvider.GOOGLE,
        defaultModel: AiModel.GEMINI_2_5_FLASH, // Updated to Gemini 2.5 Flash (latest model)
        isValid: trimmedKey.length === 39, // Google API keys are exactly 39 characters
        detectionMethod: 'prefix',
      };
    }

    // Unknown format - default to OpenAI
    return {
      provider: AiProvider.OPENAI,
      defaultModel: AiModel.GPT_4O,
      isValid: false,
      detectionMethod: 'unknown',
    };
  }

  /**
   * Validate API key format (not actual API validation)
   */
  static validateFormat(apiKey: string, expectedProvider?: AiProvider): boolean {
    const detection = this.detect(apiKey);

    if (!detection.isValid) {
      return false;
    }

    // If expectedProvider specified, ensure it matches
    if (expectedProvider && detection.provider !== expectedProvider) {
      return false;
    }

    return true;
  }

  /**
   * Get provider name for display
   */
  static getProviderDisplayName(provider: AiProvider): string {
    switch (provider) {
      case AiProvider.OPENAI:
        return 'OpenAI';
      case AiProvider.ANTHROPIC:
        return 'Anthropic';
      case AiProvider.GOOGLE:
        return 'Google AI';
      case AiProvider.DEEPSEEK:
        return 'DeepSeek';
      case AiProvider.OPENROUTER:
        return 'OpenRouter';
      case AiProvider.LOCAL:
        return 'Local (Ollama)';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get available models for a provider
   */
  static getAvailableModels(provider: AiProvider): AiModel[] {
    switch (provider) {
      case AiProvider.OPENAI:
        return [
          AiModel.GPT_4O,
          AiModel.GPT_4_TURBO,
          AiModel.GPT_4,
          AiModel.GPT_3_5_TURBO,
        ];

      case AiProvider.ANTHROPIC:
        return [
          AiModel.CLAUDE_3_5_SONNET,
          AiModel.CLAUDE_3_OPUS,
          AiModel.CLAUDE_3_SONNET,
          AiModel.CLAUDE_3_HAIKU,
        ];

      case AiProvider.GOOGLE:
        return [
          AiModel.GEMINI_2_5_FLASH, // Latest and recommended
          AiModel.GEMINI_2_5_PRO,   // More powerful alternative
          AiModel.GEMINI_1_5_FLASH, // Previous generation
          AiModel.GEMINI_1_5_PRO,   // Previous generation (powerful)
          AiModel.GEMINI_PRO,        // Legacy (deprecated but still works)
          AiModel.GEMINI_PRO_VISION, // Legacy vision model
        ];

      case AiProvider.DEEPSEEK:
        return [
          AiModel.DEEPSEEK_CHAT,      // General chat model
          AiModel.DEEPSEEK_CODER,     // Specialized for coding
          AiModel.DEEPSEEK_REASONER,  // Advanced reasoning model
        ];

      case AiProvider.OPENROUTER:
        return [
          AiModel.OPENROUTER_GPT_4,
          AiModel.OPENROUTER_CLAUDE_3_5_SONNET,
          AiModel.OPENROUTER_LLAMA_3_1_70B,
        ];

      case AiProvider.LOCAL:
        return [
          AiModel.LOCAL_LLAMA_3_1,
          AiModel.LOCAL_MISTRAL,
          AiModel.LOCAL_CODELLAMA,
        ];

      default:
        return [AiModel.GPT_4O];
    }
  }
}
