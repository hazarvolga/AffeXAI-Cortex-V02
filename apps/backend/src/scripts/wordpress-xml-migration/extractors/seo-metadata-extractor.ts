/**
 * WordPress CMS Migration - SEO Metadata Extractor
 * 
 * Extracts SEO metadata from WordPress HTML content.
 * Generates default metadata when not present.
 */

import * as cheerio from 'cheerio';
import { log } from '../utils/logger';

export interface SEOMetadata {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

export class SEOMetadataExtractor {
  /**
   * Extract SEO metadata from HTML content
   */
  extractMetadata(html: string, pageTitle: string): SEOMetadata {
    const $ = cheerio.load(html);
    
    const metadata: SEOMetadata = {};

    // Extract meta title
    metadata.metaTitle = this.extractMetaTitle($, pageTitle);

    // Extract meta description
    metadata.metaDescription = this.extractMetaDescription($, html);

    // Extract meta keywords
    metadata.metaKeywords = this.extractMetaKeywords($);

    // Extract Open Graph tags
    const ogData = this.extractOpenGraphTags($);
    metadata.ogTitle = ogData.ogTitle;
    metadata.ogDescription = ogData.ogDescription;
    metadata.ogImage = ogData.ogImage;

    log.info(`Extracted SEO metadata for: ${pageTitle}`);

    return metadata;
  }

  /**
   * Extract meta title from HTML or use page title
   */
  private extractMetaTitle($: cheerio.CheerioAPI, pageTitle: string): string {
    // Try <title> tag
    const titleTag = $('title').first().text().trim();
    if (titleTag && titleTag.length > 0) {
      return titleTag;
    }

    // Try <meta name="title">
    const metaTitle = $('meta[name="title"]').attr('content')?.trim();
    if (metaTitle && metaTitle.length > 0) {
      return metaTitle;
    }

    // Fallback to page title (trim whitespace)
    const cleanPageTitle = pageTitle.trim();
    if (cleanPageTitle.length > 0) {
      return cleanPageTitle;
    }

    // Ultimate fallback
    return 'Untitled Page';
  }

  /**
   * Extract meta description or generate from content
   */
  private extractMetaDescription($: cheerio.CheerioAPI, html: string): string {
    // Try <meta name="description">
    const metaDesc = $('meta[name="description"]').attr('content')?.trim();
    if (metaDesc) {
      return metaDesc;
    }

    // Generate from first 160 characters of text content
    return this.generateDescriptionFromContent($);
  }

  /**
   * Generate description from first 160 characters of content
   */
  private generateDescriptionFromContent($: cheerio.CheerioAPI): string {
    // Remove script and style tags
    $('script, style').remove();

    // Get all text content
    const textContent = $('body').text() || $.text();
    
    // Clean up whitespace
    const cleanText = textContent
      .replace(/\s+/g, ' ')
      .trim();

    // If no content, return a default message
    if (cleanText.length === 0) {
      return 'No description available';
    }

    // Take first 160 characters
    if (cleanText.length <= 160) {
      return cleanText;
    }

    // Truncate at word boundary
    const truncated = cleanText.substring(0, 160);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > 0) {
      return truncated.substring(0, lastSpace) + '...';
    }

    return truncated + '...';
  }

  /**
   * Extract meta keywords
   */
  private extractMetaKeywords($: cheerio.CheerioAPI): string | undefined {
    const keywords = $('meta[name="keywords"]').attr('content')?.trim();
    return keywords || undefined;
  }

  /**
   * Extract Open Graph tags
   */
  private extractOpenGraphTags($: cheerio.CheerioAPI): {
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
  } {
    const ogTitle = $('meta[property="og:title"]').attr('content')?.trim();
    const ogDescription = $('meta[property="og:description"]').attr('content')?.trim();
    const ogImage = $('meta[property="og:image"]').attr('content')?.trim();

    return {
      ogTitle: ogTitle || undefined,
      ogDescription: ogDescription || undefined,
      ogImage: ogImage || undefined,
    };
  }

  /**
   * Convert og:image URL to relative path
   */
  convertOgImageToRelativePath(ogImage: string | undefined): string | undefined {
    if (!ogImage) {
      return undefined;
    }

    try {
      // If it's already a relative path, return as-is
      if (ogImage.startsWith('/')) {
        return ogImage;
      }

      // Parse URL and extract pathname
      const url = new URL(ogImage);
      return url.pathname;
    } catch (error) {
      // If URL parsing fails, try to extract /cms-media/ path
      const match = ogImage.match(/\/cms-media\/.+/);
      if (match) {
        return match[0];
      }

      log.warn(`Could not convert og:image to relative path: ${ogImage}`);
      return undefined;
    }
  }

  /**
   * Validate that metadata has required fields
   */
  validateMetadata(metadata: SEOMetadata): boolean {
    // At minimum, should have metaTitle and metaDescription
    return !!(metadata.metaTitle && metadata.metaDescription);
  }
}
