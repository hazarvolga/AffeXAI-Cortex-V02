#!/usr/bin/env tsx
/**
 * Test ContentParser and IndustrySolutionParser with a real WordPress export file
 */

import * as fs from 'fs';
import * as path from 'path';
import { ContentParser } from './ContentParser';
import { IndustrySolutionParser } from './IndustrySolutionParser';

console.log('Testing parsers with real WordPress export file...\n');

// Read the 2024-ARCHITECTURE.txt file
const filePath = path.join(process.cwd(), '../../extracted_pages/2024-ARCHITECTURE.txt');

if (!fs.existsSync(filePath)) {
  console.error('Error: File not found:', filePath);
  console.error('Please ensure the extracted_pages directory exists at the project root.');
  process.exit(1);
}

const htmlContent = fs.readFileSync(filePath, 'utf-8');

console.log('File loaded:', filePath);
console.log('File size:', htmlContent.length, 'bytes\n');

// Test with ContentParser
console.log('=== Testing ContentParser ===');
const baseParser = new ContentParser();
const baseParsed = baseParser.parse(htmlContent, '2024-ARCHITECTURE.txt');

console.log('Title:', baseParsed.title);
console.log('Slug:', baseParsed.slug);
console.log('Sections:', baseParsed.sections.length);
console.log('Images:', baseParsed.images.length);
console.log('Videos:', baseParsed.videos.length);
console.log('Links:', baseParsed.links.length);
console.log('Category:', baseParsed.metadata.category);
console.log('Priority:', baseParsed.metadata.priority);

console.log('\n=== Testing IndustrySolutionParser ===');
const industryParser = new IndustrySolutionParser();
const industryParsed = industryParser.parseIndustrySolution(htmlContent, '2024-ARCHITECTURE.txt');

console.log('Hero Title:', industryParsed.hero.title);
console.log('Hero Subtitle:', industryParsed.hero.subtitle);
console.log('Hero Description (first 100 chars):', industryParsed.hero.description.substring(0, 100) + '...');
console.log('Hero Primary Button:', industryParsed.hero.primaryButton?.text);
console.log('Hero Background Image:', industryParsed.hero.backgroundImage ? 'Yes' : 'No');

console.log('\nFeatures:', industryParsed.features.features.length);
industryParsed.features.features.slice(0, 3).forEach((feature, i) => {
  console.log(`  ${i + 1}. ${feature.title}`);
});

if (industryParsed.stats) {
  console.log('\nStats:', industryParsed.stats.stats.length);
  industryParsed.stats.stats.forEach((stat, i) => {
    console.log(`  ${i + 1}. ${stat.value} - ${stat.label.substring(0, 50)}...`);
  });
}

if (industryParsed.workflowTabs) {
  console.log('\nWorkflow Tabs:', industryParsed.workflowTabs.mainTabs.length);
  industryParsed.workflowTabs.mainTabs.slice(0, 3).forEach((tab, i) => {
    console.log(`  ${i + 1}. ${tab.label}`);
  });
}

console.log('\nCTA Title:', industryParsed.cta.title);
console.log('CTA Primary Button:', industryParsed.cta.primaryButton?.text);

console.log('\n✓ Real file parsing completed successfully!');
console.log('\nParsed data structure is ready for CMS page creation.');
