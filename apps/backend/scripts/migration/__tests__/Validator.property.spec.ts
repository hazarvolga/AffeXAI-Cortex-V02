import * as fc from 'fast-check';
import { Validator } from '../Validator';
import { Logger, LogLevel } from '../Logger';
import { ParsedContent, ImageReference, MediaMapping } from '../types';

/**
 * Property-Based Tests for Validator
 * Feature: wordpress-cms-migration, Property 8: Validation Completeness
 * Validates: Requirements 9.1
 */

describe('Validator - Property-Based Tests', () => {
  let validator: Validator;
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger(LogLevel.NORMAL, './logs');
    validator = new Validator('http://localhost:9006/api', logger);
  });

  /**
   * Property 8: Validation Completeness
   * For any created page, all required fields (title, slug) should be non-empty strings
   */
  describe('Property 8: Validation Completeness', () => {
    it('should reject content with missing title', () => {
      fc.assert(
        fc.property(
          // Generate content with various slug values but no title
          fc.record({
            slug: fc.string({ minLength: 1, maxLength: 100 }),
            sections: fc.array(fc.record({
              type: fc.constantFrom('hero', 'features', 'stats', 'cta', 'text', 'workflow'),
              order: fc.nat(),
              content: fc.anything(),
            })),
          }),
          (data) => {
            const content: ParsedContent = {
              title: '', // Empty title
              slug: data.slug,
              sections: data.sections,
              images: [],
              videos: [],
              links: [],
              metadata: {
                filename: 'test.txt',
              },
            };

            const result = validator.validateContent(content);

            // Should be invalid
            expect(result.isValid).toBe(false);
            
            // Should have an error about title
            const titleError = result.errors.find(e => e.field === 'title');
            expect(titleError).toBeDefined();
            expect(titleError?.severity).toBe('critical');

            return !result.isValid && titleError !== undefined;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject content with missing slug', () => {
      fc.assert(
        fc.property(
          // Generate content with various title values but no slug
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 200 }),
            sections: fc.array(fc.record({
              type: fc.constantFrom('hero', 'features', 'stats', 'cta', 'text', 'workflow'),
              order: fc.nat(),
              content: fc.anything(),
            })),
          }),
          (data) => {
            const content: ParsedContent = {
              title: data.title,
              slug: '', // Empty slug
              sections: data.sections,
              images: [],
              videos: [],
              links: [],
              metadata: {
                filename: 'test.txt',
              },
            };

            const result = validator.validateContent(content);

            // Should be invalid
            expect(result.isValid).toBe(false);
            
            // Should have an error about slug
            const slugError = result.errors.find(e => e.field === 'slug');
            expect(slugError).toBeDefined();
            expect(slugError?.severity).toBe('critical');

            return !result.isValid && slugError !== undefined;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept content with valid title and slug', () => {
      fc.assert(
        fc.property(
          // Generate valid content
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
            slug: fc.array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-'.split('')), { minLength: 1, maxLength: 100 }).map(arr => arr.join('')),
            sections: fc.array(fc.record({
              type: fc.constantFrom('hero', 'features', 'stats', 'cta', 'text', 'workflow'),
              order: fc.nat(),
              content: fc.anything(),
            })),
          }),
          (data) => {
            // Ensure slug is valid format
            const validSlug = data.slug.replace(/^-+|-+$/g, '') || 'default';
            
            const content: ParsedContent = {
              title: data.title,
              slug: validSlug,
              sections: data.sections,
              images: [],
              videos: [],
              links: [],
              metadata: {
                filename: 'test.txt',
              },
            };

            const result = validator.validateContent(content);

            // Should be valid (no critical errors about title/slug)
            const hasTitleError = result.errors.some(e => e.field === 'title' && e.severity === 'critical');
            const hasSlugError = result.errors.some(e => e.field === 'slug' && e.severity === 'critical');

            return !hasTitleError && !hasSlugError;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject content with whitespace-only title', () => {
      fc.assert(
        fc.property(
          // Generate whitespace strings
          fc.array(fc.constantFrom(' ', '\t', '\n'), { minLength: 1, maxLength: 20 }).map(arr => arr.join('')),
          fc.string({ minLength: 1, maxLength: 100 }),
          (whitespace: string, slug: string) => {
            const content: ParsedContent = {
              title: whitespace, // Whitespace-only title
              slug: slug,
              sections: [],
              images: [],
              videos: [],
              links: [],
              metadata: {
                filename: 'test.txt',
              },
            };

            const result = validator.validateContent(content);

            // Should be invalid
            expect(result.isValid).toBe(false);
            
            // Should have an error about title
            const titleError = result.errors.find(e => e.field === 'title');
            expect(titleError).toBeDefined();

            return !result.isValid && titleError !== undefined;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject content with whitespace-only slug', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }),
          // Generate whitespace strings
          fc.array(fc.constantFrom(' ', '\t', '\n'), { minLength: 1, maxLength: 20 }).map(arr => arr.join('')),
          (title: string, whitespace: string) => {
            const content: ParsedContent = {
              title: title,
              slug: whitespace, // Whitespace-only slug
              sections: [],
              images: [],
              videos: [],
              links: [],
              metadata: {
                filename: 'test.txt',
              },
            };

            const result = validator.validateContent(content);

            // Should be invalid
            expect(result.isValid).toBe(false);
            
            // Should have an error about slug
            const slugError = result.errors.find(e => e.field === 'slug');
            expect(slugError).toBeDefined();

            return !result.isValid && slugError !== undefined;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate slug format (lowercase, hyphens, no spaces)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }),
          // Generate slugs with invalid characters
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => {
            // Only test strings that have invalid characters
            return s.length > 0 && !/^[a-z0-9-]+$/.test(s);
          }),
          (title, invalidSlug) => {
            const content: ParsedContent = {
              title: title,
              slug: invalidSlug,
              sections: [],
              images: [],
              videos: [],
              links: [],
              metadata: {
                filename: 'test.txt',
              },
            };

            const result = validator.validateContent(content);

            // Should have an error about slug format
            const slugError = result.errors.find(e => 
              e.field === 'slug' && 
              e.message.includes('lowercase')
            );

            return slugError !== undefined;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate that all required fields are non-empty strings', () => {
      fc.assert(
        fc.property(
          // Generate various combinations of title and slug
          fc.record({
            title: fc.oneof(
              fc.constant(''),
              fc.constant(null as any),
              fc.constant(undefined as any),
              fc.string({ minLength: 1, maxLength: 200 }),
            ),
            slug: fc.oneof(
              fc.constant(''),
              fc.constant(null as any),
              fc.constant(undefined as any),
              fc.string({ minLength: 1, maxLength: 100 }),
            ),
          }),
          (data) => {
            const content: ParsedContent = {
              title: data.title || '',
              slug: data.slug || '',
              sections: [],
              images: [],
              videos: [],
              links: [],
              metadata: {
                filename: 'test.txt',
              },
            };

            const result = validator.validateContent(content);

            // If title or slug is empty/null/undefined, should be invalid
            const titleIsEmpty = !data.title || data.title.trim().length === 0;
            const slugIsEmpty = !data.slug || data.slug.trim().length === 0;

            if (titleIsEmpty || slugIsEmpty) {
              expect(result.isValid).toBe(false);
              
              if (titleIsEmpty) {
                const titleError = result.errors.find(e => e.field === 'title');
                expect(titleError).toBeDefined();
              }
              
              if (slugIsEmpty) {
                const slugError = result.errors.find(e => e.field === 'slug');
                expect(slugError).toBeDefined();
              }
              
              return !result.isValid;
            }

            // If both are valid, might still have other errors (like slug format)
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional property: Image validation completeness
   */
  describe('Image Validation Completeness', () => {
    it('should detect broken image references (not in media mapping)', () => {
      fc.assert(
        fc.property(
          // Generate random images
          fc.array(
            fc.record({
              originalUrl: fc.webUrl(),
              altText: fc.string(),
              context: fc.string(),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (images) => {
            // Create empty media mapping (all images will be "broken")
            const mediaMapping: MediaMapping = {};

            const result = validator.checkBrokenImages(images, mediaMapping);

            // Should have warnings for each image
            expect(result.warnings.length).toBeGreaterThan(0);
            
            // Each image should have a warning
            return result.warnings.length >= images.length;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should not report errors for images in media mapping', () => {
      fc.assert(
        fc.property(
          // Generate random images
          fc.array(
            fc.record({
              originalUrl: fc.webUrl(),
              altText: fc.string(),
              context: fc.string(),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (images) => {
            // Create media mapping with all images
            const mediaMapping: MediaMapping = {};
            images.forEach(img => {
              mediaMapping[img.originalUrl] = `https://cms.example.com/media/${Math.random()}`;
            });

            const result = validator.checkBrokenImages(images, mediaMapping);

            // Should not have warnings about missing images
            const missingImageWarnings = result.warnings.filter(w => 
              w.message.includes('not found in media mapping')
            );
            
            return missingImageWarnings.length === 0;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should reject images with empty URLs', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              altText: fc.string(),
              context: fc.string(),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (imageData) => {
            // Create images with empty URLs
            const images: ImageReference[] = imageData.map(data => ({
              originalUrl: '', // Empty URL
              altText: data.altText,
              context: data.context,
            }));

            const mediaMapping: MediaMapping = {};
            const result = validator.checkBrokenImages(images, mediaMapping);

            // Should have errors for empty URLs
            expect(result.errors.length).toBeGreaterThan(0);
            
            const emptyUrlErrors = result.errors.filter(e => 
              e.field === 'image.originalUrl' && 
              e.message.includes('empty')
            );
            
            return emptyUrlErrors.length === images.length;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
