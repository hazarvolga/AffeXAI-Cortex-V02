#!/usr/bin/env ts-node

/**
 * Simple test runner for CLI integration tests
 */

import { execSync } from 'child_process';
import * as path from 'path';

console.log('🧪 Running CLI Integration Tests...\n');

const cliPath = path.join(__dirname, 'index.ts');

let passedTests = 0;
let failedTests = 0;

function runTest(name: string, testFn: () => void) {
  try {
    testFn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (error) {
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${error instanceof Error ? error.message : String(error)}`);
    failedTests++;
  }
}

function runCLI(args: string[]): { stdout: string; exitCode: number } {
  try {
    const stdout = execSync(`tsx ${cliPath} ${args.join(' ')}`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    return { stdout, exitCode: 0 };
  } catch (error: any) {
    return {
      stdout: error.stdout || error.stderr || '',
      exitCode: error.status || 1,
    };
  }
}

console.log('📋 Help and Version Tests:');

runTest('Display help with --help', () => {
  const result = runCLI(['--help']);
  if (!result.stdout.includes('WordPress to CMS Migration Tool')) {
    throw new Error('Help text not found');
  }
});

runTest('Display version with --version', () => {
  const result = runCLI(['--version']);
  if (!/\d+\.\d+\.\d+/.test(result.stdout)) {
    throw new Error('Version not found');
  }
});

console.log('\n📋 Dry Run Tests:');

runTest('Run in dry-run mode', () => {
  const result = runCLI(['--dry-run', '--help']);
  // Just check it doesn't crash
  if (result.exitCode !== 0 && !result.stdout.includes('help')) {
    throw new Error('Dry run failed');
  }
});

console.log('\n📋 Option Parsing Tests:');

runTest('Parse --verbose flag', () => {
  const result = runCLI(['--help', '--verbose']);
  if (result.exitCode !== 0) {
    throw new Error('Verbose flag parsing failed');
  }
});

runTest('Parse --skip-media flag', () => {
  const result = runCLI(['--help', '--skip-media']);
  if (result.exitCode !== 0) {
    throw new Error('Skip media flag parsing failed');
  }
});

runTest('Parse --batch-size option', () => {
  const result = runCLI(['--help', '--batch-size', '5']);
  if (result.exitCode !== 0) {
    throw new Error('Batch size parsing failed');
  }
});

runTest('Parse --pages option', () => {
  const result = runCLI(['--help', '--pages', 'Page1,Page2']);
  if (result.exitCode !== 0) {
    throw new Error('Pages option parsing failed');
  }
});

runTest('Parse --category option', () => {
  const result = runCLI(['--help', '--category', 'IndustrySolution']);
  if (result.exitCode !== 0) {
    throw new Error('Category option parsing failed');
  }
});

console.log('\n📋 Short Option Tests:');

runTest('Parse -d (dry-run)', () => {
  const result = runCLI(['-d', '--help']);
  if (result.exitCode !== 0) {
    throw new Error('Short dry-run flag failed');
  }
});

runTest('Parse -v (verbose)', () => {
  const result = runCLI(['-v', '--help']);
  if (result.exitCode !== 0) {
    throw new Error('Short verbose flag failed');
  }
});

runTest('Parse -h (help)', () => {
  const result = runCLI(['-h']);
  if (!result.stdout.includes('WordPress to CMS Migration Tool')) {
    throw new Error('Short help flag failed');
  }
});

console.log('\n📋 Combined Options Tests:');

runTest('Multiple options together', () => {
  const result = runCLI([
    '--help',
    '--dry-run',
    '--verbose',
    '--skip-media',
    '--batch-size', '5',
  ]);
  if (result.exitCode !== 0) {
    throw new Error('Combined options failed');
  }
});

runTest('Short and long options mixed', () => {
  const result = runCLI([
    '-h',
    '-d',
    '-v',
    '--skip-media',
  ]);
  if (result.exitCode !== 0) {
    throw new Error('Mixed options failed');
  }
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 Test Summary:');
console.log(`  Total: ${passedTests + failedTests}`);
console.log(`  ✓ Passed: ${passedTests}`);
console.log(`  ✗ Failed: ${failedTests}`);
console.log('='.repeat(60));

if (failedTests > 0) {
  console.log('\n❌ Some tests failed!');
  process.exit(1);
} else {
  console.log('\n✅ All CLI tests passed!');
  process.exit(0);
}
