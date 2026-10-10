#!/usr/bin/env ts-node
/**
 * Database Cleanup Script for WordPress CMS Migration
 * 
 * This script removes all migrated pages and their components from the database
 * to prepare for a fresh migration with correct data structure.
 * 
 * Features:
 * - Identifies migrated pages by slug pattern or date range
 * - Deletes pages with CASCADE (automatically removes components)
 * - Deletes orphaned media entities
 * - Generates cleanup report
 * 
 * Usage:
 *   npm run cleanup:migration
 *   npm run cleanup:migration -- --dry-run
 *   npm run cleanup:migration -- --after="2024-12-01"
 */

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface CleanupResult {
  deletedPages: number;
  deletedComponents: number;
  deletedMediaEntities: number;
  pageIds: string[];
  errors: string[];
}

interface CleanupOptions {
  dryRun: boolean;
  afterDate?: Date;
  slugPattern?: string;
}

class MigrationCleanup {
  constructor(private dataSource: DataSource) {}

  /**
   * Main cleanup method
   */
  async cleanup(options: CleanupOptions): Promise<CleanupResult> {
    const result: CleanupResult = {
      deletedPages: 0,
      deletedComponents: 0,
      deletedMediaEntities: 0,
      pageIds: [],
      errors: [],
    };

    try {
      console.log('🔍 Identifying migrated pages...');
      const pageIds = await this.identifyMigratedPages(options);
      result.pageIds = pageIds;

      console.log(`📊 Found ${pageIds.length} migrated pages`);

      if (pageIds.length === 0) {
        console.log('✅ No migrated pages found. Database is clean.');
        return result;
      }

      if (options.dryRun) {
        console.log('🔍 DRY RUN MODE - No data will be deleted');
        await this.previewDeletion(pageIds);
        return result;
      }

      // Count components before deletion
      const componentCount = await this.countComponents(pageIds);
      console.log(`📊 Found ${componentCount} components to delete`);

      // Delete pages (CASCADE will delete components automatically)
      console.log('🗑️  Deleting pages and components...');
      result.deletedPages = await this.deletePages(pageIds);
      result.deletedComponents = componentCount;

      // Delete orphaned media entities
      console.log('🗑️  Deleting orphaned media entities...');
      result.deletedMediaEntities = await this.deleteOrphanedMedia(options);

      console.log('✅ Cleanup completed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(errorMessage);
      console.error('❌ Cleanup failed:', errorMessage);
      throw error;
    }

    return result;
  }

  /**
   * Identify migrated pages based on criteria
   */
  private async identifyMigratedPages(options: CleanupOptions): Promise<string[]> {
    const queryBuilder = this.dataSource
      .createQueryBuilder()
      .select('id')
      .from('cms_pages', 'page');

    // Filter by date if specified
    if (options.afterDate) {
      queryBuilder.where('page.created_at > :afterDate', {
        afterDate: options.afterDate,
      });
    }

    // Filter by slug pattern if specified
    if (options.slugPattern) {
      queryBuilder.andWhere('page.slug LIKE :pattern', {
        pattern: `%${options.slugPattern}%`,
      });
    }

    // If no filters specified, use default: pages created in last 7 days
    if (!options.afterDate && !options.slugPattern) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      queryBuilder.where('page.created_at > :afterDate', {
        afterDate: sevenDaysAgo,
      });
      console.log(`ℹ️  Using default filter: pages created after ${sevenDaysAgo.toISOString()}`);
    }

    const results = await queryBuilder.getRawMany();
    return results.map((row) => row.id);
  }

  /**
   * Preview what will be deleted (dry-run mode)
   */
  private async previewDeletion(pageIds: string[]): Promise<void> {
    const pages = await this.dataSource
      .createQueryBuilder()
      .select(['page.id AS id', 'page.title AS title', 'page.slug AS slug', 'page.created_at AS created_at'])
      .from('cms_pages', 'page')
      .where('page.id IN (:...pageIds)', { pageIds })
      .getRawMany();

    console.log('\n📋 Pages to be deleted:');
    console.log('─'.repeat(80));
    pages.forEach((page, index) => {
      console.log(`${index + 1}. ${page.title}`);
      console.log(`   Slug: ${page.slug}`);
      console.log(`   Created: ${page.created_at}`);
      console.log(`   ID: ${page.id}`);
      console.log('');
    });
    console.log('─'.repeat(80));

    const componentCount = await this.countComponents(pageIds);
    console.log(`\n📊 Total components to be deleted: ${componentCount}`);
  }

