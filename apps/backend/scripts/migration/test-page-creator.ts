/**
 * Test PageCreator with a simple page
 */

import { PageCreator } from './PageCreator';
import { Logger, LogLevel } from './Logger';
import { ErrorHandler } from './ErrorHandler';
import { ParsedContent, TemplateMapping, MediaMapping } from './types';

async function testPageCreator() {
  console.log('🧪 Testing PageCreator...\n');

  // Initialize dependencies
  const logger = new Logger(LogLevel.VERBOSE, 'logs/page-creator-test.log');
  const errorHandler = new ErrorHandler(logger);
  const pageCreator = new PageCreator(
    'http://localhost:9005/api',
    logger,
    errorHandler,
  );

  // Mock parsed content
  const mockContent: ParsedContent = {
    title: 'Test Page - Architecture Solutions',
    slug: 'test-architecture-solutions',
    sections: [],
    images: [],
    videos: [],
    links: [],
    metadata: {
      filename: 'test-page.txt',
      category: 'Industry Solutions',
      priority: 'high',
    },
  };

  // Mock template mapping
  const mockTemplateMapping: TemplateMapping = {
    templateId: 'industry-solution-template-id', // Replace with real template ID
    templateName: 'Industry Solution',
    category: 'Industry Solutions',
    priority: 'high',
  };

  // Mock media mapping (empty for now)
  const mockMediaMapping: MediaMapping = {};

  try {
    console.log('📄 Creating test page...');
    console.log(`   Title: ${mockContent.title}`);
    console.log(`   Slug: ${mockContent.slug}`);
    console.log(`   Template: ${mockTemplateMapping.templateName}\n`);

    const result = await pageCreator.createPage(
      mockContent,
      mockTemplateMapping,
      mockMediaMapping,
    );

    if (result.success) {
      console.log('✅ Page created successfully!');
      console.log(`   Page ID: ${result.pageId}`);
      console.log(`   Components: ${result.componentCount}`);
      console.log(`\n🔗 View page: http://localhost:9005/admin/cms/pages/${result.pageId}`);
    } else {
      console.log('❌ Page creation failed!');
      console.log(`   Error: ${result.error}`);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run test
testPageCreator()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
