#!/usr/bin/env node
/**
 * WordPress CMS Migration - CLI Entry Point
 * 
 * Command-line interface for running WordPress to CMS migration.
 * 
 * Usage:
 *   npm run migrate:wordpress-xml
 *   npm run migrate:wordpress-xml -- --dry-run
 *   npm run migrate:wordpress-xml -- --validate-only
 *   npm run migrate:wordpress-xml -- --verbose
 * 
 * Environment Variables:
 *   DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
 *   MIGRATION_XML_FILE
 *   MIGRATION_MAPPING_FILE
 *   MIGRATION_TEMPLATE_FILE
 *   MIGRATION_UPLOADS_DIR
 */

import { DataSource } from 'typeorm';
import { MigrationOrchestrator } from './orchestrator/migration-orchestrator';
import { Validator } from './validators/validator';
import { log } from './utils/logger';
import * as path from 'path';
import * as fs from 'fs';

interface CLIOptions {
  dryRun: boolean;
  validateOnly: boolean;
  verbose: boolean;
  xmlFile?: string;
  mappingFile?: string;
  templateFile?: string;
  uploadsDir?: string;
}

/**
 * Parse command line arguments
 */
function parseArguments(): CLIOptions {
  const args = process.argv.slice(2);
  
  const options: CLIOptions = {
    dryRun: false,
    validateOnly: false,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--validate-only':
        options.validateOnly = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--xml-file':
        options.xmlFile = args[++i];
        break;
      case '--mapping-file':
        options.mappingFile = args[++i];
        break;
      case '--template-file':
        options.templateFile = args[++i];
        break;
      case '--uploads-dir':
        options.uploadsDir = args[++i];
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
      default:
        if (arg.startsWith('--')) {
          log.warn(`Unknown option: ${arg}`);
        }
    }
  }

  return options;
}

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
WordPress CMS Migration Tool

Usage:
  npm run migrate:wordpress-xml [options]

Options:
  --dry-run              Run migration without writing to database
  --validate-only        Only validate existing data, don't migrate
  --verbose, -v          Show detailed logs
  --xml-file <path>      Path to WordPress XML export file
  --mapping-file <path>  Path to media mapping JSON file
  --template-file <path> Path to template mapping file
  --uploads-dir <path>   Path to uploads directory
  --help, -h             Show this help message

Environment Variables:
  DB_HOST                Database host (default: localhost)
  DB_PORT                Database port (default: 5434)
  DB_USER                Database user (default: postgres)
  DB_PASSWORD            Database password
  DB_NAME                Database name (default: affexai_dev)
  
  MIGRATION_XML_FILE     Path to XML export file
  MIGRATION_MAPPING_FILE Path to media mapping file
  MIGRATION_TEMPLATE_FILE Path to template mapping file
  MIGRATION_UPLOADS_DIR  Path to uploads directory

