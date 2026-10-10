import * as cheerio from 'cheerio';
import {
  ParsedContent,
  ContentSection,
  ImageReference,
  VideoReference,
  LinkReference,
  PageMetadata,
} from './types';

/**
 * Base ContentParser class for parsing WordPress HTML exports
 * Extracts structured content including title, sections, images, videos, and links
 */
export class ContentParser {
  /**
   * Parse HTML content from a WordPress export file
   * @param htmlContent - Raw HTML content
   * @param filename - Source filename for metadata
   * @returns Parsed content structure
   */
  parse(htmlContent: string, filename: string): ParsedContent {
    const $ = cheerio.load(htmlContent);
    
    // Extract title from filename and H1/H2 tags
    const title = this.extractTitle($, filename);
    
    // Generate slug from title
    const slug = this.generateSlug(title);
    
    // Extract sections by analyzing HTML structure
    const sections = this.extractSections($);
    
    // Extract image references with context
    const images = this.extractImages($);
    
    // Extract video URLs (YouTube, Vimeo)
    const videos = this.extractVideos($);
    
    // Extract all links (internal and external)
    const links = this.extractLinks($);
    
    // Create metadata
    const metadata: PageMetadata = {
      filename,
      category: this.inferCategory(filename),
      priority: this.inferPriority(filename),
    };
    
    return {
      title,
      slug,
      sections,
      images,
      videos,
      links,
      metadata,
    };
  }
  
  /**
   * Extract title from filename and HTML heading tags
   */
  protected extractTitle($: cheerio.CheerioAPI, filename: string): string {
    // First try to get title from the first line (Title: ...)
    const firstLine = $.root().text().split('\n')[0];
    if (firstLine && firstLine.startsWith('Title:')) {
      return firstLine.replace('Title:', '').trim();
    }
    
    // Try to find H1 or H2 tags
    const h1 = $('h1').first().text().trim();
    if (h1) return h1;
    
    const h2 = $('h2').first().text().trim();
    if (h2) return h2;
    
    // Fallback to filename without extension
    return filename.replace(/\.(txt|html)$/, '').replace(/-/g, ' ');
  }
  
