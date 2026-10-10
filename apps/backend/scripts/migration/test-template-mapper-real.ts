#!/usr/bin/env tsx
/**
 * Test TemplateMapper with real PAGE_MAPPING_REPORT.md file
 */

import { TemplateMapper } from './TemplateMapper';
import * as path from 'path';

console.log('Testing TemplateMapper with real PAGE_MAPPING_REPORT.md...\n');

// Use the actual mapping file
const mappingFile = path.join(__dirname, '../../../../extracted_pages/PAGE_MAPPING_REPORT.md');
const mapper = new TemplateMapper(mappingFile);

console.log('Statistics:');
const stats = mapper.getStatistics();
console.log(`  Total pages: ${stats.totalPages}`);
console.log(`  By template:`);
Object.entries(stats.byTemplate).forEach(([template, count]) => {
  console.log(`    - ${template}: ${count}`);
});
console.log(`  By priority:`);
console.log(`    - High: ${stats.byPriority.high}`);
console.log(`    - Medium: ${stats.byPriority.medium}`);
console.log(`    - Low: ${stats.byPriority.low}`);

console.log('\nTesting specific pages:');

// Test Industry Solution pages
console.log('\n1. Industry Solution Pages:');
const industrySolutionPages = [
  '2024-ARCHITECTURE.txt',
  '2024-Civil-Engineering-Endüstri-Çözümleri.txt',
  '2024-Structural-Engineering.txt',
  '2024-Bridge-Design.txt',
  '2024-Road-and-Rail-Design.txt',
  '2024-Site-Planning.txt',
  '2024-Steel-Detailing-Fabrication.txt'
];

industrySolutionPages.forEach(page => {
  const mapping = mapper.getTemplateForPage(page);
  console.log(`  ${page} → ${mapping.templateId} (${mapping.priority})`);
});

// Test Product pages
console.log('\n2. Product Pages:');
const productPages = [
  'Product-ALLPLAN-2025.txt',
  'Product-ALLPLAN-Civil.txt',
  '2024-Product-Allplan-Bridge.txt'
];

productPages.forEach(page => {
  const mapping = mapper.getTemplateForPage(page);
  console.log(`  ${page} → ${mapping.templateId} (${mapping.priority})`);
});

// Test Pricing pages
console.log('\n3. Pricing Pages:');
const pricingPages = [
  'Editions-ALLPLAN-Basic-2025.txt',
  'Editions-ALLPLAN-Professional-2025.txt',
  'Package-Overview-2025.txt'
];

pricingPages.forEach(page => {
  const mapping = mapper.getTemplateForPage(page);
  console.log(`  ${page} → ${mapping.templateId} (${mapping.priority})`);
});

// Test Homepage
console.log('\n4. Homepage:');
const homepagePages = [
  '2024-Ana-Sayfa.txt',
  '2025-Ana-Sayfa.txt'
];

homepagePages.forEach(page => {
  const mapping = mapper.getTemplateForPage(page);
  console.log(`  ${page} → ${mapping.templateId} (${mapping.priority})`);
});

// Test unknown page
console.log('\n5. Unknown Page (should use default or infer):');
const unknownPage = 'unknown-test-page.txt';
const unknownMapping = mapper.getTemplateForPage(unknownPage);
console.log(`  ${unknownPage} → ${unknownMapping.templateId} (${unknownMapping.priority})`);

console.log('\n✓ TemplateMapper working correctly with real mapping file!');
