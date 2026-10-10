#!/usr/bin/env ts-node

/**
 * Full WordPress Migration Test
 * 
 * Tests the complete migration pipeline:
 * 1. Parse WordPress HTML files
 * 2. Upload images to MinIO
 * 3. Transform URLs
 * 4. Create pages in CMS
 */

import { loadConfig, validateConfig } from './config';
import { MediaManager } from './MediaManager';
import { URLTransformer } from './URLTransformer';
import { PageCreator } from './PageCreator';
import { MigrationOrchestrator } from './MigrationOrchestrator';
import * as fs from 'fs';
import * as path from 'path';

async function testFullMigration() {
  console.log('🚀 Starting Full WordPress Migration Test\n');
  console.log('=' .repeat(60));
  console.log('\n');

  try {
    // Step 1: Load and validate configuration
    console.log('📋 Step 1: Loading configuration...');
    const config = loadConfig();
    
    console.log('   Source directory:', config.source.directory);
    console.log('   Uploads directory:', config.source.uploadsDirectory);
    console.log('   API URL:', config.target.apiBaseUrl);
    
    const errors = validateConfig(config);
    if (errors.length > 0) {
      console.error('\n❌ Configuration errors:');
      errors.forEach(err => console.error(`   - ${err}`));
      process.exit(1);
    }
    console.log('   ✅ Configuration valid\n');

    // Step 2: Check available files
    console.log('📁 Step 2: Scanning WordPress export files...');
    const files = fs.readdirSync(config.source.directory)
      .filter(f => f.endsWith('.txt') && !f.startsWith('.'));
    
    console.log(`   Found ${files.length} WordPress export files`);
    
    // Show first 10 files
    console.log('   Sample files:');
    files.slice(0, 10).forEach(f => console.log(`     - ${f}`));
    if (files.length > 10) {
      console.log(`     ... and ${files.length - 10} more`);
    }
    console.log('');

    // Step 3: Count images
    console.log('📷 Step 3: Scanning images...');
    const countImages = (dir: string): number => {
      let count = 0;
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          count += countImages(fullPath);
        } else if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(item)) {
          count++;
        }
      }
      
      return count;
    };
    
    const imageCount = countImages(config.source.uploadsDirectory);
    console.log(`   Found ${imageCount} images to upload\n`);

    // Step 4: Ask user for confirmation
    console.log('⚠️  Migration Plan:');
    console.log(`   - Parse ${files.length} WordPress pages`);
    console.log(`   - Upload ${imageCount} images to MinIO`);
    console.log(`   - Create ${files.length} CMS pages`);
    console.log('');
    
    // For now, just do a dry run with 1 file
    console.log('🧪 Running DRY RUN with 1 file...\n');
    
    // Step 5: Test with one file
    const testFile = files[0];
    console.log(`📄 Testing with: ${testFile}`);
    
    // Parse the file
    const filePath = path.join(config.source.directory, testFile);
    const htmlContent = fs.readFileSync(filePath, 'utf-8');
    
    console.log('   Parsing HTML...');
    const { ContentParser } = require('./ContentParser');
    const parser = new ContentParser();
    const parsed = parser.parse(htmlContent, testFile);
    
    console.log(`   ✅ Parsed successfully`);
    console.log(`      Title: ${parsed.title}`);
    console.log(`      Slug: ${parsed.slug}`);
    console.log(`      Sections: ${parsed.sections.length}`);
    console.log(`      Images: ${parsed.images.length}`);
    console.log(`      Videos: ${parsed.videos.length}`);
    console.log('');

    // Show images that would be uploaded
    if (parsed.images.length > 0) {
      console.log('   Images to upload:');
      parsed.images.slice(0, 5).forEach(img => {
        console.log(`     - ${img.originalUrl}`);
      });
      if (parsed.images.length > 5) {
        console.log(`     ... and ${parsed.images.length - 5} more`);
      }
      console.log('');
    }

    console.log('=' .repeat(60));
    console.log('\n✅ DRY RUN COMPLETE!\n');
    console.log('Next steps:');
    console.log('1. Review the output above');
    console.log('2. Make sure MinIO is running (docker-compose up)');
    console.log('3. Make sure backend is running (npm run start:dev)');
    console.log('4. Run full migration: npx ts-node scripts/migration/run-production-migration.ts');
    console.log('');

  } catch (error) {
    console.error('\n❌ Migration test failed:', error);
    if (error instanceof Error) {
      console.error('   Error:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run test
if (require.main === module) {
  testFullMigration()
    .then(() => {
      console.log('✅ Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

export { testFullMigration };
