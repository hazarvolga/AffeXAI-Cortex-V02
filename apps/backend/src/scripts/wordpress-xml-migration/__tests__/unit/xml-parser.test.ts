/**
 * Unit tests for XMLParser
 * 
 * **Feature: wordpress-cms-migration**
 * **Validates: Requirements 1.1, 1.2**
 */

import * as fs from 'fs';
import * as path from 'path';
import { XMLParser } from '../../parsers/xml-parser';

describe('XMLParser', () => {
  let parser: XMLParser;
  const tempFiles: string[] = [];

  beforeEach(() => {
    parser = new XMLParser();
  });

  afterEach(() => {
    // Cleanup temp files
    tempFiles.forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });
    tempFiles.length = 0;
  });

  const createTempFile = (content: string, name: string): string => {
    const tempFile = path.join(__dirname, `temp-${name}-${Date.now()}.xml`);
    fs.writeFileSync(tempFile, content);
    tempFiles.push(tempFile);
    return tempFile;
  };

  describe('parseWordPressXML', () => {
    it('should parse valid XML with multiple pages', async () => {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:wp="http://wordpress.org/export/1.2/">
<channel>
  <title>Test Site</title>
  <item>
    <title><![CDATA[Test Page 1]]></title>
    <content:encoded><![CDATA[<h1>Test Content 1</h1>]]></content:encoded>
    <wp:post_name><![CDATA[test-page-1]]></wp:post_name>
    <wp:post_type><![CDATA[page]]></wp:post_type>
    <wp:status><![CDATA[publish]]></wp:status>
    <wp:post_id>1</wp:post_id>
    <pubDate>Mon, 01 Jan 2024 00:00:00 +0000</pubDate>
  </item>
  <item>
    <title><![CDATA[Test Page 2]]></title>
    <content:encoded><![CDATA[<h1>Test Content 2</h1>]]></content:encoded>
    <wp:post_name><![CDATA[test-page-2]]></wp:post_name>
    <wp:post_type><![CDATA[page]]></wp:post_type>
    <wp:status><![CDATA[publish]]></wp:status>
    <wp:post_id>2</wp:post_id>
    <pubDate>Mon, 02 Jan 2024 00:00:00 +0000</pubDate>
  </item>
</channel>
</rss>`;

      const tempFile = createTempFile(xmlContent, 'multiple-pages');
      const pages = await parser.parseWordPressXML(tempFile);

      expect(pages).toHaveLength(2);
      expect(pages[0].title).toBe('Test Page 1');
      expect(pages[0].slug).toBe('test-page-1');
      expect(pages[0].content).toContain('Test Content 1');
      expect(pages[0].postId).toBe('1');
      expect(pages[0].status).toBe('publish');
      expect(pages[1].title).toBe('Test Page 2');
      expect(pages[1].slug).toBe('test-page-2');
    });

    it('should extract CDATA content correctly', async () => {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:wp="http://wordpress.org/export/1.2/">
<channel>
  <item>
    <title><![CDATA[Page with <special> characters & symbols]]></title>
    <content:encoded><![CDATA[<h1>Content with <strong>HTML</strong> & entities</h1>]]></content:encoded>
    <wp:post_name><![CDATA[special-page]]></wp:post_name>
    <wp:post_type><![CDATA[page]]></wp:post_type>
    <wp:status><![CDATA[publish]]></wp:status>
    <wp:post_id>1</wp:post_id>
    <pubDate>Mon, 01 Jan 2024 00:00:00 +0000</pubDate>
  </item>
</channel>
</rss>`;

      const tempFile = createTempFile(xmlContent, 'cdata');
      const pages = await parser.parseWordPressXML(tempFile);

      expect(pages).toHaveLength(1);
      expect(pages[0].title).toContain('<special>');
      expect(pages[0].title).toContain('&');
      expect(pages[0].content).toContain('<strong>HTML</strong>');
    });

    it('should filter by post_type and status', async () => {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:wp="http://wordpress.org/export/1.2/">
<channel>
  <item>
    <title><![CDATA[Published Page]]></title>
    <content:encoded><![CDATA[<h1>Content</h1>]]></content:encoded>
    <wp:post_name><![CDATA[published-page]]></wp:post_name>
    <wp:post_type><![CDATA[page]]></wp:post_type>
    <wp:status><![CDATA[publish]]></wp:status>
    <wp:post_id>1</wp:post_id>
    <pubDate>Mon, 01 Jan 2024 00:00:00 +0000</pubDate>
  </item>
  <item>
    <title><![CDATA[Draft Page]]></title>
    <content:encoded><![CDATA[<h1>Content</h1>]]></content:encoded>
    <wp:post_name><![CDATA[draft-page]]></wp:post_name>
    <wp:post_type><![CDATA[page]]></wp:post_type>
    <wp:status><![CDATA[draft]]></wp:status>
    <wp:post_id>2</wp:post_id>
    <pubDate>Mon, 01 Jan 2024 00:00:00 +0000</pubDate>
  </item>
  <item>
    <title><![CDATA[Published Post]]></title>
    <content:encoded><![CDATA[<h1>Content</h1>]]></content:encoded>
    <wp:post_name><![CDATA[published-post]]></wp:post_name>
    <wp:post_type><![CDATA[post]]></wp:post_type>
    <wp:status><![CDATA[publish]]></wp:status>
    <wp:post_id>3</wp:post_id>
    <pubDate>Mon, 01 Jan 2024 00:00:00 +0000</pubDate>
  </item>
</channel>
</rss>`;

      const tempFile = createTempFile(xmlContent, 'filter');
      const pages = await parser.parseWordPressXML(tempFile);

      expect(pages).toHaveLength(1);
      expect(pages[0].title).toBe('Published Page');
      expect(pages[0].status).toBe('publish');
    });

    it('should skip pages with missing required fields', async () => {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:wp="http://wordpress.org/export/1.2/">
<channel>
  <item>
    <title><![CDATA[Complete Page]]></title>
    <content:encoded><![CDATA[<h1>Content</h1>]]></content:encoded>
    <wp:post_name><![CDATA[complete-page]]></wp:post_name>
    <wp:post_type><![CDATA[page]]></wp:post_type>
    <wp:status><![CDATA[publish]]></wp:status>
    <wp:post_id>1</wp:post_id>
    <pubDate>Mon, 01 Jan 2024 00:00:00 +0000</pubDate>
  </item>
  <item>
    <title><![CDATA[Page Without Content]]></title>
    <wp:post_name><![CDATA[no-content]]></wp:post_name>
    <wp:post_type><![CDATA[page]]></wp:post_type>
    <wp:status><![CDATA[publish]]></wp:status>
    <wp:post_id>2</wp:post_id>
    <pubDate>Mon, 01 Jan 2024 00:00:00 +0000</pubDate>
  </item>
</channel>
</rss>`;

      const tempFile = createTempFile(xmlContent, 'missing-fields');
      const pages = await parser.parseWordPressXML(tempFile);

      expect(pages).toHaveLength(1);
      expect(pages[0].title).toBe('Complete Page');
    });

    it('should handle empty XML file', async () => {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>Empty Site</title>
</channel>
</rss>`;

      const tempFile = createTempFile(xmlContent, 'empty');
      const pages = await parser.parseWordPressXML(tempFile);

      expect(pages).toHaveLength(0);
    });

    it('should throw error for non-existent file', async () => {
      await expect(parser.parseWordPressXML('/non/existent/file.xml'))
        .rejects.toThrow();
    });
  });
});
