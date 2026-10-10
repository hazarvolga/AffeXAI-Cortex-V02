import * as cheerio from 'cheerio';
import { ContentParser } from './ContentParser';
import {
  ParsedContent,
  ContentSection,
} from './types';

/**
 * PricingPageParser - Parser for pricing/editions pages
 * Extracts pricing tiers, features, comparison tables
 */
export class PricingPageParser extends ContentParser {
  /**
   * Parse pricing page content
   */
  parsePricingPage(htmlContent: string, filename: string): ParsedContent {
    const $ = cheerio.load(htmlContent);
    
    // Get base parsed content
    const baseContent = this.parse(htmlContent, filename);
    
    // Extract structured sections
    const sections: ContentSection[] = [];
    
    // 1. Hero Section
    const heroSection = this.extractPricingHero($);
    if (heroSection) {
      sections.push(heroSection);
    }
    
    // 2. Pricing Tiers
    const pricingSection = this.extractPricingTiers($);
    if (pricingSection) {
      sections.push(pricingSection);
    }
    
    // 3. Feature Comparison
    const comparisonSection = this.extractFeatureComparison($);
    if (comparisonSection) {
      sections.push(comparisonSection);
    }
    
    // 4. FAQ
    const faqSection = this.extractFAQ($);
    if (faqSection) {
      sections.push(faqSection);
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
   * Extract pricing hero section
   */
  private extractPricingHero($: cheerio.CheerioAPI): ContentSection | null {
    const title = $('h1').first().text().trim();
    const subtitle = $('h2, p').first().text().trim();
    
    if (!title) return null;
    
    return {
      type: 'hero',
      order: 0,
      content: {
        blockType: 'pricing-hero',
        title,
        subtitle,
      },
    };
  }
  
  /**
   * Extract pricing tiers
   */
  private extractPricingTiers($: cheerio.CheerioAPI): ContentSection | null {
    const tiers: any[] = [];
    
    // Look for pricing information in text
    const text = $.root().text();
    
    // Extract price patterns (e.g., "€99", "$99", "99 EUR")
    const priceMatches = text.match(/[€$]\s*\d+(?:[.,]\d{2})?|\d+(?:[.,]\d{2})?\s*(?:EUR|USD|TL)/gi);
    
    if (priceMatches && priceMatches.length > 0) {
      // Try to find tier names near prices
      $('h2, h3, h4').each((_, el) => {
        const $el = $(el);
        const tierName = $el.text().trim();
        
        if (tierName.length > 3 && tierName.length < 50) {
          // Get description from next paragraph
          const $description = $el.next('p');
          const description = $description.text().trim();
          
          // Get features from following list
          const features: string[] = [];
          $el.nextAll('ul, ol').first().find('li').each((_, li) => {
            features.push($(li).text().trim());
          });
          
          tiers.push({
            name: tierName,
            description,
            features,
          });
        }
      });
    }
    
    if (tiers.length === 0) return null;
    
    return {
      type: 'pricing',
      order: 1,
      content: {
        blockType: 'pricing-tiers',
        tiers,
      },
    };
  }
  
  /**
   * Extract feature comparison table
   */
  private extractFeatureComparison($: cheerio.CheerioAPI): ContentSection | null {
    const features: any[] = [];
    
    // Look for tables
    $('table').each((_, table) => {
      const $table = $(table);
      
      $table.find('tr').each((_, row) => {
        const $row = $(row);
        const cells = $row.find('td, th');
        
        if (cells.length >= 2) {
          const feature = cells.eq(0).text().trim();
          const values = cells.slice(1).map((_, cell) => $(cell).text().trim()).get();
          
          features.push({
            feature,
            values,
          });
        }
      });
    });
    
    if (features.length === 0) return null;
    
    return {
      type: 'text',
      order: 2,
      content: {
        blockType: 'feature-comparison',
        features,
      },
    };
  }
  
  /**
   * Extract FAQ section
   */
  private extractFAQ($: cheerio.CheerioAPI): ContentSection | null {
    const faqs: any[] = [];
    
    // Look for Q&A patterns
    $('h3, h4, dt').each((_, el) => {
      const $el = $(el);
      const question = $el.text().trim();
      
      if (question.includes('?') || question.length > 10) {
        const $answer = $el.next('p, dd');
        const answer = $answer.text().trim();
        
        if (answer) {
          faqs.push({
            question,
            answer,
          });
        }
      }
    });
    
    if (faqs.length < 2) return null;
    
    return {
      type: 'text',
      order: 3,
      content: {
        blockType: 'faq-section',
        faqs,
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
      const isCTA = /buy|purchase|get started|contact|demo|trial/i.test(text);
      
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
        blockType: 'pricing-cta',
        title: 'Ready to choose your plan?',
        buttons,
      },
    };
  }
}
