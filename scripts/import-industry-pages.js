#!/usr/bin/env node
/**
 * Import Industry Solution Pages to CMS
 *
 * This script:
 * 1. Creates an "Industry Solutions" category
 * 2. Reads each extracted WordPress page
 * 3. Transforms image URLs using the mapping file
 * 4. Transforms domain links (aluplan.com.tr → aluplan.tr)
 * 5. Preserves YouTube video links
 * 6. Creates CMS pages with BLOCK components
 */

const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:9006/api';
const EXTRACTED_PAGES_DIR = '/Users/hazarekiz/Projects/v06/Affexai/extracted_pages';
const IMAGE_MAPPING_FILE = '/tmp/industry_images_mapping.json';

// Industry Solution pages to import
const INDUSTRY_PAGES = [
  { file: '2024-ARCHITECTURE.txt', slug: 'architecture', title: 'Mimari Çözümler' },
  { file: '2024-Structural-Engineering.txt', slug: 'structural-engineering', title: 'Yapısal Mühendislik' },
  { file: '2024-Civil-Engineering-Endüstri-Çözümleri.txt', slug: 'civil-engineering', title: 'İnşaat Mühendisliği' },
  { file: '2024-Bridge-Design.txt', slug: 'bridge-design', title: 'Köprü Tasarımı' },
  { file: '2024-Road-and-Rail-Design.txt', slug: 'road-rail-design', title: 'Yol ve Demiryolu Tasarımı' },
  { file: '2024-Site-Planning.txt', slug: 'site-planning', title: 'Şantiye Planlaması' },
  { file: '2024-Steel-Detailing-Fabrication.txt', slug: 'steel-fabrication', title: 'Çelik İmalatı' },
  { file: '2024-Product-Allplan-Bridge.txt', slug: 'allplan-bridge', title: 'Allplan Bridge' },
];

// Load image mapping
let imageMapping = {};
try {
  const mappingContent = fs.readFileSync(IMAGE_MAPPING_FILE, 'utf8');
  imageMapping = JSON.parse(mappingContent);
  console.log(`✅ Loaded ${Object.keys(imageMapping).length} image mappings`);
} catch (error) {
  console.error('⚠️  Could not load image mapping file:', error.message);
}

/**
 * Transform content - replace old URLs with new ones
 */
function transformContent(content) {
  let transformed = content;

  // 1. Replace image URLs from WordPress to local Media Library
  for (const [oldUrl, mapping] of Object.entries(imageMapping)) {
    if (mapping.newUrl) {
      // Make the new URL absolute with API base
      const newUrl = `http://localhost:9006${mapping.newUrl}`;
      transformed = transformed.split(oldUrl).join(newUrl);

      // Also handle variations (without https:)
      const oldUrlHttp = oldUrl.replace('https://', 'http://');
      transformed = transformed.split(oldUrlHttp).join(newUrl);
    }
  }

  // 2. Also handle allplan.com images that might be referenced
  transformed = transformed.replace(
    /https?:\/\/www\.allplan\.com\/fileadmin\/_processed_\/[^"'\s)]+/g,
    (match) => {
      // Keep these as-is since they're from allplan.com (external)
      return match;
    }
  );

  // 3. Transform domain links: aluplan.com.tr → aluplan.tr
  transformed = transformed.replace(/https?:\/\/aluplan\.com\.tr/g, 'https://aluplan.tr');
  transformed = transformed.replace(/https?:\/\/allplanblogturkiye\.aluplan\.com\.tr/g, 'https://blog.aluplan.tr');

  // 4. Keep YouTube links as-is (they're already correct)
  // YouTube links like https://youtu.be/SnuaHSL18e8 are preserved

  // 5. Clean up Elementor-specific styles that won't work
  transformed = transformed.replace(/<style>\.elementor-\d+[^<]*<\/style>/gs, '');

  // 6. Remove data-* attributes from sections
  transformed = transformed.replace(/data-id="[^"]+"/g, '');
  transformed = transformed.replace(/data-element_type="[^"]+"/g, '');

  return transformed;
}

/**
 * Extract a clean description from the content
 */
function extractDescription(content) {
  // Try to find the first meaningful paragraph
  const paragraphMatch = content.match(/<p[^>]*>([^<]+)<\/p>/);
  if (paragraphMatch && paragraphMatch[1]) {
    let desc = paragraphMatch[1].trim();
    // Remove HTML entities
    desc = desc.replace(/&[^;]+;/g, ' ');
    // Truncate to 200 chars
    if (desc.length > 200) {
      desc = desc.substring(0, 197) + '...';
    }
    return desc;
  }
  return '';
}

/**
 * Make API request with proper error handling
 */
async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(`API Error: ${response.status} - ${JSON.stringify(result)}`);
  }

  // Unwrap data from { success, data } format
  return result.data;
}

/**
 * Create or get Industry Solutions category
 */