Examples:
  # Run full migration
  npm run migrate:wordpress-xml

  # Dry run (no database writes)
  npm run migrate:wordpress-xml -- --dry-run

  # Validate only
  npm run migrate:wordpress-xml -- --validate-only

  # Verbose output
  npm run migrate:wordpress-xml -- --verbose
  `);
}

/**
 * Load configuration from environment and CLI options
 */
function loadConfiguration(options: CLIOptions): {
  xmlFilePath: string;
  mappingFilePath: string;
  templateMappingPath: string;
  uploadsDir: string;
  dryRun: boolean;
} {
  const xmlFilePath = options.xmlFile || 
    process.env.MIGRATION_XML_FILE || 
    path.join(__dirname, '../../../extracted_pages/wordpress-export.xml');

  const mappingFilePath = options.mappingFile || 
    process.env.MIGRATION_MAPPING_FILE || 
    path.join(__dirname, '../../../extracted_pages/MIGRATION_MAPPING.json');

  const templateMappingPath = options.templateFile || 
    process.env.MIGRATION_TEMPLATE_FILE || 
    path.join(__dirname, '../../../extracted_pages/PAGE_MAPPING_REPORT.md');

  const uploadsDir = options.uploadsDir || 
    process.env.MIGRATION_UPLOADS_DIR || 
    path.join(__dirname, '../../../extracted_pages/uploads');

  // Validate files exist
  if (!fs.existsSync(xmlFilePath)) {
    throw new Error(`XML file not found: ${xmlFilePath}`);
  }

  if (!fs.existsSync(mappingFilePath)) {
    log.warn(`Mapping file not found: ${mappingFilePath} (will use empty mapping)`);
  }

  if (!fs.existsSync(templateMappingPath)) {
    log.warn(`Template mapping file not found: ${templateMappingPath} (will use defaults)`);
  }

  return {
    xmlFilePath,
    mappingFilePath,
    templateMappingPath,
    uploadsDir,
    dryRun: options.dryRun,
  };
}

/**
 * Initialize database connection using raw SQL (no entity metadata needed)
 */
async function initializeDatabase(): Promise<DataSource> {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5434'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'affexai_dev',
    entities: [],
    synchronize: false,
    logging: false,
  });

  await dataSource.initialize();
  log.info('Database connection established');
  return dataSource;
}

/**
 * Run migration
 */
async function runMigration(
  dataSource: DataSource,
  config: ReturnType<typeof loadConfiguration>
): Promise<number> {
  const orchestrator = new MigrationOrchestrator(dataSource);

  try {
    const result = await orchestrator.migrate(config);

    // Return exit code based on result
    if (result.failedPages > 0) {
      log.error(`Migration completed with ${result.failedPages} failed pages`);
      return 1;
    }

    log.info('Migration completed successfully');
    return 0;
  } catch (error) {
    log.error('Migration failed with critical error', error);
    return 1;
  }
}

/**
 * Run validation only
 */
async function runValidation(dataSource: DataSource): Promise<number> {
  const validator = new Validator(dataSource);

  try {
    const result = await validator.validateMigration();

    // Save JSON report
    const reportPath = path.join(__dirname, '../../../validation-report.json');
    fs.writeFileSync(reportPath, validator.generateJSONReport(result));
    log.info(`Validation report saved to: ${reportPath}`);

    // Return exit code based on result
    if (!result.valid) {
      log.error(`Validation failed with ${result.errors.length} errors`);
      return 1;
    }

    log.info('Validation passed');
    return 0;
  } catch (error) {
    log.error('Validation failed with critical error', error);
    return 1;
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  try {
    // Parse arguments
    const options = parseArguments();

    // Print banner
    log.info('='.repeat(80));
    log.info('WordPress CMS Migration Tool');
    log.info('='.repeat(80));

    if (options.dryRun) {
      log.info('Mode: DRY RUN (no database writes)');
    } else if (options.validateOnly) {
      log.info('Mode: VALIDATE ONLY');
    } else {
      log.info('Mode: FULL MIGRATION');
    }

    if (options.verbose) {
      log.info('Verbose logging enabled');
    }

    log.info('='.repeat(80));

    // Initialize database
    const dataSource = await initializeDatabase();

    let exitCode = 0;

    try {
      if (options.validateOnly) {
        // Run validation only
        exitCode = await runValidation(dataSource);
      } else {
        // Load configuration
        const config = loadConfiguration(options);

        log.info('Configuration:');
        log.info(`  XML File: ${config.xmlFilePath}`);
        log.info(`  Mapping File: ${config.mappingFilePath}`);
        log.info(`  Template File: ${config.templateMappingPath}`);
        log.info(`  Uploads Dir: ${config.uploadsDir}`);
        log.info(`  Dry Run: ${config.dryRun}`);
        log.info('');

        // Run migration
        exitCode = await runMigration(dataSource, config);
      }
    } finally {
      // Close database connection
      await dataSource.destroy();
      log.info('Database connection closed');
    }

    // Exit with appropriate code
    process.exit(exitCode);
  } catch (error) {
    log.error('Fatal error', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { main, parseArguments, loadConfiguration };
