import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { 
  UnsupportedFileTypeException, 
  FileSizeExceededException, 
  InvalidFileException,
  FileSecurityException 
} from '../exceptions/document-processing.exceptions';

export interface FileValidationResult {
  isValid: boolean;
  fileType: string;
  mimeType: string;
  checksum: string;
  securityChecks: {
    hasExecutableContent: boolean;
    hasScriptContent: boolean;
    hasSuspiciousPatterns: boolean;
    isPasswordProtected: boolean;
  };
}

@Injectable()
export class FileValidatorService {
  private readonly logger = new Logger(FileValidatorService.name);
  
  // File type configurations
  private readonly supportedFormats = ['pdf', 'docx', 'xlsx', 'txt', 'md'];
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  
  // MIME type mappings with magic numbers
  private readonly fileSignatures = {
    'pdf': {
      mimeType: 'application/pdf',
      signatures: [Buffer.from([0x25, 0x50, 0x44, 0x46])] // %PDF
    },
    'docx': {
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      signatures: [Buffer.from([0x50, 0x4B, 0x03, 0x04])] // ZIP signature (DOCX is ZIP-based)
    },
    'xlsx': {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      signatures: [Buffer.from([0x50, 0x4B, 0x03, 0x04])] // ZIP signature (XLSX is ZIP-based)
    },
    'txt': {
      mimeType: 'text/plain',
      signatures: [] // No specific signature for plain text
    },
    'md': {
      mimeType: 'text/markdown',
      signatures: [] // No specific signature for markdown
    }
  };

