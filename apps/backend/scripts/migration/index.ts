#!/usr/bin/env tsx
/**
 * WordPress to CMS Migration CLI
 * 
 * Advanced CLI tool with commander for argument parsing and progress tracking
 */

import { Command } from 'commander';
import * as path from 'path';
import { MigrationOrchestrator } from './MigrationOrchestrator';
import { MigrationOptions } from './types';
import { loadConfig } from './config';

const program = new Command();

// CLI Configuration
program
  .name('migrate')
  .description('WordPress to CMS Migration Tool')
  .version('1.0.0')
  .option('-d, --dry-run', 'Run without making actual changes (validation only)')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('--skip-media', 'Skip media file upload')
  .option('-p, --pages <pages>', 'Migrate specific pages (comma-separated)')
  .option('--category <category>', 'Migrate pages by category (e.g., "Industry Solution")')
  .option('-s, --source <dir>', 'Source directory', '../../extracted_pages')
  .option('-u, --uploads <dir>', 'Uploads directory', '../../extracted_pages/uploads')
  .option('-a, --api-url <url>', 'CMS API URL', process.env.API_URL || 'http://localhost:9006/api')
  .option('-b, --batch-size <size>', 'Batch size for processing', '10')
  .option('--config <path>', 'Path to configuration file')
  .option('--no-progress', 'Disable progress bar')
  .parse(process.argv);

const opts = program.opts();

/**
 * Display banner
 */
function displayBanner() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   WordPress to CMS Migration Tool                            ║
║   Version 1.0.0                                               ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);
}

/**
 * Display configuration
 */
function displayConfiguration(options: MigrationOptions, apiUrl: string) {
  console.log('📋 Configuration:');
  console.log('─'.repeat(60));
  console.log(`  Source Directory:    ${options.sourceDir}`);
  console.log(`  Uploads Directory:   ${options.uploadsDir}`);
  console.log(`  API URL:             ${apiUrl}`);
  console.log(`  Batch Size:          ${options.batchSize}`);
  console.log(`  Dry Run:             ${options.dryRun ? '✓ Yes' : '✗ No'}`);
  console.log(`  Skip Media:          ${options.skipMedia ? '✓ Yes' : '✗ No'}`);
  console.log(`  Verbose:             ${options.verbose ? '✓ Yes' : '✗ No'}`);
  
  if (options.pageFilter) {
    console.log(`  Page Filter:         ${options.pageFilter.join(', ')}`);
  }
  
  console.log('─'.repeat(60));
  console.log('');
}

/**
 * Display progress bar
 */
function displayProgress(current: number, total: number, item?: string) {
  const percentage = Math.round((current / total) * 100);
  const barLength = 40;
  const filledLength = Math.round((barLength * current) / total);
  const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
  
  const itemText = item ? ` - ${item}` : '';
  process.stdout.write(`\r  Progress: [${bar}] ${percentage}% (${current}/${total})${itemText}`);
  
  if (current === total) {
    process.stdout.write('\n');
  }
}

/**
 * Display summary
 */
function displaySummary(result: any) {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                     Migration Summary                         ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');
  
  // Pages
  console.log('📄 Pages:');
  console.log(`  Total:               ${result.totalPages}`);
  console.log(`  ✓ Success:           ${result.successCount}`);
  console.log(`  ✗ Failed:            ${result.failureCount}`);
  console.log(`  ⏭  Skipped:           ${result.skippedCount}`);
  console.log('');
  
  // Media
  console.log('📸 Media:');
  console.log(`  Total Images:        ${result.mediaReport.totalImages}`);
  console.log(`  ✓ Uploaded:          ${result.mediaReport.uploadedCount}`);
  console.log(`  ✗ Failed:            ${result.mediaReport.failedCount}`);
  console.log(`  ⏭  Skipped:           ${result.mediaReport.skippedCount}`);
  console.log('');
  
  // Performance
  console.log('⏱  Performance:');
  console.log(`  Duration:            ${(result.duration / 1000).toFixed(2)}s`);
  console.log(`  Avg per page:        ${(result.duration / result.totalPages / 1000).toFixed(2)}s`);
  console.log('');
  
  // Errors
  if (result.errors && result.errors.length > 0) {
    console.log('⚠️  Errors:');
    result.errors.slice(0, 5).forEach((error: any) => {
      console.log(`  - ${error.page}: ${error.error}`);
    });
    if (result.errors.length > 5) {
      console.log(`  ... and ${result.errors.length - 5} more errors`);
    }
    console.log('');
  }
  
  console.log('─'.repeat(60));
  
  // Final status
  if (result.failureCount > 0) {
    console.log('⚠️  Migration completed with errors');
    console.log('   Check logs/migration.log for details');
  } else {
    console.log('✅ Migration completed successfully!');
  }
  
  console.log('');
}

/**
 * Main execution
 */
async function main() {
  try {
    // Display banner
    displayBanner();
    
    // Load configuration
    let config;
    if (opts.config) {
      config = loadConfig(opts.config);
    }
    
    // Build migration options
    const options: MigrationOptions = {
      sourceDir: path.resolve(__dirname, opts.source),
      uploadsDir: path.resolve(__dirname, opts.uploads),
      dryRun: opts.dryRun || false,
      verbose: opts.verbose || false,
      batchSize: parseInt(opts.batchSize) || 10,
      skipMedia: opts.skipMedia || false,
      pageFilter: opts.pages ? opts.pages.split(',').map((p: string) => p.trim()) : undefined,
    };
    
    const apiUrl = opts.apiUrl;
    
    // Display configuration
    displayConfiguration(options, apiUrl);
    
    // Confirm if not dry-run
    if (!options.dryRun) {
      console.log('⚠️  This will create pages in the CMS!');
      console.log('   Use --dry-run to test without making changes.\n');
    } else {
      console.log('ℹ️  Running in DRY RUN mode - no changes will be made.\n');
    }
    
    // Create orchestrator
    const orchestrator = new MigrationOrchestrator(options, apiUrl);
    
    // Setup progress tracking
    let currentPage = 0;
    let totalPages = 0;
    
    // Start migration
    console.log('🚀 Starting migration...\n');
    const startTime = Date.now();
    
    const result = await orchestrator.migrate();
    
    const endTime = Date.now();
    result.duration = endTime - startTime;
    
    // Display summary
    displaySummary(result);
    
    // Exit with appropriate code
    if (result.failureCount > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error instanceof Error ? error.message : String(error));
    
    if (opts.verbose && error instanceof Error && error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unhandled error:');
  console.error(error);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n\n⚠️  Migration interrupted by user');
  process.exit(130);
});

// Run
main();
