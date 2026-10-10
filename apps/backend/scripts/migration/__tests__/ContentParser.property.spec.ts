import * as fc from 'fast-check';
import { ContentParser } from '../ContentParser';

/**
 * Property-Based Tests for ContentParser
 * Feature: wordpress-cms-migration, Property 1: Content Preservation
 * Validates: Requirements 1.1, 6.2
 */

describe('ContentParser - Property-Based Tests', () => {
  const parser = new ContentParser();

  /**
   * Property 1: Content Preservation
   * For any WordPress HTML file, parsing should preserve all text content without loss
   */
  describe('Property 1: Content Preservation', () => {
    it('should preserve all text content when parsing HTML', () => {
      fc.assert(
        fc.property(
          // Generate random HTML-like content with text
          fc.record({
            title: fc.string({ minLength: 5, maxLength: 100 }),
            paragraphs: fc.array(fc.string({ minLength: 20, maxLength: 500 }), { minLength: 1, maxLength: 10 }),
            headings: fc.array(fc.string({ minLength: 5, maxLength: 100 }), { minLength: 0, maxLength: 5 }),
          }),
          (data) => {
            // Build HTML content
            const htmlContent = `
              <h1>${escapeHtml(data.title)}</h1>
              ${data.headings.map(h => `<h2>${escapeHtml(h)}</h2>`).join('\n')}
              ${data.paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('\n')}
            `;
            
            // Parse the content
            const parsed = parser.parse(htmlContent, 'test-file.txt');
            
            // Extract all text from parsed sections
            const parsedText = extractAllText(parsed);
            
            // Extract all text from original HTML (normalize whitespace)
            const originalText = normalizeText(
              data.title + ' ' + 
              data.headings.join(' ') + ' ' + 
              data.paragraphs.join(' ')
            );
            
            // Check that all original text is present in parsed content
            // We normalize both to handle whitespace differences
            const normalizedParsed = normalizeText(parsedText);
            
            // The parsed text should contain all the original text
            // (it may have additional structure, but no content should be lost)
            return originalText.split(/\s+/).every(word => {
              if (word.length === 0) return true;
              return normalizedParsed.includes(word);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve text content from real WordPress HTML structure', () => {
      fc.assert(
        fc.property(
          fc.record({
            heroTitle: fc.string({ minLength: 10, maxLength: 100 }),
            heroSubtitle: fc.string({ minLength: 20, maxLength: 200 }),
            featureTitle: fc.string({ minLength: 10, maxLength: 50 }),
            featureDescription: fc.string({ minLength: 20, maxLength: 200 }),
            bodyText: fc.string({ minLength: 50, maxLength: 500 }),
          }),
          (data) => {
            // Build WordPress-like HTML structure
            const htmlContent = `
              Title: ${escapeHtml(data.heroTitle)}
              
              <h2>${escapeHtml(data.heroTitle)}</h2>
              <h2>${escapeHtml(data.heroSubtitle)}</h2>
              
              <figure>
                <img src="test.jpg" alt="test" />
              </figure>
              <h3>${escapeHtml(data.featureTitle)}</h3>
              <p>${escapeHtml(data.featureDescription)}</p>
              
              <p>${escapeHtml(data.bodyText)}</p>
            `;
            
            // Parse the content
            const parsed = parser.parse(htmlContent, 'test-file.txt');
            
            // Extract all text from parsed content
            const parsedText = extractAllText(parsed);
            const normalizedParsed = normalizeText(parsedText);
            
            // Check that all key content is preserved
            const allOriginalText = [
              data.heroTitle,
              data.heroSubtitle,
              data.featureTitle,
              data.featureDescription,
              data.bodyText,
            ];
            
            return allOriginalText.every(text => {
              const normalized = normalizeText(text);
              return normalized.split(/\s+/).every(word => {
                if (word.length === 0) return true;
                return normalizedParsed.includes(word);
              });
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve special characters and Turkish text', () => {
      fc.assert(
        fc.property(
          fc.record({
            turkishText: fc.constantFrom(
              'Mimari tasarım için BIM çözümleri',
              'Yapı mühendisliği uygulamaları',
              'İnşaat planlaması ve yönetimi',
              'Şantiye koordinasyonu',
              'Çelik imalatı detayları'
            ),
            content: fc.string({ minLength: 20, maxLength: 200 }),
          }),
          (data) => {
            const htmlContent = `
              <h2>${escapeHtml(data.turkishText)}</h2>
              <p>${escapeHtml(data.content)}</p>
            `;
            
            const parsed = parser.parse(htmlContent, 'test-file.txt');
            const parsedText = extractAllText(parsed);
            
            // Turkish characters should be preserved
            const turkishChars = ['ı', 'ğ', 'ü', 'ş', 'ö', 'ç', 'İ', 'Ğ', 'Ü', 'Ş', 'Ö', 'Ç'];
            const originalHasTurkish = turkishChars.some(char => data.turkishText.includes(char));
            
            if (originalHasTurkish) {
              return turkishChars.some(char => parsedText.includes(char));
            }
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});

/**
 * Helper function to escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Helper function to extract all text from parsed content
 */
function extractAllText(parsed: any): string {
  let text = parsed.title + ' ';
  
  for (const section of parsed.sections) {
    if (section.content) {
      text += JSON.stringify(section.content) + ' ';
    }
  }
  
  return text;
}

/**
 * Helper function to normalize text for comparison
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\sığüşöçİĞÜŞÖÇ]/g, '')
    .trim();
}