async function getOrCreateCategory() {
  console.log('\n📁 Setting up Industry Solutions category...');

  try {
    // Try to get existing categories
    const categories = await apiRequest('/cms/categories');

    // Look for existing Industry Solutions category
    const existing = categories.find(c => c.slug === 'industry-solutions');
    if (existing) {
      console.log(`   ✅ Found existing category: ${existing.id}`);
      return existing.id;
    }

    // Create new category
    const newCategory = await apiRequest('/cms/categories', 'POST', {
      name: 'Endüstri Çözümleri',
      slug: 'industry-solutions',
      description: 'Allplan endüstri çözümleri - Mimari, Yapısal Mühendislik, Köprü Tasarımı ve daha fazlası',
      isActive: true,
      orderIndex: 10
    });

    console.log(`   ✅ Created new category: ${newCategory.id}`);
    return newCategory.id;

  } catch (error) {
    console.error('   ❌ Category error:', error.message);
    return null;
  }
}

/**
 * Create a CMS page
 */
async function createPage(pageInfo, categoryId) {
  const { file, slug, title } = pageInfo;
  const filePath = path.join(EXTRACTED_PAGES_DIR, file);

  console.log(`\n📄 Processing: ${title} (${file})`);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.log(`   ⚠️  File not found: ${filePath}`);
    return null;
  }

  // Read and transform content
  let content = fs.readFileSync(filePath, 'utf8');

  // Extract title from content if available
  const titleMatch = content.match(/^Title:\s*(.+)$/m);
  const extractedTitle = titleMatch ? titleMatch[1].trim() : title;

  // Remove the Title: line from content
  content = content.replace(/^Title:\s*.+\n?/m, '');

  // Transform content (URLs, cleanup)
  content = transformContent(content);

  // Extract description
  const description = extractDescription(content);

  try {
    // Check if page already exists
    const existingPages = await apiRequest(`/cms/pages?search=${encodeURIComponent(slug)}`);
    const existingPage = Array.isArray(existingPages) ?
      existingPages.find(p => p.slug === slug) :
      null;

    if (existingPage) {
      console.log(`   ⚠️  Page exists: ${existingPage.id}`);

      // Check if page has components
      const pageDetails = await apiRequest(`/cms/pages/${existingPage.id}`);
      if (pageDetails.components && pageDetails.components.length > 0) {
        console.log(`   ⏭️  Already has ${pageDetails.components.length} components, skipping`);
        return { ...existingPage, alreadyExists: true };
      }

      // Page exists but has no components - add content
      console.log(`   📦 Adding missing content block...`);
      const componentData = {
        pageId: existingPage.id,
        type: 'block',
        props: {
          blockType: 'html-content',
          content: content,
          originalFile: file,
          importedAt: new Date().toISOString()
        },
        orderIndex: 0
      };

      const component = await apiRequest('/cms/components', 'POST', componentData);
      console.log(`   ✅ Component added: ${component.id}`);

      // Update page category if needed
      if (categoryId && !existingPage.categoryId) {
        await apiRequest(`/cms/pages/${existingPage.id}`, 'PATCH', { categoryId });
        console.log(`   ✅ Category updated`);
      }

      return existingPage;
    }

    // Create new page
    const pageData = {
      title: extractedTitle || title,
      slug: slug,
      description: description,
      status: 'draft',
      categoryId: categoryId,
      layoutOptions: {
        showHeader: true,
        showFooter: true,
        fullWidth: true,
        showTitle: true
      }
    };

    console.log(`   📝 Creating page: ${pageData.title}`);
    const page = await apiRequest('/cms/pages', 'POST', pageData);
    console.log(`   ✅ Page created: ${page.id}`);

    // Create content component
    const componentData = {
      pageId: page.id,
      type: 'block',
      props: {
        blockType: 'html-content',
        content: content,
        originalFile: file,
        importedAt: new Date().toISOString()
      },
      orderIndex: 0
    };

    console.log(`   📦 Adding content block...`);
    const component = await apiRequest('/cms/components', 'POST', componentData);
    console.log(`   ✅ Component added: ${component.id}`);

    return page;

  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  🚀 Industry Solutions Page Import');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  API: ${API_BASE_URL}`);
  console.log(`  Pages to import: ${INDUSTRY_PAGES.length}`);
  console.log('═══════════════════════════════════════════════════════');

  // Check API health
  try {
    const health = await apiRequest('/health');
    console.log(`\n✅ API is healthy: ${health.data?.status || 'ok'}`);
  } catch (error) {
    console.error('❌ API is not available:', error.message);
    process.exit(1);
  }

  // Create/get category
  const categoryId = await getOrCreateCategory();

  // Track results
  const results = {
    success: [],
    failed: [],
    skipped: []
  };

  // Process each page
  for (const pageInfo of INDUSTRY_PAGES) {
    const result = await createPage(pageInfo, categoryId);

    if (result === null) {
      results.failed.push(pageInfo.file);
    } else if (result.alreadyExists) {
      results.skipped.push(pageInfo.file);
    } else {
      results.success.push(pageInfo.file);
    }
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  📊 Import Summary');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  ✅ Created: ${results.success.length}`);
  console.log(`  ⚠️  Skipped (existing): ${results.skipped.length}`);
  console.log(`  ❌ Failed: ${results.failed.length}`);

  if (results.failed.length > 0) {
    console.log('\n  Failed pages:');
    results.failed.forEach(f => console.log(`    - ${f}`));
  }

  console.log('═══════════════════════════════════════════════════════');
}

// Run
main().catch(console.error);
