#!/usr/bin/env tsx
/**
 * Demo: TemplateMapper Complete Functionality
 * 
 * This script demonstrates all features of the TemplateMapper class
 */

import { TemplateMapper } from './TemplateMapper';
import * as path from 'path';

console.log('='.repeat(70));
console.log('TemplateMapper - Complete Functionality Demo');
console.log('='.repeat(70));

// Initialize with real mapping file
const mappingFile = path.join(__dirname, '../../../../extracted_pages/PAGE_MAPPING_REPORT.md');
const mapper = new TemplateMapper(mappingFile);

console.log('\n1. BASIC TEMPLATE LOOKUP');
console.log('-'.repeat(70));

const testPages = [
  '2024-ARCHITECTURE.txt',
  'Product-ALLPLAN-2025.txt',
  'Editions-ALLPLAN-Basic-2025.txt',
  '2024-Ana-Sayfa.txt'
];

testPages.forEach(page => {
  const mapping = mapper.getTemplateForPage(page);
  console.log(`\n${page}`);
  console.log(`  Template ID: ${mapping.templateId}`);
  console.log(`  Template Name: ${mapping.templateName}`);
  console.log(`  Category: ${mapping.category}`);
  console.log(`  Priority: ${mapping.priority}`);
});

console.log('\n\n2. TEMPLATE INFERENCE (Unknown Pages)');
console.log('-'.repeat(70));

const unknownPages = [
  'new-architecture-2026.txt',
  'product-future-software.txt',
  'edition-enterprise-2027.txt',
  'completely-unknown-page.txt'
];

unknownPages.forEach(page => {
  const mapping = mapper.getTemplateForPage(page);
  console.log(`\n${page}`);
  console.log(`  → Inferred: ${mapping.templateId} (${mapping.templateName})`);
});

console.log('\n\n3. STATISTICS & REPORTING');
console.log('-'.repeat(70));

const stats = mapper.getStatistics();
console.log(`\nTotal Pages Mapped: ${stats.totalPages}`);

console.log('\nTemplate Distribution:');
Object.entries(stats.byTemplate)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([template, count]) => {
    console.log(`  ${template.padEnd(40)} ${count} pages`);
  });

console.log('\nPriority Distribution:');
console.log(`  High Priority:   ${stats.byPriority.high} pages`);
console.log(`  Medium Priority: ${stats.byPriority.medium} pages`);
console.log(`  Low Priority:    ${stats.byPriority.low} pages`);

console.log('\n\n4. FILTERING BY TEMPLATE');
console.log('-'.repeat(70));

const industrySolutionPages = mapper.getPagesByTemplate('industry-solution');
console.log(`\nIndustry Solution Pages (${industrySolutionPages.length}):`);
industrySolutionPages.forEach(page => {
  console.log(`  - ${page}`);
});

console.log('\n\n5. FILTERING BY PRIORITY');
console.log('-'.repeat(70));

const highPriorityPages = mapper.getPagesByPriority('high');
console.log(`\nHigh Priority Pages (${highPriorityPages.length}):`);
highPriorityPages.slice(0, 10).forEach(page => {
  console.log(`  - ${page}`);
});
if (highPriorityPages.length > 10) {
  console.log(`  ... and ${highPriorityPages.length - 10} more`);
}

console.log('\n\n6. CACHING DEMONSTRATION');
console.log('-'.repeat(70));

const testPage = '2024-ARCHITECTURE.txt';
console.log(`\nLooking up "${testPage}" multiple times...`);

const start = Date.now();
for (let i = 0; i < 10000; i++) {
  mapper.getTemplateForPage(testPage);
}
const duration = Date.now() - start;

console.log(`✓ 10,000 lookups completed in ${duration}ms`);
console.log(`  Average: ${(duration / 10000).toFixed(4)}ms per lookup`);
console.log(`  (Caching ensures O(1) performance)`);

console.log('\n\n7. ERROR HANDLING');
console.log('-'.repeat(70));

console.log('\nHandling edge cases:');
console.log('  Empty filename: ', mapper.getTemplateForPage('').templateId);
console.log('  Special chars:  ', mapper.getTemplateForPage('test@#$%.txt').templateId);
console.log('  Very long name: ', mapper.getTemplateForPage('a'.repeat(200) + '.txt').templateId);

console.log('\n\n8. MIGRATION WORKFLOW EXAMPLE');
console.log('-'.repeat(70));

console.log('\nSimulating migration workflow:');

// Get all high priority pages
const priorityPages = mapper.getPagesByPriority('high');
console.log(`\nStep 1: Found ${priorityPages.length} high-priority pages to migrate`);

// Group by template
const byTemplate = new Map<string, string[]>();
priorityPages.forEach(page => {
  const mapping = mapper.getTemplateForPage(page);
  if (!byTemplate.has(mapping.templateId)) {
    byTemplate.set(mapping.templateId, []);
  }
  byTemplate.get(mapping.templateId)!.push(page);
});

console.log('\nStep 2: Grouped by template type:');
byTemplate.forEach((pages, templateId) => {
  console.log(`  ${templateId}: ${pages.length} pages`);
});

console.log('\nStep 3: Ready to migrate in batches by template type');

console.log('\n' + '='.repeat(70));
console.log('✓ TemplateMapper Demo Complete!');
console.log('='.repeat(70));
