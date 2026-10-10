#!/usr/bin/env tsx
/**
 * Property-Based Test Runner for TemplateMapper
 * Run with: tsx scripts/migration/run-template-mapper-tests.ts
 * 
 * Feature: wordpress-cms-migration, Property 5: Template Matching
 * Validates: Requirements 4.2
 */

import * as fc from 'fast-check';
import { TemplateMapper } from './TemplateMapper';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

console.log('Running Property-Based Tests for TemplateMapper...\n');

// Create a temporary mapping file for testing
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'template-mapper-test-'));
const tempMappingFile = path.join(tempDir, 'PAGE_MAPPING_REPORT.md');

// Create a minimal mapping file with Industry Solution pages
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

### 3. EDİSYON/PAKET SAYFALARI (Editions)

| Dosya Adı | Boyut | Önerilen CMS Şablonu | Öncelik |
|-----------|-------|---------------------|---------|
| \`Editions-ALLPLAN-Basic-2025.txt\` | 14KB | **Pricing Page** | Yüksek |
`;

fs.writeFileSync(tempMappingFile, mappingContent);
const mapper = new TemplateMapper(tempMappingFile);

/**
 * Property 5: Template Matching
 * For any page in the Industry Solution category, the Template Mapper 
 * should return the "Industry Solution" template
 */
console.log('Property 5: Template Matching');
console.log('Testing that Industry Solution pages always map to Industry Solution template...\n');

try {
  // Define known Industry Solution page filenames
  const industrySolutionPages = [
    '2024-ARCHITECTURE.txt',
    '2024-Civil-Engineering-Endüstri-Çözümleri.txt',
    '2024-Structural-Engineering.txt',
    '2024-Bridge-Design.txt',
    '2024-Road-and-Rail-Design.txt',
    '2024-Site-Planning.txt',
    '2024-Steel-Detailing-Fabrication.txt'
  ];

  fc.assert(
    fc.property(
      fc.constantFrom(...industrySolutionPages),
      (filename) => {
        const mapping = mapper.getTemplateForPage(filename);
        
        // Verify the template ID is 'industry-solution'
        if (mapping.templateId !== 'industry-solution') {
          console.error(`  ✗ Failed for ${filename}: expected 'industry-solution', got '${mapping.templateId}'`);
          return false;
        }
        
        // Verify the template name contains 'Industry Solution'
        if (!mapping.templateName.includes('Industry Solution')) {
          console.error(`  ✗ Failed for ${filename}: template name '${mapping.templateName}' doesn't contain 'Industry Solution'`);
          return false;
        }
        
        return true;
      }
    ),
    { numRuns: 100 }
  );
  console.log('✓ Test 1 passed: Industry Solution pages map correctly (100 runs)');
} catch (error: any) {
  console.error('✗ Test 1 failed:', error.message);
  cleanup();
  process.exit(1);
}

/**
 * Additional property: Template consistency (idempotency)
 * For any filename, calling getTemplateForPage multiple times should 
 * return the same template
 */
console.log('\nProperty: Template lookup is idempotent');
console.log('Testing that repeated lookups return consistent results...\n');

try {
  const allFilenames = [
    '2024-ARCHITECTURE.txt',
    '2024-Civil-Engineering-Endüstri-Çözümleri.txt',
    'Product-ALLPLAN-2025.txt',
    'Editions-ALLPLAN-Basic-2025.txt',
    'unknown-page.txt'
  ];

  fc.assert(
    fc.property(
      fc.constantFrom(...allFilenames),
      fc.integer({ min: 2, max: 10 }),
      (filename, numCalls) => {
        // Call getTemplateForPage multiple times
        const results = Array.from({ length: numCalls }, () => 
          mapper.getTemplateForPage(filename)
        );

        // All results should be identical
        const firstResult = results[0];
        const allSame = results.every(result => 
          result.templateId === firstResult.templateId &&
          result.templateName === firstResult.templateName &&
          result.category === firstResult.category &&
          result.priority === firstResult.priority
        );

        if (!allSame) {
          console.error(`  ✗ Failed for ${filename}: inconsistent results across ${numCalls} calls`);
        }

        return allSame;
      }
    ),
    { numRuns: 100 }
  );
  console.log('✓ Test 2 passed: Template lookup is idempotent (100 runs)');
} catch (error: any) {
  console.error('✗ Test 2 failed:', error.message);
  cleanup();
  process.exit(1);
}

