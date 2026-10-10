import * as cheerio from 'cheerio';
import { ContentParser } from './ContentParser';
import {
  ParsedContent,
  ContentSection,
} from './types';

/**
 * LeadMagnetParser - Parser for lead magnet/campaign pages
 * Extracts offer details, benefits, and conversion forms
 */
export class LeadMagnetParser extends ContentParser {
  /**
   * Parse lead magnet page content
   */
  parseLeadMagnetPage(htmlContent: string, filename: string): ParsedContent {
    const $ = cheerio.load(htmlContent);
    
    // Get base parsed content
    const baseContent = this.parse(htmlContent, filename);
    
    // Extract structured sections
    const sections: ContentSection[] = [];
    
    // 1. Hero/Offer Section
    const heroSection = this.extractOfferHero($);
    if (heroSection) {
      sections.push(heroSection);
    }
    
    // 2. Benefits/Value Proposition
    const benefitsSection = this.extractBenefits($);
    if (benefitsSection) {
      sections.push(benefitsSection);
    }
    
    // 3. Social Proof/Testimonials
    const socialProofSection = this.extractSocialProof($);
    if (socialProofSection) {
      sections.push(socialProofSection);
    }
    
    // 4. Urgency/Scarcity
    const urgencySection = this.extractUrgency($);
    if (urgencySection) {
      sections.push(urgencySection);
    }
    
    // 5. CTA/Form
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
   * Extract offer hero section
   */
  private extractOfferHero($: cheerio.CheerioAPI): ContentSection | null {
    const title = $('h1').first().text().trim();
    const subtitle = $('h2, p').first().text().trim();
    const image = $('img').first().attr('src') || '';
    
    if (!title) return null;
    
    return {
      type: 'hero',
      order: 0,
      content: {
        blockType: 'offer-hero',
        title,
        subtitle,
        image,
      },
    };
  }
  
  /**
   * Extract benefits/value proposition
   */
  private extractBenefits($: cheerio.CheerioAPI): ContentSection | null {
    const benefits: any[] = [];
    
    // Look for benefit statements
    $('ul li, ol li').each((_, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      
      if (text.length > 10 && text.length < 200) {
        // Check if it's a benefit (contains positive keywords)
        const isBenefit = /save|get|free|bonus|exclusive|limited|special/i.test(text);
        
        if (isBenefit || benefits.length < 5) {
          benefits.push({
            text,
          });
        }
      }
    });
    
    if (benefits.length === 0) return null;
    
    return {
      type: 'features',
      order: 1,
      content: {
        blockType: 'benefits-list',
        benefits,
      },
    };
  }
  
  /**
   * Extract social proof/testimonials
   */
  private extractSocialProof($: cheerio.CheerioAPI): ContentSection | null {
    const testimonials: any[] = [];
    
    // Look for testimonial-like content
    $('blockquote, .testimonial').each((_, el) => {
      const $el = $(el);
      const quote = $el.text().trim();
      
      if (quote.length > 20) {
        testimonials.push({
          quote,
        });
      }
    });
    
    if (testimonials.length === 0) return null;
    
    return {
      type: 'text',
      order: 2,
      content: {
        blockType: 'testimonials',
        testimonials,
      },
    };
  }
  
  /**
   * Extract urgency/scarcity messaging
   */
  private extractUrgency($: cheerio.CheerioAPI): ContentSection | null {
    const text = $.root().text();
    
    // Look for urgency keywords
    const urgencyPatterns = [
      /limited time/i,
      /expires/i,
      /only \d+ left/i,
      /hurry/i,
      /don't miss/i,
      /last chance/i,
    ];
    
    let urgencyMessage = '';
    
    for (const pattern of urgencyPatterns) {
      const match = text.match(pattern);
      if (match) {
        // Get surrounding context
        const index = text.indexOf(match[0]);
        urgencyMessage = text.substring(Math.max(0, index - 50), Math.min(text.length, index + 100)).trim();
        break;
      }
    }
    
    if (!urgencyMessage) return null;
    
    return {
      type: 'text',
      order: 3,
      content: {
        blockType: 'urgency-banner',
        message: urgencyMessage,
      },
    };
  }
  
  /**
   * Extract CTA/form section
   */
  private extractCTA($: cheerio.CheerioAPI): ContentSection | null {
    const buttons: any[] = [];
    const formFields: any[] = [];
    
    // Extract form fields
    $('input, textarea, select').each((_, field) => {
      const $field = $(field);
      const name = $field.attr('name') || '';
      const type = $field.attr('type') || 'text';
      const placeholder = $field.attr('placeholder') || '';
      
      if (name) {
        formFields.push({
          name,
          type,
          placeholder,
        });
      }
    });
    
    // Extract CTA buttons
    $('button, input[type="submit"], a').each((_, el) => {
      const $el = $(el);
      const text = $el.text().trim() || $el.attr('value') || '';
      const href = $el.attr('href') || '';
      
      // Look for CTA-like text
      const isCTA = /download|get|claim|start|register|sign up|submit/i.test(text);
      
      if (isCTA && text.length > 3 && text.length < 50) {
        buttons.push({
          text,
          href,
        });
      }
    });
    
    if (buttons.length === 0 && formFields.length === 0) return null;
    
    return {
      type: 'cta',
      order: 10,
      content: {
        blockType: 'lead-capture-form',
        title: 'Get your offer now',
        buttons,
        formFields,
      },
    };
  }
}
