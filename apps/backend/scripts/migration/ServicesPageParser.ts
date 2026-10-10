import * as cheerio from 'cheerio';
import { ContentParser } from './ContentParser';
import {
  ParsedContent,
  ContentSection,
} from './types';

/**
 * ServicesPageParser - Parser for services/features pages
 * Extracts service descriptions, benefits, and features
 */
export class ServicesPageParser extends ContentParser {
  /**
   * Parse services page content
   */
  parseServicesPage(htmlContent: string, filename: string): ParsedContent {
    const $ = cheerio.load(htmlContent);
    
    // Get base parsed content
    const baseContent = this.parse(htmlContent, filename);
    
    // Extract structured sections
    const sections: ContentSection[] = [];
    
    // 1. Hero Section
    const heroSection = this.extractServicesHero($);
    if (heroSection) {
      sections.push(heroSection);
    }
    
    // 2. Services Grid
    const servicesSection = this.extractServices($);
    if (servicesSection) {
      sections.push(servicesSection);
    }
    
    // 3. Benefits
    const benefitsSection = this.extractBenefits($);
    if (benefitsSection) {
      sections.push(benefitsSection);
    }
    
    // 4. How It Works
    const processSection = this.extractProcess($);
    if (processSection) {
      sections.push(processSection);
    }
    
    // 5. CTA
    const ctaSection = this.extractCTA($);
    if (ctaSection) {
      sections.push(ctaSection);
    }
    
    return {
      ...baseContent,
      sections,
    };
  }
  
  /**
   * Extract services hero section
   */
  private extractServicesHero($: cheerio.CheerioAPI): ContentSection | null {
    const title = $('h1').first().text().trim();
    const subtitle = $('h2, p').first().text().trim();
    const image = $('img').first().attr('src') || '';
    
    if (!title) return null;
    
    return {
      type: 'hero',
      order: 0,
      content: {
        blockType: 'services-hero',
        title,
        subtitle,
        image,
      },
    };
  }
  
  /**
   * Extract services/features grid
   */
  private extractServices($: cheerio.CheerioAPI): ContentSection | null {
    const services: any[] = [];
    
    // Look for service items
    $('h2, h3').each((_, el) => {
      const $el = $(el);
      const title = $el.text().trim();
      
      if (title.length > 5 && title.length < 100) {
        // Get description from next paragraph
        const $description = $el.next('p');
        const description = $description.text().trim();
        
        // Get icon/image if available
        const $icon = $el.prevAll('img').first();
        const icon = $icon.attr('src') || '';
        
        if (description) {
          services.push({
            title,
            description,
            icon,
          });
        }
      }
    });
    
    if (services.length === 0) return null;
    
    return {
      type: 'features',
      order: 1,
      content: {
        blockType: 'services-grid',
        services,
      },
    };
  }
  
  /**
   * Extract benefits section
   */
  private extractBenefits($: cheerio.CheerioAPI): ContentSection | null {
    const benefits: any[] = [];
    
    // Look for list items that describe benefits
    $('ul li, ol li').each((_, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      
      if (text.length > 10 && text.length < 200) {
        benefits.push({
          text,
        });
      }
    });
    
    if (benefits.length < 3) return null;
    
    return {
      type: 'features',
      order: 2,
      content: {
        blockType: 'benefits-list',
        benefits,
      },
    };
  }
  
  /**
   * Extract process/how it works section
   */
  private extractProcess($: cheerio.CheerioAPI): ContentSection | null {
    const steps: any[] = [];
    
    // Look for numbered steps or process descriptions
    $('h3, h4').each((_, el) => {
      const $el = $(el);
      const heading = $el.text().trim();
      
      // Check if this looks like a step (contains number or step keyword)
      const isStep = /\d+|step|phase|stage/i.test(heading);
      
      if (isStep && heading.length > 5) {
        const $description = $el.next('p');
        const description = $description.text().trim();
        
        if (description) {
          steps.push({
            title: heading,
            description,
          });
        }
      }
    });
    
    if (steps.length < 2) return null;
    
    return {
      type: 'text',
      order: 3,
      content: {
        blockType: 'process-steps',
        steps,
      },
    };
  }
  
  /**
   * Extract CTA section
   */
  private extractCTA($: cheerio.CheerioAPI): ContentSection | null {
    const buttons: any[] = [];
    
    $('a').each((_, link) => {
      const $link = $(link);
      const text = $link.text().trim();
      const href = $link.attr('href') || '';
      
      // Look for CTA-like text
      const isCTA = /learn more|get started|contact|demo|try|sign up/i.test(text);
      
      if (isCTA && text.length > 3 && text.length < 50) {
        buttons.push({
          text,
          href,
        });
      }
    });
    
    if (buttons.length === 0) return null;
    
    return {
      type: 'cta',
      order: 10,
      content: {
        blockType: 'services-cta',
        title: 'Ready to learn more?',
        buttons,
      },
    };
  }
}