  /**
   * Count components for given pages
   */
  private async countComponents(pageIds: string[]): Promise<number> {
    if (pageIds.length === 0) return 0;

    const result = await this.dataSource
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('cms_components', 'component')
      .where('component."pageId" IN (:...pageIds)', { pageIds })
      .getRawOne();

    return parseInt(result.count, 10);
  }

  /**
   * Delete pages (CASCADE will delete components)
   */
  private async deletePages(pageIds: string[]): Promise<number> {
    if (pageIds.length === 0) return 0;

    const result = await this.dataSource
      .createQueryBuilder()
      .delete()
      .from('cms_pages')
      .where('id IN (:...pageIds)', { pageIds })
      .execute();

    return result.affected || 0;
  }

  /**
   * Delete orphaned media entities
   */
  private async deleteOrphanedMedia(options: CleanupOptions): Promise<number> {
    // Find media entities that are not referenced by any component
    const orphanedMedia = await this.dataSource
      .createQueryBuilder()
      .select('media.id')
      .from('media', 'media')
      .leftJoin(
        'cms_components',
        'component',
        `component.props::jsonb @> jsonb_build_object('imageMediaId', media.id::text)`
      )
      .where('component.id IS NULL')
      .andWhere('media.module = :module', { module: 'cms' });

    // Filter by date if specified
    if (options.afterDate) {
      orphanedMedia.andWhere('media.created_at > :afterDate', {
        afterDate: options.afterDate,
      });
    }

    const mediaIds = (await orphanedMedia.getRawMany()).map((row) => row.id);

    if (mediaIds.length === 0) {
      console.log('ℹ️  No orphaned media entities found');
      return 0;
    }

    console.log(`📊 Found ${mediaIds.length} orphaned media entities`);

    if (options.dryRun) {
      return mediaIds.length;
    }

    const result = await this.dataSource
      .createQueryBuilder()
      .delete()
      .from('media')
      .where('id IN (:...mediaIds)', { mediaIds })
      .execute();

    return result.affected || 0;
  }

  /**
   * Generate cleanup report
   */
  generateReport(result: CleanupResult, options: CleanupOptions): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 CLEANUP REPORT');
    console.log('='.repeat(80));
    console.log(`Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}`);
    console.log(`Date: ${new Date().toISOString()}`);
    console.log('─'.repeat(80));
    console.log(`Pages deleted: ${result.deletedPages}`);
    console.log(`Components deleted: ${result.deletedComponents}`);
    console.log(`Media entities deleted: ${result.deletedMediaEntities}`);
    console.log('─'.repeat(80));

    if (result.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      result.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    if (options.dryRun) {
      console.log('\n⚠️  This was a DRY RUN. No data was actually deleted.');
      console.log('Run without --dry-run to perform actual deletion.');
    } else {
      console.log('\n✅ Cleanup completed successfully!');
      console.log('Database is ready for fresh migration.');
    }

    console.log('='.repeat(80) + '\n');
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): CleanupOptions {
  const args = process.argv.slice(2);
  const options: CleanupOptions = {
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--after' && args[i + 1]) {
      options.afterDate = new Date(args[i + 1]);
      i++;
    } else if (arg === '--slug-pattern' && args[i + 1]) {
      options.slugPattern = args[i + 1];
      i++;
    } else if (arg === '--help') {
      console.log(`
Usage: npm run cleanup:migration [options]

Options:
  --dry-run              Preview what will be deleted without actually deleting
  --after <date>         Delete pages created after this date (ISO format)
  --slug-pattern <text>  Delete pages with slugs containing this text
  --help                 Show this help message

Examples:
  npm run cleanup:migration --dry-run
  npm run cleanup:migration --after="2024-12-01"
  npm run cleanup:migration --slug-pattern="product-"
      `);
      process.exit(0);
    }
  }

  return options;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 WordPress CMS Migration - Database Cleanup');
  console.log('');

  const options = parseArgs();

  // Create database connection
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5434', 10),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'affexai_dev',
  });

  try {
    console.log('🔌 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Connected to database');

    const cleanup = new MigrationCleanup(dataSource);
    const result = await cleanup.cleanup(options);
    cleanup.generateReport(result, options);

    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { MigrationCleanup, CleanupOptions, CleanupResult };
