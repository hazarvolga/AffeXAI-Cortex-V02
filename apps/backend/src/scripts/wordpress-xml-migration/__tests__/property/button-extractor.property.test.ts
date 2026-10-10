/**
 * Property-Based Tests for ButtonExtractor
 * 
 * **Feature: wordpress-cms-migration, Property 7: Button Text Extraction**
 * **Validates: Requirements 6.1, 6.3**
 */

import * as fc from 'fast-check';
import { ButtonExtractor } from '../../extractors/button-extractor';

// Generator for non-placeholder button text
const buttonTextArbitrary = fc.string({ minLength: 3, maxLength: 30 })
  .map(s => s.trim().replace(/[<>"'&]/g, ''))
  .filter(s => {
    const lower = s.toLowerCase();
    return s.length >= 3 &&
           !lower.includes('primary button') &&
           !lower.includes('secondary button') &&
           !lower.includes('click here') &&
           !lower.includes('read more') &&
           lower !== 'button';
  });

// Generator for href
const hrefArbitrary = fc.oneof(
  fc.constant('#'),
  fc.constant('/page'),
  fc.constant('/contact'),
  fc.string({ minLength: 1, maxLength: 15 })
    .map(s => `/${s.replace(/[^a-zA-Z0-9-]/g, '-')}`)
);

describe('ButtonExtractor Property Tests', () => {
  let extractor: ButtonExtractor;

  beforeEach(() => {
    extractor = new ButtonExtractor();
  });

  /**
   * Property 7: Button Text Extraction
   * Non-placeholder button text should be extracted correctly
   */
  it('Property 7: non-placeholder button text should be extracted correctly', () => {
    fc.assert(
      fc.property(
        buttonTextArbitrary,
        hrefArbitrary,
        (text, href) => {
          const html = `<a href="${href}" class="button">${text}</a>`;
          const buttons = extractor.extractButtons(html);
          
          expect(buttons.length).toBe(1);
          expect(buttons[0].text).toBe(text);
          expect(buttons[0].href).toBe(href);
          expect(buttons[0].isPlaceholder).toBe(false);
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Placeholder texts are always detected
   */
  it('placeholder texts should always be detected', () => {
    const placeholders = [
      'Primary Button',
      'Secondary Button', 
      'Click Here',
      'Read More',
      'Button'
    ];

    for (const placeholder of placeholders) {
      const html = `<a href="/page" class="button">${placeholder}</a>`;
      const buttons = extractor.extractButtons(html);
      
      expect(buttons.length).toBe(1);
      expect(buttons[0].isPlaceholder).toBe(true);
    }
  });

  /**
   * Property: All extracted buttons pass validation
   */
  it('all extracted buttons should pass validation', () => {
    fc.assert(
      fc.property(
        buttonTextArbitrary,
        hrefArbitrary,
        (text, href) => {
          const html = `<a href="${href}" class="button">${text}</a>`;
          const buttons = extractor.extractButtons(html);
          
          for (const button of buttons) {
            expect(extractor.validateButton(button)).toBe(true);
          }
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Empty text buttons are skipped
   */
  it('buttons with empty text should be skipped', () => {
    const emptyTexts = ['', '   ', '\t', '\n'];
    
    for (const emptyText of emptyTexts) {
      const html = `<a href="/page" class="button">${emptyText}</a>`;
      const buttons = extractor.extractButtons(html);
      expect(buttons.length).toBe(0);
    }
  });

  /**
   * Property: Missing href defaults to #
   */
  it('missing href should default to #', () => {
    fc.assert(
      fc.property(
        buttonTextArbitrary,
        (text) => {
          const html = `<a class="button">${text}</a>`;
          const buttons = extractor.extractButtons(html);
          
          if (buttons.length === 1) {
            expect(buttons[0].href).toBe('#');
          }
          return true;
        }
      ),
      { numRuns: 30 }
    );
  });
});