/**
 * Property: All mapped pages return valid template IDs
 * For any page that has a mapping, the template ID should be non-empty
 */
console.log('\nProperty: All mapped pages return valid template IDs');
console.log('Testing that all mappings have valid template IDs...\n');

try {
  const mappedPages = [
    '2024-ARCHITECTURE.txt',
    '2024-Civil-Engineering-Endüstri-Çözümleri.txt',
    '2024-Structural-Engineering.txt',
    '2024-Bridge-Design.txt',
    'Product-ALLPLAN-2025.txt',
    'Product-ALLPLAN-Civil.txt',
    'Editions-ALLPLAN-Basic-2025.txt'
  ];

  fc.assert(
    fc.property(
      fc.constantFrom(...mappedPages),
      (filename) => {
        const mapping = mapper.getTemplateForPage(filename);
        
        // Template ID should be non-empty
        if (!mapping.templateId || mapping.templateId.length === 0) {
          console.error(`  ✗ Failed for ${filename}: empty template ID`);
          return false;
        }
        
        // Template name should be non-empty
        if (!mapping.templateName || mapping.templateName.length === 0) {
          console.error(`  ✗ Failed for ${filename}: empty template name`);
          return false;
        }
        
        // Priority should be valid
        if (!['high', 'medium', 'low'].includes(mapping.priority)) {
          console.error(`  ✗ Failed for ${filename}: invalid priority '${mapping.priority}'`);
          return false;
        }
        
        return true;
      }
    ),
    { numRuns: 100 }
  );
  console.log('✓ Test 3 passed: All mapped pages have valid template IDs (100 runs)');
} catch (error: any) {
  console.error('✗ Test 3 failed:', error.message);
  cleanup();
  process.exit(1);
}

/**
 * Property: Unknown pages get default or inferred template
 * For any filename not in the mapping, should return a valid template
 */
console.log('\nProperty: Unknown pages receive valid templates');
console.log('Testing that unknown pages get default or inferred templates...\n');

try {
  fc.assert(
    fc.property(
      fc.string({ minLength: 5, maxLength: 50 }).map(s => `unknown-${s}.txt`),
      (filename) => {
        const mapping = mapper.getTemplateForPage(filename);
        
        // Should return a valid mapping (either inferred or default)
        if (!mapping) {
          console.error(`  ✗ Failed for ${filename}: no mapping returned`);
          return false;
        }
        
        if (!mapping.templateId || mapping.templateId.length === 0) {
          console.error(`  ✗ Failed for ${filename}: empty template ID`);
          return false;
        }
        
        if (!mapping.templateName || mapping.templateName.length === 0) {
          console.error(`  ✗ Failed for ${filename}: empty template name`);
          return false;
        }
        
        return true;
      }
    ),
    { numRuns: 50 }
  );
  console.log('✓ Test 4 passed: Unknown pages receive valid templates (50 runs)');
} catch (error: any) {
  console.error('✗ Test 4 failed:', error.message);
  cleanup();
  process.exit(1);
}

console.log('\n✓ All property tests passed!');
console.log('Property 5: Template Matching - VALIDATED');

// Cleanup
cleanup();

function cleanup() {
  if (fs.existsSync(tempMappingFile)) {
    fs.unlinkSync(tempMappingFile);
    fs.rmdirSync(tempDir);
  }
}
