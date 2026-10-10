import * as cheerio from 'cheerio';
import { ContentParser } from './ContentParser';
import { ParsedContent, ButtonConfig } from './types';

/**
 * Corporate Homepage specific content structure
 */
export interface CorporateHomepageContent extends ParsedContent {
  heroCarousel: HeroCarouselSection;
  solutionsSections: SolutionsSection[];
  productsSections: ProductsSection[];
  features: FeatureHighlight[];
  cta: CTASection;
  newsletter?: NewsletterSection;
}

export interface HeroCarouselSection {
  slides: HeroSlide[];
}

export interface HeroSlide {
  title: string;
  subtitle: string;
  description?: string;
  backgroundImage?: string;
  ctaButton?: ButtonConfig;
}

export interface SolutionsSection {
  title: string;
  subtitle?: string;
  items: SolutionItem[];
}

export interface SolutionItem {
  title: string;
  description: string;
  image?: string;
  link?: string;
  category?: string;
}

export interface ProductsSection {
  title: string;
  subtitle?: string;
  items: ProductItem[];
}

export interface ProductItem {
  title: string;
  description: string;
  image?: string;
  link?: string;
  category?: string;
}

export interface FeatureHighlight {
  icon?: string;
  title: string;
  description: string;
}

export interface CTASection {
  title: string;
  description?: string;
  primaryButton?: ButtonConfig;
  secondaryButton?: ButtonConfig;
  backgroundImage?: string;
}

export interface NewsletterSection {
  title: string;
  description?: string;
  benefits?: string[];
}

/**
 * CorporateHomepageParser - Parses corporate homepage content
 * Extracts hero carousel, solutions, products, features, CTA, and newsletter
 */
export class CorporateHomepageParser extends ContentParser {
  /**
   * Parse corporate homepage content
   */
  parseCorporateHomepage(htmlContent: string, filename: string): CorporateHomepageContent {
    const $ = cheerio.load(htmlContent);
    
    // Get base parsed content
    const baseContent = this.parse(htmlContent, filename);
    
    // Extract hero carousel
    const heroCarousel = this.extractHeroCarousel($);
    
    // Extract solutions sections
    const solutionsSections = this.extractSolutionsSections($);
    
    // Extract products sections
    const productsSections = this.extractProductsSections($);
    
    // Extract feature highlights
    const features = this.extractFeatureHighlights($);
    
    // Extract CTA section
    const cta = this.extractCTASection($);
    
    // Extract newsletter section
    const newsletter = this.extractNewsletterSection($);
    
    return {
      ...baseContent,
      heroCarousel,
      solutionsSections,
      productsSections,
      features,
      cta,
      newsletter,
    };
  }
  
  /**
   * Extract hero carousel slides
   * Looks for multiple h2 elements at the top, YouTube embeds, and CTA buttons
   */
  private extractHeroCarousel($: cheerio.CheerioAPI): HeroCarouselSection {
    const slides: HeroSlide[] = [];
    
    // Get first few h2 elements as hero content
    const h2Elements = $('h2').slice(0, 5);
    
    // Group h2 elements into slides (every 2-3 h2s = 1 slide)
    let currentSlide: Partial<HeroSlide> = {};
    let h2Count = 0;
    
    h2Elements.each((index, el) => {
      const text = $(el).text().trim();
      
      if (!text) return;
      
      if (h2Count === 0) {
        currentSlide.title = text;
      } else if (h2Count === 1) {
        currentSlide.subtitle = text;
      } else if (h2Count === 2) {
        currentSlide.description = text;
      }
      
      h2Count++;
      
      // After 2-3 h2s, create a slide
      if (h2Count >= 2) {
        if (currentSlide.title) {
          slides.push({
            title: currentSlide.title,
            subtitle: currentSlide.subtitle || '',
            description: currentSlide.description,
          });
        }
        currentSlide = {};
        h2Count = 0;
      }
    });
    
    // Add remaining slide
    if (currentSlide.title) {
      slides.push({
        title: currentSlide.title,
        subtitle: currentSlide.subtitle || '',
        description: currentSlide.description,
      });
    }
    
    // Extract CTA buttons (first few links)
    const ctaLinks = $('a').slice(0, 5);
    ctaLinks.each((index, el) => {
      const $link = $(el);
      const text = $link.text().trim();
      const href = $link.attr('href') || '#';
      
      // Skip empty or very short links
      if (!text || text.length < 3) return;
      
      // Assign to slides
      if (slides[index]) {
        slides[index].ctaButton = {
          text,
          url: href,
          variant: 'primary',
        };
      }
    });
    
    // Extract background images (first few images)
    const images = $('img').slice(0, slides.length);
    images.each((index, el) => {
      const src = $(el).attr('src');
      if (src && slides[index]) {
        slides[index].backgroundImage = src;
      }
    });
    
    return { slides };
  }
  
