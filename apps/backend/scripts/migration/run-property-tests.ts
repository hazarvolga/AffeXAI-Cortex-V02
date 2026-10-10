#!/usr/bin/env tsx
/**
 * Property-Based Test Runner for ContentParser
 * Run with: tsx scripts/migration/run-property-tests.ts
 */

import * as fc from 'fast-check';
import { ContentParser } from './ContentParser';

const parser = new ContentParser();

console.log('Running Property-Based Tests for ContentParser...\n');

/**
 * Property 1: Content Preservation
 * For any WordPress HTML file, parsing should preserve all text content without loss
 * Feature: wordpress-cms-migration, Property 1: Content Preservation
 * Validates: Requirements 1.1, 6.2
 */
console.log('Property 1: Content Preservation');
console.log('Testing that all text content is preserved when parsing HTML...\n');

try {
  // Test 1: Basic HTML content preservation
  // Use alphanumeric strings for more realistic content
  const wordGen = fc.string({ minLength: 3, maxLength: 20, unit: fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')) });
  const sentenceGen = fc.array(wordGen, { minLength: 10, maxLength: 30 }).map(words => words.join(' '));
  
  fc.assert(
    fc.property(
      fc.record({
        title: wordGen,
        paragraphs: fc.array(sentenceGen, { minLength: 1, maxLength: 5 }),
        headings: fc.array(wordGen, { minLength: 0, maxLength: 3 }),
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
        const normalizedParsed = normalizeText(parsedText);
        
        // The parsed text should contain all the original text
        return originalText.split(/\s+/).every(word => {
          if (word.length === 0) return true;
          return normalizedParsed.includes(word);
        });
      }
    ),
    { numRuns: 100 }
  );
  console.log('✓ Test 1 passed: Basic HTML content preservation (100 runs)');
} catch (error: any) {
  console.error('✗ Test 1 failed:', error.message);
  process.exit(1);
}

try {
  // Test 2: WordPress-like HTML structure
  const wordGen2 = fc.string({ minLength: 3, maxLength: 15, unit: fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')) });
  
  fc.assert(
    fc.property(
      fc.record({
        heroTitle: fc.array(wordGen2, { minLength: 2, maxLength: 10 }).map(w => w.join(' ')),
        heroSubtitle: fc.array(wordGen2, { minLength: 3, maxLength: 15 }).map(w => w.join(' ')),
        featureTitle: fc.array(wordGen2, { minLength: 2, maxLength: 5 }).map(w => w.join(' ')),
        featureDescription: fc.array(wordGen2, { minLength: 3, maxLength: 15 }).map(w => w.join(' ')),
        bodyText: fc.array(wordGen2, { minLength: 10, maxLength: 30 }).map(w => w.join(' ')),
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
  console.log('✓ Test 2 passed: WordPress-like HTML structure (100 runs)');
} catch (error: any) {
  console.error('✗ Test 2 failed:', error.message);
  process.exit(1);
}

try {
  // Test 3: Turkish text and special characters
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
  console.log('✓ Test 3 passed: Turkish text and special characters (50 runs)');
} catch (error: any) {
  console.error('✗ Test 3 failed:', error.message);
  process.exit(1);
}

console.log('\n✓ All property tests passed!');
console.log('Property 1: Content Preservation - VALIDATED');

// Helper functions
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function extractAllText(parsed: any): string {
  let text = parsed.title + ' ';
  
  for (const section of parsed.sections) {
    if (section.content) {
      text += JSON.stringify(section.content) + ' ';
    }
  }
  
  return text;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\sığüşöçİĞÜŞÖÇ0-9]/g, ' ') // Replace special chars with space instead of removing
    .replace(/\s+/g, ' ') // Normalize whitespace again
    .trim();
}
