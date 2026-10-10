#!/usr/bin/env tsx
/**
 * Production Migration Runner
 * Runs the AddBlockSupportToComponents migration on production database
 */

import { AppDataSource } from '../../src/database/data-source';
import { AddBlockSupportToComponents1732886400000 } from '../../src/migrations/1732886400000-AddBlockSupportToComponents';

async function runMigration() {
  console.log('🚀 Starting Production Migration...\n');
  console.log('📋 Migration: AddBlockSupportToComponents');
  console.log('📅 Date:', new Date().toISOString());
  console.log('🗄️  Database:', process.env.DATABASE_NAME || 'affexai_dev');
  console.log('');

  try {
    // Initialize data source
    console.log('🔌 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    // Create migration instance
    const migration = new AddBlockSupportToComponents1732886400000();
    
    // Run migration
    console.log('⚡ Running migration...\n');
    await migration.up(AppDataSource.createQueryRunner());
    
    console.log('\n✅ Migration completed successfully!');
    console.log('');
    console.log('📊 Next Steps:');
    console.log('   1. Verify data integrity');
    console.log('   2. Test CMS functionality');
    console.log('   3. Monitor for 24 hours');
    console.log('');

  } catch (error) {
    console.error('\n❌ Migration failed!');
    console.error('Error:', error);
    console.error('');
    console.error('🔄 Rollback options:');
    console.error('   1. npm run typeorm:migration:revert');
    console.error('   2. Restore from backup');
    process.exit(1);
  } finally {
    // Close connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run migration
runMigration();
