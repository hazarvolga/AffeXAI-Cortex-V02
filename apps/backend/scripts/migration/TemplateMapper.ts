/**
 * TemplateMapper - Maps WordPress pages to CMS templates
 * 
 * Parses PAGE_MAPPING_REPORT.md to extract template mappings and provides
 * efficient lookup with caching for performance.
 */

import * as fs from 'fs';
import * as path from 'path';
import { TemplateMapping } from './types';

export class TemplateMapper {
  private mappings: Map<string, TemplateMapping> = new Map();
  private categoryMappings: Map<string, string> = new Map();
  private defaultTemplate: TemplateMapping = {
    templateId: 'default-page',
    templateName: 'Default Page',
    category: 'Other',
    priority: 'low'
  };

  constructor(private mappingFilePath: string) {
    this.loadMappings();
  }

  /**
   * Load and parse PAGE_MAPPING_REPORT.md
   */
  private loadMappings(): void {
    try {
      if (!fs.existsSync(this.mappingFilePath)) {
        console.warn(`Mapping file not found: ${this.mappingFilePath}. Using defaults.`);
        return;
      }

      const content = fs.readFileSync(this.mappingFilePath, 'utf-8');
      this.parseMappingReport(content);
    } catch (error) {
      console.error('Error loading mapping file:', error);
      // Continue with empty mappings - will use default template
    }
  }

