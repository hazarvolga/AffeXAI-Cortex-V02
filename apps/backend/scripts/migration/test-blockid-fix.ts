#!/usr/bin/env ts-node

/**
 * Test Script for BlockId Structure Fix
 * 
 * This script tests that the blockId fix works correctly by:
 * 1. Checking database structure
 * 2. Verifying component data format
 * 3. Testing both old and new data formats
 */

import { DataSource } from 'typeorm';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5434'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'affexai_dev',
  synchronize: false,
  logging: false,
});

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

async function runTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  try {
    console.log('🔌 Connecting to database...\n');
    await dataSource.initialize();

    // Test 1: Check if block_id column exists
    console.log('Test 1: Checking block_id column exists...');
    try {
      const columnCheck = await dataSource.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'cms_components' 
        AND column_name = 'block_id'
      `);
      
      if (columnCheck.length > 0) {
        results.push({
          name: 'block_id column exists',
          passed: true,
          message: 'Column exists with correct type',
          details: columnCheck[0],
        });
      } else {
        results.push({
          name: 'block_id column exists',
          passed: false,
          message: 'Column does not exist',
        });
      }
    } catch (error) {
      results.push({
        name: 'block_id column exists',
        passed: false,
        message: `Error checking column: ${error}`,
      });
    }

    // Test 2: Check for components with blockId in props (should be 0 after migration)
    console.log('Test 2: Checking for blockId in props...');
    try {
      const propsCheck = await dataSource.query(`
        SELECT COUNT(*) as count
        FROM cms_components
        WHERE type = 'block' AND props ? 'blockId'
      `);
      
      const count = parseInt(propsCheck[0].count);
      if (count === 0) {
        results.push({
          name: 'No blockId in props',
          passed: true,
          message: 'All components have clean props structure',
          details: { count },
        });
      } else {
        results.push({
          name: 'No blockId in props',
          passed: false,
          message: `Found ${count} components with blockId in props (should be 0)`,
          details: { count },
        });
      }
    } catch (error) {
      results.push({
        name: 'No blockId in props',
        passed: false,
        message: `Error checking props: ${error}`,
      });
    }

    // Test 3: Check for components with blockId at root level
    console.log('Test 3: Checking for blockId at root level...');
    try {
      const rootCheck = await dataSource.query(`
        SELECT COUNT(*) as count
        FROM cms_components
        WHERE type = 'block' AND block_id IS NOT NULL
      `);
      
      const count = parseInt(rootCheck[0].count);
      results.push({
        name: 'blockId at root level',
        passed: count > 0,
        message: count > 0 
          ? `Found ${count} components with blockId at root level` 
          : 'No components with blockId at root level',
        details: { count },
      });
    } catch (error) {
      results.push({
        name: 'blockId at root level',
        passed: false,
        message: `Error checking root blockId: ${error}`,
      });
    }

    // Test 4: Check for orphaned block components (type='block' but no blockId)
    console.log('Test 4: Checking for orphaned block components...');
    try {
      const orphanCheck = await dataSource.query(`
        SELECT COUNT(*) as count
        FROM cms_components
        WHERE type = 'block' AND block_id IS NULL AND NOT (props ? 'blockId')
      `);
      
      const count = parseInt(orphanCheck[0].count);
      if (count === 0) {
        results.push({
          name: 'No orphaned block components',
          passed: true,
          message: 'All block components have blockId',
          details: { count },
        });
      } else {
        results.push({
          name: 'No orphaned block components',
          passed: false,
          message: `Found ${count} orphaned block components`,
          details: { count },
        });
      }
    } catch (error) {
      results.push({
        name: 'No orphaned block components',
        passed: false,
        message: `Error checking orphans: ${error}`,
      });
    }

    // Test 5: Sample data inspection
    console.log('Test 5: Inspecting sample component data...');
    try {
      const sampleData = await dataSource.query(`
        SELECT 
          id,
          type,
          block_id,
          props->>'blockId' as props_block_id,
          jsonb_object_keys(props) as prop_keys
        FROM cms_components
        WHERE type = 'block'
        LIMIT 3
      `);
      
      results.push({
        name: 'Sample data inspection',
        passed: true,
        message: `Inspected ${sampleData.length} sample components`,
        details: sampleData,
      });
    } catch (error) {
      results.push({
        name: 'Sample data inspection',
        passed: false,
        message: `Error inspecting data: ${error}`,
      });
    }

    // Test 6: Statistics summary
    console.log('Test 6: Generating statistics...');
    try {
      const stats = await dataSource.query(`
        SELECT 
          COUNT(*) FILTER (WHERE type = 'block') as total_blocks,
          COUNT(*) FILTER (WHERE type = 'block' AND block_id IS NOT NULL) as blocks_with_id,
          COUNT(*) FILTER (WHERE type = 'block' AND props ? 'blockId') as blocks_with_props_id,
          COUNT(*) FILTER (WHERE type != 'block') as non_block_components
        FROM cms_components
      `);
      
      results.push({
        name: 'Statistics summary',
        passed: true,
        message: 'Statistics generated successfully',
        details: stats[0],
      });
    } catch (error) {
      results.push({
        name: 'Statistics summary',
        passed: false,
        message: `Error generating stats: ${error}`,
      });
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error);
    results.push({
      name: 'Test suite execution',
      passed: false,
      message: `Fatal error: ${error}`,
    });
  } finally {
    await dataSource.destroy();
    console.log('\n🔌 Database connection closed\n');
  }

  return results;
}

// Run tests and display results
if (require.main === module) {
  console.log('🧪 Starting BlockId Structure Fix Tests\n');
  console.log('=' .repeat(60));
  console.log('\n');

  runTests()
    .then((results) => {
      console.log('\n');
      console.log('=' .repeat(60));
      console.log('📊 Test Results:\n');

      let passedCount = 0;
      let failedCount = 0;

      results.forEach((result, index) => {
        const icon = result.passed ? '✅' : '❌';
        console.log(`${icon} Test ${index + 1}: ${result.name}`);
        console.log(`   ${result.message}`);
        
        if (result.details) {
          console.log(`   Details:`, JSON.stringify(result.details, null, 2));
        }
        console.log('');

        if (result.passed) {
          passedCount++;
        } else {
          failedCount++;
        }
      });

      console.log('=' .repeat(60));
      console.log(`\n📈 Summary: ${passedCount} passed, ${failedCount} failed\n`);

      if (failedCount === 0) {
        console.log('🎉 All tests passed!');
        process.exit(0);
      } else {
        console.log('⚠️  Some tests failed. Please review the results above.');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n❌ Test suite failed with error:', error);
      process.exit(1);
    });
}

export { runTests };
