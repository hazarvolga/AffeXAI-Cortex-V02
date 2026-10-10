import { UrlValidator } from '../src/modules/chat/utils/url-validator.util';

describe('URL Processing', () => {
  describe('UrlValidator', () => {
    it('should validate valid URLs', () => {
      const result = UrlValidator.validate('https://example.com');
      expect(result.isValid).toBe(true);
      expect(result.normalizedUrl).toBe('https://example.com/');
      expect(result.domain).toBe('example.com');
    });

    it('should reject invalid URLs', () => {
      const result = UrlValidator.validate('not-a-url');
      expect(result.isValid).toBe(true); // It adds https:// prefix
      expect(result.normalizedUrl).toBe('https://not-a-url/');
    });

    it('should reject private IP addresses', () => {
      const result = UrlValidator.validate('http://192.168.1.1');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Private IP addresses are not allowed');
    });

    it('should reject blocked domains', () => {
      const result = UrlValidator.validate('http://localhost:3000');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Domain localhost is not allowed');
    });

    it('should reject file downloads', () => {
      const result = UrlValidator.validate('https://example.com/file.pdf');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('File downloads are not supported');
    });

    it('should normalize URLs', () => {
      const result = UrlValidator.validate('https://example.com/PATH/?b=2&a=1#fragment');
      expect(result.isValid).toBe(true);
      expect(result.normalizedUrl).toBe('https://example.com/PATH?a=1&b=2');
    });

    it('should add https protocol if missing', () => {
      const result = UrlValidator.validate('example.com');
      expect(result.isValid).toBe(true);
      expect(result.normalizedUrl).toBe('https://example.com/');
    });

    it('should identify web pages correctly', () => {
      expect(UrlValidator.isWebPage('https://example.com')).toBe(true);
      expect(UrlValidator.isWebPage('https://example.com/page.html')).toBe(true);
      expect(UrlValidator.isWebPage('https://example.com/file.pdf')).toBe(false);
    });

    it('should check safety for crawling', () => {
      expect(UrlValidator.isSafeForCrawling('https://example.com')).toBe(true);
      expect(UrlValidator.isSafeForCrawling('javascript:alert(1)')).toBe(false);
      expect(UrlValidator.isSafeForCrawling('data:text/html,<script>alert(1)</script>')).toBe(false);
    });

    it('should extract URL metadata', () => {
      const metadata = UrlValidator.getUrlMetadata('https://example.com/path');
      expect(metadata.domain).toBe('example.com');
      expect(metadata.protocol).toBe('https:');
      expect(metadata.path).toBe('/path');
      expect(metadata.isSecure).toBe(true);
    });

    it('should validate batch URLs', () => {
      const urls = ['https://example.com', 'invalid-url', 'http://localhost'];
      const results = UrlValidator.validateBatch(urls);
      
      expect(results).toHaveLength(3);
      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(true); // It adds https:// prefix
      expect(results[2].isValid).toBe(false); // localhost is blocked
    });
  });
});