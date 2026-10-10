#!/usr/bin/env tsx
/**
 * Test runner for TemplateMapper tests
 */

import { execSync } from 'child_process';
import * as path from 'path';

const testFile = path.join(__dirname, '__tests__', 'TemplateMapper.property.spec.ts');

try {
  console.log('Running TemplateMapper property tests...\n');
  
  execSync(
    `npx jest --testEnvironment=node --testMatch="**/__tests__/TemplateMapper.property.spec.ts" --verbose`,
    {
      cwd: path.join(__dirname, '../..'),
      stdio: 'inherit'
    }
  );
  
  console.log('\n✓ All tests passed!');
} catch (error) {
  console.error('\n✗ Tests failed');
  process.exit(1);
}
