/**
 * WordPress Migration Cleanup Script
 * 
 * Deletes failed migration data to prepare for fresh migration.
 * According to plan.txt:
 * - Delete 226 pages
 * - Delete 9,545 components (CASCADE)
 * - Keep Media entities (reusable)
 */

import { DataSource } from 'typeorm';
import { log } from './utils/logger';

interface CleanupStats {
  pagesDeleted: number;
  componentsDeleted: number;
  mediaKept: number;
}

export class MigrationCleanup {
  constructor(private dataSource: DataSource) {}

  /**
   * Clean up all migrated pages and components
   * Media entities are preserved for reuse
   */
  async cleanup(dryRun: boolean = false): Promise<CleanupStats> {
    log.info('Starting migration cleanup...');
    log.info(`Dry run mode: ${dryRun}`);

    const stats: CleanupStats = {
      pagesDeleted: 0,
      componentsDeleted: 0,
      mediaKept: 0,
    };

    try {
      // Count existing data
      const pageCount = await this.dataSource.query(
        `SELECT COUNT(*) as count FROM cms_pages WHERE status = 'draft'`
      );
      const componentCount = await this.dataSource.query(
        `SELECT COUNT(*) as count FROM cms_components`
      );
      const mediaCount = await this.dataSource.query(
        `SELECT COUNT(*) as count FROM media WHERE module = 'cms'`
      );

      log.info(`Found ${pageCount[0].count} draft pages`);
      log.info(`Found ${componentCount[0].count} components`);
      log.info(`Found ${mediaCount[0].count} media entities (will be kept)`);

      if (dryRun) {
        log.info('DRY RUN - No data will be deleted');
        stats.pagesDeleted = parseInt(pageCount[0].count);
        stats.componentsDeleted = parseInt(componentCount[0].count);
        stats.mediaKept = parseInt(mediaCount[0].count);
        return stats;
      }

      // Start transaction
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Delete all components (orphaned from previous failed migration)
        log.info('Deleting all components...');
        const componentsResult = await queryRunner.query(
          `DELETE FROM cms_components`
        );
        stats.componentsDeleted = componentsResult[1] || 0;
        log.info(`Deleted ${stats.componentsDeleted} components`);

        // Delete pages
        log.info('Deleting pages...');
        const pagesResult = await queryRunner.query(
          `DELETE FROM cms_pages WHERE status = 'draft'`
        );
        stats.pagesDeleted = pagesResult[1] || 0;
        log.info(`Deleted ${stats.pagesDeleted} pages`);

        // Count remaining media
        const remainingMedia = await queryRunner.query(
          `SELECT COUNT(*) as count FROM media WHERE module = 'cms'`
        );
        stats.mediaKept = parseInt(remainingMedia[0].count);
        log.info(`Kept ${stats.mediaKept} media entities for reuse`);

        // Commit transaction
        await queryRunner.commitTransaction();
        log.info('Cleanup completed successfully');
      } catch (error) {
        // Rollback on error
        await queryRunner.rollbackTransaction();
        log.error('Cleanup failed, rolling back', error);
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      log.error('Cleanup error:', error);
      throw error;
    }

    return stats;
  }

  /**
   * Verify database is clean and ready for migration
   */
  async verifyCleanState(): Promise<boolean> {
    try {
      const pageCount = await this.dataSource.query(
        `SELECT COUNT(*) as count FROM cms_pages WHERE status = 'draft'`
      );
      const componentCount = await this.dataSource.query(
        `SELECT COUNT(*) as count FROM cms_components`
      );

      const isClean = pageCount[0].count === '0' && componentCount[0].count === '0';
      
      if (isClean) {
        log.info('✅ Database is clean and ready for migration');
      } else {
        log.warn(`⚠️  Database not clean: ${pageCount[0].count} pages, ${componentCount[0].count} components`);
      }

      return isClean;
    } catch (error) {
      log.error('Verification error:', error);
      return false;
    }
  }
}

/**
 * Initialize database connection
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

// CLI execution
async function main() {
  const dryRun = process.argv.includes('--dry-run');
  
  try {
    // Initialize database connection
    const dataSource = await initializeDatabase();

    const cleanup = new MigrationCleanup(dataSource);

    // Run cleanup
    const stats = await cleanup.cleanup(dryRun);

    // Display results
    console.log('\n📊 Cleanup Summary:');
    console.log(`   Pages deleted: ${stats.pagesDeleted}`);
    console.log(`   Components deleted: ${stats.componentsDeleted}`);
    console.log(`   Media entities kept: ${stats.mediaKept}`);

    if (!dryRun) {
      // Verify clean state
      console.log('\n🔍 Verifying clean state...');
      await cleanup.verifyCleanState();
    }

    // Close database connection
    await dataSource.destroy();
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export default MigrationCleanup;
