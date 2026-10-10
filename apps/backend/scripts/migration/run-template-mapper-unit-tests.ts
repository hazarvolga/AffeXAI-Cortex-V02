#!/usr/bin/env tsx
/**
 * Unit Test Runner for TemplateMapper
 * Run with: tsx scripts/migration/run-template-mapper-unit-tests.ts
 * 
 * Validates: Requirements 4.2, 4.3, 4.5
 */

import { TemplateMapper } from './TemplateMapper';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

console.log('Running Unit Tests for TemplateMapper...\n');

// Create a temporary mapping file for testing
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'template-mapper-unit-test-'));
const tempMappingFile = path.join(tempDir, 'PAGE_MAPPING_REPORT.md');

// Create a comprehensive mapping file
const mappingContent = `
# Extracted Pages - CMS Şablon Eşleştirme Raporu

### 4. ENDÜSTRİ ÇÖZÜM SAYFALARI (Industry Solutions)

| Dosya Adı | Boyut | Önerilen CMS Şablonu | Öncelik |
|-----------|-------|---------------------|---------|
| \`2024-ARCHITECTURE.txt\` | 49KB | **Industry Solution** | Yüksek |
| \`2024-Civil-Engineering-Endüstri-Çözümleri.txt\` | 26KB | **Industry Solution** | Yüksek |
| \`2024-Structural-Engineering.txt\` | 47KB | **Industry Solution** | Yüksek |
| \`2024-Bridge-Design.txt\` | 11KB | **Industry Solution** | Yüksek |
| \`2024-Road-and-Rail-Design.txt\` | 32KB | **Industry Solution** | Yüksek |
| \`2024-Site-Planning.txt\` | 34KB | **Industry Solution** | Yüksek |
| \`2024-Steel-Detailing-Fabrication.txt\` | 6KB | **Industry Solution** | Orta |

### 2. ÜRÜN SAYFALARI (Product Pages)

| Dosya Adı | Boyut | Önerilen CMS Şablonu | Öncelik |
|-----------|-------|---------------------|---------|
| \`Product-ALLPLAN-2025.txt\` | 19KB | **Product Landing Page** | Yüksek |
| \`Product-ALLPLAN-Civil.txt\` | 34KB | **Product Landing Page** | Yüksek |
| \`Product-ALLPLAN-Cloud-Services.txt\` | 12KB | **Product Landing Page** | Yüksek |

### 3. EDİSYON/PAKET SAYFALARI (Editions)

| Dosya Adı | Boyut | Önerilen CMS Şablonu | Öncelik |
|-----------|-------|---------------------|---------|
| \`Editions-ALLPLAN-Basic-2025.txt\` | 14KB | **Pricing Page** | Yüksek |
| \`Editions-ALLPLAN-Professional-2025.txt\` | 28KB | **Pricing Page** | Yüksek |

### 1. ANA SAYFA (Homepage)

| Dosya Adı | Boyut | Önerilen CMS Şablonu | Öncelik |
|-----------|-------|---------------------|---------|
| \`2024-Ana-Sayfa.txt\` | 15KB | **Corporate Homepage** | Yüksek |
| \`2025-Ana-Sayfa.txt\` | 14KB | **Corporate Homepage** | Yüksek |
`;

fs.writeFileSync(tempMappingFile, mappingContent);
const mapper = new TemplateMapper(tempMappingFile);

let passedTests = 0;
let failedTests = 0;

function test(description: string, testFn: () => void) {
  try {
    testFn();
    console.log(`✓ ${description}`);
    passedTests++;
  } catch (error: any) {
    console.error(`✗ ${description}`);
    console.error(`  Error: ${error.message}`);
    failedTests++;
  }
}