  /**
   * Parse the markdown mapping report and extract page-to-template mappings
   */
  private parseMappingReport(content: string): void {
    const lines = content.split('\n');
    let currentCategory = '';
    let currentTemplate = '';
    let currentPriority: 'high' | 'medium' | 'low' = 'low';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Extract category from headers like "### 1. ANA SAYFA (Homepage)"
      if (line.startsWith('###') && line.includes('.')) {
        const match = line.match(/###\s*\d+\.\s*(.+?)(?:\s*\(|$)/);
        if (match) {
          currentCategory = match[1].trim();
        }
        continue;
      }

      // Extract template from table rows
      // Format: | `filename.txt` | size | **Template Name** | Priority |
      if (line.startsWith('|') && line.includes('.txt')) {
        const parts = line.split('|').map(p => p.trim()).filter(p => p);
        
        if (parts.length >= 3) {
          // Extract filename
          const filenameMatch = parts[0].match(/`([^`]+\.txt)`/);
          if (!filenameMatch) continue;
          
          const filename = filenameMatch[1];
          
          // Extract template name (may be in bold **Template** or plain text)
          let templateName = parts[2];
          const boldMatch = templateName.match(/\*\*([^*]+)\*\*/);
          if (boldMatch) {
            templateName = boldMatch[1];
          }
          
          // Extract priority if available
          if (parts.length >= 4) {
            const priorityText = parts[3].toLowerCase();
            if (priorityText.includes('yüksek') || priorityText.includes('high')) {
              currentPriority = 'high';
            } else if (priorityText.includes('orta') || priorityText.includes('medium')) {
              currentPriority = 'medium';
            } else {
              currentPriority = 'low';
            }
          }

          // Skip files marked as SKIP
          if (templateName.includes('SKIP')) {
            continue;
          }

          // Create template mapping
          const templateId = this.templateNameToId(templateName);
          const mapping: TemplateMapping = {
            templateId,
            templateName,
            category: currentCategory,
            priority: currentPriority
          };

          this.mappings.set(filename, mapping);
          
          // Also store category mapping for template lookup
          if (!this.categoryMappings.has(currentCategory)) {
            this.categoryMappings.set(currentCategory, templateId);
          }
        }
      }
    }

    console.log(`Loaded ${this.mappings.size} page-to-template mappings`);
  }

  /**
   * Convert template name to template ID
   * e.g., "Industry Solution" -> "industry-solution"
   */
  private templateNameToId(templateName: string): string {
    return templateName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Get template mapping for a specific page
   * @param filename - The page filename (e.g., "2024-ARCHITECTURE.txt")
   * @returns Template mapping or default template if not found
   */
  public getTemplateForPage(filename: string): TemplateMapping {
    // Check cache first
    const cached = this.mappings.get(filename);
    if (cached) {
      return cached;
    }

    // Try to infer from filename patterns
    const inferred = this.inferTemplateFromFilename(filename);
    if (inferred) {
      // Cache the inferred mapping
      this.mappings.set(filename, inferred);
      return inferred;
    }

    // Return default template
    console.warn(`No template mapping found for ${filename}, using default template`);
    return this.defaultTemplate;
  }

  /**
   * Infer template from filename patterns when not in mapping file
   */
  private inferTemplateFromFilename(filename: string): TemplateMapping | null {
    const lower = filename.toLowerCase();

    // Industry Solution patterns
    if (lower.includes('architecture') || 
        lower.includes('engineering') || 
        lower.includes('bridge-design') ||
        lower.includes('steel-detailing') ||
        lower.includes('site-planning') ||
        lower.includes('road-and-rail')) {
      return {
        templateId: 'industry-solution',
        templateName: 'Industry Solution',
        category: 'Industry Solutions',
        priority: 'high'
      };
    }

    // Product pages
    if (lower.includes('product-') || 
        lower.includes('allplan-') && (lower.includes('aec') || lower.includes('civil') || lower.includes('bridge'))) {
      return {
        templateId: 'product-landing-page',
        templateName: 'Product Landing Page',
        category: 'Product Pages',
        priority: 'high'
      };
    }

    // Pricing/Editions
    if (lower.includes('edition') || 
        lower.includes('paket') || 
        lower.includes('package') ||
        lower.includes('pricing')) {
      return {
        templateId: 'pricing-page',
        templateName: 'Pricing Page',
        category: 'Editions',
        priority: 'high'
      };
    }

    // Homepage
    if (lower.includes('ana-sayfa') || lower.includes('homepage')) {
      return {
        templateId: 'corporate-homepage',
        templateName: 'Corporate Homepage',
        category: 'Homepage',
        priority: 'high'
      };
    }

    // Campaign pages
    if (lower.includes('kampanya') || lower.includes('campaign') || lower.match(/q[1-4]-/)) {
      return {
        templateId: 'lead-magnet-page',
        templateName: 'Lead Magnet Page',
        category: 'Campaigns',
        priority: 'low'
      };
    }

    return null;
  }

  /**
   * Get all mappings (for reporting/debugging)
   */
  public getAllMappings(): Map<string, TemplateMapping> {
    return new Map(this.mappings);
  }

  /**
   * Get pages by template ID
   */
  public getPagesByTemplate(templateId: string): string[] {
    const pages: string[] = [];
    for (const [filename, mapping] of this.mappings.entries()) {
      if (mapping.templateId === templateId) {
        pages.push(filename);
      }
    }
    return pages;
  }

  /**
   * Get pages by priority
   */
  public getPagesByPriority(priority: 'high' | 'medium' | 'low'): string[] {
    const pages: string[] = [];
    for (const [filename, mapping] of this.mappings.entries()) {
      if (mapping.priority === priority) {
        pages.push(filename);
      }
    }
    return pages;
  }

  /**
   * Get template statistics
   */
  public getStatistics(): {
    totalPages: number;
    byTemplate: Record<string, number>;
    byPriority: Record<string, number>;
  } {
    const byTemplate: Record<string, number> = {};
    const byPriority: Record<string, number> = { high: 0, medium: 0, low: 0 };

    for (const mapping of this.mappings.values()) {
      byTemplate[mapping.templateId] = (byTemplate[mapping.templateId] || 0) + 1;
      byPriority[mapping.priority]++;
    }

    return {
      totalPages: this.mappings.size,
      byTemplate,
      byPriority
    };
  }
}
