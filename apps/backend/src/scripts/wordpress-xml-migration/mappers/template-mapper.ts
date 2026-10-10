/**
 * WordPress CMS Migration - Template Mapper
 * 
 * Maps WordPress pages to CMS templates using intelligent pattern matching.
 * Uses slug patterns, title keywords, and content analysis.
 */

import { DataSource } from 'typeorm';
import { log } from '../utils/logger';

interface PageTemplate {
  id: string;
  name: string;
  description?: string;
}

interface TemplatePattern {
  templateName: string;
  slugPatterns: RegExp[];
  titleKeywords: string[];
  priority: number; // Higher = checked first
}

export class TemplateMapper {
  private dataSource: DataSource;
  private templates: Map<string, PageTemplate> = new Map();
  private defaultTemplate: PageTemplate | null = null;

  // Pattern-based template matching rules
  private readonly patterns: TemplatePattern[] = [
    // Homepage patterns (highest priority)
    {
      templateName: 'Corporate Homepage',
      slugPatterns: [/^home-?\d*$/, /^ana-sayfa/, /^anasayfa/],
      titleKeywords: ['ana sayfa', 'home', 'homepage'],
      priority: 100,
    },
    
    // Product pages
    {
      templateName: 'Product Landing Page',
      slugPatterns: [
        /^product-/,
        /^allplan-\d{4}$/,
        /^allplan-.*-\d{4}$/,
        /urun-/,
      ],
      titleKeywords: ['allplan', 'product', 'ürün'],
      priority: 90,
    },
    
    // Features pages
    {
      templateName: 'Services Page',
      slugPatterns: [
        /^features?-/,
        /^allplan-.*-ozellikleri$/,
        /^.*-ozellikleri$/,
        /^services?-/,
      ],
      titleKeywords: ['features', 'özellikleri', 'services', 'hizmet'],
      priority: 85,
    },
    
    // Pricing/Editions pages
    {
      templateName: 'Pricing Page',
      slugPatterns: [
        /^editions?-/,
        /^package-/,
        /^paket-/,
        /^pricing-/,
        /^fiyat-/,
      ],
      titleKeywords: ['edition', 'package', 'paket', 'pricing', 'fiyat'],
      priority: 80,
    },
    
    // Industry solutions
    {
      templateName: 'Industry Solution',
      slugPatterns: [
        /^architecture$/,
        /^engineering$/,
        /^civil-engineering/,
        /^structural-engineering/,
        /^bridge-design/,
        /^.*-endustri-cozumleri$/,
      ],
      titleKeywords: ['architecture', 'engineering', 'endüstri', 'çözüm'],
      priority: 75,
    },
    
    // Download/Trial pages
    {
      templateName: 'Free Trial Signup',
      slugPatterns: [
        /^.*-download$/,
        /^.*-dene$/,
        /^.*-trial$/,
        /^demo-/,
      ],
      titleKeywords: ['download', 'trial', 'demo', 'dene', 'indir'],
      priority: 70,
    },
    
    // Contact pages
    {
      templateName: 'Contact Page',
      slugPatterns: [
        /^contact-/,
        /^iletisim-/,
      ],
      titleKeywords: ['contact', 'iletişim'],
      priority: 65,
    },
    
    // FAQ pages
    {
      templateName: 'FAQ Page',
      slugPatterns: [/^faq/, /^sss/],
      titleKeywords: ['faq', 'sss', 'sıkça sorulan'],
      priority: 60,
    },
    
    // About/Team pages
    {
      templateName: 'About Us Page',
      slugPatterns: [
        /^about-/,
        /^hakkimizda/,
        /^our-team/,
        /^team-/,
        /^history/,
      ],
      titleKeywords: ['about', 'hakkımızda', 'team', 'ekip', 'history', 'tarih'],
      priority: 55,
    },
    
    // Event/Webinar pages
    {
      templateName: 'Event Page',
      slugPatterns: [
        /^.*-webinar/,
        /^event-/,
        /^etkinlik-/,
      ],
      titleKeywords: ['webinar', 'event', 'etkinlik'],
      priority: 50,
    },
    
    // Case studies/Projects
    {
      templateName: 'Case Study',
      slugPatterns: [
        /^project-/,
        /^case-study/,
        /^referans/,
      ],
      titleKeywords: ['project', 'case study', 'referans'],
      priority: 45,
    },
    
    // Thank you pages
    {
      templateName: 'Thank You Page',
      slugPatterns: [
        /^tesekkur/,
        /^thank-you/,
        /^.*-tesekkur-sayfasi$/,
      ],
      titleKeywords: ['teşekkür', 'thank you'],
      priority: 40,
    },
    
    // Blog pages
    {
      templateName: 'Blog Homepage',
      slugPatterns: [/^blog$/],
      titleKeywords: ['blog'],
      priority: 35,
    },
    
    // Privacy/Legal pages
    {
      templateName: 'About Us Page', // Use About Us as fallback for legal
      slugPatterns: [
        /^gizlilik/,
        /^privacy/,
        /^term-of-use/,
        /^yasal/,
      ],
      titleKeywords: ['gizlilik', 'privacy', 'term', 'yasal'],
      priority: 30,
    },
  ];

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  /**
   * Load all templates from database
   */
  async loadTemplates(): Promise<void> {
    try {
      const templates = await this.dataSource.query(`
        SELECT id, name, description
        FROM page_templates
        WHERE "isActive" = true
      `);
      
      for (const template of templates) {
        this.templates.set(template.name, template);
      }

      // Set default template (Services Page is most flexible)
      this.defaultTemplate = this.templates.get('Services Page') || templates[0] || null;

      log.info(`Loaded ${templates.length} templates from database`);
      if (this.defaultTemplate) {
        log.info(`Default template: ${this.defaultTemplate.name}`);
      }
    } catch (error) {
      log.error('Failed to load templates', error);
      throw error;
    }
  }

