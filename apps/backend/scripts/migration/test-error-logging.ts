#!/usr/bin/env tsx
/**
 * Test Error Handling and Logging System
 * 
 * Demonstrates all features of Logger, ErrorHandler, and ReportGenerator
 */

import { Logger, LogLevel } from './Logger';
import { ErrorHandler, ErrorCategory, ErrorAction } from './ErrorHandler';
import { ReportGenerator, MigrationSummary, ValidationReport } from './ReportGenerator';
import { MediaReport } from './types';
import * as path from 'path';

console.log('='.repeat(80));
console.log('Testing Error Handling and Logging System');
console.log('='.repeat(80));

// Create logger
const logFile = path.join(__dirname, 'logs', 'test-migration.log');
const logger = new Logger(LogLevel.VERBOSE, logFile);

// Create error handler
const errorHandler = new ErrorHandler(logger);

// Create report generator
const reportGenerator = new ReportGenerator(logger, errorHandler, path.join(__dirname, 'logs'));

console.log('\n1. Testing Logger...\n');

// Test different log levels
logger.section('Migration Started');
logger.info('System', 'Initializing migration system');
logger.success('System', 'Configuration loaded successfully');
logger.warn('System', 'Using default template for unknown page type');
logger.debug('System', 'Debug information', { config: { verbose: true } });

// Test progress logging
logger.section('Processing Pages');
for (let i = 1; i <= 5; i++) {
  logger.progress('PageProcessor', i, 5, `page-${i}.txt`);
}

console.log('\n2. Testing Error Handler...\n');

// Test critical error
try {
  throw new Error('Database connection failed: ECONNREFUSED');
} catch (error) {
  const action = errorHandler.handleError(error as Error, {
    component: 'Database',
    page: 'test-page.txt',
    operation: 'connect'
  });
  console.log(`Action for critical error: ${action}`);
}

// Test page-level error
try {
  throw new Error('Template not found for page');
} catch (error) {
  const action = errorHandler.handleError(error as Error, {
    component: 'TemplateMapper',
    page: 'unknown-page.txt',
    operation: 'getTemplate'
  });
  console.log(`Action for page-level error: ${action}`);
}

// Test component-level error
try {
  throw new Error('Image upload failed: timeout');
} catch (error) {
  const action = errorHandler.handleError(error as Error, {
    component: 'MediaManager',
    page: 'product-page.txt',
    operation: 'uploadImage',
    data: { imageUrl: 'https://example.com/image.jpg' }
  });
  console.log(`Action for component-level error: ${action}`);
}

console.log('\n3. Testing Error Categorization...\n');

const testErrors = [
  new Error('API unavailable'),
  new Error('Invalid HTML structure'),
  new Error('Broken image link'),
  new Error('Network error: ENOTFOUND'),
  new Error('Slug already exists'),
];

testErrors.forEach(error => {
  const isCritical = errorHandler.isCritical(error);
  const isPageLevel = errorHandler.isPageLevel(error);
  const isComponentLevel = errorHandler.isComponentLevel(error);
  
  console.log(`Error: "${error.message}"`);
  console.log(`  Critical: ${isCritical}, Page-level: ${isPageLevel}, Component-level: ${isComponentLevel}`);
});

console.log('\n4. Testing Wrapped Functions...\n');

// Test async wrapper
(async () => {
  const asyncResult = await errorHandler.wrapAsync(
    async () => {
      // Simulate async operation that fails
      throw new Error('Async operation failed');
    },
    {
      component: 'AsyncTest',
      page: 'test.txt',
      operation: 'asyncOperation'
    }
  );

  console.log(`Async result: success=${asyncResult.success}, action=${asyncResult.action}`);
})();

// Test sync wrapper
const syncResult = errorHandler.wrap(
  () => {
    // Simulate sync operation that succeeds
    return { data: 'success' };
  },
  {
    component: 'SyncTest',
    page: 'test.txt',
    operation: 'syncOperation'
  }
);

console.log(`Sync result: success=${syncResult.success}, data=${JSON.stringify(syncResult.data)}`);

console.log('\n5. Testing Report Generation...\n');

// Create mock migration summary
const summary: MigrationSummary = {
  startTime: new Date(Date.now() - 600000), // 10 minutes ago
  endTime: new Date(),
  duration: 600000,
  totalPages: 58,
  successCount: 52,
  failureCount: 4,
  skippedCount: 2,
  totalComponents: 312,
  totalImages: 145,
  errors: errorHandler.getErrors()
};

// Create mock media report
const mediaReport: MediaReport = {
  totalImages: 145,
  uploadedCount: 140,
  failedCount: 3,
  skippedCount: 2,
  failures: [
    {
      success: false,
      originalPath: '/uploads/broken-image.jpg',
      error: 'File not found'
    },
    {
      success: false,
      originalPath: '/uploads/large-image.png',
      error: 'File too large'
    },
    {
      success: false,
      originalPath: '/uploads/corrupt.jpg',
      error: 'Invalid image format'
    }
  ],
  mapping: {
    'https://aluplan.com.tr/wp-content/uploads/image1.jpg': 'https://aluplan.tr/media/abc123.jpg',
    'https://aluplan.com.tr/wp-content/uploads/image2.png': 'https://aluplan.tr/media/def456.png',
  }
};

// Create mock validation report
const validationReport: ValidationReport = {
  totalIssues: 15,
  errors: 2,
  warnings: 10,
  info: 3,
  issues: [
    {
      page: 'product-page.txt',
      issue: 'Missing required field: description',
      severity: 'error'
    },
    {
      page: 'about-page.txt',
      component: 'hero-section',
      issue: 'Image URL is broken',
      severity: 'warning',
      details: { url: 'https://example.com/missing.jpg' }
    },
    {
      page: 'contact-page.txt',
      issue: 'Slug contains special characters',
      severity: 'warning'
    }
  ],
  pagesWithIssues: ['product-page.txt', 'about-page.txt', 'contact-page.txt']
};

// Generate all reports
const reportPaths = reportGenerator.generateAllReports(summary, mediaReport, validationReport);

console.log('\nReports generated:');
console.log(`  Summary: ${reportPaths.summaryPath}`);
console.log(`  Errors: ${reportPaths.errorPath}`);
console.log(`  Media: ${reportPaths.mediaPath}`);
console.log(`  Validation: ${reportPaths.validationPath}`);

// Display quick summary
console.log(reportGenerator.generateQuickSummary(summary));

console.log('\n6. Testing Statistics...\n');

// Logger statistics
const logStats = logger.getSummary();
console.log('Logger Statistics:');
console.log(`  Total logs: ${logStats.total}`);
console.log(`  Errors: ${logStats.errors}`);
console.log(`  Warnings: ${logStats.warnings}`);

// Error handler statistics
const errorStats = errorHandler.getSummary();
console.log('\nError Handler Statistics:');
console.log(`  Total errors: ${errorStats.total}`);
console.log(`  Critical: ${errorStats.critical}`);
console.log(`  Page-level: ${errorStats.pageLevel}`);
console.log(`  Component-level: ${errorStats.componentLevel}`);

// Close logger
logger.close();

console.log('\n' + '='.repeat(80));
console.log('✓ All tests completed successfully!');
console.log('='.repeat(80));
