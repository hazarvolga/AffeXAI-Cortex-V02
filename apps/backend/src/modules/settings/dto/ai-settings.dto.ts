import { IsString, IsBoolean, IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { IsSecretUpdateInput, maskCredential } from './secret-update.dto';

/**
 * Supported AI Providers
 */
export enum AiProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  DEEPSEEK = 'deepseek',
  OPENROUTER = 'openrouter',
  LOCAL = 'local',
}

/**
 * Supported AI Models
 */
export enum AiModel {
  // OpenAI Models
  GPT_4 = 'gpt-4',
  GPT_4_TURBO = 'gpt-4-turbo',
  GPT_4O = 'gpt-4o',
  GPT_3_5_TURBO = 'gpt-3.5-turbo',
  
  // Anthropic Models
  CLAUDE_3_5_SONNET = 'claude-3-5-sonnet-20241022',
  CLAUDE_3_OPUS = 'claude-3-opus-20240229',
  CLAUDE_3_SONNET = 'claude-3-sonnet-20240229',
  CLAUDE_3_HAIKU = 'claude-3-haiku-20240307',
  
  // Google Models
  GEMINI_PRO = 'gemini-pro',
  GEMINI_PRO_VISION = 'gemini-pro-vision',
  GEMINI_1_5_PRO = 'gemini-1.5-pro',
  GEMINI_1_5_FLASH = 'gemini-1.5-flash',
  GEMINI_2_5_PRO = 'gemini-2.5-pro',
  GEMINI_2_5_FLASH = 'gemini-2.5-flash',

  // DeepSeek Models
  DEEPSEEK_CHAT = 'deepseek-chat',
  DEEPSEEK_CODER = 'deepseek-coder',
  DEEPSEEK_REASONER = 'deepseek-reasoner',

  // OpenRouter Models (Popular ones)
  OPENROUTER_GPT_4 = 'openai/gpt-4',
  OPENROUTER_CLAUDE_3_5_SONNET = 'anthropic/claude-3.5-sonnet',
  OPENROUTER_LLAMA_3_1_70B = 'meta-llama/llama-3.1-70b-instruct',
  
  // Local Models (Ollama)
  LOCAL_LLAMA_3_1 = 'llama3.1',
  LOCAL_MISTRAL = 'mistral',
  LOCAL_CODELLAMA = 'codellama',
}

/**
 * AI Module Settings
 * Used for each AI-powered module (emailMarketing, social, support, analytics)
 */
export class AiModuleSettingsDto {
  @IsOptional()
  @IsSecretUpdateInput()
  apiKey?: string; // Module-specific API key; update endpoints also accept explicit secret operations

  @IsOptional()
  @IsEnum(AiModel)
  model?: AiModel; // Optional - auto-detected from API key if not provided

  @IsBoolean()
  enabled: boolean;

  @IsOptional()
  @IsEnum(AiProvider)
  provider?: AiProvider; // Optional - auto-detected from API key format
}

/**
 * Complete AI Settings
 */
export class AiSettingsDto {
  @IsBoolean()
  useSingleApiKey: boolean; // If true, all modules use global.apiKey

  @IsOptional()
  @ValidateNested()
  @Type(() => AiModuleSettingsDto)
  global?: AiModuleSettingsDto; // Global AI settings (used when useSingleApiKey=true)

  @ValidateNested()
  @Type(() => AiModuleSettingsDto)
  emailMarketing: AiModuleSettingsDto;

  @ValidateNested()
  @Type(() => AiModuleSettingsDto)
  social: AiModuleSettingsDto;

  @ValidateNested()
  @Type(() => AiModuleSettingsDto)
  support: AiModuleSettingsDto;

  @ValidateNested()
  @Type(() => AiModuleSettingsDto)
  analytics: AiModuleSettingsDto;
}

/**
 * Masked AI Settings (for frontend - API keys hidden)
 */
export class AiSettingsMaskedDto extends AiSettingsDto {
  static mask(settings: AiSettingsDto): AiSettingsMaskedDto {
    const masked = JSON.parse(JSON.stringify(settings)) as AiSettingsMaskedDto;

    // Helper function to safely mask API key
    const maskApiKey = (apiKey: string | undefined): string | undefined => maskCredential(apiKey);

    // Mask global API key
    if (masked.global?.apiKey) {
      masked.global.apiKey = maskApiKey(masked.global.apiKey);
    }

    // Mask module-specific API keys
    if (masked.emailMarketing?.apiKey) {
      masked.emailMarketing.apiKey = maskApiKey(masked.emailMarketing.apiKey);
    }
    if (masked.social?.apiKey) {
      masked.social.apiKey = maskApiKey(masked.social.apiKey);
    }
    if (masked.support?.apiKey) {
      masked.support.apiKey = maskApiKey(masked.support.apiKey);
    }
    if (masked.analytics?.apiKey) {
      masked.analytics.apiKey = maskApiKey(masked.analytics.apiKey);
    }

    return masked;
  }
}

/**
 * AI Connection Test Result
 */
export class AiConnectionTestDto {
  @IsBoolean()
  success: boolean;

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  provider?: string; // openai, anthropic

  @IsOptional()
  @IsString()
  model?: string; // actual model tested
}
