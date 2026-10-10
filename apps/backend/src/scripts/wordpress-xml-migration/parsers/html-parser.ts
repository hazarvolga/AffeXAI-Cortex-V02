/**
 * WordPress CMS Migration - HTML Parser
 * 
 * Parses HTML content from WordPress and extracts structured elements.
 * Uses Cheerio for HTML parsing.
 */

import * as cheerio from 'cheerio';
import { ParsedContent, ParsedElement, ButtonData } from '../types/migration.types';
import { log } from '../utils/logger';

export class HTMLParser {
  /**
   * Parse HTML content and extract structured elements
   */
  parse(html: string): ParsedContent {
    try {
      // Wrap HTML for proper parsing
      const wrappedHtml = this.wrapHTML(html);
      const $ = cheerio.load(wrappedHtml);

      // Extract different content types
      const elements = this.buildElementTree($);
      const images = this.extractImages($);
      const videos = this.extractVideos($);
      const buttons = this.extractButtons($);

      return {
        elements,
        images,
        videos,
        buttons,
      };
    } catch (error) {
      log.error('Failed to parse HTML', error);
      throw error;
    }
  }

  /**
   * Wrap HTML in container div for proper parsing
   */
  private wrapHTML(html: string): string {
    return `<div class="wp-content">${html}</div>`;
  }

  /**
   * Extract all image URLs from HTML
   */
  private extractImages($: cheerio.CheerioAPI): string[] {
    const images: string[] = [];
    
    $('img').each((_, el) => {
      const src = $(el).attr('src');
      if (src && !src.startsWith('data:')) {
        images.push(src);
      }
    });

    return images;
  }

  /**
   * Extract YouTube/Vimeo video URLs from HTML
   */
  private extractVideos($: cheerio.CheerioAPI): string[] {
    const videos: string[] = [];
    const html = $.html();

    // YouTube patterns
    const youtubeRegex = /https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/g;
    let youtubeMatch;
    while ((youtubeMatch = youtubeRegex.exec(html)) !== null) {
      videos.push(youtubeMatch[0]);
    }

    // Vimeo patterns
    const vimeoRegex = /https?:\/\/(?:www\.)?(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/g;
    let vimeoMatch;
    while ((vimeoMatch = vimeoRegex.exec(html)) !== null) {
      videos.push(vimeoMatch[0]);
    }

    // Remove duplicates
    const uniqueVideos: string[] = [];
    const seen = new Set<string>();
    for (const video of videos) {
      if (!seen.has(video)) {
        seen.add(video);
        uniqueVideos.push(video);
      }
    }

    return uniqueVideos;
  }

  /**
   * Extract button elements with text and href
   */
  private extractButtons($: cheerio.CheerioAPI): ButtonData[] {
    const buttons: ButtonData[] = [];

    // Find <a> tags with button-like classes or role
    $('a[role="button"], a.btn, a.button, button').each((_, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      const href = $el.attr('href') || '#';

      if (text && text.length > 0) {
        buttons.push({
          text,
          href,
          variant: this.detectButtonVariant($el),
          target: $el.attr('target') as '_blank' | '_self' | undefined,
        });
      }
    });

    return buttons;
  }

  /**
   * Detect button variant from CSS classes
   */
  private detectButtonVariant($el: cheerio.Cheerio<any>): 'primary' | 'secondary' | 'outline' {
    const classes = $el.attr('class') || '';
    
    if (classes.includes('primary')) return 'primary';
    if (classes.includes('secondary')) return 'secondary';
    if (classes.includes('outline')) return 'outline';
    
    return 'primary'; // Default
  }

  /**
   * Build element tree from HTML
   */
  private buildElementTree($: cheerio.CheerioAPI): ParsedElement[] {
    const elements: ParsedElement[] = [];

    $('.wp-content').children().each((_, el) => {
      const element = this.parseElement($, el);
      if (element) {
        elements.push(element);
      }
    });

    return elements;
  }

  /**
   * Parse a single HTML element
   */
  private parseElement($: cheerio.CheerioAPI, el: any): ParsedElement | null {
    const $el = $(el);
    const tagName = el.tagName?.toLowerCase();

    if (!tagName) return null;

    // Determine element type
    let type: ParsedElement['type'];
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
      type = 'heading';
    } else if (tagName === 'p') {
      type = 'paragraph';
    } else if (tagName === 'img') {
      type = 'image';
    } else if (['ul', 'ol'].includes(tagName)) {
      type = 'list';
    } else if (tagName === 'a' && $el.find('img').length === 0) {
      type = 'button';
    } else if (tagName === 'section' || tagName === 'div') {
      type = 'section';
    } else {
      type = 'paragraph'; // Default
    }

    // Extract attributes
    const attributes: Record<string, string> = {};
    if (el.attribs) {
      Object.keys(el.attribs).forEach(key => {
        attributes[key] = el.attribs[key];
      });
    }

    // Extract content
    const content = type === 'image' ? '' : $el.text().trim();

    // Extract children for sections
    const children: ParsedElement[] = [];
    if (type === 'section') {
      $el.children().each((_, child) => {
        const childElement = this.parseElement($, child);
        if (childElement) {
          children.push(childElement);
        }
      });
    }

    return {
      type,
      tagName,
      content,
      attributes,
      children,
    };
  }
}
