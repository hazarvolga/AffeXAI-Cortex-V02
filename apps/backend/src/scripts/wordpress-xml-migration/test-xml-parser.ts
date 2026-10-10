/**
 * Test script for XMLParser
 */

import * as path from 'path';
import { XMLParser } from './parsers/xml-parser';

async function testXMLParser() {
  console.log('🧪 Testing XMLParser...\n');

  const xmlPath = path.join(
    __dirname,
    '../../../extracted_pages/aluplanprogramsistemleriallplantrkiyedistribtr.WordPress.2025-11-10.Pagesxml.xml'
  );

  const parser = new XMLParser();

  try {
    const pages = await parser.parseWordPressXML(xmlPath);

    console.log(`✅ Successfully parsed ${pages.length} pages\n`);

    // Show first 3 pages
    console.log('📄 First 3 pages:');
    pages.slice(0, 3).forEach((page, index) => {
      console.log(`\n${index + 1}. ${page.title}`);
      console.log(`   Slug: ${page.slug}`);
      console.log(`   Post ID: ${page.postId}`);
      console.log(`   Status: ${page.status}`);
      console.log(`   Pub Date: ${page.pubDate.toISOString()}`);
      console.log(`   Content length: ${page.content.length} chars`);
      console.log(`   Content preview: ${page.content.substring(0, 100)}...`);
    });

    console.log(`\n✅ XMLParser test completed successfully!`);
  } catch (error) {
    console.error('❌ XMLParser test failed:', error);
    process.exit(1);
  }
}

testXMLParser();
