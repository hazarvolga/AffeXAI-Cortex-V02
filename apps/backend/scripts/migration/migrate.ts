#!/usr/bin/env tsx
/**
 * WordPress to CMS Migration CLI
 * 
 * Usage:
 *   tsx migrate.ts                           # Migrate all pages
 *   tsx migrate.ts --dry-run                 # Dry run (no actual changes)
 *   tsx migrate.ts --pages "Ana-Sayfa,ARCHITECTURE"  # Migrate specific pages
 *   tsx migrate.ts --skip-media              # Skip media upload
 *   tsx migrate.ts --verbose                 # Verbose logging
 */

import { MigrationOrchestrator } from './MigrationOrchestrator';
import { MigrationOptions } from './types';

// Parse command line arguments
function parseArgs(): MigrationOptions {
  const args = process.argv.slice(2);

  const options: MigrationOptions = {
    sourceDir: 'extracted_pages',
    uploadsDir: 'extracted_pages/uploads',
    dryRun: false,
    verbose: false,
    batchSize: 10,
    skipMedia: false,
    pageFilter: undefined,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--dry-run':
        options.dryRun = true;
        break;

      case '--verbose':
      case '-v':
        options.verbose = true;
        break;

      case '--skip-media':
        options.skipMedia = true;
        break;

      case '--pages':
        if (i + 1 < args.length) {
          options.pageFilter = args[i + 1].split(',').map((p) => p.trim());
          i++;
        }
        break;

      case '--source':
        if (i + 1 < args.length) {
          options.sourceDir = args[i + 1];
          i++;
        }
        break;

      case '--api-url':
        if (i + 1 < args.length) {
          // Store for later use
          i++;
        }
        break;

      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;

      default:
        console.error(`Unknown argument: ${arg}`);
        printHelp();
        process.exit(1);
    }
  }

  return options;
}

function printHelp() {
  console.log(`
WordPress to CMS Migration Tool

Usage:
  tsx migrate.ts [options]

Options:
  --dry-run              Run without making actual changes
  --verbose, -v          Enable verbose logging
  --skip-media           Skip media file upload
  --pages <list>         Migrate specific pages (comma-separated)
  --source <dir>         Source directory (default: ../../extracted_pages)
  --api-url <url>        CMS API URL (default: http://localhost:9005/api)
  --help, -h             Show this help message

Examples:
  tsx migrate.ts
  tsx migrate.ts --dry-run --verbose
  tsx migrate.ts --pages "Ana-Sayfa,ARCHITECTURE"
  tsx migrate.ts --skip-media
`);
}

async function main() {
  console.log('🚀 WordPress to CMS Migration\n');

  // Parse arguments
  const options = parseArgs();

  // Get API URL from args or env
  const apiUrl =
    process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9006/api';

  console.log('Configuration:');
  console.log(`  Source: ${options.sourceDir}`);
  console.log(`  API URL: ${apiUrl}`);
  console.log(`  Dry Run: ${options.dryRun}`);
  console.log(`  Skip Media: ${options.skipMedia}`);
  console.log(`  Verbose: ${options.verbose}`);
  if (options.pageFilter) {
    console.log(`  Pages: ${options.pageFilter.join(', ')}`);
  }
  console.log('');

  // Create orchestrator
  const orchestrator = new MigrationOrchestrator(options, apiUrl);

  try {
    // Run migration
    const result = await orchestrator.migrate();

    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 Migration Summary');
    console.log('='.repeat(80));
    console.log(`Total Pages:     ${result.totalPages}`);
    console.log(`✓ Success:       ${result.successCount}`);
    console.log(`✗ Failed:        ${result.failureCount}`);
    console.log(`⏭  Skipped:       ${result.skippedCount}`);
    console.log(`⏱  Duration:      ${(result.duration / 1000).toFixed(2)}s`);
    console.log('');
    console.log(`📸 Media:         ${result.mediaReport.uploadedCount}/${result.mediaReport.totalImages} uploaded`);
    console.log('='.repeat(80));

    if (result.failureCount > 0) {
      console.log('\n⚠️  Some pages failed to migrate. Check logs/migration.log for details.');
      process.exit(1);
    } else {
      console.log('\n✅ All pages migrated successfully!');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run
main();