  /**
   * Get template for a WordPress page using intelligent matching
   */
  async getTemplateForPage(title: string, slug: string): Promise<PageTemplate> {
    // Try pattern matching
    const matchedTemplate = this.matchByPatterns(title, slug);
    if (matchedTemplate) {
      return matchedTemplate;
    }

    // Fallback to default
    if (this.defaultTemplate) {
      log.warn(`No template match for "${title}" (${slug}), using default: ${this.defaultTemplate.name}`);
      return this.defaultTemplate;
    }

    throw new Error('No templates available in database');
  }

  /**
   * Match page to template using patterns
   */
  private matchByPatterns(title: string, slug: string): PageTemplate | null {
    const lowerTitle = title.toLowerCase();
    const lowerSlug = slug.toLowerCase();

    // Sort patterns by priority (highest first)
    const sortedPatterns = [...this.patterns].sort((a, b) => b.priority - a.priority);

    for (const pattern of sortedPatterns) {
      // Check slug patterns
      for (const slugPattern of pattern.slugPatterns) {
        if (slugPattern.test(lowerSlug)) {
          const template = this.templates.get(pattern.templateName);
          if (template) {
            log.info(`Matched "${title}" → ${pattern.templateName} (slug pattern: ${slugPattern})`);
            return template;
          }
        }
      }

      // Check title keywords
      for (const keyword of pattern.titleKeywords) {
        if (lowerTitle.includes(keyword)) {
          const template = this.templates.get(pattern.templateName);
          if (template) {
            log.info(`Matched "${title}" → ${pattern.templateName} (title keyword: ${keyword})`);
            return template;
          }
        }
      }
    }

    return null;
  }

  /**
   * Get template statistics
   */
  getStats(): { totalTemplates: number; defaultTemplate: string | null } {
    return {
      totalTemplates: this.templates.size,
      defaultTemplate: this.defaultTemplate?.name || null,
    };
  }

  /**
   * Preview template matching for all pages (for testing/debugging)
   */
  previewMatching(pages: Array<{ title: string; slug: string }>): Map<string, string[]> {
    const templateMatches = new Map<string, string[]>();

    for (const page of pages) {
      const template = this.matchByPatterns(page.title, page.slug);
      const templateName = template?.name || 'Default (Services Page)';

      if (!templateMatches.has(templateName)) {
        templateMatches.set(templateName, []);
      }
      templateMatches.get(templateName)!.push(`${page.title} (${page.slug})`);
    }

    return templateMatches;
  }
}
