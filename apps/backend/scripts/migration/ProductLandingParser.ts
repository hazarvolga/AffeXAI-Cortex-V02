import * as cheerio from 'cheerio';
import { ContentParser } from './ContentParser';
import {
  ParsedContent,
  ContentSection,
} from './types';

/**
 * ProductLandingParser - Parser for product landing pages
 * Extracts hero, features, benefits, specifications, and CTAs
 */
export class ProductLandingParser extends ContentParser {
  /**
   * Parse product landing page content
   */
  parseProductPage(htmlContent: string, filename: string): ParsedContent {
    const $ = cheerio.load(htmlContent);
    
    // Get base parsed content
    const baseContent = this.parse(htmlContent, filename);
    
    // Extract structured sections
    const sections: ContentSection[] = [];
    
    // 1. Hero Section (Product intro)
    const heroSection = this.extractProductHero($);
    if (heroSection) {
      sections.push(heroSection);
    }
    
    // 2. Features/Benefits Grid
    const featuresSection = this.extractFeatures($);
    if (featuresSection) {
      sections.push(featuresSection);
    }
    
    // 3. Specifications/Details
    const specsSection = this.extractSpecifications($);
    if (specsSection) {
      sections.push(specsSection);
    }
    
    // 4. Use Cases/Applications
    const useCasesSection = this.extractUseCases($);
    if (useCasesSection) {
      sections.push(useCasesSection);
    }
    
    // 5. Video/Demo Section
    const videoSection = this.extractVideoDemo($);
    if (videoSection) {
      sections.push(videoSection);
    }
    
    // 6. CTA Section
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
   * Extract product hero section
   */
  private extractProductHero($: cheerio.CheerioAPI): ContentSection | null {
    // Get main product title and description
    const title = $('h1, h2').first().text().trim();
    const subtitle = $('h2, h3').eq(1).text().trim();
    const description = $('p').first().text().trim();
    
    // Get hero image
    const heroImage = $('img').first().attr('src') || '';
    
    // Get primary CTA
    const primaryCTA = $('a').first();
    const ctaText = primaryCTA.text().trim();
    const ctaLink = primaryCTA.attr('href') || '';
    
    if (!title) return null;
    
    return {
      type: 'hero',
      order: 0,
      content: {
        blockType: 'product-hero',
        title,
        subtitle,
        description,
        image: heroImage,
        cta: {
          text: ctaText,
          link: ctaLink,
        },
      },
    };
  }
  
  /**
   * Extract features/benefits
   */
  private extractFeatures($: cheerio.CheerioAPI): ContentSection | null {
    const features: any[] = [];
    
    // Look for list items or figure elements
    $('li, figure').each((_, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      
      if (text.length > 10 && text.length < 200) {
        // Find associated icon/image
        const icon = $el.find('img').attr('src') || '';
        
        // Try to split into title and description
        const parts = text.split(/[:.]/);
        const title = parts[0]?.trim() || text;
        const description = parts.slice(1).join('.').trim();
        
        features.push({
          icon,
          title,
          description: description || text,
        });
      }
    });
    
    if (features.length === 0) return null;
    
    return {
      type: 'features',
      order: 1,
      content: {
        blockType: 'features-list',
        features,
      },
    };
  }
  
  /**
   * Extract specifications/technical details
   */
  private extractSpecifications($: cheerio.CheerioAPI): ContentSection | null {
    const specs: any[] = [];
    
    // Look for tables or definition lists
    $('table tr, dl dt').each((_, el) => {
      const $el = $(el);
      
      if ($el.is('tr')) {
        const cells = $el.find('td, th');
        if (cells.length >= 2) {
          specs.push({
            label: cells.eq(0).text().trim(),
            value: cells.eq(1).text().trim(),
          });
        }
      } else if ($el.is('dt')) {
        const $dd = $el.next('dd');
        specs.push({
          label: $el.text().trim(),
          value: $dd.text().trim(),
        });
      }
    });
    
    if (specs.length === 0) return null;
    
    return {
      type: 'text',
      order: 2,
      content: {
        blockType: 'specifications-table',
        specs,
      },
    };
  }
  
  /**
   * Extract use cases/applications
   */
  private extractUseCases($: cheerio.CheerioAPI): ContentSection | null {
    const useCases: any[] = [];
    
    // Look for sections with "use case" or "application" keywords
    $('h3, h4').each((_, el) => {
      const $el = $(el);
      const heading = $el.text().trim();
      
      // Check if this looks like a use case
      const isUseCase = heading.length > 5 && heading.length < 100;
      
      if (isUseCase) {
        const $description = $el.next('p');
        const description = $description.text().trim();
        
        if (description) {
          useCases.push({
            title: heading,
            description,
          });
        }
      }
    });
    
    if (useCases.length < 2) return null; // Need at least 2 use cases
    
    return {
      type: 'features',
      order: 3,
      content: {
        blockType: 'use-cases',
        cases: useCases,
      },
    };
  }
  
  /**
   * Extract video/demo section
   */
  private extractVideoDemo($: cheerio.CheerioAPI): ContentSection | null {
    const videos: string[] = [];
    
    // Look for YouTube/Vimeo URLs
    $('a, iframe').each((_, el) => {
      const $el = $(el);
      const href = $el.attr('href') || $el.attr('src') || '';
      
      if (href.includes('youtube.com') || href.includes('youtu.be') || href.includes('vimeo.com')) {
        videos.push(href);
      }
    });
    
    // Check text content for video URLs
    const text = $.root().text();
    const videoMatches = text.match(/https?:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com)\/[^\s]+/g);
    if (videoMatches) {
      videos.push(...videoMatches);
    }
    
    if (videos.length === 0) return null;
    
    return {
      type: 'text',
      order: 4,
      content: {
        blockType: 'video-demo',
        videos: videos.map(url => ({ url })),
      },
    };
  }
  
  /**
   * Extract CTA section
   */
  private extractCTA($: cheerio.CheerioAPI): ContentSection | null {
    const buttons: any[] = [];
    
    // Get last few links as potential CTAs
    const links = $('a');
    const lastLinks = links.slice(-3);
    
    lastLinks.each((_, link) => {
      const $link = $(link);
      const text = $link.text().trim();
      const href = $link.attr('href') || '';
      
      if (text.length > 3 && text.length < 50) {
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
        blockType: 'product-cta',
        title: 'Ready to get started?',
        buttons,
      },
    };
  }
}
