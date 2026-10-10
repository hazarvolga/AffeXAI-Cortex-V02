#!/usr/bin/env ts-node

/**
 * Test runner for Validator property tests
 */

import { execSync } from 'child_process';

try {
  console.log('Running Validator property tests...\n');
  
  // Run jest with specific config for this test
  execSync(
    'npx jest __tests__/Validator.property.spec.ts --testEnvironment=node --testTimeout=30000 --verbose',
    {
      cwd: __dirname,
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
    }
  );
  
  console.log('\n✓ All Validator property tests passed!');
  process.exit(0);
} catch (error) {
  console.error('\n✗ Validator property tests failed');
  process.exit(1);
}
