#!/usr/bin/env ts-node

/**
 * Simple test runner for Validator property tests
 * Runs tests directly without Jest to avoid configuration conflicts
 */

import * as fc from 'fast-check';
import { Validator } from './Validator';
import { Logger, LogLevel } from './Logger';
import { ParsedContent, ImageReference, MediaMapping } from './types';

console.log('🧪 Running Validator Property Tests...\n');

const logger = new Logger(LogLevel.QUIET);
const validator = new Validator('http://localhost:9006/api', logger);

let passedTests = 0;
let failedTests = 0;

function runTest(name: string, testFn: () => void) {
  try {
    console.log(`  Testing: ${name}`);
    testFn();
    console.log(`  ✓ PASSED\n`);
    passedTests++;
  } catch (error) {
    console.log(`  ✗ FAILED: ${error instanceof Error ? error.message : String(error)}\n`);
    failedTests++;
  }
}

// Test 1: Should reject content with missing title
runTest('Property 8.1: Reject content with missing title', () => {
  fc.assert(
    fc.property(
      fc.record({
        slug: fc.string({ minLength: 1, maxLength: 100 }),
      }),
      (data) => {
        const content: ParsedContent = {
          title: '',
          slug: data.slug,
          sections: [],
          images: [],
          videos: [],
          links: [],
          metadata: { filename: 'test.txt' },
        };

        const result = validator.validateContent(content);
        const titleError = result.errors.find(e => e.field === 'title');
        
        if (result.isValid || !titleError) {
          throw new Error('Should reject empty title');
        }
        return true;
      }
    ),
    { numRuns: 50 }
  );
});

// Test 2: Should reject content with missing slug
runTest('Property 8.2: Reject content with missing slug', () => {
  fc.assert(
    fc.property(
      fc.record({
        title: fc.string({ minLength: 1, maxLength: 200 }),
      }),
      (data) => {
        const content: ParsedContent = {
          title: data.title,
          slug: '',
          sections: [],
          images: [],
          videos: [],
          links: [],
          metadata: { filename: 'test.txt' },
        };

        const result = validator.validateContent(content);
        const slugError = result.errors.find(e => e.field === 'slug');
        
        if (result.isValid || !slugError) {
          throw new Error('Should reject empty slug');
        }
        return true;
      }
    ),
    { numRuns: 50 }
  );
});

// Test 3: Should accept content with valid title and slug
runTest('Property 8.3: Accept content with valid title and slug', () => {
  fc.assert(
    fc.property(
      fc.record({
        title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
        slug: fc.array(
          fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-'.split('')),
          { minLength: 5, maxLength: 50 }
        ).map(arr => arr.join('')),
      }),
      (data) => {
        const validSlug = data.slug.replace(/^-+|-+$/g, '') || 'default';
        
        const content: ParsedContent = {
          title: data.title,
          slug: validSlug,
          sections: [],
          images: [],
          videos: [],
          links: [],
          metadata: { filename: 'test.txt' },
        };

        const result = validator.validateContent(content);
        
        // Should not have critical errors about title/slug
        const hasTitleError = result.errors.some(e => e.field === 'title' && e.severity === 'critical');
        const hasSlugError = result.errors.some(e => e.field === 'slug' && e.severity === 'critical');
        
        if (hasTitleError || hasSlugError) {
          throw new Error('Should accept valid title and slug');
        }
        return true;
      }
    ),
    { numRuns: 50 }
  );
});

// Test 4: Should reject whitespace-only title
runTest('Property 8.4: Reject whitespace-only title', () => {
  fc.assert(
    fc.property(
      fc.array(fc.constantFrom(' ', '\t', '\n'), { minLength: 1, maxLength: 10 }).map(arr => arr.join('')),
      fc.string({ minLength: 1, maxLength: 100 }),
      (whitespace: string, slug: string) => {
        const content: ParsedContent = {
          title: whitespace,
          slug: slug,
          sections: [],
          images: [],
          videos: [],
          links: [],
          metadata: { filename: 'test.txt' },
        };

        const result = validator.validateContent(content);
        const titleError = result.errors.find(e => e.field === 'title');
        
        if (result.isValid || !titleError) {
          throw new Error('Should reject whitespace-only title');
        }
        return true;
      }
    ),
    { numRuns: 50 }
  );
});

