/**
 * WordPress CMS Migration - Button Extractor
 * 
 * Extracts button elements from WordPress HTML content.
 * Detects actual button text vs placeholder text.
 */

import * as cheerio from 'cheerio';
import { log } from '../utils/logger';

export interface ButtonData {
  text: string;
  href: string;
  variant: 'primary' | 'secondary' | 'outline' | 'default';
  isPlaceholder: boolean;
}

export class ButtonExtractor {
  private readonly placeholderTexts = [
    'primary button',
    'secondary button',
    'button',
    'click here',
    'read more',
  ];

  /**
   * Extract all buttons from HTML content
   */
  extractButtons(html: string): ButtonData[] {
    const $ = cheerio.load(html);
    const buttons: ButtonData[] = [];

    // Find button elements and links with button classes
    const buttonSelectors = [
      'button',
      'a.button',
      'a.btn',
      'a[class*="button"]',
      'a[class*="btn"]',
      '.wp-block-button a',
    ];

    $(buttonSelectors.join(', ')).each((_, element) => {
      const button = this.extractButtonData($, $(element));
      
      if (button) {
        buttons.push(button);
      }
    });

    log.info(`Extracted ${buttons.length} buttons from HTML`);

    return buttons;
  }

  /**
   * Extract button data from a single element
   */
  private extractButtonData(
    $: cheerio.CheerioAPI,
    element: cheerio.Cheerio<any>
  ): ButtonData | null {
    // Extract text
    const text = element.text().trim();

    // Skip if no text
    if (!text || text.length === 0) {
      log.warn('Skipping button with no text');
      return null;
    }

    // Extract href
    let href = element.attr('href') || '#';

    // If element is <button>, look for href in parent <a>
    if (element.is('button')) {
      const parentAnchor = element.closest('a');
      if (parentAnchor.length > 0) {
        href = parentAnchor.attr('href') || '#';
      }
    }

    // Detect variant from CSS classes
    const variant = this.detectVariant(element);

    // Check if placeholder text
    const isPlaceholder = this.isPlaceholderText(text);

    if (isPlaceholder) {
      log.warn(`Button has placeholder text: "${text}"`);
    }

    return {
      text,
      href,
      variant,
      isPlaceholder,
    };
  }

  /**
   * Detect button variant from CSS classes
   */
  private detectVariant(
    element: cheerio.Cheerio<any>
  ): 'primary' | 'secondary' | 'outline' | 'default' {
    const classNames = element.attr('class') || '';
    const lowerClass = classNames.toLowerCase();

    if (lowerClass.includes('primary') || lowerClass.includes('btn-primary')) {
      return 'primary';
    }

    if (lowerClass.includes('secondary') || lowerClass.includes('btn-secondary')) {
      return 'secondary';
    }

    if (lowerClass.includes('outline') || lowerClass.includes('btn-outline')) {
      return 'outline';
    }

    return 'default';
  }

  /**
   * Check if text is a placeholder
   */
  private isPlaceholderText(text: string): boolean {
    const lowerText = text.toLowerCase().trim();
    return this.placeholderTexts.some(placeholder => 
      lowerText === placeholder || lowerText.includes(placeholder)
    );
  }

  /**
   * Group adjacent buttons together
   */
  groupAdjacentButtons(buttons: ButtonData[]): ButtonData[][] {
    if (buttons.length === 0) {
      return [];
    }

    // For now, return all buttons as a single group
    // In a real implementation, we would analyze DOM structure
    // to determine which buttons are actually adjacent
    return [buttons];
  }

  /**
   * Validate button data
   */
  validateButton(button: ButtonData): boolean {
    // Must have text
    if (!button.text || button.text.trim().length === 0) {
      return false;
    }

    // Must have href (even if it's "#")
    if (!button.href) {
      return false;
    }

    return true;
  }

  /**
   * Get statistics about extracted buttons
   */
  getButtonStats(buttons: ButtonData[]): {
    total: number;
    withPlaceholder: number;
    withoutHref: number;
    byVariant: Record<string, number>;
  } {
    const stats = {
      total: buttons.length,
      withPlaceholder: 0,
      withoutHref: 0,
      byVariant: {} as Record<string, number>,
    };

    for (const button of buttons) {
      if (button.isPlaceholder) {
        stats.withPlaceholder++;
      }

      if (button.href === '#') {
        stats.withoutHref++;
      }

      stats.byVariant[button.variant] = (stats.byVariant[button.variant] || 0) + 1;
    }

    return stats;
  }
}