  // Suspicious patterns for security scanning
  private readonly suspiciousPatterns: RegExp[] = [
    // JavaScript patterns
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
    
    // Executable patterns
    /\.exe\b/gi,
    /\.bat\b/gi,
    /\.cmd\b/gi,
    /\.scr\b/gi,
    /\.com\b/gi,
    
    // Macro patterns
    /Sub\s+\w+\(/gi,
    /Function\s+\w+\(/gi,
    /ActiveX/gi,
    /WScript/gi,
    /Shell\(/gi,
    
    // SQL injection patterns
    /union\s+select/gi,
    /drop\s+table/gi,
    /exec\s*\(/gi,
    
    // Path traversal patterns
    /\.\.\//g,
    /\.\.\\/g,
    
    // Base64 encoded executables (common in malware)
    /TVqQAAMAAAAEAAAA/g // MZ header in base64
  ];

  /**
   * Validate uploaded file comprehensively
   */
  async validateFile(file: Buffer, filename: string, declaredMimeType?: string): Promise<FileValidationResult> {
    this.logger.log(`Validating file: ${filename} (${file.length} bytes)`);

    // Basic validations
    this.validateFileSize(file);
    this.validateFilename(filename);
    
    const fileType = this.extractFileType(filename);
    this.validateFileType(fileType);
    
    // Generate checksum
    const checksum = this.generateChecksum(file);
    
    // Validate file signature
    const detectedMimeType = this.validateFileSignature(file, fileType, declaredMimeType);
    
    // Security checks
    const securityChecks = await this.performSecurityChecks(file, fileType);
    
    // Check for password protection
    const isPasswordProtected = this.checkPasswordProtection(file, fileType);
    securityChecks.isPasswordProtected = isPasswordProtected;

    const result: FileValidationResult = {
      isValid: true,
      fileType,
      mimeType: detectedMimeType,
      checksum,
      securityChecks
    };

    // Fail validation if security issues found
    if (securityChecks.hasExecutableContent || 
        securityChecks.hasScriptContent || 
        securityChecks.hasSuspiciousPatterns) {
      throw new FileSecurityException('File contains potentially malicious content');
    }

    if (isPasswordProtected) {
      throw new FileSecurityException('Password-protected files are not supported');
    }

    this.logger.log(`File validation successful: ${filename}`);
    return result;
  }

  /**
   * Validate file size
   */
  private validateFileSize(file: Buffer): void {
    if (file.length > this.maxFileSize) {
      throw new FileSizeExceededException(file.length, this.maxFileSize);
    }
    
    if (file.length === 0) {
      throw new InvalidFileException('File is empty');
    }
  }

  /**
   * Validate filename
   */
  private validateFilename(filename: string): void {
    if (!filename || filename.trim().length === 0) {
      throw new InvalidFileException('Filename is required');
    }

    // Check for path traversal attempts
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new InvalidFileException('Filename contains invalid characters');
    }

    // Check filename length
    if (filename.length > 255) {
      throw new InvalidFileException('Filename is too long');
    }

    // Check for null bytes
    if (filename.includes('\0')) {
      throw new InvalidFileException('Filename contains null bytes');
    }
  }

  /**
   * Extract and validate file type from filename
   */
  private extractFileType(filename: string): string {
    const extension = filename.toLowerCase().split('.').pop();
    
    if (!extension) {
      throw new InvalidFileException('File has no extension');
    }

    return extension;
  }

  /**
   * Validate file type against supported formats
   */
  private validateFileType(fileType: string): void {
    if (!this.supportedFormats.includes(fileType)) {
      throw new UnsupportedFileTypeException(fileType, this.supportedFormats);
    }
  }

  /**
   * Validate file signature (magic numbers)
   */
  private validateFileSignature(file: Buffer, fileType: string, declaredMimeType?: string): string {
    const config = this.fileSignatures[fileType];
    
    if (!config) {
      throw new InvalidFileException(`No signature configuration for file type: ${fileType}`);
    }

    // For text files, skip signature validation
    if (fileType === 'txt' || fileType === 'md') {
      return config.mimeType;
    }

    // Check file signatures
    const hasValidSignature = config.signatures.some(signature => {
      if (file.length < signature.length) return false;
      return file.subarray(0, signature.length).equals(signature);
    });

    if (!hasValidSignature && config.signatures.length > 0) {
      throw new InvalidFileException(`File signature does not match declared type: ${fileType}`);
    }

    // Validate declared MIME type if provided
    if (declaredMimeType && declaredMimeType !== config.mimeType) {
      this.logger.warn(`MIME type mismatch: declared=${declaredMimeType}, expected=${config.mimeType}`);
    }

    return config.mimeType;
  }

  /**
   * Perform comprehensive security checks
   */
  private async performSecurityChecks(file: Buffer, fileType: string): Promise<{
    hasExecutableContent: boolean;
    hasScriptContent: boolean;
    hasSuspiciousPatterns: boolean;
    isPasswordProtected: boolean;
  }> {
    const content = file.toString('utf-8', 0, Math.min(file.length, 1024 * 1024)); // Check first 1MB
    
    let hasExecutableContent = false;
    let hasScriptContent = false;
    let hasSuspiciousPatterns = false;

    // Check for suspicious patterns
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(content)) {
        hasSuspiciousPatterns = true;
        this.logger.warn(`Suspicious pattern detected: ${pattern.source}`);
        
        // Categorize the threat
        if (pattern.source.includes('script') || pattern.source.includes('javascript')) {
          hasScriptContent = true;
        }
        if (pattern.source.includes('exe') || pattern.source.includes('bat')) {
          hasExecutableContent = true;
        }
      }
    }

    // Additional checks for specific file types
    if (fileType === 'pdf') {
      // Check for PDF JavaScript
      if (content.includes('/JavaScript') || content.includes('/JS')) {
        hasScriptContent = true;
      }
    }

    if (fileType === 'docx' || fileType === 'xlsx') {
      // Check for Office macros
      if (content.includes('vbaProject') || content.includes('macros')) {
        hasExecutableContent = true;
      }
    }

    return {
      hasExecutableContent,
      hasScriptContent,
      hasSuspiciousPatterns,
      isPasswordProtected: false // Will be set separately
    };
  }

  /**
   * Check if file is password protected
   */
  private checkPasswordProtection(file: Buffer, fileType: string): boolean {
    const content = file.toString('utf-8', 0, Math.min(file.length, 1024));

    switch (fileType) {
      case 'pdf':
        // PDF encryption indicators
        return content.includes('/Encrypt') || content.includes('/Filter/Standard');
      
      case 'docx':
      case 'xlsx':
        // Office document encryption indicators
        return content.includes('EncryptedPackage') || 
               content.includes('Microsoft Office Encrypted Document');
      
      default:
        return false;
    }
  }

  /**
   * Generate file checksum
   */
  private generateChecksum(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Get supported file formats
   */
  getSupportedFormats(): string[] {
    return [...this.supportedFormats];
  }

  /**
   * Get maximum file size
   */
  getMaxFileSize(): number {
    return this.maxFileSize;
  }
}