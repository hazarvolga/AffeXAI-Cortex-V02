#!/usr/bin/env ts-node

/**
 * BlockId Structure Fix Migration
 * 
 * This script migrates blockId from props to root level in cms_components table.
 * It ensures backward compatibility and provides detailed reporting.
 */

import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

// Database configuration
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5434'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'affexai_dev',
  synchronize: false,
  logging: true,
});

interface MigrationStats {
  totalBlockComponents: number;
  componentsWithBlockIdInProps: number;
  componentsWithBlockIdAtRoot: number;
  componentsMigrated: number;
  propsCleanedUp: number;
  errors: string[];
}

async function runMigration(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    totalBlockComponents: 0,
    componentsWithBlockIdInProps: 0,
    componentsWithBlockIdAtRoot: 0,
    componentsMigrated: 0,
    propsCleanedUp: 0,
    errors: [],
  };

  try {
    console.log('🔌 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Database connected\n');

    // Step 1: Get statistics before migration
    console.log('📊 Analyzing current state...');
    
    const totalResult = await dataSource.query(`
      SELECT COUNT(*) as count
      FROM cms_components
      WHERE type = 'block'
    `);
    stats.totalBlockComponents = parseInt(totalResult[0].count);
    console.log(`   Total block components: ${stats.totalBlockComponents}`);

    const propsResult = await dataSource.query(`
      SELECT COUNT(*) as count
      FROM cms_components
      WHERE type = 'block' AND props ? 'blockId'
    `);
    stats.componentsWithBlockIdInProps = parseInt(propsResult[0].count);
    console.log(`   Components with blockId in props: ${stats.componentsWithBlockIdInProps}`);

    const rootResult = await dataSource.query(`
      SELECT COUNT(*) as count
      FROM cms_components
      WHERE type = 'block' AND block_id IS NOT NULL
    `);
    stats.componentsWithBlockIdAtRoot = parseInt(rootResult[0].count);
    console.log(`   Components with blockId at root: ${stats.componentsWithBlockIdAtRoot}\n`);

    if (stats.componentsWithBlockIdInProps === 0) {
      console.log('✨ No migration needed! All components already have correct structure.');
      return stats;
    }

    // Step 2: Create backup (optional)
    console.log('💾 Creating backup table...');
    try {
      await dataSource.query(`
        DROP TABLE IF EXISTS cms_components_backup_blockid_fix;
        CREATE TABLE cms_components_backup_blockid_fix AS 
        SELECT * FROM cms_components WHERE type = 'block';
      `);
      console.log('✅ Backup created: cms_components_backup_blockid_fix\n');
    } catch (error) {
      console.warn('⚠️  Backup creation failed (non-critical):', error);
    }

    // Step 3: Migrate blockId from props to root level
    console.log('🔄 Migrating blockId from props to root level...');
    const migrateResult = await dataSource.query(`
      UPDATE cms_components
      SET 
        block_id = props->>'blockId',
        updated_at = NOW()
      WHERE 
        type = 'block'
        AND block_id IS NULL
        AND props ? 'blockId'
      RETURNING id, block_id
    `);
    stats.componentsMigrated = migrateResult.length;
    console.log(`✅ Migrated ${stats.componentsMigrated} components\n`);

    // Step 4: Clean up props (remove blockId from props)
    console.log('🧹 Cleaning up props...');
    const cleanupResult = await dataSource.query(`
      UPDATE cms_components
      SET 
        props = props - 'blockId',
        updated_at = NOW()
      WHERE 
        type = 'block'
        AND props ? 'blockId'
      RETURNING id
    `);
    stats.propsCleanedUp = cleanupResult.length;
    console.log(`✅ Cleaned up ${stats.propsCleanedUp} components\n`);

    // Step 5: Verify migration
    console.log('🔍 Verifying migration...');
    const verifyResult = await dataSource.query(`
      SELECT 
        id,
        type,
        block_id,
        props->>'blockId' as props_block_id
      FROM cms_components
      WHERE 
        type = 'block'
        AND (
          (block_id IS NULL AND props ? 'blockId')
          OR (block_id IS NOT NULL AND props ? 'blockId')
        )
    `);

    if (verifyResult.length > 0) {
      console.error('❌ Verification failed! Found components with issues:');
      verifyResult.forEach((row: any) => {
        console.error(`   Component ${row.id}: blockId=${row.block_id}, props.blockId=${row.props_block_id}`);
        stats.errors.push(`Component ${row.id} has inconsistent blockId`);
      });
    } else {
      console.log('✅ Verification passed! All components have correct structure\n');
    }

    // Step 6: Final statistics
    console.log('📊 Final statistics:');
    const finalStats = await dataSource.query(`
      SELECT 
        'Total block components' as metric,
        COUNT(*) as count
      FROM cms_components
      WHERE type = 'block'

      UNION ALL

      SELECT 
        'Block components with blockId at root' as metric,
        COUNT(*) as count
      FROM cms_components
      WHERE type = 'block' AND block_id IS NOT NULL

      UNION ALL

      SELECT 
        'Block components with blockId in props' as metric,
        COUNT(*) as count
      FROM cms_components
      WHERE type = 'block' AND props ? 'blockId'
    `);

    finalStats.forEach((row: any) => {
      console.log(`   ${row.metric}: ${row.count}`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    stats.errors.push(error instanceof Error ? error.message : String(error));
    throw error;
  } finally {
    await dataSource.destroy();
    console.log('\n🔌 Database connection closed');
  }

  return stats;
}

// Run migration
if (require.main === module) {
  console.log('🚀 Starting BlockId Structure Fix Migration\n');
  console.log('=' .repeat(60));
  console.log('\n');

  runMigration()
    .then((stats) => {
      console.log('\n');
      console.log('=' .repeat(60));
      console.log('✅ Migration completed successfully!\n');
      console.log('Summary:');
      console.log(`   Total block components: ${stats.totalBlockComponents}`);
      console.log(`   Components migrated: ${stats.componentsMigrated}`);
      console.log(`   Props cleaned up: ${stats.propsCleanedUp}`);
      
      if (stats.errors.length > 0) {
        console.log(`\n⚠️  Errors encountered: ${stats.errors.length}`);
        stats.errors.forEach(err => console.log(`   - ${err}`));
        process.exit(1);
      } else {
        console.log('\n🎉 All done! No errors.');
        process.exit(0);
      }
    })
    .catch((error) => {
      console.error('\n❌ Migration failed with error:', error);
      process.exit(1);
    });
}

export { runMigration };
