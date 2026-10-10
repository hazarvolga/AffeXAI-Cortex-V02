/**
 * Property-Based Tests for TemplateMapper
 * 
 * Feature: wordpress-cms-migration, Property 5: Template Matching
 * Validates: Requirements 4.2
 */

import * as fc from 'fast-check';
import { TemplateMapper } from '../TemplateMapper';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

describe('TemplateMapper - Property-Based Tests', () => {
  let tempMappingFile: string;
  let mapper: TemplateMapper;

  beforeAll(() => {
    // Create a temporary mapping file for testing
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'template-mapper-test-'));
    tempMappingFile = path.join(tempDir, 'PAGE_MAPPING_REPORT.md');

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
    mapper = new TemplateMapper(tempMappingFile);
  });

  afterAll(() => {
    // Cleanup temp file
    if (fs.existsSync(tempMappingFile)) {
      fs.unlinkSync(tempMappingFile);
      fs.rmdirSync(path.dirname(tempMappingFile));
    }
  });

  /**
   * Property 5: Template Matching
   * For any page in the Industry Solution category, the Template Mapper 
   * should return the "Industry Solution" template
   * 
   * Validates: Requirements 4.2
   */
  test('Property 5: Industry Solution pages always map to Industry Solution template', () => {
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
          expect(mapping.templateId).toBe('industry-solution');
          
          // Verify the template name contains 'Industry Solution'
          expect(mapping.templateName).toContain('Industry Solution');
          
          // Return true for property assertion
          return mapping.templateId === 'industry-solution';
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Template consistency
   * For any filename, calling getTemplateForPage multiple times should 
   * return the same template (idempotency)
   */
  test('Property: Template lookup is idempotent', () => {
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
          return results.every(result => 
            result.templateId === firstResult.templateId &&
            result.templateName === firstResult.templateName &&
            result.category === firstResult.category &&
            result.priority === firstResult.priority
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: All mapped pages return valid template IDs
   * For any page that has a mapping, the template ID should be non-empty
   */
  test('Property: All mapped pages return valid template IDs', () => {
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
          expect(mapping.templateId).toBeTruthy();
          expect(mapping.templateId.length).toBeGreaterThan(0);
          
          // Template name should be non-empty
          expect(mapping.templateName).toBeTruthy();
          expect(mapping.templateName.length).toBeGreaterThan(0);
          
          // Priority should be valid
          expect(['high', 'medium', 'low']).toContain(mapping.priority);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Unknown pages get default template
   * For any filename not in the mapping, should return default template
   */
  test('Property: Unknown pages receive default template', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 5, maxLength: 50 }).map(s => `unknown-${s}.txt`),
        (filename) => {
          const mapping = mapper.getTemplateForPage(filename);
          
          // Should return a valid mapping (either inferred or default)
          expect(mapping).toBeDefined();
          expect(mapping.templateId).toBeTruthy();
          expect(mapping.templateName).toBeTruthy();
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
