/**
 * Property-Based Tests for SEOMetadataExtractor
 * 
 * **Feature: wordpress-cms-migration, Property 9: SEO Metadata Completeness**
 * **Validates: Requirements 8.1, 8.2, 8.5**
 */

import * as fc from 'fast-check';
import { SEOMetadataExtractor } from '../../extractors/seo-metadata-extractor';

// Generator for HTML with meta tags
const htmlWithMetaArbitrary = fc.record({
  hasTitle: fc.boolean(),
  hasMetaDesc: fc.boolean(),
  title: fc.string({ minLength: 3, maxLength: 50 }).map(s => s.replace(/[<>"]/g, '')),
  description: fc.string({ minLength: 10, maxLength: 100 }).map(s => s.replace(/[<>"]/g, '')),
  content: fc.string({ minLength: 20, maxLength: 200 }).map(s => s.replace(/[<>"]/g, '')),
}).map(({ hasTitle, hasMetaDesc, title, description, content }) => {
  let html = '<html><head>';
  if (hasTitle) html += `<title>${title}</title>`;
  if (hasMetaDesc) html += `<meta name="description" content="${description}">`;
  html += `</head><body><p>${content}</p></body></html>`;
  return { html, pageTitle: title || 'Default Title' };
});

describe('SEOMetadataExtractor Property Tests', () => {
  let extractor: SEOMetadataExtractor;

  beforeEach(() => {
    extractor = new SEOMetadataExtractor();
  });

  /**
   * Property 9: SEO Metadata Completeness
   * All pages should have metaTitle and metaDescription
   */
  it('Property 9: all pages should have metaTitle and metaDescription', () => {
    fc.assert(
      fc.property(
        htmlWithMetaArbitrary,
        ({ html, pageTitle }) => {
          const metadata = extractor.extractMetadata(html, pageTitle);
          
          expect(metadata.metaTitle).toBeDefined();
          expect(metadata.metaTitle.length).toBeGreaterThan(0);
          expect(metadata.metaDescription).toBeDefined();
          expect(metadata.metaDescription.length).toBeGreaterThan(0);
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: metaTitle is never empty
   */
  it('metaTitle should never be empty string', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 200 }),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        (html, pageTitle) => {
          const metadata = extractor.extractMetadata(html, pageTitle);
          expect(metadata.metaTitle).not.toBe('');
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Generated descriptions are within length limit
   */
  it('generated descriptions should be <= 163 chars', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 200, maxLength: 500 }).map(s => s.replace(/[<>"]/g, '')),
        fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
        (content, pageTitle) => {
          const html = `<html><body><p>${content}</p></body></html>`;
          const metadata = extractor.extractMetadata(html, pageTitle);
          
          if (metadata.metaDescription) {
            expect(metadata.metaDescription.length).toBeLessThanOrEqual(163);
          }
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
