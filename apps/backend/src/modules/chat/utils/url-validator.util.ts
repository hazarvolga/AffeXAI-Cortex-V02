import { URL } from 'url';
import { assertPublicUrl } from '../../../core/network/public-url-fetcher';

export interface UrlValidationResult {
  isValid: boolean;
  error?: string;
  normalizedUrl?: string;
  domain?: string;
  protocol?: string;
}

export class UrlValidator {
  private static readonly BLOCKED_EXTENSIONS = [
    '.exe', '.bat', '.cmd', '.com', '.scr', '.pif',
    '.zip', '.rar', '.7z', '.tar', '.gz',
    '.mp4', '.avi', '.mkv', '.mov', '.wmv',
    '.mp3', '.wav', '.flac', '.aac',
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  ];

  /**
   * Validate and normalize URL
   */
  static validate(url: string): UrlValidationResult {
    try {
      // Basic format check
      if (!url || typeof url !== 'string') {
        return { isValid: false, error: 'URL is required and must be a string' };
      }

      // Trim whitespace
      url = url.trim();

      // Add protocol if missing
      if (!/^[a-z][a-z\d+.-]*:/i.test(url)) {
        url = 'https://' + url;
      }

      // Parse URL
      const urlObj = assertPublicUrl(url);
      const hostname = urlObj.hostname.toLowerCase();

      // Check file extension
      const pathname = urlObj.pathname.toLowerCase();
      const hasBlockedExtension = this.BLOCKED_EXTENSIONS.some(ext => 
        pathname.endsWith(ext)
      );
      
      if (hasBlockedExtension) {
        return {
          isValid: false,
          error: 'File downloads are not supported',
        };
      }

      // Check URL length
      if (url.length > 2048) {
        return {
          isValid: false,
          error: 'URL is too long (maximum 2048 characters)',
        };
      }

      // Normalize URL
      const normalizedUrl = urlObj.href;

      return {
        isValid: true,
        normalizedUrl,
        domain: hostname,
        protocol: urlObj.protocol,
      };

    } catch (error) {
      return {
        isValid: false,
        error: `Invalid URL format: ${error.message}`,
      };
    }
  }

  /**
   * Extract domain from URL
   */
  static extractDomain(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.toLowerCase();
    } catch {
      return null;
    }
  }

  /**
   * Check if URL is likely to be a web page (not a file download)
   */
  static isWebPage(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();
      
      // If no extension or common web extensions
      const webExtensions = ['.html', '.htm', '.php', '.asp', '.aspx', '.jsp'];
      const hasWebExtension = webExtensions.some(ext => pathname.endsWith(ext));
      const hasNoExtension = !pathname.includes('.') || pathname.endsWith('/');
      
      return hasWebExtension || hasNoExtension;
    } catch {
      return false;
    }
  }

  /**
   * Validate multiple URLs
   */
  static validateBatch(urls: string[]): Array<UrlValidationResult & { originalUrl: string }> {
    return urls.map(url => ({
      originalUrl: url,
      ...this.validate(url),
    }));
  }

  /**
   * Check if URL is safe for crawling (basic security checks)
   */
  static isSafeForCrawling(url: string): boolean {
    const validation = this.validate(url);
    if (!validation.isValid) {
      return false;
    }

    // Additional safety checks
    const urlObj = new URL(validation.normalizedUrl!);
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /file:/i,
      /ftp:/i,
    ];

    const urlString = urlObj.toString();
    return !suspiciousPatterns.some(pattern => pattern.test(urlString));
  }

  /**
   * Get URL metadata for display
   */
  static getUrlMetadata(url: string): {
    domain: string | null;
    protocol: string | null;
    path: string | null;
    isSecure: boolean;
  } {
    try {
      const urlObj = new URL(url);
      return {
        domain: urlObj.hostname,
        protocol: urlObj.protocol,
        path: urlObj.pathname,
        isSecure: urlObj.protocol === 'https:',
      };
    } catch {
      return {
        domain: null,
        protocol: null,
        path: null,
        isSecure: false,
      };
    }
  }
}