  /**
   * Extract solutions sections
   * Looks for sections with "Çözüm", "Solution", "BİNA", "ALTYAPI" keywords
   */
  private extractSolutionsSections($: cheerio.CheerioAPI): SolutionsSection[] {
    const sections: SolutionsSection[] = [];
    
    // Find h2 elements that contain solution-related keywords
    $('h2').each((_, el) => {
      const text = $(el).text().trim().toUpperCase();
      
      if (text.includes('ÇÖZÜM') || text.includes('SOLUTION') || 
          text.includes('BİNA') || text.includes('ALTYAPI') ||
          text.includes('TASARIM') || text.includes('DESIGN')) {
        
        const section: SolutionsSection = {
          title: $(el).text().trim(),
          items: [],
        };
        
        // Find related content (next siblings until next h2)
        let current = $(el).next();
        while (current.length && !current.is('h2')) {
          // Look for links and images
          const links = current.find('a');
          const images = current.find('img');
          
          links.each((_, link) => {
            const $link = $(link);
            const title = $link.text().trim();
            const href = $link.attr('href') || '';
            
            if (title && title.length > 3) {
              section.items.push({
                title,
                description: '',
                link: href,
              });
            }
          });
          
          current = current.next();
        }
        
        if (section.items.length > 0) {
          sections.push(section);
        }
      }
    });
    
    return sections;
  }
  
  /**
   * Extract products sections
   * Looks for sections with "Ürün", "Product", "ALLPLAN" keywords
   */
  private extractProductsSections($: cheerio.CheerioAPI): ProductsSection[] {
    const sections: ProductsSection[] = [];
    
    // Find h2 elements that contain product-related keywords
    $('h2').each((_, el) => {
      const text = $(el).text().trim().toUpperCase();
      
      if (text.includes('ÜRÜN') || text.includes('PRODUCT') || 
          text.includes('ALLPLAN') || text.includes('BIMPLUS')) {
        
        const section: ProductsSection = {
          title: $(el).text().trim(),
          items: [],
        };
        
        // Find related content
        let current = $(el).next();
        while (current.length && !current.is('h2')) {
          const links = current.find('a');
          const images = current.find('img');
          
          links.each((_, link) => {
            const $link = $(link);
            const title = $link.text().trim();
            const href = $link.attr('href') || '';
            
            if (title && title.length > 3) {
              section.items.push({
                title,
                description: '',
                link: href,
              });
            }
          });
          
          current = current.next();
        }
        
        if (section.items.length > 0) {
          sections.push(section);
        }
      }
    });
    
    return sections;
  }
  
  /**
   * Extract feature highlights
   * Looks for short text blocks with icons or bullet points
   */
  private extractFeatureHighlights($: cheerio.CheerioAPI): FeatureHighlight[] {
    const features: FeatureHighlight[] = [];
    
    // Look for paragraphs that might be features
    $('p').each((_, el) => {
      const text = $(el).text().trim();
      
      // Features are usually short (50-200 chars)
      if (text.length >= 20 && text.length <= 200) {
        // Check if it looks like a feature (has colon or dash)
        if (text.includes(':') || text.includes('–') || text.includes('-')) {
          const parts = text.split(/[:–-]/);
          if (parts.length >= 2) {
            features.push({
              title: parts[0].trim(),
              description: parts.slice(1).join(':').trim(),
            });
          }
        }
      }
    });
    
    return features.slice(0, 6); // Limit to 6 features
  }
  
  /**
   * Extract CTA section
   * Looks for "Demo", "Dene", "İletişim", "Contact" keywords
   */
  private extractCTASection($: cheerio.CheerioAPI): CTASection {
    const cta: CTASection = {
      title: 'Hemen Başlayın',
      description: 'BIM ile dönüşümünüze bugün başlayın',
    };
    
    // Find CTA-related h2
    $('h2').each((_, el) => {
      const text = $(el).text().trim().toUpperCase();
      
      if (text.includes('DEMO') || text.includes('DENE') || 
          text.includes('İLETİŞİM') || text.includes('CONTACT') ||
          text.includes('BAŞLA') || text.includes('START')) {
        cta.title = $(el).text().trim();
        
        // Find next paragraph as description
        const nextP = $(el).next('p');
        if (nextP.length) {
          cta.description = nextP.text().trim();
        }
      }
    });
    
    // Find CTA buttons (look for "demo", "teklif", "contact" in links)
    $('a').each((_, el) => {
      const $link = $(el);
      const text = $link.text().trim().toUpperCase();
      const href = $link.attr('href') || '';
      
      if (text.includes('DEMO') || text.includes('DENE')) {
        cta.primaryButton = {
          text: $link.text().trim(),
          url: href,
          variant: 'primary',
        };
      } else if (text.includes('TEKLİF') || text.includes('İLETİŞİM') || text.includes('CONTACT')) {
        cta.secondaryButton = {
          text: $link.text().trim(),
          url: href,
          variant: 'secondary',
        };
      }
    });
    
    return cta;
  }
  
  /**
   * Extract newsletter section
   * Looks for "Bülten", "Newsletter", "E-bülten" keywords
   */
  private extractNewsletterSection($: cheerio.CheerioAPI): NewsletterSection | undefined {
    let newsletter: NewsletterSection | undefined;
    
    $('h2, h3, h4').each((_, el) => {
      const text = $(el).text().trim().toUpperCase();
      
      if (text.includes('BÜLTEN') || text.includes('NEWSLETTER') || text.includes('E-BÜLTEN')) {
        newsletter = {
          title: $(el).text().trim(),
          benefits: [],
        };
        
        // Find next paragraph as description
        const nextP = $(el).next('p');
        if (nextP.length) {
          newsletter.description = nextP.text().trim();
        }
        
        // Find benefits (list items or paragraphs after)
        let current = $(el).next();
        while (current.length && !current.is('h2, h3')) {
          if (current.is('p')) {
            const benefit = current.text().trim();
            if (benefit && benefit.length > 10 && benefit.length < 200) {
              newsletter.benefits?.push(benefit);
            }
          }
          current = current.next();
        }
      }
    });
    
    return newsletter;
  }
}
