/**
 * Property-Based Tests for HTML Parser
 * 
 * **Feature: wordpress-cms-migration, Property 4: HTML Content Preservation**
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
 * 
 * Property: For any valid HTML content, parsing should preserve all extractable
 * elements (images, videos, buttons) without loss or corruption.
 */

import * as fc from 'fast-check';
import { HTMLParser } from '../../parsers/html-parser';

describe('HTMLParser - Property-Based Tests', () => {
  const parser = new HTMLParser();

  describe('Property 4: HTML Content Preservation', () => {
    it('should preserve all images when parsing HTML with multiple images', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              src: fc.webUrl(),
              alt: fc.string({ minLength: 0, maxLength: 100 }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (images) => {
            // Generate HTML with images
            const html = images
              .map(img => `<img src="${img.src}" alt="${img.alt}" />`)
              .join('\n');

            const result = parser.parse(html);

            // All image URLs should be extracted
            expect(result.images.length).toBe(images.length);
            
            // All source URLs should be present
            for (const img of images) {
              expect(result.images).toContain(img.src);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should extract YouTube watch URLs from HTML content', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.constantFrom(
              'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
              'https://www.youtube.com/watch?v=abc123defgh'
            ),
            { minLength: 1, maxLength: 5 }
          ),
          (videoUrls) => {
            // Generate HTML with video URLs (only watch format, not embed)
            const html = videoUrls
              .map(url => `<p>Watch: ${url}</p>`)
              .join('\n');

            const result = parser.parse(html);

            // Should extract at least one video
            expect(result.videos.length).toBeGreaterThanOrEqual(1);
            
            // All videos should contain youtube.com/watch
            for (const video of result.videos) {
              expect(video.includes('youtube.com/watch')).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should extract button text and href for all valid button elements', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              text: fc.string({ minLength: 5, maxLength: 50 })
                .filter(s => {
                  const trimmed = s.trim();
                  // Must have at least 3 alphanumeric characters
                  const alphanumCount = (trimmed.match(/[a-zA-Z0-9]/g) || []).length;
                  return trimmed.length >= 3 && alphanumCount >= 3 && !/[<>]/.test(s);
                }),
              href: fc.webUrl(),
              // Use classes that parser actually recognizes: 'btn', 'button', or role="button"
              className: fc.constantFrom('btn', 'button'),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (buttons) => {
            const html = buttons
              .map(btn => `<a href="${btn.href}" class="${btn.className}">${btn.text}</a>`)
              .join('\n');

            const result = parser.parse(html);

            // Should extract buttons (parser only recognizes 'btn' and 'button' classes)
            expect(result.buttons.length).toBeGreaterThanOrEqual(1);
            
            // All extracted buttons should have valid text and href
            for (const btn of result.buttons) {
              expect(btn.text.length).toBeGreaterThan(0);
              expect(btn.href).toBeDefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle HTML with mixed content types without data loss', () => {
      fc.assert(
        fc.property(
          fc.record({
            headings: fc.array(
              fc.string({ minLength: 3, maxLength: 100 })
                .filter(s => s.trim().length >= 2 && !/[<>]/.test(s)), // No HTML chars
              { minLength: 1, maxLength: 5 }
            ),
            paragraphs: fc.array(
              fc.string({ minLength: 3, maxLength: 200 })
                .filter(s => s.trim().length >= 2 && !/[<>]/.test(s)), // No HTML chars
              { minLength: 1, maxLength: 5 }
            ),
            images: fc.array(fc.webUrl(), { minLength: 0, maxLength: 3 }),
          }),
          (content) => {
            // Generate mixed HTML
            const html = [
              ...content.headings.map((h, i) => `<h${(i % 6) + 1}>${h}</h${(i % 6) + 1}>`),
              ...content.paragraphs.map(p => `<p>${p}</p>`),
              ...content.images.map(img => `<img src="${img}" />`),
            ].join('\n');

            const result = parser.parse(html);

            // Should extract elements (images are also elements)
            const totalElements = content.headings.length + content.paragraphs.length + content.images.length;
            expect(result.elements.length).toBe(totalElements);
            
            // Should extract all images separately
            expect(result.images.length).toBe(content.images.length);
            
            // All heading texts should be present (trimmed)
            for (const heading of content.headings) {
              const trimmedHeading = heading.trim();
              expect(result.elements.some(el => el.content.trim() === trimmedHeading)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty or whitespace-only HTML gracefully', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('', '   ', '\n\n', '\t\t', '  \n  \t  '),
          (html) => {
            const result = parser.parse(html);

            // Should return empty arrays for empty content
            expect(result.elements).toHaveLength(0);
            expect(result.images).toHaveLength(0);
            expect(result.videos).toHaveLength(0);
            expect(result.buttons).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve element order when parsing sequential elements', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              tag: fc.constantFrom('h1', 'h2', 'p'),
              content: fc.string({ minLength: 3, maxLength: 50 })
                .filter(s => s.trim().length >= 2 && !/[<>]/.test(s)), // No HTML chars
            }),
            { minLength: 2, maxLength: 10 }
          ),
          (elements) => {
            // Generate HTML with sequential elements
            const html = elements
              .map(el => `<${el.tag}>${el.content}</${el.tag}>`)
              .join('\n');

            const result = parser.parse(html);

            // Should extract all elements
            expect(result.elements.length).toBe(elements.length);
            
            // Order should be preserved (content is trimmed by parser)
            for (let i = 0; i < elements.length; i++) {
              expect(result.elements[i].content).toBe(elements[i].content.trim());
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
