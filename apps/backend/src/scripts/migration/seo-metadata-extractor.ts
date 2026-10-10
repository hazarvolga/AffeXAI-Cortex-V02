/**
 * SEO Metadata Extractor
 * 
 * Extracts SEO metadata from WordPress HTML content
 * 
 * Features:
 * - Extracts meta title, description, keywords
 * - Extracts Open Graph tags (og:title, og:description, og:image)
 * - Generates default values when missing
 * - Sanitizes and validates metadata
 */

import * as cheerio from 'cheerio';

export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
}

export class SEOMetadataExtractor {
  /**
   * Extract SEO metadata from HTML
   */
  extractFromHTML(html: string): SEOMetadata {
    const $ = cheerio.load(html);

    const metadata: SEOMetadata = {
      title: this.extractTitle($),
      description: this.extractDescription($),
      keywords: this.extractKeywords($),
      ogTitle: this.extractOpenGraphTag($, 'og:title'),
      ogDescription: this.extractOpenGraphTag($, 'og:description'),
      ogImage: this.extractOpenGraphTag($, 'og:image'),
      canonicalUrl: this.extractCanonicalUrl($),
    };

    return metadata;
  }

  /**
   * Generate default SEO metadata from page title and content
   */
  generateDefaults(pageTitle: string, content: string): SEOMetadata {
    const description = this.generateDescription(content, 160);
    const keywords = this.extractKeywordsFromContent(content);

    return {
      title: pageTitle,
      description,
      keywords,
      ogTitle: pageTitle,
      ogDescription: description,
    };
  }

  /**
   * Merge extracted metadata with defaults
   */
  mergeWithDefaults(extracted: SEOMetadata, defaults: SEOMetadata): SEOMetadata {
    return {
      title: extracted.title || defaults.title,
      description: extracted.description || defaults.description,
      keywords: extracted.keywords.length > 0 ? extracted.keywords : defaults.keywords,
      ogTitle: extracted.ogTitle || defaults.ogTitle,
      ogDescription: extracted.ogDescription || defaults.ogDescription,
      ogImage: extracted.ogImage,
      canonicalUrl: extracted.canonicalUrl,
    };
  }

  /**
   * Extract title from HTML
   */
  private extractTitle($: cheerio.CheerioAPI): string {
    // Try meta title first
    const metaTitle = $('meta[name="title"]').attr('content');
    if (metaTitle) return this.sanitizeText(metaTitle);

    // Try <title> tag
    const titleTag = $('title').text();
    if (titleTag) return this.sanitizeText(titleTag);

    // Try first H1
    const h1 = $('h1').first().text();
    if (h1) return this.sanitizeText(h1);

    return '';
  }

  /**
   * Extract description from HTML
   */
  private extractDescription($: cheerio.CheerioAPI): string {
    // Try meta description
    const metaDesc = $('meta[name="description"]').attr('content');
    if (metaDesc) return this.sanitizeText(metaDesc);

    // Try Open Graph description
    const ogDesc = $('meta[property="og:description"]').attr('content');
    if (ogDesc) return this.sanitizeText(ogDesc);

    return '';
  }

  /**
   * Extract keywords from HTML
   */
  private extractKeywords($: cheerio.CheerioAPI): string[] {
    const metaKeywords = $('meta[name="keywords"]').attr('content');
    if (!metaKeywords) return [];

    return metaKeywords
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);
  }

  /**
   * Extract Open Graph tag
   */
  private extractOpenGraphTag($: cheerio.CheerioAPI, property: string): string | undefined {
    const content = $(`meta[property="${property}"]`).attr('content');
    return content ? this.sanitizeText(content) : undefined;
  }

  /**
   * Extract canonical URL
   */
  private extractCanonicalUrl($: cheerio.CheerioAPI): string | undefined {
    const canonical = $('link[rel="canonical"]').attr('href');
    return canonical || undefined;
  }

  /**
   * Generate description from content
   */
  private generateDescription(content: string, maxLength: number = 160): string {
    // Remove HTML tags
    const text = content.replace(/<[^>]*>/g, ' ');

    // Remove extra whitespace
    const cleaned = text.replace(/\s+/g, ' ').trim();

    // Truncate to maxLength
    if (cleaned.length <= maxLength) {
      return cleaned;
    }

    // Find last complete sentence within maxLength
    const truncated = cleaned.substring(0, maxLength);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastQuestion = truncated.lastIndexOf('?');
    const lastExclamation = truncated.lastIndexOf('!');

    const lastSentenceEnd = Math.max(lastPeriod, lastQuestion, lastExclamation);

    if (lastSentenceEnd > maxLength * 0.7) {
      // If we found a sentence end in the last 30%, use it
      return truncated.substring(0, lastSentenceEnd + 1).trim();
    }

    // Otherwise, find last space and add ellipsis
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 0) {
      return truncated.substring(0, lastSpace).trim() + '...';
    }

    return truncated + '...';
  }

  /**
   * Extract keywords from content
   */
  private extractKeywordsFromContent(content: string, maxKeywords: number = 10): string[] {
    // Remove HTML tags
    const text = content.replace(/<[^>]*>/g, ' ');

    // Split into words
    const words = text
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3); // Only words longer than 3 chars

    // Count word frequency
    const frequency: Record<string, number> = {};
    words.forEach((word) => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    // Sort by frequency and take top N
    const keywords = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxKeywords)
      .map(([word]) => word);

    return keywords;
  }

  /**
   * Sanitize text (remove extra whitespace, trim)
   */
  private sanitizeText(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }

  /**
   * Validate SEO metadata
   */
  validate(metadata: SEOMetadata): {
    valid: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];

    // Check title length
    if (metadata.title.length === 0) {
      warnings.push('Title is empty');
    } else if (metadata.title.length < 30) {
      warnings.push('Title is too short (< 30 characters)');
    } else if (metadata.title.length > 60) {
      warnings.push('Title is too long (> 60 characters)');
    }

    // Check description length
    if (metadata.description.length === 0) {
      warnings.push('Description is empty');
    } else if (metadata.description.length < 120) {
      warnings.push('Description is too short (< 120 characters)');
    } else if (metadata.description.length > 160) {
      warnings.push('Description is too long (> 160 characters)');
    }

    // Check keywords
    if (metadata.keywords.length === 0) {
      warnings.push('No keywords provided');
    }

    // Check Open Graph
    if (!metadata.ogTitle) {
      warnings.push('Open Graph title missing');
    }
    if (!metadata.ogDescription) {
      warnings.push('Open Graph description missing');
    }
    if (!metadata.ogImage) {
      warnings.push('Open Graph image missing');
    }

    return {
      valid: warnings.length === 0,
      warnings,
    };
  }
}
