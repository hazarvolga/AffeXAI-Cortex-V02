/**
 * Unit Tests for TemplateMapper
 * 
 * Tests specific scenarios:
 * - Industry Solution page mapping
 * - Product page mapping
 * - Default template fallback
 * 
 * Validates: Requirements 4.2, 4.3, 4.5
 */

import { TemplateMapper } from '../TemplateMapper';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('TemplateMapper - Unit Tests', () => {
  let tempMappingFile: string;
  let tempDir: string;
  let mapper: TemplateMapper;

  beforeAll(() => {
    // Create a temporary mapping file for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'template-mapper-unit-test-'));
    tempMappingFile = path.join(tempDir, 'PAGE_MAPPING_REPORT.md');

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
    mapper = new TemplateMapper(tempMappingFile);
  });

  afterAll(() => {
    // Cleanup temp file
    if (fs.existsSync(tempMappingFile)) {
      fs.unlinkSync(tempMappingFile);
      fs.rmdirSync(tempDir);
    }
  });

  describe('Industry Solution page mapping', () => {
    it('should map 2024-ARCHITECTURE.txt to Industry Solution template', () => {
      const mapping = mapper.getTemplateForPage('2024-ARCHITECTURE.txt');
      
      expect(mapping.templateId).toBe('industry-solution');
      expect(mapping.templateName).toBe('Industry Solution');
      expect(mapping.category).toBe('ENDÜSTRİ ÇÖZÜM SAYFALARI (Industry Solutions)');
      expect(mapping.priority).toBe('high');
    });

    it('should map 2024-Civil-Engineering-Endüstri-Çözümleri.txt to Industry Solution template', () => {
      const mapping = mapper.getTemplateForPage('2024-Civil-Engineering-Endüstri-Çözümleri.txt');
      
      expect(mapping.templateId).toBe('industry-solution');
      expect(mapping.templateName).toBe('Industry Solution');
      expect(mapping.priority).toBe('high');
    });

    it('should map 2024-Steel-Detailing-Fabrication.txt with medium priority', () => {
      const mapping = mapper.getTemplateForPage('2024-Steel-Detailing-Fabrication.txt');
      
      expect(mapping.templateId).toBe('industry-solution');
      expect(mapping.templateName).toBe('Industry Solution');
      expect(mapping.priority).toBe('medium');
    });

    it('should map all 7 Industry Solution pages correctly', () => {
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
  });

  describe('Product page mapping', () => {
    it('should map Product-ALLPLAN-2025.txt to Product Landing Page template', () => {
      const mapping = mapper.getTemplateForPage('Product-ALLPLAN-2025.txt');
      
      expect(mapping.templateId).toBe('product-landing-page');
      expect(mapping.templateName).toBe('Product Landing Page');
      expect(mapping.category).toBe('ÜRÜN SAYFALARI (Product Pages)');
      expect(mapping.priority).toBe('high');
    });

    it('should map Product-ALLPLAN-Civil.txt to Product Landing Page template', () => {
      const mapping = mapper.getTemplateForPage('Product-ALLPLAN-Civil.txt');
      
      expect(mapping.templateId).toBe('product-landing-page');
      expect(mapping.templateName).toBe('Product Landing Page');
      expect(mapping.priority).toBe('high');
    });

    it('should map all Product pages correctly', () => {
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
  });

  describe('Pricing page mapping', () => {
    it('should map Editions-ALLPLAN-Basic-2025.txt to Pricing Page template', () => {
      const mapping = mapper.getTemplateForPage('Editions-ALLPLAN-Basic-2025.txt');
      
      expect(mapping.templateId).toBe('pricing-page');
      expect(mapping.templateName).toBe('Pricing Page');
      expect(mapping.category).toBe('EDİSYON/PAKET SAYFALARI (Editions)');
      expect(mapping.priority).toBe('high');
    });
  });

  describe('Homepage mapping', () => {
    it('should map 2024-Ana-Sayfa.txt to Corporate Homepage template', () => {
      const mapping = mapper.getTemplateForPage('2024-Ana-Sayfa.txt');
      
      expect(mapping.templateId).toBe('corporate-homepage');
      expect(mapping.templateName).toBe('Corporate Homepage');
      expect(mapping.category).toBe('ANA SAYFA (Homepage)');
      expect(mapping.priority).toBe('high');
    });
  });

  describe('Default template fallback', () => {
    it('should return default template for unknown page', () => {
      const mapping = mapper.getTemplateForPage('unknown-page-12345.txt');
      
      expect(mapping.templateId).toBe('default-page');
      expect(mapping.templateName).toBe('Default Page');
      expect(mapping.category).toBe('Other');
      expect(mapping.priority).toBe('low');
    });

    it('should return default template for completely random filename', () => {
      const mapping = mapper.getTemplateForPage('xyz-random-file-999.txt');
      
      expect(mapping.templateId).toBe('default-page');
      expect(mapping.templateName).toBe('Default Page');
    });

    it('should handle empty filename gracefully', () => {
      const mapping = mapper.getTemplateForPage('');
      
      expect(mapping).toBeDefined();
      expect(mapping.templateId).toBeTruthy();
    });
  });

  describe('Template inference from filename patterns', () => {
    it('should infer Industry Solution template from architecture keyword', () => {
      const mapping = mapper.getTemplateForPage('new-architecture-page.txt');
      
      expect(mapping.templateId).toBe('industry-solution');
      expect(mapping.templateName).toBe('Industry Solution');
    });

    it('should infer Product Landing Page from product keyword', () => {
      const mapping = mapper.getTemplateForPage('product-new-software.txt');
      
      expect(mapping.templateId).toBe('product-landing-page');
      expect(mapping.templateName).toBe('Product Landing Page');
    });

    it('should infer Pricing Page from edition keyword', () => {
      const mapping = mapper.getTemplateForPage('edition-premium-2026.txt');
      
      expect(mapping.templateId).toBe('pricing-page');
      expect(mapping.templateName).toBe('Pricing Page');
    });

    it('should infer Corporate Homepage from homepage keyword', () => {
      const mapping = mapper.getTemplateForPage('2026-ana-sayfa.txt');
      
      expect(mapping.templateId).toBe('corporate-homepage');
      expect(mapping.templateName).toBe('Corporate Homepage');
    });
  });

  describe('Statistics and reporting', () => {
    it('should return correct total page count', () => {
      const stats = mapper.getStatistics();
      
      expect(stats.totalPages).toBe(14); // 7 Industry + 3 Product + 2 Pricing + 2 Homepage
    });

    it('should return correct template distribution', () => {
      const stats = mapper.getStatistics();
      
      expect(stats.byTemplate['industry-solution']).toBe(7);
      expect(stats.byTemplate['product-landing-page']).toBe(3);
      expect(stats.byTemplate['pricing-page']).toBe(2);
      expect(stats.byTemplate['corporate-homepage']).toBe(2);
    });

    it('should return correct priority distribution', () => {
      const stats = mapper.getStatistics();
      
      expect(stats.byPriority.high).toBeGreaterThan(0);
      expect(stats.byPriority.medium).toBeGreaterThan(0);
    });

    it('should get pages by template ID', () => {
      const industrySolutionPages = mapper.getPagesByTemplate('industry-solution');
      
      expect(industrySolutionPages.length).toBe(7);
      expect(industrySolutionPages).toContain('2024-ARCHITECTURE.txt');
      expect(industrySolutionPages).toContain('2024-Bridge-Design.txt');
    });

    it('should get pages by priority', () => {
      const highPriorityPages = mapper.getPagesByPriority('high');
      
      expect(highPriorityPages.length).toBeGreaterThan(0);
      expect(highPriorityPages).toContain('2024-ARCHITECTURE.txt');
      expect(highPriorityPages).toContain('Product-ALLPLAN-2025.txt');
    });
  });

  describe('Caching behavior', () => {
    it('should cache template lookups for performance', () => {
      // First lookup
      const mapping1 = mapper.getTemplateForPage('2024-ARCHITECTURE.txt');
      
      // Second lookup (should be cached)
      const mapping2 = mapper.getTemplateForPage('2024-ARCHITECTURE.txt');
      
      // Should return the same object reference (cached)
      expect(mapping1).toBe(mapping2);
    });

    it('should cache inferred templates', () => {
      // First lookup of unknown page
      const mapping1 = mapper.getTemplateForPage('new-architecture-2026.txt');
      
      // Second lookup (should be cached)
      const mapping2 = mapper.getTemplateForPage('new-architecture-2026.txt');
      
      // Should return the same object reference (cached)
      expect(mapping1).toBe(mapping2);
    });
  });

  describe('Error handling', () => {
    it('should handle missing mapping file gracefully', () => {
      const nonExistentFile = path.join(tempDir, 'non-existent.md');
      const mapperWithMissingFile = new TemplateMapper(nonExistentFile);
      
      // Should not throw, should use defaults
      const mapping = mapperWithMissingFile.getTemplateForPage('test.txt');
      expect(mapping).toBeDefined();
    });

    it('should handle malformed mapping file gracefully', () => {
      const malformedFile = path.join(tempDir, 'malformed.md');
      fs.writeFileSync(malformedFile, 'This is not valid markdown table content');
      
      const mapperWithMalformedFile = new TemplateMapper(malformedFile);
      
      // Should not throw, should use defaults or inference
      const mapping = mapperWithMalformedFile.getTemplateForPage('test.txt');
      expect(mapping).toBeDefined();
      
      fs.unlinkSync(malformedFile);
    });
  });
});
