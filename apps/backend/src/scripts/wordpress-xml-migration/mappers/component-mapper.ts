/**
 * WordPress CMS Migration - Component Mapper (CORRECTED VERSION)
 * 
 * Maps parsed HTML elements to EXISTING prebuild CMS components.
 * Does NOT create new component types like content-rich-text.
 * 
 * Pattern Mapping to EXISTING Prebuild Components:
 * - <h2> + <p> + <img> → content-large-small-column
 * - <img> + <h2> + <p> → content-small-large-column
 * - <h2> + <p>         → content-single-fullwidth
 * - <img> (tek)        → gallery-single-image
 * - <video>/<iframe>   → video-embed-section
 * - <button>/<a>       → element-button-group
 */

import { ParsedElement } from '../types/migration.types';
import { HTMLSanitizer } from '../utils/html-sanitizer';
import { log } from '../utils/logger';

export interface MappedComponent {
  type: 'block';
  blockId: string;
  blockType: string;
  blockCategory: string;
  props: Record<string, any>;
  orderIndex: number;
}

export class ComponentMapper {
  private sanitizer: HTMLSanitizer;

  constructor() {
    this.sanitizer = new HTMLSanitizer();
  }

  /**
   * Map parsed elements to CMS components using intelligent pattern matching
   */
  mapElements(elements: ParsedElement[]): MappedComponent[] {
    const components: MappedComponent[] = [];
    let i = 0;

    while (i < elements.length) {
      // Try to match multi-element patterns first
      const pattern = this.detectPattern(elements, i);
      
      if (pattern) {
        components.push(pattern.component);
        i += pattern.consumed;
      } else {
        // Fallback to single element mapping
        const component = this.mapSingleElement(elements[i], components.length);
        if (component) {
          components.push(component);
        }
        i++;
      }
    }

    log.info(`Mapped ${components.length} components from ${elements.length} elements`);
    return components;
  }

  /**
   * Detect multi-element patterns and map to EXISTING prebuild components
   */
  private detectPattern(elements: ParsedElement[], startIndex: number): { component: MappedComponent; consumed: number } | null {
    const current = elements[startIndex];
    const next = elements[startIndex + 1];
    const next2 = elements[startIndex + 2];

    // Pattern 1: <img> + <h2> + <p> → content-small-large-column (image first)
    if (current?.type === 'image' && next?.type === 'heading' && next2?.type === 'paragraph') {
      log.info(`Pattern: image + heading + paragraph → content-small-large-column`);
      return {
        component: {
          type: 'block',
          blockId: 'content-small-large-column',
          blockType: 'content',
          blockCategory: 'content',
          props: {
            title: this.extractText(next.content),
            titleHtml: this.sanitizer.sanitize(next.content),
            content: this.extractText(next2.content),
            contentHtml: this.sanitizer.sanitize(next2.content),
            image: current.attributes.src || '/placeholder-image.jpg',
          },
          orderIndex: startIndex,
        },
        consumed: 3,
      };
    }

    // Pattern 2: <h2> + <p> + <img> → content-large-small-column (text first)
    if (current?.type === 'heading' && next?.type === 'paragraph' && next2?.type === 'image') {
      log.info(`Pattern: heading + paragraph + image → content-large-small-column`);
      return {
        component: {
          type: 'block',
          blockId: 'content-large-small-column',
          blockType: 'content',
          blockCategory: 'content',
          props: {
            title: this.extractText(current.content),
            titleHtml: this.sanitizer.sanitize(current.content),
            content: this.extractText(next.content),
            contentHtml: this.sanitizer.sanitize(next.content),
            image: next2.attributes.src || '/placeholder-image.jpg',
          },
          orderIndex: startIndex,
        },
        consumed: 3,
      };
    }

    // Pattern 3: <h2> + <p> → content-single-fullwidth
    if (current?.type === 'heading' && next?.type === 'paragraph') {
      log.info(`Pattern: heading + paragraph → content-single-fullwidth`);
      return {
        component: {
          type: 'block',
          blockId: 'content-single-fullwidth',
          blockType: 'content',
          blockCategory: 'content',
          props: {
            title: this.extractText(current.content),
            titleHtml: this.sanitizer.sanitize(current.content),
            content: this.extractText(next.content),
            contentHtml: this.sanitizer.sanitize(next.content),
          },
          orderIndex: startIndex,
        },
        consumed: 2,
      };
    }

    // Pattern 4: Multiple consecutive paragraphs → content-single-fullwidth (combined)
    if (current?.type === 'paragraph' && next?.type === 'paragraph') {
      // Combine consecutive paragraphs
      let combinedContent = current.content;
      let consumed = 1;
      let idx = startIndex + 1;
      
      while (idx < elements.length && elements[idx]?.type === 'paragraph') {
        combinedContent += '\n\n' + elements[idx].content;
        consumed++;
        idx++;
      }
      
      if (consumed > 1) {
        log.info(`Pattern: ${consumed} consecutive paragraphs → content-single-fullwidth`);
        return {
          component: {
            type: 'block',
            blockId: 'content-single-fullwidth',
            blockType: 'content',
            blockCategory: 'content',
            props: {
              title: '',
              content: this.extractText(combinedContent),
              contentHtml: this.sanitizer.sanitize(combinedContent),
            },
            orderIndex: startIndex,
          },
          consumed,
        };
      }
    }

    return null;
  }

