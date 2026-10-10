import * as cheerio from 'cheerio';
import { ContentParser } from './ContentParser';
import {
  ParsedContent,
  ContentSection,
} from './types';

/**
 * ThankYouPageParser - Parser for thank you/confirmation pages
 * Extracts confirmation message, next steps, and related content
 */
export class ThankYouPageParser extends ContentParser {
  /**
   * Parse thank you page content
   */
  parseThankYouPage(htmlContent: string, filename: string): ParsedContent {
    const $ = cheerio.load(htmlContent);
    
    // Get base parsed content
    const baseContent = this.parse(htmlContent, filename);
    
    // Extract structured sections
    const sections: ContentSection[] = [];
    
    // 1. Confirmation Message
    const confirmationSection = this.extractConfirmation($);
    if (confirmationSection) {
      sections.push(confirmationSection);
    }
    
    // 2. Next Steps
    const nextStepsSection = this.extractNextSteps($);
    if (nextStepsSection) {
      sections.push(nextStepsSection);
    }
    
    // 3. Related Resources
    const resourcesSection = this.extractResources($);
    if (resourcesSection) {
      sections.push(resourcesSection);
    }
    
    // 4. Social Sharing
    const socialSection = this.extractSocialSharing($);
    if (socialSection) {
      sections.push(socialSection);
    }
    
    return {
      ...baseContent,
      sections,
    };
  }
  
  /**
   * Extract confirmation message
   */
  private extractConfirmation($: cheerio.CheerioAPI): ContentSection | null {
    const title = $('h1').first().text().trim();
    const message = $('p').first().text().trim();
    
    if (!title) return null;
    
    return {
      type: 'hero',
      order: 0,
      content: {
        blockType: 'confirmation-message',
        title,
        message,
      },
    };
  }
  
  /**
   * Extract next steps
   */
  private extractNextSteps($: cheerio.CheerioAPI): ContentSection | null {
    const steps: any[] = [];
    
    $('h2, h3, li').each((_, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      
      if (text.length > 10 && text.length < 200) {
        steps.push({
          text,
        });
      }
    });
    
    if (steps.length === 0) return null;
    
    return {
      type: 'text',
      order: 1,
      content: {
        blockType: 'next-steps',
        steps,
      },
    };
  }
  
  /**
   * Extract related resources
   */
  private extractResources($: cheerio.CheerioAPI): ContentSection | null {
    const resources: any[] = [];
    
    $('a').each((_, link) => {
      const $link = $(link);
      const text = $link.text().trim();
      const href = $link.attr('href') || '';
      
      if (text.length > 5 && href) {
        resources.push({
          title: text,
          url: href,
        });
      }
    });
    
    if (resources.length === 0) return null;
    
    return {
      type: 'text',
      order: 2,
      content: {
        blockType: 'related-resources',
        resources,
      },
    };
  }
  
  /**
   * Extract social sharing
   */
  private extractSocialSharing($: cheerio.CheerioAPI): ContentSection | null {
    const socialLinks: any[] = [];
    
    $('a').each((_, link) => {
      const $link = $(link);
      const href = $link.attr('href') || '';
      
      // Check for social media URLs
      const socialPlatforms = ['facebook', 'twitter', 'linkedin', 'instagram'];
      const platform = socialPlatforms.find(p => href.includes(p));
      
      if (platform) {
        socialLinks.push({
          platform,
          url: href,
        });
      }
    });
    
    if (socialLinks.length === 0) return null;
    
    return {
      type: 'text',
      order: 3,
      content: {
        blockType: 'social-sharing',
        links: socialLinks,
      },
    };
  }
}
