import { SEOMetadataExtractor } from '../../extractors/seo-metadata-extractor';

describe('SEOMetadataExtractor', () => {
  let extractor: SEOMetadataExtractor;

  beforeEach(() => {
    extractor = new SEOMetadataExtractor();
  });

  describe('extractMetadata', () => {
    it('should extract meta title from <title> tag', () => {
      const html = `
        <html>
          <head>
            <title>Test Page Title</title>
          </head>
          <body>Content here</body>
        </html>
      `;

      const metadata = extractor.extractMetadata(html, 'Fallback Title');

      expect(metadata.metaTitle).toBe('Test Page Title');
    });

    it('should extract meta title from <meta name="title">', () => {
      const html = `
        <html>
          <head>
            <meta name="title" content="Meta Title Content">
          </head>
          <body>Content here</body>
        </html>
      `;

      const metadata = extractor.extractMetadata(html, 'Fallback Title');

      expect(metadata.metaTitle).toBe('Meta Title Content');
    });

    it('should use page title as fallback when no meta title', () => {
      const html = '<html><body>Content here</body></html>';

      const metadata = extractor.extractMetadata(html, 'Fallback Title');

      expect(metadata.metaTitle).toBe('Fallback Title');
    });

    it('should extract meta description', () => {
      const html = `
        <html>
          <head>
            <meta name="description" content="This is a test description">
          </head>
          <body>Content here</body>
        </html>
      `;

      const metadata = extractor.extractMetadata(html, 'Test Page');

      expect(metadata.metaDescription).toBe('This is a test description');
    });

    it('should generate description from first 160 characters', () => {
      const longText = 'A'.repeat(200);
      const html = `<html><body><p>${longText}</p></body></html>`;

      const metadata = extractor.extractMetadata(html, 'Test Page');

      expect(metadata.metaDescription).toBeDefined();
      expect(metadata.metaDescription!.length).toBeLessThanOrEqual(163); // 160 + '...'
      expect(metadata.metaDescription).toContain('...');
    });

    it('should truncate description at word boundary', () => {
      // Text must be longer than 160 chars to trigger truncation
      const text = 'This is a very long sentence that should be truncated at a word boundary to make it look better and more professional when displayed to users in search results and social media previews';
      const html = `<html><body><p>${text}</p></body></html>`;

      const metadata = extractor.extractMetadata(html, 'Test Page');

      expect(metadata.metaDescription).toBeDefined();
      expect(metadata.metaDescription!.length).toBeLessThanOrEqual(163);
      expect(metadata.metaDescription).toContain('...');
    });

    it('should extract meta keywords', () => {
      const html = `
        <html>
          <head>
            <meta name="keywords" content="wordpress, migration, cms">
          </head>
          <body>Content here</body>
        </html>
      `;

      const metadata = extractor.extractMetadata(html, 'Test Page');

      expect(metadata.metaKeywords).toBe('wordpress, migration, cms');
    });

    it('should return undefined for missing keywords', () => {
      const html = '<html><body>Content here</body></html>';

      const metadata = extractor.extractMetadata(html, 'Test Page');

      expect(metadata.metaKeywords).toBeUndefined();
    });
  });

  describe('Open Graph extraction', () => {
    it('should extract og:title', () => {
      const html = `
        <html>
          <head>
            <meta property="og:title" content="OG Title">
          </head>
          <body>Content here</body>
        </html>
      `;

      const metadata = extractor.extractMetadata(html, 'Test Page');

      expect(metadata.ogTitle).toBe('OG Title');
    });

    it('should extract og:description', () => {
      const html = `
        <html>
          <head>
            <meta property="og:description" content="OG Description">
          </head>
          <body>Content here</body>
        </html>
      `;

      const metadata = extractor.extractMetadata(html, 'Test Page');

      expect(metadata.ogDescription).toBe('OG Description');
    });

    it('should extract og:image', () => {
      const html = `
        <html>
          <head>
            <meta property="og:image" content="https://example.com/image.jpg">
          </head>
          <body>Content here</body>
        </html>
      `;

      const metadata = extractor.extractMetadata(html, 'Test Page');

      expect(metadata.ogImage).toBe('https://example.com/image.jpg');
    });

    it('should extract all Open Graph tags together', () => {
      const html = `
        <html>
          <head>
            <meta property="og:title" content="OG Title">
            <meta property="og:description" content="OG Description">
            <meta property="og:image" content="https://example.com/image.jpg">
          </head>
          <body>Content here</body>
        </html>
      `;

      const metadata = extractor.extractMetadata(html, 'Test Page');

      expect(metadata.ogTitle).toBe('OG Title');
      expect(metadata.ogDescription).toBe('OG Description');
      expect(metadata.ogImage).toBe('https://example.com/image.jpg');
    });
  });

  describe('convertOgImageToRelativePath', () => {
    it('should return undefined for undefined input', () => {
      const result = extractor.convertOgImageToRelativePath(undefined);
      expect(result).toBeUndefined();
    });

    it('should return relative path as-is', () => {
      const result = extractor.convertOgImageToRelativePath('/cms-media/image.jpg');
      expect(result).toBe('/cms-media/image.jpg');
    });

    it('should extract pathname from full URL', () => {
      const result = extractor.convertOgImageToRelativePath('http://localhost:9007/cms-media/image.jpg');
      expect(result).toBe('/cms-media/image.jpg');
    });

    it('should extract pathname from HTTPS URL', () => {
      const result = extractor.convertOgImageToRelativePath('https://example.com/cms-media/image.jpg');
      expect(result).toBe('/cms-media/image.jpg');
    });

    it('should handle URL with query parameters', () => {
      // URL.pathname doesn't include query params, so we expect just the path
      const result = extractor.convertOgImageToRelativePath('https://example.com/cms-media/image.jpg?v=123');
      expect(result).toBe('/cms-media/image.jpg');
    });

    it('should extract /cms-media/ path from malformed URL', () => {
      const result = extractor.convertOgImageToRelativePath('not-a-url/cms-media/image.jpg');
      expect(result).toBe('/cms-media/image.jpg');
    });

    it('should return undefined for invalid URL without /cms-media/', () => {
      const result = extractor.convertOgImageToRelativePath('invalid-url');
      expect(result).toBeUndefined();
    });
  });

  describe('validateMetadata', () => {
    it('should return true for valid metadata', () => {
      const metadata = {
        metaTitle: 'Test Title',
        metaDescription: 'Test Description',
      };

      const isValid = extractor.validateMetadata(metadata);

      expect(isValid).toBe(true);
    });

    it('should return false when missing metaTitle', () => {
      const metadata = {
        metaDescription: 'Test Description',
      };

      const isValid = extractor.validateMetadata(metadata);

      expect(isValid).toBe(false);
    });

    it('should return false when missing metaDescription', () => {
      const metadata = {
        metaTitle: 'Test Title',
      };

      const isValid = extractor.validateMetadata(metadata);

      expect(isValid).toBe(false);
    });

    it('should return false for empty metadata', () => {
      const metadata = {};

      const isValid = extractor.validateMetadata(metadata);

      expect(isValid).toBe(false);
    });
  });

  describe('content cleaning', () => {
    it('should remove script tags from description generation', () => {
      const html = `
        <html>
          <body>
            <p>Visible content</p>
            <script>alert('hidden');</script>
          </body>
        </html>
      `;

      const metadata = extractor.extractMetadata(html, 'Test Page');

      expect(metadata.metaDescription).toBe('Visible content');
      expect(metadata.metaDescription).not.toContain('alert');
    });

    it('should remove style tags from description generation', () => {
      const html = `
        <html>
          <body>
            <p>Visible content</p>
            <style>.hidden { display: none; }</style>
          </body>
        </html>
      `;

      const metadata = extractor.extractMetadata(html, 'Test Page');

      expect(metadata.metaDescription).toBe('Visible content');
      expect(metadata.metaDescription).not.toContain('display');
    });

    it('should clean up multiple whitespaces', () => {
      const html = `
        <html>
          <body>
            <p>Text   with    multiple     spaces</p>
          </body>
        </html>
      `;

      const metadata = extractor.extractMetadata(html, 'Test Page');

      expect(metadata.metaDescription).toBe('Text with multiple spaces');
    });
  });
});
