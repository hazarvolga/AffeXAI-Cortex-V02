/**
 * Idempotency Migration Integration Test
 * 
 * Tests that running migration twice on the same XML:
 * - Does not create duplicate pages
 * - Does not create duplicate components
 * - Updates existing pages correctly
 * - Maintains data integrity
 * 
 * Validates Requirements 9.1, 9.2
 */

import { DataSource } from 'typeorm';
import { MigrationOrchestrator } from '../../orchestrator/migration-orchestrator';
import { Page } from '../../../../modules/cms/entities/page.entity';
import { Component } from '../../../../modules/cms/entities/component.entity';
import { Media } from '../../../../modules/media/entities/media.entity';
import { PageTemplate } from '../../../../modules/cms/entities/page-template.entity';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

// Skip: Requires real database connection
// Run manually with: npm test -- idempotency-migration.test.ts --testPathIgnorePatterns=[]
describe.skip('Idempotency Migration Integration Test', () => {
  let dataSource: DataSource;
  let orchestrator: MigrationOrchestrator;
  let testDir: string;

  beforeAll(async () => {
    // Setup test database connection
    dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5434'),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'affexai_dev',
      synchronize: false,
      entities: [Page, Component, Media, PageTemplate],
    });

    await dataSource.initialize();

    // Initialize orchestrator
    orchestrator = new MigrationOrchestrator(dataSource);

    // Create temp directory for test files
    testDir = path.join(os.tmpdir(), 'wp-idempotency-test-' + Date.now());
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterAll(async () => {
    // Cleanup temp directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }

    await dataSource.destroy();
  });

  test('should not create duplicate pages when running migration twice', async () => {
    // Create test XML with 3 pages
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:wp="http://wordpress.org/export/1.2/" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <item>
      <title><![CDATA[Test Page 1]]></title>
      <wp:post_name><![CDATA[test-idempotency-1]]></wp:post_name>
      <wp:post_type><![CDATA[page]]></wp:post_type>
      <wp:status><![CDATA[publish]]></wp:status>
      <wp:post_id>101</wp:post_id>
      <pubDate>Sat, 20 Jul 2019 04:57:44 +0000</pubDate>
      <content:encoded><![CDATA[
        <h1>First Test Page</h1>
        <p>This is the first test page content.</p>
      ]]></content:encoded>
    </item>

    <item>
      <title><![CDATA[Test Page 2]]></title>
      <wp:post_name><![CDATA[test-idempotency-2]]></wp:post_name>
      <wp:post_type><![CDATA[page]]></wp:post_type>
      <wp:status><![CDATA[publish]]></wp:status>
      <wp:post_id>102</wp:post_id>
      <pubDate>Sat, 20 Jul 2019 05:00:00 +0000</pubDate>
      <content:encoded><![CDATA[
        <h1>Second Test Page</h1>
        <p>This is the second test page content.</p>
      ]]></content:encoded>
    </item>

    <item>
      <title><![CDATA[Test Page 3]]></title>
      <wp:post_name><![CDATA[test-idempotency-3]]></wp:post_name>
      <wp:post_type><![CDATA[page]]></wp:post_type>
      <wp:status><![CDATA[publish]]></wp:status>
      <wp:post_id>103</wp:post_id>
      <pubDate>Sat, 20 Jul 2019 05:15:00 +0000</pubDate>
      <content:encoded><![CDATA[
        <h1>Third Test Page</h1>
        <p>This is the third test page content.</p>
      ]]></content:encoded>
    </item>
  </channel>
</rss>`;

    const xmlPath = path.join(testDir, 'idempotency-test.xml');
    const mappingPath = path.join(testDir, 'idempotency-mapping.json');
    const templatePath = path.join(testDir, 'idempotency-template.md');

    fs.writeFileSync(xmlPath, xmlContent);
    fs.writeFileSync(mappingPath, '{}');
    fs.writeFileSync(templatePath, '');

    try {
      const config = {
        xmlFilePath: xmlPath,
        mappingFilePath: mappingPath,
        templateMappingPath: templatePath,
        uploadsDir: testDir,
        dryRun: false,
      };

      // First migration run
      const result1 = await orchestrator.migrate(config);

      expect(result1.totalPages).toBe(3);
      expect(result1.successfulPages).toBe(3);
      expect(result1.failedPages).toBe(0);

      // Get page count after first run
      const pagesAfterFirst = await dataSource.query(
        `SELECT id, title, slug FROM cms_pages 
         WHERE slug IN ('test-idempotency-1', 'test-idempotency-2', 'test-idempotency-3')
         ORDER BY slug`
      );

      expect(pagesAfterFirst).toHaveLength(3);

      // Get component count after first run
      const componentsAfterFirst = await dataSource.query(
        `SELECT c.id, c.block_id, p.slug
         FROM cms_components c
         JOIN cms_pages p ON c.page_id = p.id
         WHERE p.slug IN ('test-idempotency-1', 'test-idempotency-2', 'test-idempotency-3')`
      );

      const firstRunComponentCount = componentsAfterFirst.length;
      expect(firstRunComponentCount).toBeGreaterThan(0);

      // Store page IDs from first run
      const firstRunPageIds = pagesAfterFirst.map((p: any) => p.id);

      // Second migration run (should update, not create duplicates)
      const result2 = await orchestrator.migrate(config);

      expect(result2.totalPages).toBe(3);
      expect(result2.successfulPages).toBe(3);
      expect(result2.failedPages).toBe(0);

      // Get page count after second run
      const pagesAfterSecond = await dataSource.query(
        `SELECT id, title, slug FROM cms_pages 
         WHERE slug IN ('test-idempotency-1', 'test-idempotency-2', 'test-idempotency-3')
         ORDER BY slug`
      );

      // Should still have exactly 3 pages (no duplicates)
      expect(pagesAfterSecond).toHaveLength(3);

      // Page IDs should be the same (pages were updated, not recreated)
      const secondRunPageIds = pagesAfterSecond.map((p: any) => p.id);
      expect(secondRunPageIds).toEqual(firstRunPageIds);

      // Get component count after second run
      const componentsAfterSecond = await dataSource.query(
        `SELECT c.id, c.block_id, p.slug
         FROM cms_components c
         JOIN cms_pages p ON c.page_id = p.id
         WHERE p.slug IN ('test-idempotency-1', 'test-idempotency-2', 'test-idempotency-3')`
      );

      // Component count should be the same (components were replaced, not duplicated)
      expect(componentsAfterSecond.length).toBe(firstRunComponentCount);

      // Verify no duplicate slugs exist
      const duplicateCheck = await dataSource.query(
        `SELECT slug, COUNT(*) as count
         FROM cms_pages
         WHERE slug IN ('test-idempotency-1', 'test-idempotency-2', 'test-idempotency-3')
         GROUP BY slug
         HAVING COUNT(*) > 1`
      );

      expect(duplicateCheck).toHaveLength(0);

      // Cleanup
      await dataSource.query(
        `DELETE FROM cms_components WHERE page_id IN 
         (SELECT id FROM cms_pages WHERE slug IN ('test-idempotency-1', 'test-idempotency-2', 'test-idempotency-3'))`
      );
      await dataSource.query(
        `DELETE FROM cms_pages WHERE slug IN ('test-idempotency-1', 'test-idempotency-2', 'test-idempotency-3')`
      );

    } finally {
      if (fs.existsSync(xmlPath)) fs.unlinkSync(xmlPath);
      if (fs.existsSync(mappingPath)) fs.unlinkSync(mappingPath);
      if (fs.existsSync(templatePath)) fs.unlinkSync(templatePath);
    }
  }, 300000);

  test('should update page content when running migration twice with different content', async () => {
    const slug = 'test-update-content';

    // First XML with original content
    const xmlContent1 = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:wp="http://wordpress.org/export/1.2/" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <item>
      <title><![CDATA[Original Title]]></title>
      <wp:post_name><![CDATA[${slug}]]></wp:post_name>
      <wp:post_type><![CDATA[page]]></wp:post_type>
      <wp:status><![CDATA[publish]]></wp:status>
      <wp:post_id>201</wp:post_id>
      <pubDate>Sat, 20 Jul 2019 04:57:44 +0000</pubDate>
      <content:encoded><![CDATA[
        <h1>Original Heading</h1>
        <p>Original content here.</p>
      ]]></content:encoded>
    </item>
  </channel>
</rss>`;

    // Second XML with updated content
    const xmlContent2 = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:wp="http://wordpress.org/export/1.2/" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <item>
      <title><![CDATA[Updated Title]]></title>
      <wp:post_name><![CDATA[${slug}]]></wp:post_name>
      <wp:post_type><![CDATA[page]]></wp:post_type>
      <wp:status><![CDATA[publish]]></wp:status>
      <wp:post_id>201</wp:post_id>
      <pubDate>Sat, 20 Jul 2019 04:57:44 +0000</pubDate>
      <content:encoded><![CDATA[
        <h1>Updated Heading</h1>
        <p>Updated content here.</p>
        <p>Additional paragraph added.</p>
      ]]></content:encoded>
    </item>
  </channel>
</rss>`;

    const xmlPath1 = path.join(testDir, 'update-test-1.xml');
    const xmlPath2 = path.join(testDir, 'update-test-2.xml');
    const mappingPath = path.join(testDir, 'update-mapping.json');
    const templatePath = path.join(testDir, 'update-template.md');

    fs.writeFileSync(xmlPath1, xmlContent1);
    fs.writeFileSync(xmlPath2, xmlContent2);
    fs.writeFileSync(mappingPath, '{}');
    fs.writeFileSync(templatePath, '');

    try {
      // First migration with original content
      await orchestrator.migrate({
        xmlFilePath: xmlPath1,
        mappingFilePath: mappingPath,
        templateMappingPath: templatePath,
        uploadsDir: testDir,
        dryRun: false,
      });

      const pageAfterFirst = await dataSource.query(
        `SELECT id, title FROM cms_pages WHERE slug = $1`,
        [slug]
      );

      expect(pageAfterFirst).toHaveLength(1);
      expect(pageAfterFirst[0].title).toBe('Original Title');

      const componentsAfterFirst = await dataSource.query(
        `SELECT COUNT(*) as count FROM cms_components WHERE page_id = $1`,
        [pageAfterFirst[0].id]
      );

      const firstComponentCount = parseInt(componentsAfterFirst[0].count);

      // Second migration with updated content
      await orchestrator.migrate({
        xmlFilePath: xmlPath2,
        mappingFilePath: mappingPath,
        templateMappingPath: templatePath,
        uploadsDir: testDir,
        dryRun: false,
      });

      const pageAfterSecond = await dataSource.query(
        `SELECT id, title FROM cms_pages WHERE slug = $1`,
        [slug]
      );

      // Should still have exactly 1 page
      expect(pageAfterSecond).toHaveLength(1);

      // Page ID should be the same
      expect(pageAfterSecond[0].id).toBe(pageAfterFirst[0].id);

      // Title should be updated
      expect(pageAfterSecond[0].title).toBe('Updated Title');

      const componentsAfterSecond = await dataSource.query(
        `SELECT COUNT(*) as count FROM cms_components WHERE page_id = $1`,
        [pageAfterSecond[0].id]
      );

      const secondComponentCount = parseInt(componentsAfterSecond[0].count);

      // Component count should reflect the new content (3 paragraphs vs 2)
      expect(secondComponentCount).toBeGreaterThanOrEqual(firstComponentCount);

      // Cleanup
      await dataSource.query(
        `DELETE FROM cms_components WHERE page_id = $1`,
        [pageAfterSecond[0].id]
      );
      await dataSource.query(
        `DELETE FROM cms_pages WHERE slug = $1`,
        [slug]
      );

    } finally {
      if (fs.existsSync(xmlPath1)) fs.unlinkSync(xmlPath1);
      if (fs.existsSync(xmlPath2)) fs.unlinkSync(xmlPath2);
      if (fs.existsSync(mappingPath)) fs.unlinkSync(mappingPath);
      if (fs.existsSync(templatePath)) fs.unlinkSync(templatePath);
    }
  }, 300000);

  test('should handle multiple consecutive migrations without errors', async () => {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:wp="http://wordpress.org/export/1.2/" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <item>
      <title><![CDATA[Multi Run Test]]></title>
      <wp:post_name><![CDATA[test-multi-run]]></wp:post_name>
      <wp:post_type><![CDATA[page]]></wp:post_type>
      <wp:status><![CDATA[publish]]></wp:status>
      <wp:post_id>301</wp:post_id>
      <pubDate>Sat, 20 Jul 2019 04:57:44 +0000</pubDate>
      <content:encoded><![CDATA[
        <h1>Multi Run Test</h1>
        <p>Testing multiple consecutive runs.</p>
      ]]></content:encoded>
    </item>
  </channel>
</rss>`;

    const xmlPath = path.join(testDir, 'multi-run-test.xml');
    const mappingPath = path.join(testDir, 'multi-run-mapping.json');
    const templatePath = path.join(testDir, 'multi-run-template.md');

    fs.writeFileSync(xmlPath, xmlContent);
    fs.writeFileSync(mappingPath, '{}');
    fs.writeFileSync(templatePath, '');

    try {
      const config = {
        xmlFilePath: xmlPath,
        mappingFilePath: mappingPath,
        templateMappingPath: templatePath,
        uploadsDir: testDir,
        dryRun: false,
      };

      // Run migration 5 times
      for (let i = 0; i < 5; i++) {
        const result = await orchestrator.migrate(config);

        expect(result.totalPages).toBe(1);
        expect(result.successfulPages).toBe(1);
        expect(result.failedPages).toBe(0);
        expect(result.errors).toHaveLength(0);
      }

      // Verify still only 1 page exists
      const pages = await dataSource.query(
        `SELECT COUNT(*) as count FROM cms_pages WHERE slug = 'test-multi-run'`
      );

      expect(parseInt(pages[0].count)).toBe(1);

      // Cleanup
      await dataSource.query(
        `DELETE FROM cms_components WHERE page_id IN 
         (SELECT id FROM cms_pages WHERE slug = 'test-multi-run')`
      );
      await dataSource.query(
        `DELETE FROM cms_pages WHERE slug = 'test-multi-run'`
      );

    } finally {
      if (fs.existsSync(xmlPath)) fs.unlinkSync(xmlPath);
      if (fs.existsSync(mappingPath)) fs.unlinkSync(mappingPath);
      if (fs.existsSync(templatePath)) fs.unlinkSync(templatePath);
    }
  }, 300000);
});