function expect(actual: any) {
  return {
    toBe(expected: any) {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}`);
      }
    },
    toContain(expected: any) {
      if (!actual.includes(expected)) {
        throw new Error(`Expected ${actual} to contain ${expected}`);
      }
    },
    toBeGreaterThan(expected: number) {
      if (actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    },
    toBeDefined() {
      if (actual === undefined || actual === null) {
        throw new Error(`Expected value to be defined, got ${actual}`);
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new Error(`Expected value to be truthy, got ${actual}`);
      }
    }
  };
}

// Test Suite 1: Industry Solution page mapping
console.log('Test Suite: Industry Solution page mapping\n');

test('should map 2024-ARCHITECTURE.txt to Industry Solution template', () => {
  const mapping = mapper.getTemplateForPage('2024-ARCHITECTURE.txt');
  expect(mapping.templateId).toBe('industry-solution');
  expect(mapping.templateName).toBe('Industry Solution');
  expect(mapping.priority).toBe('high');
});

test('should map 2024-Steel-Detailing-Fabrication.txt with medium priority', () => {
  const mapping = mapper.getTemplateForPage('2024-Steel-Detailing-Fabrication.txt');
  expect(mapping.templateId).toBe('industry-solution');
  expect(mapping.priority).toBe('medium');
});

test('should map all 7 Industry Solution pages correctly', () => {
  const pages = [
    '2024-ARCHITECTURE.txt',
    '2024-Civil-Engineering-Endüstri-Çözümleri.txt',
    '2024-Structural-Engineering.txt',
    '2024-Bridge-Design.txt',
    '2024-Road-and-Rail-Design.txt',
    '2024-Site-Planning.txt',
    '2024-Steel-Detailing-Fabrication.txt'
  ];

  pages.forEach(page => {
    const mapping = mapper.getTemplateForPage(page);
    expect(mapping.templateId).toBe('industry-solution');
  });
});

// Test Suite 2: Product page mapping
console.log('\nTest Suite: Product page mapping\n');

test('should map Product-ALLPLAN-2025.txt to Product Landing Page template', () => {
  const mapping = mapper.getTemplateForPage('Product-ALLPLAN-2025.txt');
  expect(mapping.templateId).toBe('product-landing-page');
  expect(mapping.templateName).toBe('Product Landing Page');
  expect(mapping.priority).toBe('high');
});

test('should map all Product pages correctly', () => {
  const pages = [
    'Product-ALLPLAN-2025.txt',
    'Product-ALLPLAN-Civil.txt',
    'Product-ALLPLAN-Cloud-Services.txt'
  ];

  pages.forEach(page => {
    const mapping = mapper.getTemplateForPage(page);
    expect(mapping.templateId).toBe('product-landing-page');
  });
});

// Test Suite 3: Default template fallback
console.log('\nTest Suite: Default template fallback\n');

test('should return default template for unknown page', () => {
  const mapping = mapper.getTemplateForPage('unknown-page-12345.txt');
  expect(mapping.templateId).toBe('default-page');
  expect(mapping.templateName).toBe('Default Page');
  expect(mapping.priority).toBe('low');
});

test('should handle empty filename gracefully', () => {
  const mapping = mapper.getTemplateForPage('');
  expect(mapping).toBeDefined();
  expect(mapping.templateId).toBeTruthy();
});

// Test Suite 4: Template inference
console.log('\nTest Suite: Template inference from filename patterns\n');

test('should infer Industry Solution template from architecture keyword', () => {
  const mapping = mapper.getTemplateForPage('new-architecture-page.txt');
  expect(mapping.templateId).toBe('industry-solution');
});

test('should infer Product Landing Page from product keyword', () => {
  const mapping = mapper.getTemplateForPage('product-new-software.txt');
  expect(mapping.templateId).toBe('product-landing-page');
});

test('should infer Pricing Page from edition keyword', () => {
  const mapping = mapper.getTemplateForPage('edition-premium-2026.txt');
  expect(mapping.templateId).toBe('pricing-page');
});

test('should infer Corporate Homepage from homepage keyword', () => {
  const mapping = mapper.getTemplateForPage('2026-ana-sayfa.txt');
  expect(mapping.templateId).toBe('corporate-homepage');
});

// Test Suite 5: Statistics and reporting
console.log('\nTest Suite: Statistics and reporting\n');

test('should return correct total page count', () => {
  const stats = mapper.getStatistics();
  // Note: count may be higher due to inferred templates being cached
  expect(stats.totalPages).toBeGreaterThan(13);
});

test('should return correct template distribution', () => {
  const stats = mapper.getStatistics();
  // At least 7 Industry Solution pages from the mapping file
  expect(stats.byTemplate['industry-solution']).toBeGreaterThan(6);
  expect(stats.byTemplate['product-landing-page']).toBeGreaterThan(2);
  expect(stats.byTemplate['pricing-page']).toBeGreaterThan(1);
  expect(stats.byTemplate['corporate-homepage']).toBeGreaterThan(1);
});

test('should get pages by template ID', () => {
  const industrySolutionPages = mapper.getPagesByTemplate('industry-solution');
  // At least 7 from the mapping file
  expect(industrySolutionPages.length).toBeGreaterThan(6);
});

test('should get pages by priority', () => {
  const highPriorityPages = mapper.getPagesByPriority('high');
  expect(highPriorityPages.length).toBeGreaterThan(0);
});

// Test Suite 6: Caching behavior
console.log('\nTest Suite: Caching behavior\n');

test('should cache template lookups for performance', () => {
  const mapping1 = mapper.getTemplateForPage('2024-ARCHITECTURE.txt');
  const mapping2 = mapper.getTemplateForPage('2024-ARCHITECTURE.txt');
  
  // Should return the same object reference (cached)
  if (mapping1 !== mapping2) {
    throw new Error('Expected cached result to be the same object reference');
  }
});

// Test Suite 7: Error handling
console.log('\nTest Suite: Error handling\n');

test('should handle missing mapping file gracefully', () => {
  const nonExistentFile = path.join(tempDir, 'non-existent.md');
  const mapperWithMissingFile = new TemplateMapper(nonExistentFile);
  
  const mapping = mapperWithMissingFile.getTemplateForPage('test.txt');
  expect(mapping).toBeDefined();
});

test('should handle malformed mapping file gracefully', () => {
  const malformedFile = path.join(tempDir, 'malformed.md');
  fs.writeFileSync(malformedFile, 'This is not valid markdown table content');
  
  const mapperWithMalformedFile = new TemplateMapper(malformedFile);
  const mapping = mapperWithMalformedFile.getTemplateForPage('test.txt');
  expect(mapping).toBeDefined();
  
  fs.unlinkSync(malformedFile);
});

// Cleanup
if (fs.existsSync(tempMappingFile)) {
  fs.unlinkSync(tempMappingFile);
  fs.rmdirSync(tempDir);
}

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Test Results: ${passedTests} passed, ${failedTests} failed`);
console.log('='.repeat(50));

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('\n✓ All unit tests passed!');
}
