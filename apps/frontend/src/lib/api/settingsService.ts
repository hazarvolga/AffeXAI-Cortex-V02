import { httpClient } from './http-client';

export interface Contact {
  address: string;
  phone: string;
  email: string;
}

export interface SocialMedia {
  facebook?: string;
  linkedin?: string;
  twitter?: string;
  youtube?: string;
  instagram?: string;
  pinterest?: string;
  tiktok?: string;
  [key: string]: string | undefined;
}

export interface Seo {
  defaultTitle: string;
  defaultDescription: string;
}

export interface SiteSettings {
  companyName: string;
  logoUrl: string;
  logoDarkUrl: string;
  contact: Contact;
  socialMedia: SocialMedia;
  seo: Seo;
}

// AI Settings Types
export type AiModel =
  // OpenAI Models
  | 'gpt-4'
  | 'gpt-4-turbo'
  | 'gpt-4o'
  | 'gpt-3.5-turbo'
  // Anthropic Models
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-opus-20240229'
  | 'claude-3-sonnet-20240229'
  | 'claude-3-haiku-20240307'
  // Google Models
  | 'gemini-pro'
  | 'gemini-pro-vision'
  | 'gemini-1.5-pro'
  | 'gemini-1.5-flash'
  | 'gemini-2.5-pro'
  | 'gemini-2.5-flash'
  // DeepSeek Models
  | 'deepseek-chat'
  | 'deepseek-coder'
  | 'deepseek-reasoner'
  // OpenRouter Models
  | 'openai/gpt-4'
  | 'anthropic/claude-3.5-sonnet'
  | 'meta-llama/llama-3.1-70b-instruct'
  // Local Models
  | 'llama3.1'
  | 'mistral'
  | 'codellama';

export type AiProvider = 'openai' | 'anthropic' | 'google' | 'deepseek' | 'openrouter' | 'local';

export interface AiModuleSettings {
  apiKey?: string; // Optional - may use global key
  model: AiModel;
  enabled: boolean;
  provider?: AiProvider;
}

export interface AiSettings {
  useSingleApiKey: boolean;
  global?: AiModuleSettings; // Only if useSingleApiKey=true
  emailMarketing: AiModuleSettings;
  social: AiModuleSettings;
  support: AiModuleSettings;
  analytics: AiModuleSettings;
}

export interface AiConnectionTestResult {
  success: boolean;
  message: string;
  provider?: AiProvider;
  model?: AiModel;
}

export interface ApiKeyDetectionResult {
  provider: AiProvider;
  providerName: string;
  defaultModel: AiModel;
  isValid: boolean;
  detectionMethod: 'prefix' | 'unknown';
  availableModels: AiModel[];
}

// Storage Settings Types
export type StorageProvider = 'local' | 'aws_s3' | 'cloudflare_r2' | 'digital_ocean_spaces' | 'minio';

export interface StorageConfigS3 {
  accessKeyId?: string;
  secretAccessKey?: string;
  region: string;
  bucket: string;
  endpoint?: string;
  publicUrl?: string;
}

export interface StorageConfigR2 {
  accountId: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  bucket: string;
  publicUrl: string;
}

export interface StorageConfigSpaces {
  accessKeyId?: string;
  secretAccessKey?: string;
  region: string;
  bucket: string;
  endpoint: string;
  cdnUrl?: string;
}

export interface StorageConfigMinio {
  endPoint: string;
  port: number;
  useSSL: boolean;
  accessKey?: string;
  secretKey?: string;
  bucket: string;
  publicUrl?: string;
}

export interface StorageSettings {
  provider: StorageProvider;
  useLocalFallback: boolean;
  awsS3?: StorageConfigS3;
  cloudflareR2?: StorageConfigR2;
  digitalOceanSpaces?: StorageConfigSpaces;
  minio?: StorageConfigMinio;
}

export type EmailProvider = 'resend' | 'sendgrid' | 'postmark' | 'mailgun' | 'ses' | 'smtp';

export interface EmailIdentitySettings {
  domain: string;
  fromName: string;
  fromEmail: string;
  replyToEmail?: string;
}

export interface EmailSettings {
  provider: EmailProvider;
  transactional: EmailIdentitySettings;
  marketing: EmailIdentitySettings;
  tracking?: { clickTracking?: boolean; openTracking?: boolean };
  rateLimit?: { transactional: number; marketing: number };
  resend?: { apiKey: string };
  sendgrid?: { apiKey: string };
  postmark?: { apiKey: string };
  mailgun?: { apiKey: string; domain: string };
  ses?: { accessKey: string; secretKey: string; region: string };
  smtp?: { host: string; port: number; user: string; password: string; secure: boolean };
}

/**
 * Settings Service
 * Handles site settings API operations with unified HTTP client
 * Note: Uses getWrapped() because backend uses global ApiResponse wrapper
 */
class SettingsService {
  /**
   * Get site settings
   */
  async getAdministrativeSiteSettings(): Promise<SiteSettings> {
    return httpClient.getWrapped<SiteSettings>('/settings/site/admin');
  }

  async getSiteSettings(): Promise<SiteSettings> {
    return httpClient.getWrapped<SiteSettings>('/settings/site');
  }

  async getEmailSettings(): Promise<EmailSettings> {
    return httpClient.getWrapped<EmailSettings>('/settings/email');
  }

  async updateEmailSettings(settings: EmailSettings): Promise<EmailSettings> {
    return httpClient.putWrapped<EmailSettings>('/settings/email', settings);
  }

  /**
   * Get AI settings (returns masked API keys)
   */
  async getAiSettings(): Promise<AiSettings> {
    return httpClient.getWrapped<AiSettings>('/settings/ai');
  }

  /**
   * Update AI settings
   */
  async updateAiSettings(settings: AiSettings): Promise<{ message: string }> {
    return httpClient.patchWrapped<{ message: string }>('/settings/ai', settings);
  }

  /**
   * Test AI connection for specific module
   */
  async testAiConnection(module: 'emailMarketing' | 'social' | 'support' | 'analytics'): Promise<AiConnectionTestResult> {
    return httpClient.postWrapped<AiConnectionTestResult>(`/settings/ai/test/${module}`, {});
  }

  /**
   * Auto-detect AI provider from API key format
   * Works for both global and module-level API keys
   */
  async detectProvider(apiKey: string): Promise<ApiKeyDetectionResult> {
    return httpClient.postWrapped<ApiKeyDetectionResult>('/settings/ai/detect-provider', { apiKey });
  }

  /**
   * Get storage settings (masked)
   */
  async getStorageSettings(): Promise<StorageSettings> {
    return httpClient.getWrapped<StorageSettings>('/settings/storage');
  }

  /**
   * Update storage settings
   */
  async updateStorageSettings(settings: StorageSettings): Promise<{ message: string }> {
    return httpClient.putWrapped<{ message: string }>('/settings/storage', settings);
  }
}

export const settingsService = new SettingsService();
export default settingsService;
