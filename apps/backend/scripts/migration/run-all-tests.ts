#!/usr/bin/env ts-node

/**
 * Master Test Runner
 * Runs all tests for the WordPress to CMS Migration System
 */

import { execSync } from 'child_process';
import * as path from 'path';

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║                                                               ║');
console.log('║   WordPress to CMS Migration - Master Test Suite             ║');
console.log('║                                                               ║');
console.log('╚═══════════════════════════════════════════════════════════════╝');
console.log('');

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

const results: TestResult[] = [];

/**
 * Run a test suite
 */
function runTestSuite(name: string, command: string): TestResult {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`🧪 Running: ${name}`);
  console.log('─'.repeat(60));
  
  const startTime = Date.now();
  
  try {
    execSync(command, {
      cwd: path.join(__dirname, '../..'),
      stdio: 'inherit',
      encoding: 'utf-8',
    });
    
    const duration = Date.now() - startTime;
    console.log(`\n✅ ${name} - PASSED (${(duration / 1000).toFixed(2)}s)`);
    
    return {
      name,
      passed: true,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`\n❌ ${name} - FAILED (${(duration / 1000).toFixed(2)}s)`);
    
    return {
      name,
      passed: false,
      duration,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Test Suites
const testSuites = [
  {
    name: 'Validator Property Tests',
    command: 'npx ts-node scripts/migration/run-validator-property-test.ts',
  },
  {
    name: 'Validator Unit Tests',
    command: 'npx ts-node scripts/migration/run-validator-unit-test.ts',
  },
  {
    name: 'CLI Integration Tests',
    command: 'npx ts-node scripts/migration/run-cli-tests.ts',
  },
  {
    name: 'Template Mapper Tests',
    command: 'npx ts-node scripts/migration/run-template-mapper-tests.ts',
  },
];

// Run all test suites
console.log('Starting test execution...\n');

for (const suite of testSuites) {
  const result = runTestSuite(suite.name, suite.command);
  results.push(result);
}

// Summary
console.log('\n\n');
console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║                      Test Summary                             ║');
console.log('╚═══════════════════════════════════════════════════════════════╝');
console.log('');

const totalTests = results.length;
const passedTests = results.filter(r => r.passed).length;
const failedTests = results.filter(r => !r.passed).length;
const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

// Individual results
console.log('📊 Test Results:');
console.log('─'.repeat(60));
results.forEach(result => {
  const status = result.passed ? '✅ PASSED' : '❌ FAILED';
  const duration = (result.duration / 1000).toFixed(2);
  console.log(`  ${status}  ${result.name} (${duration}s)`);
});

console.log('');
console.log('─'.repeat(60));
console.log(`  Total Suites:        ${totalTests}`);
console.log(`  ✅ Passed:           ${passedTests}`);
console.log(`  ❌ Failed:           ${failedTests}`);
console.log(`  ⏱  Total Duration:    ${(totalDuration / 1000).toFixed(2)}s`);
console.log('─'.repeat(60));

// Failed tests details
if (failedTests > 0) {
  console.log('\n⚠️  Failed Tests:');
  results.filter(r => !r.passed).forEach(result => {
    console.log(`\n  ❌ ${result.name}`);
    if (result.error) {
      console.log(`     Error: ${result.error}`);
    }
  });
}

console.log('');

// Exit code
if (failedTests > 0) {
  console.log('❌ Some tests failed. Please fix the issues and run again.');
  process.exit(1);
} else {
  console.log('✅ All tests passed! Migration system is ready.');
  process.exit(0);
}