  /**
   * Generate URL-friendly slug from title
   */
  protected generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')          // Replace spaces with hyphens
      .replace(/-+/g, '-')           // Replace multiple hyphens with single
      .replace(/^-|-$/g, '');        // Remove leading/trailing hyphens
  }
  
  /**
   * Extract content sections by analyzing HTML structure
   */
  protected extractSections($: cheerio.CheerioAPI): ContentSection[] {
    const sections: ContentSection[] = [];
    let order = 0;
    
    // Extract hero section (first h2 elements)
    const heroHeadings = $('h2').slice(0, 3);
    if (heroHeadings.length > 0) {
      sections.push({
        type: 'hero',
        order: order++,
        content: {
          headings: heroHeadings.map((_, el) => $(el).text().trim()).get(),
        },
      });
    }
    
    // Extract workflow tabs (ul[role="tablist"])
    $('ul[role="tablist"]').each((_, tabList) => {
      const tabs = $(tabList).find('li[role="tab"]');
      if (tabs.length > 0) {
        sections.push({
          type: 'workflow',
          order: order++,
          content: {
            tabs: tabs.map((_, tab) => ({
              id: $(tab).attr('id') || '',
              label: $(tab).text().trim(),
            })).get(),
          },
        });
      }
    });
    
    // Extract text sections (paragraphs)
    $('p').each((_, p) => {
      const text = $(p).text().trim();
      if (text && text.length > 50) { // Only meaningful paragraphs
        sections.push({
          type: 'text',
          order: order++,
          content: { text },
        });
      }
    });
    
    // Extract stats sections (percentage values)
    const statsElements = $('*').filter((_, el) => {
      const text = $(el).text();
      return /\d+%/.test(text);
    });
    
    if (statsElements.length > 0) {
      const stats: any[] = [];
      statsElements.each((_, el) => {
        const text = $(el).text().trim();
        const match = text.match(/(\d+)%/);
        if (match) {
          stats.push({
            value: match[1] + '%',
            label: text.replace(/\d+%/, '').trim(),
          });
        }
      });
      
      if (stats.length > 0) {
        sections.push({
          type: 'stats',
          order: order++,
          content: { stats },
        });
      }
    }
    
    // Extract features (figure + h3 + p pattern)
    const features: any[] = [];
    $('figure').each((_, figure) => {
      const $figure = $(figure);
      const img = $figure.find('img').attr('src');
      const nextH3 = $figure.next('h3');
      const nextP = nextH3.next('p');
      
      if (img && nextH3.length > 0) {
        features.push({
          icon: img,
          title: nextH3.text().trim(),
          description: nextP.text().trim(),
        });
      }
    });
    
    if (features.length > 0) {
      sections.push({
        type: 'features',
        order: order++,
        content: { features },
      });
    }
    
    // Extract CTA sections (links with specific patterns)
    const ctaLinks = $('a').filter((_, link) => {
      const text = $(link).text().trim();
      return text.length > 0 && text.length < 100;
    });
    
    if (ctaLinks.length > 0) {
      sections.push({
        type: 'cta',
        order: order++,
        content: {
          buttons: ctaLinks.map((_, link) => ({
            text: $(link).text().trim(),
            url: $(link).attr('href') || '',
          })).get(),
        },
      });
    }
    
    return sections;
  }
  
  /**
   * Extract image references with context
   */
  protected extractImages($: cheerio.CheerioAPI): ImageReference[] {
    const images: ImageReference[] = [];
    
    $('img').each((index, img) => {
      const $img = $(img);
      const src = $img.attr('src');
      const alt = $img.attr('alt') || '';
      
      if (src) {
        // Determine context based on surrounding elements
        const parent = $img.parent();
        let context = `image-${index}`;
        
        if (parent.is('figure')) {
          context = 'feature';
        } else if (parent.closest('section').length > 0) {
          context = 'section';
        } else if (index === 0) {
          context = 'hero';
        }
        
        images.push({
          originalUrl: src,
          altText: alt,
          context,
        });
      }
    });
    
    return images;
  }
  
  /**
   * Extract video URLs (YouTube, Vimeo)
   */
  protected extractVideos($: cheerio.CheerioAPI): VideoReference[] {
    const videos: VideoReference[] = [];
    
    // Find YouTube URLs in text content
    const text = $.root().text();
    const youtubeRegex = /https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/g;
    let match;
    
    while ((match = youtubeRegex.exec(text)) !== null) {
      videos.push({
        url: match[0],
        platform: 'youtube',
      });
    }
    
    // Find Vimeo URLs
    const vimeoRegex = /https?:\/\/(www\.)?vimeo\.com\/(\d+)/g;
    while ((match = vimeoRegex.exec(text)) !== null) {
      videos.push({
        url: match[0],
        platform: 'vimeo',
      });
    }
    
    // Find iframe embeds
    $('iframe').each((_, iframe) => {
      const src = $(iframe).attr('src');
      if (src) {
        if (src.includes('youtube.com') || src.includes('youtu.be')) {
          videos.push({
            url: src,
            platform: 'youtube',
            embedCode: $.html(iframe),
          });
        } else if (src.includes('vimeo.com')) {
          videos.push({
            url: src,
            platform: 'vimeo',
            embedCode: $.html(iframe),
          });
        } else {
          videos.push({
            url: src,
            platform: 'other',
            embedCode: $.html(iframe),
          });
        }
      }
    });
    
    return videos;
  }
  
  /**
   * Extract all links (internal and external)
   */
  protected extractLinks($: cheerio.CheerioAPI): LinkReference[] {
    const links: LinkReference[] = [];
    
    $('a').each((_, link) => {
      const $link = $(link);
      const href = $link.attr('href');
      const text = $link.text().trim();
      
      if (href) {
        const isInternal = 
          href.startsWith('/') || 
          href.includes('aluplan.com.tr') ||
          href.includes('aluplan.tr');
        
        links.push({
          url: href,
          text,
          isInternal,
        });
      }
    });
    
    return links;
  }
  
  /**
   * Infer category from filename
   */
  protected inferCategory(filename: string): string {
    const lower = filename.toLowerCase();
    
    if (lower.includes('architecture') || lower.includes('mimari')) {
      return 'Architecture';
    }
    if (lower.includes('engineering') || lower.includes('muhendislik')) {
      return 'Engineering';
    }
    if (lower.includes('bridge') || lower.includes('kopru')) {
      return 'Bridge Design';
    }
    if (lower.includes('road') || lower.includes('yol')) {
      return 'Road Design';
    }
    if (lower.includes('precast') || lower.includes('prekast')) {
      return 'Precast';
    }
    if (lower.includes('product') || lower.includes('urun')) {
      return 'Product';
    }
    
    return 'General';
  }
  
  /**
   * Infer priority from filename
   */
  protected inferPriority(filename: string): 'high' | 'medium' | 'low' {
    const lower = filename.toLowerCase();
    
    // High priority: Industry solution pages
    if (
      lower.includes('architecture') ||
      lower.includes('engineering') ||
      lower.includes('bridge') ||
      lower.includes('road')
    ) {
      return 'high';
    }
    
    // Medium priority: Product pages
    if (lower.includes('product') || lower.includes('allplan')) {
      return 'medium';
    }
    
    // Low priority: Other pages
    return 'low';
  }
}