// Test 5: Should validate slug format
runTest('Property 8.5: Validate slug format (lowercase, hyphens only)', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 1, maxLength: 200 }),
      fc.string({ minLength: 1, maxLength: 100 }).filter(s => {
        return s.length > 0 && !/^[a-z0-9-]+$/.test(s);
      }),
      (title: string, invalidSlug: string) => {
        const content: ParsedContent = {
          title: title,
          slug: invalidSlug,
          sections: [],
          images: [],
          videos: [],
          links: [],
          metadata: { filename: 'test.txt' },
        };

        const result = validator.validateContent(content);
        const slugError = result.errors.find(e => 
          e.field === 'slug' && e.message.includes('lowercase')
        );
        
        if (!slugError) {
          throw new Error('Should reject invalid slug format');
        }
        return true;
      }
    ),
    { numRuns: 50 }
  );
});

// Test 6: Image validation - detect broken references
runTest('Property 8.6: Detect broken image references', () => {
  fc.assert(
    fc.property(
      fc.array(
        fc.record({
          originalUrl: fc.webUrl(),
          altText: fc.string(),
          context: fc.string(),
        }),
        { minLength: 1, maxLength: 5 }
      ),
      (images) => {
        const mediaMapping: MediaMapping = {};
        const result = validator.checkBrokenImages(images, mediaMapping);
        
        if (result.warnings.length === 0) {
          throw new Error('Should detect broken image references');
        }
        return true;
      }
    ),
    { numRuns: 30 }
  );
});

// Test 7: Image validation - accept mapped images
runTest('Property 8.7: Accept images in media mapping', () => {
  fc.assert(
    fc.property(
      fc.array(
        fc.record({
          originalUrl: fc.webUrl(),
          altText: fc.string(),
          context: fc.string(),
        }),
        { minLength: 1, maxLength: 5 }
      ),
      (images) => {
        const mediaMapping: MediaMapping = {};
        images.forEach(img => {
          mediaMapping[img.originalUrl] = `https://cms.example.com/media/${Math.random()}`;
        });
        
        const result = validator.checkBrokenImages(images, mediaMapping);
        const missingWarnings = result.warnings.filter(w => 
          w.message.includes('not found in media mapping')
        );
        
        if (missingWarnings.length > 0) {
          throw new Error('Should not warn about mapped images');
        }
        return true;
      }
    ),
    { numRuns: 30 }
  );
});

// Test 8: Reject images with empty URLs
runTest('Property 8.8: Reject images with empty URLs', () => {
  fc.assert(
    fc.property(
      fc.array(
        fc.record({
          altText: fc.string(),
          context: fc.string(),
        }),
        { minLength: 1, maxLength: 3 }
      ),
      (imageData) => {
        const images: ImageReference[] = imageData.map(data => ({
          originalUrl: '',
          altText: data.altText,
          context: data.context,
        }));

        const mediaMapping: MediaMapping = {};
        const result = validator.checkBrokenImages(images, mediaMapping);
        
        const emptyUrlErrors = result.errors.filter(e => 
          e.field === 'image.originalUrl' && e.message.includes('empty')
        );
        
        if (emptyUrlErrors.length !== images.length) {
          throw new Error('Should reject all images with empty URLs');
        }
        return true;
      }
    ),
    { numRuns: 30 }
  );
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 Test Summary:');
console.log(`  Total: ${passedTests + failedTests}`);
console.log(`  ✓ Passed: ${passedTests}`);
console.log(`  ✗ Failed: ${failedTests}`);
console.log('='.repeat(60));

if (failedTests > 0) {
  console.log('\n❌ Some tests failed!');
  process.exit(1);
} else {
  console.log('\n✅ All property tests passed!');
  process.exit(0);
}
