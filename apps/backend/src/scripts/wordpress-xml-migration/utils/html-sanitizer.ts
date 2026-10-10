/**
 * WordPress CMS Migration - HTML Sanitizer
 * 
 * Sanitizes HTML content by removing unsafe tags and attributes
 * while preserving formatting and structure.
 */

import * as cheerio from 'cheerio';
import { log } from './logger';

export class HTMLSanitizer {
  // Unsafe tags that should be removed
  private readonly unsafeTags = [
    'script',
    'iframe',
    'object',
    'embed',
    'form',
    'input',
    'button',
    'select',
    'textarea',
    'applet',
    'base',
    'link',
    'meta',
    'style',
  ];

  // Unsafe attributes that should be removed
  private readonly unsafeAttributes = [
    'onclick',
    'ondblclick',
    'onmousedown',
    'onmouseup',
    'onmouseover',
    'onmousemove',
    'onmouseout',
    'onmouseenter',
    'onmouseleave',
    'onload',
    'onerror',
    'onabort',
    'onblur',
    'onchange',
    'onfocus',
    'onreset',
    'onsubmit',
    'onkeydown',
    'onkeypress',
    'onkeyup',
  ];

  // Safe tags that should be preserved
  private readonly safeTags = [
    'p',
    'br',
    'strong',
    'em',
    'b',
    'i',
    'u',
    'a',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'blockquote',
    'code',
    'pre',
    'span',
    'div',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'img',
  ];

  /**
   * Sanitize HTML content
   */
  sanitize(html: string): string {
    if (!html || html.trim().length === 0) {
      return '';
    }

    try {
      const $ = cheerio.load(html);

      // Remove unsafe tags
      this.removeUnsafeTags($);

      // Remove unsafe attributes
      this.removeUnsafeAttributes($);

      // Clean up javascript: URLs
      this.cleanJavaScriptUrls($);

      // Get sanitized HTML
      const sanitized = $.html();

      log.info('HTML sanitized successfully');

      return sanitized;
    } catch (error) {
      log.error('Failed to sanitize HTML', error);
      return '';
    }
  }

  /**
   * Remove unsafe tags from HTML
   */
  private removeUnsafeTags($: cheerio.CheerioAPI): void {
    this.unsafeTags.forEach((tag) => {
      $(tag).remove();
    });
  }

  /**
   * Remove unsafe attributes from all elements
   */
  private removeUnsafeAttributes($: cheerio.CheerioAPI): void {
    $('*').each((_, element) => {
      const $element = $(element);

      // Remove unsafe event handlers
      this.unsafeAttributes.forEach((attr) => {
        if ($element.attr(attr)) {
          $element.removeAttr(attr);
        }
      });

      // Check all attributes for javascript: (except href and src - they're handled by cleanJavaScriptUrls)
      const attributes = $element.attr();
      if (attributes) {
        Object.keys(attributes).forEach((attr) => {
          // Skip href and src - they're cleaned by cleanJavaScriptUrls()
          if (attr === 'href' || attr === 'src') {
            return;
          }
          
          const value = attributes[attr];
          if (value && typeof value === 'string' && value.toLowerCase().includes('javascript:')) {
            $element.removeAttr(attr);
          }
        });
      }
    });
  }

  /**
   * Clean javascript: URLs from href and src attributes
   */
  private cleanJavaScriptUrls($: cheerio.CheerioAPI): void {
    // Clean href attributes
    $('a[href]').each((_, element) => {
      const $element = $(element);
      const href = $element.attr('href');

      if (href && href.toLowerCase().trim().startsWith('javascript:')) {
        $element.attr('href', '#');
      }
    });

    // Clean src attributes
    $('img[src]').each((_, element) => {
      const $element = $(element);
      const src = $element.attr('src');

      if (src && src.toLowerCase().trim().startsWith('javascript:')) {
        $element.removeAttr('src');
      }
    });
  }

  /**
   * Check if HTML contains unsafe content
   */
  containsUnsafeContent(html: string): boolean {
    if (!html) {
      return false;
    }

    const lowerHtml = html.toLowerCase();

    // Check for unsafe tags
    for (const tag of this.unsafeTags) {
      if (lowerHtml.includes(`<${tag}`)) {
        return true;
      }
    }

    // Check for unsafe attributes
    for (const attr of this.unsafeAttributes) {
      if (lowerHtml.includes(attr)) {
        return true;
      }
    }

    // Check for javascript: URLs
    if (lowerHtml.includes('javascript:')) {
      return true;
    }

    return false;
  }

  /**
   * Get list of unsafe tags that would be removed
   */
  getUnsafeTags(): string[] {
    return [...this.unsafeTags];
  }

  /**
   * Get list of unsafe attributes that would be removed
   */
  getUnsafeAttributes(): string[] {
    return [...this.unsafeAttributes];
  }

  /**
   * Get list of safe tags that are preserved
   */
  getSafeTags(): string[] {
    return [...this.safeTags];
  }
}
