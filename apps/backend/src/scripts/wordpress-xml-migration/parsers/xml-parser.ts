/**
 * WordPress CMS Migration - XML Parser
 * 
 * Parses WordPress WXR (WordPress eXtended RSS) format XML export files.
 * Extracts page data including title, content, slug, and metadata.
 */

import * as fs from 'fs';
import * as xml2js from 'xml2js';
import { WordPressPage } from '../types/migration.types';
import { log } from '../utils/logger';

export class XMLParser {
  /**
   * Parse WordPress XML export file and extract all published pages
   */
  async parseWordPressXML(xmlPath: string): Promise<WordPressPage[]> {
    try {
      log.info(`Loading XML file: ${xmlPath}`);

      // Read XML file
      const xmlContent = fs.readFileSync(xmlPath, 'utf-8');

      // Parse XML
      const parser = new xml2js.Parser({
        explicitArray: false,
        trim: true,
        normalize: true,
      });

      const result = await parser.parseStringPromise(xmlContent);

      // Extract items from channel
      const channel = result.rss?.channel;
      if (!channel) {
        throw new Error('Invalid WordPress XML: missing channel element');
      }

      let items = channel.item;
      if (!items) {
        log.warn('No items found in XML file');
        return [];
      }

      // Ensure items is an array
      if (!Array.isArray(items)) {
        items = [items];
      }

      log.info(`Found ${items.length} total items in XML`);

      // Filter and transform items
      const pages = this.filterPublishedPages(items);

      log.info(`Extracted ${pages.length} published pages`);

      return pages;
    } catch (error) {
      log.error('Failed to parse WordPress XML', error);
      throw error;
    }
  }

  /**
   * Filter items to only include published pages and transform to WordPressPage
   */
  private filterPublishedPages(items: any[]): WordPressPage[] {
    const pages: WordPressPage[] = [];

    for (const item of items) {
      try {
        // Extract WordPress-specific fields
        const postType = this.extractWPField(item, 'wp:post_type');
        const status = this.extractWPField(item, 'wp:status');

        // Only process published pages
        if (postType !== 'page' || status !== 'publish') {
          continue;
        }

        // Extract page data
        const page: WordPressPage = {
          title: this.extractCDATA(item, 'title'),
          content: this.extractCDATA(item, 'content:encoded'),
          slug: this.extractWPField(item, 'wp:post_name'),
          postId: this.extractWPField(item, 'wp:post_id'),
          status: status,
          pubDate: new Date(item.pubDate || Date.now()),
        };

        // Validate required fields
        if (!page.title || !page.content || !page.slug) {
          log.warn(`Skipping page with missing required fields: ${page.title || 'Unknown'}`);
          continue;
        }

        pages.push(page);
      } catch (error) {
        log.error(`Failed to process item`, error);
        // Continue with next item
      }
    }

    return pages;
  }

  /**
   * Extract CDATA content from element
   */
  private extractCDATA(element: any, tagName: string): string {
    const value = element[tagName];
    
    if (!value) {
      return '';
    }

    // xml2js automatically extracts CDATA content
    return typeof value === 'string' ? value.trim() : '';
  }

  /**
   * Extract WordPress-specific field (wp:* namespace)
   */
  private extractWPField(element: any, fieldName: string): string {
    const value = element[fieldName];
    
    if (!value) {
      return '';
    }

    return typeof value === 'string' ? value.trim() : '';
  }
}
