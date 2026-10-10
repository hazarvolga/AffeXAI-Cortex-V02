import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

/**
 * AES-256-GCM şifreleme/deşifreleme yardımcı sınıfı
 * Email API anahtarları gibi hassas verileri güvenli saklamak için kullanılır
 */
export class EncryptionUtil {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly SALT_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  private static readonly TAG_LENGTH = 16;
  private static readonly KEY_LENGTH = 32;

  /**
   * Environment'tan encryption key'i alır
   * Yoksa development ortamı için varsayılan bir key döner (production'da HATA!)
   */
  private static getEncryptionKey(): string {
    const key = process.env.ENCRYPTION_KEY;
    
    if (!key) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('ENCRYPTION_KEY environment variable must be set in production');
      }
      
      // Development için varsayılan key (ASLA production'da kullanma!)
      console.warn('⚠️  Using default encryption key for development. Set ENCRYPTION_KEY in production!');
      return 'dev_key_32_characters_long!!!';
    }
    
    return key;
  }

  /**
   * Encryption key'den türetilmiş cipher key üretir
   */
  private static deriveKey(key: string, salt: Buffer): Buffer {
    return scryptSync(key, salt, EncryptionUtil.KEY_LENGTH);
  }

  /**
   * Metni şifreler
   * Format: salt(32) + iv(16) + tag(16) + encryptedData
   * @param plaintext Şifrelenecek metin
   * @returns Base64 encoded şifreli veri
   */
  static encrypt(plaintext: string): string {
    if (!plaintext) {
      return '';
    }

    try {
      const masterKey = this.getEncryptionKey();
      
      // Random salt ve IV oluştur
      const salt = randomBytes(this.SALT_LENGTH);
      const iv = randomBytes(this.IV_LENGTH);
      
      // Key türet
      const key = this.deriveKey(masterKey, salt);
      
      // Şifrele
      const cipher = createCipheriv(this.ALGORITHM, key, iv);
      const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final(),
      ]);
      
      // Auth tag al
      const tag = cipher.getAuthTag();
      
      // Tüm parçaları birleştir: salt + iv + tag + encrypted
      const combined = Buffer.concat([salt, iv, tag, encrypted]);
      
      return combined.toString('base64');
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Şifreli metni çözer
   * @param ciphertext Base64 encoded şifreli veri
   * @returns Orijinal metin
   */
  static decrypt(ciphertext: string): string {
    if (!ciphertext) {
      return '';
    }

    try {
      const masterKey = this.getEncryptionKey();
      
      // Base64'ten buffer'a çevir
      const combined = Buffer.from(ciphertext, 'base64');
      
      // Parçaları ayır
      const salt = combined.subarray(0, this.SALT_LENGTH);
      const iv = combined.subarray(
        this.SALT_LENGTH,
        this.SALT_LENGTH + this.IV_LENGTH
      );
      const tag = combined.subarray(
        this.SALT_LENGTH + this.IV_LENGTH,
        this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH
      );
      const encrypted = combined.subarray(
        this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH
      );
      
      // Key türet
      const key = this.deriveKey(masterKey, salt);
      
      // Deşifrele
      const decipher = createDecipheriv(this.ALGORITHM, key, iv);
      decipher.setAuthTag(tag);
      
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);
      
      return decrypted.toString('utf8');
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Test için: şifrele ve deşifrele döngüsü
   */
  static test(): boolean {
    const testData = 're_test_1234567890abcdef';
    const encrypted = this.encrypt(testData);
    const decrypted = this.decrypt(encrypted);
    return testData === decrypted;
  }
}
