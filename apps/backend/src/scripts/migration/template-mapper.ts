/**
 * Template Mapper
 * 
 * Maps WordPress page filenames to CMS templates by parsing PAGE_MAPPING_REPORT.md
 * 
 * Features:
 * - Parses markdown tables to extract filename → template mappings
 * - Caches mappings for performance
 * - Provides default template fallback
 * - Validates template existence
 */

import * as fs from 'fs';
import * as path from 'path';

export interface TemplateMapping {
  filename: string;
  template: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  fileSize?: string;
}

export class TemplateMapper {
  private mappings: Map<string, TemplateMapping> = new Map();
  private availableTemplates: Set<string> = new Set([
    'Corporate Homepage',
    'Product Landing Page',
    'Pricing Page',
    'Industry Solution',
    'Services Page',
    'Free Trial Signup',
    'Lead Magnet Page',
    'Event Page',
    'Thank You Page',
    'Contact Page',
    'Legal Page',
    'FAQ Page',
    'About Us Page',
    'Resources Page',
    'Education Page',
  ]);

  constructor(mappingFilePath: string) {
    this.loadMappings(mappingFilePath);
  }

  /**
   * Get template for a given page filename
   */
  getTemplateForPage(filename: string): string {
    // Remove .txt extension if present
    const cleanFilename = filename.replace(/\.txt$/, '');
    
    // Try exact match
    const mapping = this.mappings.get(cleanFilename);
    if (mapping) {
      return mapping.template;
    }

    // Try case-insensitive match
    const lowerFilename = cleanFilename.toLowerCase();
    for (const [key, value] of this.mappings.entries()) {
      if (key.toLowerCase() === lowerFilename) {
        return value.template;
      }
    }

    // Default fallback
    console.warn(`⚠️  No template mapping found for: ${filename}, using default`);
    return 'Product Landing Page'; // Default template
  }

  /**
   * Verify if a template exists in available templates
   */
  verifyTemplateExists(template: string): boolean {
    return this.availableTemplates.has(template);
  }

  /**
   * Get all mappings
   */
  getAllMappings(): TemplateMapping[] {
    return Array.from(this.mappings.values());
  }

  /**
   * Get mappings by category
   */
  getMappingsByCategory(category: string): TemplateMapping[] {
    return Array.from(this.mappings.values()).filter(
      (m) => m.category.toLowerCase() === category.toLowerCase()
    );
  }

  /**
   * Get mappings by priority
   */
  getMappingsByPriority(priority: 'high' | 'medium' | 'low'): TemplateMapping[] {
    return Array.from(this.mappings.values()).filter((m) => m.priority === priority);
  }

  /**
   * Load mappings from PAGE_MAPPING_REPORT.md
   */
  private loadMappings(filePath: string): void {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Mapping file not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const tables = this.parseMarkdownTables(content);

    console.log(`📋 Loaded ${this.mappings.size} template mappings from ${path.basename(filePath)}`);
  }

  /**
   * Parse markdown tables to extract mappings
   */
  private parseMarkdownTables(content: string): TemplateMapping[] {
    const mappings: TemplateMapping[] = [];
    const lines = content.split('\n');

    let currentCategory = '';
    let inTable = false;
    let tableHeaders: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Detect category headers (e.g., "### 1. ANA SAYFA (Homepage)")
      if (line.startsWith('###')) {
        const match = line.match(/###\s+\d+\.\s+(.+?)(?:\s+\(|$)/);
        if (match) {
          currentCategory = match[1].trim();
        }
        inTable = false;
        continue;
      }

      // Detect table start
      if (line.startsWith('|') && line.includes('Dosya Adı')) {
        inTable = true;
        tableHeaders = line
          .split('|')
          .map((h) => h.trim())
          .filter((h) => h.length > 0);
        i++; // Skip separator line
        continue;
      }

      // Parse table rows
      if (inTable && line.startsWith('|')) {
        const cells = line
          .split('|')
          .map((c) => c.trim())
          .filter((c) => c.length > 0);

        if (cells.length >= 3) {
          const filename = cells[0].replace(/`/g, '').replace(/\.txt$/, '');
          const fileSize = cells[1];
          const template = cells[2].replace(/\*\*/g, '');
          const priority = cells[3]?.toLowerCase().includes('yüksek')
            ? 'high'
            : cells[3]?.toLowerCase().includes('orta')
              ? 'medium'
              : 'low';

          // Skip empty or header rows
          if (filename && filename !== 'Dosya Adı' && template && template !== 'Önerilen CMS Şablonu') {
            const mapping: TemplateMapping = {
              filename,
              template,
              priority,
              category: currentCategory,
              fileSize,
            };

            mappings.push(mapping);
            this.mappings.set(filename, mapping);
          }
        }
      }

      // End of table
      if (inTable && !line.startsWith('|')) {
        inTable = false;
      }
    }

    return mappings;
  }

  /**
   * Generate mapping statistics
   */
  getStatistics(): {
    totalMappings: number;
    byTemplate: Record<string, number>;
    byPriority: Record<string, number>;
    byCategory: Record<string, number>;
  } {
    const stats = {
      totalMappings: this.mappings.size,
      byTemplate: {} as Record<string, number>,
      byPriority: { high: 0, medium: 0, low: 0 },
      byCategory: {} as Record<string, number>,
    };

    for (const mapping of this.mappings.values()) {
      // Count by template
      stats.byTemplate[mapping.template] = (stats.byTemplate[mapping.template] || 0) + 1;

      // Count by priority
      stats.byPriority[mapping.priority]++;

      // Count by category
      stats.byCategory[mapping.category] = (stats.byCategory[mapping.category] || 0) + 1;
    }

    return stats;
  }

  /**
   * Print statistics to console
   */
  printStatistics(): void {
    const stats = this.getStatistics();

    console.log('\n📊 Template Mapping Statistics');
    console.log('─'.repeat(80));
    console.log(`Total Mappings: ${stats.totalMappings}`);
    console.log('');

    console.log('By Template:');
    Object.entries(stats.byTemplate)
      .sort((a, b) => b[1] - a[1])
      .forEach(([template, count]) => {
        console.log(`  ${template}: ${count}`);
      });
    console.log('');

    console.log('By Priority:');
    console.log(`  High: ${stats.byPriority.high}`);
    console.log(`  Medium: ${stats.byPriority.medium}`);
    console.log(`  Low: ${stats.byPriority.low}`);
    console.log('');

    console.log('By Category:');
    Object.entries(stats.byCategory)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        console.log(`  ${category}: ${count}`);
      });
    console.log('─'.repeat(80));
  }
}
