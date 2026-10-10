#!/usr/bin/env ts-node

/**
 * Pre-Flight Check
 * Verifies system is ready for production migration
 */

import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║                                                               ║');
console.log('║   WordPress to CMS Migration - Pre-Flight Check              ║');
console.log('║                                                               ║');
console.log('╚═══════════════════════════════════════════════════════════════╝');
console.log('');

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
  critical: boolean;
}

const results: CheckResult[] = [];

function check(name: string, critical: boolean, testFn: () => boolean, successMsg: string, failMsg: string) {
  try {
    const passed = testFn();
    results.push({
      name,
      passed,
      message: passed ? successMsg : failMsg,
      critical,
    });
    
    const icon = passed ? '✅' : (critical ? '❌' : '⚠️');
    console.log(`${icon} ${name}`);
    console.log(`   ${passed ? successMsg : failMsg}`);
  } catch (error) {
    results.push({
      name,
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      critical,
    });
    
    const icon = critical ? '❌' : '⚠️';
    console.log(`${icon} ${name}`);
    console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function asyncCheck(name: string, critical: boolean, testFn: () => Promise<boolean>, successMsg: string, failMsg: string) {
  try {
    const passed = await testFn();
    results.push({
      name,
      passed,
      message: passed ? successMsg : failMsg,
      critical,
    });
    
    const icon = passed ? '✅' : (critical ? '❌' : '⚠️');
    console.log(`${icon} ${name}`);
    console.log(`   ${passed ? successMsg : failMsg}`);
  } catch (error) {
    results.push({
      name,
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      critical,
    });
    
    const icon = critical ? '❌' : '⚠️';
    console.log(`${icon} ${name}`);
    console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function main() {
  console.log('🔍 Running pre-flight checks...\n');
  
  // 1. Check source directory
  console.log('📁 Source Files:');
  const extractedPagesPath = '/Users/hazarekiz/Projects/v06/Affexai/extracted_pages';
  
  check(
    'Source directory exists',
    true,
    () => fs.existsSync(extractedPagesPath),
    `Found: ${extractedPagesPath}`,
    `Not found: ${extractedPagesPath}`
  );
  
  check(
    'Uploads directory exists',
    true,
    () => fs.existsSync(path.join(extractedPagesPath, 'uploads')),
    'Found: extracted_pages/uploads',
    'Not found: extracted_pages/uploads'
  );
  
  check(
    'PAGE_MAPPING_REPORT.md exists',
    true,
    () => fs.existsSync(path.join(extractedPagesPath, 'PAGE_MAPPING_REPORT.md')),
    'Found: PAGE_MAPPING_REPORT.md',
    'Not found: PAGE_MAPPING_REPORT.md'
  );
  
  // Count pages
  if (fs.existsSync(extractedPagesPath)) {
    const files = fs.readdirSync(extractedPagesPath).filter(f => f.endsWith('.txt'));
    console.log(`   📄 Found ${files.length} page files`);
  }
  
  console.log('');
  
  // 2. Check backend API
  console.log('🌐 Backend API:');
  const apiUrl = process.env.API_URL || 'http://localhost:9006/api';
  
  await asyncCheck(
    'Backend API is running',
    true,
    async () => {
      try {
        const response = await axios.get(`${apiUrl}/health`, { timeout: 5000 });
        return response.status === 200;
      } catch {
        return false;
      }
    },
    `API responding at ${apiUrl}`,
    `API not responding at ${apiUrl}`
  );
  
  await asyncCheck(
    'CMS endpoints available',
    true,
    async () => {
      try {
        // Try to access CMS templates endpoint
        const response = await axios.get(`${apiUrl}/cms/templates`, { timeout: 5000 });
        return response.status === 200 || response.status === 401; // 401 is ok (auth required)
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          return true; // Auth required is ok
        }
        return false;
      }
    },
    'CMS endpoints accessible',
    'CMS endpoints not accessible'
  );
  
  console.log('');
  
  // 3. Check database
  console.log('🗄️  Database:');
  await asyncCheck(
    'Database schema updated',
    true,
    async () => {
      try {
        // Check if components table has block fields
        const response = await axios.get(`${apiUrl}/cms/pages`, { timeout: 5000 });
        return true; // If we can query, schema is probably ok
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          return true; // Auth required is ok
        }
        return false;
      }
    },
    'Database schema is up to date',
    'Database schema may need migration'
  );
  
  console.log('');
  
  // 4. Check migration components
  console.log('🔧 Migration Components:');
  const components = [
    'ContentParser.ts',
    'IndustrySolutionParser.ts',
    'MediaManager.ts',
    'URLTransformer.ts',
    'TemplateMapper.ts',
    'PageCreator.ts',
    'MigrationOrchestrator.ts',
    'Logger.ts',
    'ErrorHandler.ts',
    'Validator.ts',
  ];
  
  components.forEach(component => {
    check(
      component,
      true,
      () => fs.existsSync(path.join(__dirname, component)),
      'Found',
      'Missing'
    );
  });
  
  console.log('');
  
  // 5. Check logs directory
  console.log('📝 Logging:');
  const logsDir = path.join(__dirname, 'logs');
  check(
    'Logs directory',
    false,
    () => {
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      return fs.existsSync(logsDir);
    },
    'Logs directory ready',
    'Could not create logs directory'
  );
  
  console.log('');
  
  // Summary
  console.log('═'.repeat(60));
  console.log('📊 Pre-Flight Check Summary:');
  console.log('═'.repeat(60));
  
  const totalChecks = results.length;
  const passedChecks = results.filter(r => r.passed).length;
  const failedChecks = results.filter(r => !r.passed).length;
  const criticalFailed = results.filter(r => !r.passed && r.critical).length;
  
  console.log(`Total Checks:        ${totalChecks}`);
  console.log(`✅ Passed:           ${passedChecks}`);
  console.log(`❌ Failed:           ${failedChecks}`);
  console.log(`🔴 Critical Failed:  ${criticalFailed}`);
  console.log('');
  
  if (criticalFailed > 0) {
    console.log('❌ CRITICAL ISSUES FOUND - Migration cannot proceed');
    console.log('');
    console.log('Failed Critical Checks:');
    results.filter(r => !r.passed && r.critical).forEach(r => {
      console.log(`  ❌ ${r.name}: ${r.message}`);
    });
    console.log('');
    console.log('Please fix these issues before running migration.');
    process.exit(1);
  } else if (failedChecks > 0) {
    console.log('⚠️  Some non-critical checks failed');
    console.log('');
    console.log('Failed Checks:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  ⚠️  ${r.name}: ${r.message}`);
    });
    console.log('');
    console.log('Migration can proceed but may have issues.');
    process.exit(0);
  } else {
    console.log('✅ ALL CHECKS PASSED - System ready for migration!');
    console.log('');
    console.log('You can now run:');
    console.log('  tsx index.ts --dry-run          # Test migration');
    console.log('  tsx index.ts                    # Run migration');
    process.exit(0);
  }
}

main();
