/**
 * Property-Based Tests for XMLParser
 * 
 * **Feature: wordpress-cms-migration, Property 1: XML Parsing Completeness**
 * **Validates: Requirements 1.1, 1.2**
 */

import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import { XMLParser } from '../../parsers/xml-parser';

// Generator for WordPress page data
const wordpressPageArbitrary = fc.record({
  title: fc.string({ minLength: 1, maxLength: 50 })
    .map(s => s.trim().replace(/[<>&"']/g, ''))
    .filter(s => s.length > 0),
  content: fc.string({ minLength: 5, maxLength: 200 })
    .map(s => s.trim().replace(/[<>&"']/g, ''))
    .filter(s => s.length > 0),
  slug: fc.string({ minLength: 1, maxLength: 30 })
    .map(s => s.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-'))
    .filter(s => s.length > 0 && s !== '-'),
  postId: fc.nat({ max: 10000 }).map(n => (n + 1).toString()),
});

// Generate WordPress XML from page data
function generateWordPressXML(pages: any[]): string {
  const items = pages.map(page => `
  <item>
    <title><![CDATA[${page.title}]]></title>
    <content:encoded><![CDATA[<p>${page.content}</p>]]></content:encoded>
    <wp:post_name><![CDATA[${page.slug}]]></wp:post_name>
    <wp:post_type><![CDATA[page]]></wp:post_type>
    <wp:status><![CDATA[publish]]></wp:status>
    <wp:post_id>${page.postId}</wp:post_id>
    <pubDate>Mon, 01 Jan 2024 00:00:00 +0000</pubDate>
  </item>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:wp="http://wordpress.org/export/1.2/">
<channel>
  <title>Test Site</title>
  ${items}
</channel>
</rss>`;
}

describe('XMLParser Property Tests', () => {
  let parser: XMLParser;
  const tempFiles: string[] = [];

  beforeEach(() => {
    parser = new XMLParser();
  });

  afterEach(() => {
    tempFiles.forEach(file => {
      if (fs.existsSync(file)) {
        try { fs.unlinkSync(file); } catch {}
      }
    });
    tempFiles.length = 0;
  });

  /**
   * Property 1: XML Parsing Completeness
   * For any WordPress XML with N published pages, parser extracts exactly N pages
   */
  it('Property 1: should extract exactly N pages from XML with N published pages', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(wordpressPageArbitrary, { minLength: 0, maxLength: 10 }),
        async (pages) => {
          const xmlContent = generateWordPressXML(pages);
          const tempFile = path.join(__dirname, `temp-prop1-${Date.now()}-${Math.random()}.xml`);
          tempFiles.push(tempFile);
          fs.writeFileSync(tempFile, xmlContent);

          const parsedPages = await parser.parseWordPressXML(tempFile);
          
          // Property: count should match
          expect(parsedPages.length).toBe(pages.length);
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 2: All Required Fields Present
   * All parsed pages must have title, content, slug, postId, status
   */
  it('Property 2: all parsed pages should have required fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(wordpressPageArbitrary, { minLength: 1, maxLength: 5 }),
        async (pages) => {
          const xmlContent = generateWordPressXML(pages);
          const tempFile = path.join(__dirname, `temp-prop2-${Date.now()}-${Math.random()}.xml`);
          tempFiles.push(tempFile);
          fs.writeFileSync(tempFile, xmlContent);

          const parsedPages = await parser.parseWordPressXML(tempFile);
          
          for (const page of parsedPages) {
            expect(page.title).toBeDefined();
            expect(page.title.length).toBeGreaterThan(0);
            expect(page.content).toBeDefined();
            expect(page.slug).toBeDefined();
            expect(page.postId).toBeDefined();
            expect(page.status).toBe('publish');
          }
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
