import { Injectable, Logger } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

/**
 * KEK/DEK (Key Encryption Key / Data Encryption Key) Pattern Implementation
 * 
 * Architecture:
 * - KEK (Master Key): Stored in environment variable, never changes frequently
 * - DEK (Data Encryption Keys): Generated per provider, encrypted with KEK
 * - Benefits: Easy key rotation (only re-encrypt DEKs), provider isolation
 */

// AI Provider types
export type AiProviderType =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'deepseek'
  | 'global'
  | 'emailMarketing'
  | 'social'
  | 'support'
  | 'analytics';

interface DataEncryptionKey {
  provider: AiProviderType;
  dek: string; // Base64 encoded DEK
  encryptedDek: string; // DEK encrypted with KEK
  createdAt: Date;
  expiresAt: Date;
}

@Injectable()
export class KeyManagementService {
  private readonly logger = new Logger(KeyManagementService.name);

  // Encryption constants
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly SALT_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  private static readonly TAG_LENGTH = 16;
  private static readonly KEY_LENGTH = 32;
  private static readonly DEK_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

  // In-memory DEK cache (production should use Redis)
  private dekCache: Map<string, DataEncryptionKey> = new Map();

  /**
   * Get the master KEK from environment
   */
  private getKEK(): string {
    const kek = process.env.ENCRYPTION_KEY;
    
    if (!kek) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('ENCRYPTION_KEY environment variable must be set in production');
      }
      this.logger.warn('⚠️  Using default KEK for development. Set ENCRYPTION_KEY in production!');
      return 'dev_key_32_characters_long!!!';
    }
    
    if (kek.length < 32) {
      throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
    }
    
    return kek;
  }

  /**
   * Derive encryption key using scrypt
   */
  private deriveKey(masterKey: string, salt: Buffer): Buffer {
    return scryptSync(masterKey, salt, KeyManagementService.KEY_LENGTH);
  }

  /**
   * Generate a new random DEK for a provider
   */
  generateDEK(provider: AiProviderType): string {
    const dek = randomBytes(KeyManagementService.KEY_LENGTH);
    const dekBase64 = dek.toString('base64');
    
    this.logger.log(`Generated new DEK for provider: ${provider}`);
    return dekBase64;
  }

  /**
   * Encrypt a DEK using the master KEK
   */
  encryptDEK(dekBase64: string): string {
    const kek = this.getKEK();
    const salt = randomBytes(KeyManagementService.SALT_LENGTH);
    const iv = randomBytes(KeyManagementService.IV_LENGTH);
    const key = this.deriveKey(kek, salt);
    
    const cipher = createCipheriv(KeyManagementService.ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(dekBase64, 'utf8'),
      cipher.final(),
    ]);
    
    const tag = cipher.getAuthTag();
    
    // Format: salt + iv + tag + encrypted
    const combined = Buffer.concat([salt, iv, tag, encrypted]);
    return combined.toString('base64');
  }

  /**
   * Decrypt a DEK using the master KEK
   */
  decryptDEK(encryptedDekBase64: string): string {
    const kek = this.getKEK();
    const combined = Buffer.from(encryptedDekBase64, 'base64');
    
    const salt = combined.subarray(0, KeyManagementService.SALT_LENGTH);
    const iv = combined.subarray(
      KeyManagementService.SALT_LENGTH,
      KeyManagementService.SALT_LENGTH + KeyManagementService.IV_LENGTH
    );
    const tag = combined.subarray(
      KeyManagementService.SALT_LENGTH + KeyManagementService.IV_LENGTH,
      KeyManagementService.SALT_LENGTH + KeyManagementService.IV_LENGTH + KeyManagementService.TAG_LENGTH
    );
    const encrypted = combined.subarray(
      KeyManagementService.SALT_LENGTH + KeyManagementService.IV_LENGTH + KeyManagementService.TAG_LENGTH
    );
    
    const key = this.deriveKey(kek, salt);
    const decipher = createDecipheriv(KeyManagementService.ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    
    return decrypted.toString('utf8');
  }

  /**
   * Encrypt data using a DEK
   */
  encryptWithDEK(plaintext: string, dekBase64: string): string {
    const dekBuffer = Buffer.from(dekBase64, 'base64');
    
    const salt = randomBytes(KeyManagementService.SALT_LENGTH);
    const iv = randomBytes(KeyManagementService.IV_LENGTH);
    
    const cipher = createCipheriv(KeyManagementService.ALGORITHM, dekBuffer, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    
    const tag = cipher.getAuthTag();
    
    // Format: salt + iv + tag + encrypted
    const combined = Buffer.concat([salt, iv, tag, encrypted]);
    return combined.toString('base64');
  }

  /**
   * Decrypt data using a DEK
   */
  decryptWithDEK(ciphertext: string, dekBase64: string): string {
    const dekBuffer = Buffer.from(dekBase64, 'base64');
    const combined = Buffer.from(ciphertext, 'base64');
    
    const salt = combined.subarray(0, KeyManagementService.SALT_LENGTH);
    const iv = combined.subarray(
      KeyManagementService.SALT_LENGTH,
      KeyManagementService.SALT_LENGTH + KeyManagementService.IV_LENGTH
    );
    const tag = combined.subarray(
      KeyManagementService.SALT_LENGTH + KeyManagementService.IV_LENGTH,
      KeyManagementService.SALT_LENGTH + KeyManagementService.IV_LENGTH + KeyManagementService.TAG_LENGTH
    );
    const encrypted = combined.subarray(
      KeyManagementService.SALT_LENGTH + KeyManagementService.IV_LENGTH + KeyManagementService.TAG_LENGTH
    );
    
    const decipher = createDecipheriv(KeyManagementService.ALGORITHM, dekBuffer, iv);
    decipher.setAuthTag(tag);
    
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    
    return decrypted.toString('utf8');
  }

  /**
   * Get or create a cached DEK for a provider
   */
  async getDEKForProvider(
    provider: AiProviderType,
    encryptedDek?: string
  ): Promise<string> {
    // Check cache first
    const cached = this.dekCache.get(provider);
    if (cached && cached.expiresAt > new Date()) {
      this.logger.debug(`Using cached DEK for provider: ${provider}`);
      return cached.dek;
    }

    // If encrypted DEK provided, decrypt it
    if (encryptedDek) {
      try {
        const dek = this.decryptDEK(encryptedDek);
        
        // Cache it
        this.dekCache.set(provider, {
          provider,
          dek,
          encryptedDek,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + KeyManagementService.DEK_CACHE_TTL_MS)
        });
        
        this.logger.log(`Decrypted and cached DEK for provider: ${provider}`);
        return dek;
      } catch (error) {
        this.logger.error(`Failed to decrypt DEK for provider ${provider}:`, error);
        throw error;
      }
    }

    // Generate new DEK if none exists
    this.logger.warn(`No DEK found for provider ${provider}, generating new one`);
    return this.generateDEK(provider);
  }

  /**
   * Rotate a DEK for a provider (re-encrypt all data with new DEK)
   */
  async rotateDEK(provider: AiProviderType): Promise<{
    oldEncryptedDek: string;
    newDek: string;
    newEncryptedDek: string;
  }> {
    const cached = this.dekCache.get(provider);
    const oldEncryptedDek = cached?.encryptedDek || '';

    // Generate new DEK
    const newDek = this.generateDEK(provider);
    const newEncryptedDek = this.encryptDEK(newDek);

    // Update cache
    this.dekCache.set(provider, {
      provider,
      dek: newDek,
      encryptedDek: newEncryptedDek,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + KeyManagementService.DEK_CACHE_TTL_MS)
    });

    this.logger.log(`Rotated DEK for provider: ${provider}`);

    return {
      oldEncryptedDek,
      newDek,
      newEncryptedDek
    };
  }

  /**
   * Clear DEK cache (useful for testing or after rotation)
   */
  clearDEKCache(provider?: AiProviderType): void {
    if (provider) {
      this.dekCache.delete(provider);
      this.logger.log(`Cleared DEK cache for provider: ${provider}`);
    } else {
      this.dekCache.clear();
      this.logger.log('Cleared all DEK cache');
    }
  }

  /**
   * Full workflow: Encrypt API key using KEK/DEK pattern
   * 1. Get/generate DEK for provider
   * 2. Encrypt API key with DEK
   * 3. Return both encrypted API key and encrypted DEK
   */
  async encryptApiKey(
    apiKey: string,
    provider: AiProviderType
  ): Promise<{ encryptedApiKey: string; encryptedDek: string }> {
    // Generate new DEK
    const dek = this.generateDEK(provider);
    
    // Encrypt the API key with the DEK
    const encryptedApiKey = this.encryptWithDEK(apiKey, dek);
    
    // Encrypt the DEK with the KEK
    const encryptedDek = this.encryptDEK(dek);
    
    this.logger.log(`Encrypted API key for provider: ${provider} using KEK/DEK pattern`);
    
    return { encryptedApiKey, encryptedDek };
  }

  /**
   * Full workflow: Decrypt API key using KEK/DEK pattern
   * 1. Decrypt DEK with KEK
   * 2. Decrypt API key with DEK
   */
  async decryptApiKey(
    encryptedApiKey: string,
    encryptedDek: string,
    provider: AiProviderType
  ): Promise<string> {
    // Get DEK (from cache or decrypt)
    const dek = await this.getDEKForProvider(provider, encryptedDek);
    
    // Decrypt API key with DEK
    const apiKey = this.decryptWithDEK(encryptedApiKey, dek);
    
    this.logger.debug(`Decrypted API key for provider: ${provider} using KEK/DEK pattern`);
    
    return apiKey;
  }
}