  /**
   * Map single element to EXISTING prebuild component
   */
  private mapSingleElement(element: ParsedElement, order: number): MappedComponent | null {
    switch (element.type) {
      case 'image':
        return this.mapImage(element, order);
      
      case 'heading':
        return this.mapHeading(element, order);
      
      case 'paragraph':
        return this.mapParagraph(element, order);
      
      case 'list':
        return this.mapList(element, order);
      
      case 'button':
        return this.mapButton(element, order);
      
      case 'video':
        return this.mapVideo(element, order);
      
      default:
        log.warn(`Unknown element type: ${element.type}`);
        return null;
    }
  }

  /**
   * Map image to gallery-single-image
   */
  private mapImage(element: ParsedElement, order: number): MappedComponent {
    log.info(`Mapping image → gallery-single-image`);
    return {
      type: 'block',
      blockId: 'gallery-single-image',
      blockType: 'gallery',
      blockCategory: 'media',
      props: {
        imageUrl: element.attributes.src || '/placeholder-image.jpg',
        caption: element.attributes.alt || '',
        title: '',
      },
      orderIndex: order,
    };
  }

  /**
   * Map heading to content-single-fullwidth (title only)
   */
  private mapHeading(element: ParsedElement, order: number): MappedComponent {
    log.info(`Mapping heading → content-single-fullwidth`);
    return {
      type: 'block',
      blockId: 'content-single-fullwidth',
      blockType: 'content',
      blockCategory: 'content',
      props: {
        title: this.extractText(element.content),
        titleHtml: this.sanitizer.sanitize(element.content),
        titleVariant: this.getHeadingVariant(element.tagName),
        content: '',
      },
      orderIndex: order,
    };
  }

  /**
   * Map paragraph to content-single-fullwidth (content only)
   */
  private mapParagraph(element: ParsedElement, order: number): MappedComponent {
    log.info(`Mapping paragraph → content-single-fullwidth`);
    return {
      type: 'block',
      blockId: 'content-single-fullwidth',
      blockType: 'content',
      blockCategory: 'content',
      props: {
        title: '',
        content: this.extractText(element.content),
        contentHtml: this.sanitizer.sanitize(element.content),
      },
      orderIndex: order,
    };
  }

  /**
   * Map list to content-single-fullwidth (preserving HTML)
   */
  private mapList(element: ParsedElement, order: number): MappedComponent {
    log.info(`Mapping list → content-single-fullwidth`);
    return {
      type: 'block',
      blockId: 'content-single-fullwidth',
      blockType: 'content',
      blockCategory: 'content',
      props: {
        title: '',
        content: this.extractText(element.content),
        contentHtml: this.sanitizer.sanitize(element.content),
      },
      orderIndex: order,
    };
  }

  /**
   * Map button to element-button-group
   */
  private mapButton(element: ParsedElement, order: number): MappedComponent {
    log.info(`Mapping button → element-button-group`);
    return {
      type: 'block',
      blockId: 'element-button-group',
      blockType: 'element',
      blockCategory: 'interactive',
      props: {
        buttons: [
          {
            text: element.content || 'Learn More',
            href: element.attributes.href || '#',
            variant: 'default',
          },
        ],
        alignment: 'left',
      },
      orderIndex: order,
    };
  }

  /**
   * Map video to video-embed-section
   */
  private mapVideo(element: ParsedElement, order: number): MappedComponent {
    log.info(`Mapping video → video-embed-section`);
    return {
      type: 'block',
      blockId: 'video-embed-section',
      blockType: 'video',
      blockCategory: 'media',
      props: {
        videoUrl: element.attributes.src || '',
        provider: element.attributes.provider || 'youtube',
        title: element.content || '',
      },
      orderIndex: order,
    };
  }

  /**
   * Extract plain text from HTML content
   */
  private extractText(html: string): string {
    if (!html) return '';
    // Remove HTML tags but keep text
    return html.replace(/<[^>]*>/g, '').trim();
  }

  /**
   * Get heading variant based on tag name
   */
  private getHeadingVariant(tagName?: string): string {
    switch (tagName?.toLowerCase()) {
      case 'h1': return 'heading1';
      case 'h2': return 'heading2';
      case 'h3': return 'heading3';
      default: return 'heading2';
    }
  }
}
