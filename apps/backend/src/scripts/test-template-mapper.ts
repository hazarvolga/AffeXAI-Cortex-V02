#!/usr/bin/env ts-node
/**
 * Test Template Mapper
 * 
 * Tests the TemplateMapper class with PAGE_MAPPING_REPORT.md
 */

import * as path from 'path';
import { TemplateMapper } from './migration/template-mapper';

async function main() {
  console.log('🧪 Testing Template Mapper\n');

  const mappingFile = path.resolve(__dirname, '../../extracted_pages/PAGE_MAPPING_REPORT.md');
  
  try {
    const mapper = new TemplateMapper(mappingFile);
    
    // Print statistics
    mapper.printStatistics();
    
    // Test some lookups
    console.log('\n🔍 Testing Template Lookups:');
    console.log('─'.repeat(80));
    
    const testFiles = [
      '2024-Ana-Sayfa.txt',
      'Product-ALLPLAN-2025.txt',
      '2024-ARCHITECTURE.txt',
      'Editions-ALLPLAN-Basic-2025.txt',
      'nonexistent-file.txt',
    ];
    
    testFiles.forEach((filename) => {
      const template = mapper.getTemplateForPage(filename);
      const exists = mapper.verifyTemplateExists(template);
      console.log(`${filename}`);
      console.log(`  → Template: ${template}`);
      console.log(`  → Exists: ${exists ? '✅' : '❌'}`);
      console.log('');
    });
    
    // Test category filtering
    console.log('\n📂 High Priority Pages:');
    console.log('─'.repeat(80));
    const highPriority = mapper.getMappingsByPriority('high');
    highPriority.slice(0, 5).forEach((mapping) => {
      console.log(`  ${mapping.filename} → ${mapping.template}`);
    });
    console.log(`  ... and ${highPriority.length - 5} more`);
    
    console.log('\n✅ Template Mapper test completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
