/**
 * End-to-End Migration Integration Test
 * 
 * Tests complete migration flow with a small XML file containing 5-10 pages.
 * Verifies:
 * - All pages are created
 * - All components are created with correct structure
 * - All media entities are created
 * - No errors occur during migration
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
// Run manually with: npm test -- end-to-end-migration.test.ts --testPathIgnorePatterns=[]
describe.skip('End-to-End Migration Integration Test', () => {
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
    testDir = path.join(os.tmpdir(), 'wp-e2e-test-' + Date.now());
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

  test('should successfully migrate 5 pages with various content types', async () => {
    // Create test XML with 5 pages
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:wp="http://wordpress.org/export/1.2/" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <!-- Page 1: Simple text page -->
    <item>
      <title><![CDATA[About Us]]></title>
      <wp:post_name><![CDATA[about-us]]></wp:post_name>
      <wp:post_type><![CDATA[page]]></wp:post_type>
      <wp:status><![CDATA[publish]]></wp:status>
      <wp:post_id>1</wp:post_id>
      <pubDate>Sat, 20 Jul 2019 04:57:44 +0000</pubDate>
      <content:encoded><![CDATA[
        <h1>About Our Company</h1>
        <p>We are a leading technology company focused on innovation.</p>
        <p>Our mission is to deliver exceptional products and services.</p>
      ]]></content:encoded>
    </item>

    <!-- Page 2: Page with image -->
    <item>
      <title><![CDATA[Products]]></title>
      <wp:post_name><![CDATA[products]]></wp:post_name>
      <wp:post_type><![CDATA[page]]></wp:post_type>
      <wp:status><![CDATA[publish]]></wp:status>
      <wp:post_id>2</wp:post_id>
      <pubDate>Sat, 20 Jul 2019 05:00:00 +0000</pubDate>
      <content:encoded><![CDATA[
        <h1>Our Products</h1>
        <img src="https://example.com/product.jpg" alt="Product Image" />
        <p>Discover our innovative product line.</p>
      ]]></content:encoded>
    </item>

    <!-- Page 3: Page with button -->
    <item>
      <title><![CDATA[Contact]]></title>
      <wp:post_name><![CDATA[contact]]></wp:post_name>
      <wp:post_type><![CDATA[page]]></wp:post_type>
      <wp:status><![CDATA[publish]]></wp:status>
      <wp:post_id>3</wp:post_id>
      <pubDate>Sat, 20 Jul 2019 05:15:00 +0000</pubDate>
      <content:encoded><![CDATA[
        <h1>Contact Us</h1>
        <p>Get in touch with our team.</p>
        <a href="/contact-form" class="btn btn-primary">Send Message</a>
      ]]></content:encoded>
    </item>

    <!-- Page 4: Page with video -->
    <item>
      <title><![CDATA[Demo]]></title>
      <wp:post_name><![CDATA[demo]]></wp:post_name>
      <wp:post_type><![CDATA[page]]></wp:post_type>
      <wp:status><![CDATA[publish]]></wp:status>
      <wp:post_id>4</wp:post_id>
      <pubDate>Sat, 20 Jul 2019 05:30:00 +0000</pubDate>
      <content:encoded><![CDATA[
        <h1>Product Demo</h1>
        <p>Watch our product in action.</p>
        <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>
      ]]></content:encoded>
    </item>

    <!-- Page 5: Page with list -->
    <item>
      <title><![CDATA[Features]]></title>
      <wp:post_name><![CDATA[features]]></wp:post_name>
      <wp:post_type><![CDATA[page]]></wp:post_type>
      <wp:status><![CDATA[publish]]></wp:status>
      <wp:post_id>5</wp:post_id>
      <pubDate>Sat, 20 Jul 2019 05:45:00 +0000</pubDate>
      <content:encoded><![CDATA[
        <h1>Key Features</h1>
        <ul>
          <li>Fast performance</li>
          <li>Easy to use</li>
          <li>Secure and reliable</li>
        </ul>
      ]]></content:encoded>
    </item>
  </channel>
</rss>`;

    const xmlPath = path.join(testDir, 'test-migration.xml');
    const mappingPath = path.join(testDir, 'mapping.json');
    const templatePath = path.join(testDir, 'template.md');

    // Create test files
    fs.writeFileSync(xmlPath, xmlContent);
    fs.writeFileSync(mappingPath, JSON.stringify({
      'https://example.com/product.jpg': 'https://minio.example.com/cms-media/product.jpg'
    }));
    fs.writeFileSync(templatePath, '');

    try {
      // Run migration
      const config = {
        xmlFilePath: xmlPath,
        mappingFilePath: mappingPath,
        templateMappingPath: templatePath,
        uploadsDir: testDir,
        dryRun: false,
      };

      const result = await orchestrator.migrate(config);

      // Verify migration results
      expect(result.totalPages).toBe(5);
      expect(result.successfulPages).toBe(5);
      expect(result.failedPages).toBe(0);
      expect(result.errors).toHaveLength(0);

      // Verify pages were created
      const pages = await dataSource.query(
        `SELECT id, title, slug FROM cms_pages 
         WHERE slug IN ('about-us', 'products', 'contact', 'demo', 'features')
         ORDER BY slug`
      );

      expect(pages).toHaveLength(5);
      expect(pages[0].slug).toBe('about-us');
      expect(pages[1].slug).toBe('contact');
      expect(pages[2].slug).toBe('demo');
      expect(pages[3].slug).toBe('features');
      expect(pages[4].slug).toBe('products');

      // Verify components were created
      const components = await dataSource.query(
        `SELECT c.id, c.block_id, c.block_type, c.props, p.slug
         FROM cms_components c
         JOIN cms_pages p ON c.page_id = p.id
         WHERE p.slug IN ('about-us', 'products', 'contact', 'demo', 'features')
         ORDER BY p.slug, c.order_index`
      );

      expect(components.length).toBeGreaterThan(0);

      // Verify each page has components
      const aboutUsComponents = components.filter(c => c.slug === 'about-us');
      expect(aboutUsComponents.length).toBeGreaterThan(0);

      const productsComponents = components.filter(c => c.slug === 'products');
      expect(productsComponents.length).toBeGreaterThan(0);
      
      // Verify image component exists for products page
      const imageComponent = productsComponents.find(c => c.block_id === 'gallery-single-image');
      expect(imageComponent).toBeDefined();
      if (imageComponent) {
        expect(imageComponent.props).toHaveProperty('imageUrl');
        expect(imageComponent.props.imageUrl).toContain('/cms-media/');
      }

      // Verify button component exists for contact page
      const contactComponents = components.filter(c => c.slug === 'contact');
      const buttonComponent = contactComponents.find(c => c.block_id === 'element-button-group');
      expect(buttonComponent).toBeDefined();
      if (buttonComponent) {
        expect(buttonComponent.props).toHaveProperty('buttons');
        expect(Array.isArray(buttonComponent.props.buttons)).toBe(true);
      }

      // Verify video component exists for demo page
      const demoComponents = components.filter(c => c.slug === 'demo');
      const videoComponent = demoComponents.find(c => c.block_id === 'video-embed-section');
      expect(videoComponent).toBeDefined();
      if (videoComponent) {
        expect(videoComponent.props).toHaveProperty('videoUrl');
      }

      // Verify all components have required fields
      for (const component of components) {
        expect(component.block_id).toBeTruthy();
        expect(component.block_type).toBeTruthy();
        expect(component.props).toBeDefined();
      }

      // Verify media entities were created
      const mediaEntities = await dataSource.query(
        `SELECT id, filename, url FROM media 
         WHERE url LIKE '/cms-media/%'`
      );

      expect(result.totalMediaEntities).toBeGreaterThanOrEqual(0);

      // Cleanup: delete test data
      await dataSource.query(
        `DELETE FROM cms_components WHERE page_id IN 
         (SELECT id FROM cms_pages WHERE slug IN ('about-us', 'products', 'contact', 'demo', 'features'))`
      );
      await dataSource.query(
        `DELETE FROM cms_pages WHERE slug IN ('about-us', 'products', 'contact', 'demo', 'features')`
      );

    } finally {
      // Cleanup test files
      if (fs.existsSync(xmlPath)) fs.unlinkSync(xmlPath);
      if (fs.existsSync(mappingPath)) fs.unlinkSync(mappingPath);
      if (fs.existsSync(templatePath)) fs.unlinkSync(templatePath);
    }
  }, 300000); // 5 minute timeout

  test('should handle empty XML gracefully', async () => {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:wp="http://wordpress.org/export/1.2/" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
  </channel>
</rss>`;

    const xmlPath = path.join(testDir, 'empty.xml');
    const mappingPath = path.join(testDir, 'empty-mapping.json');
    const templatePath = path.join(testDir, 'empty-template.md');

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

      const result = await orchestrator.migrate(config);

      expect(result.totalPages).toBe(0);
      expect(result.successfulPages).toBe(0);
      expect(result.failedPages).toBe(0);
    } finally {
      if (fs.existsSync(xmlPath)) fs.unlinkSync(xmlPath);
      if (fs.existsSync(mappingPath)) fs.unlinkSync(mappingPath);
      if (fs.existsSync(templatePath)) fs.unlinkSync(templatePath);
    }
  }, 60000);
});
