#!/usr/bin/env ts-node

/**
 * Simple test runner for Validator unit tests
 */

import { Validator } from './Validator';
import { Logger, LogLevel } from './Logger';
import { ParsedContent, ImageReference, MediaMapping } from './types';

console.log('🧪 Running Validator Unit Tests...\n');

const logger = new Logger(LogLevel.QUIET);
const validator = new Validator('http://localhost:9006/api', logger);

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

console.log('📋 Required Field Validation:');

runTest('Reject empty title', () => {
  const content: ParsedContent = {
    title: '',
    slug: 'valid-slug',
    sections: [],
    images: [],
    videos: [],
    links: [],
    metadata: { filename: 'test.txt' },
  };
  const result = validator.validateContent(content);
  if (result.isValid || !result.errors.find(e => e.field === 'title')) {
    throw new Error('Should reject empty title');
  }
});

runTest('Reject empty slug', () => {
  const content: ParsedContent = {
    title: 'Valid Title',
    slug: '',
    sections: [],
    images: [],
    videos: [],
    links: [],
    metadata: { filename: 'test.txt' },
  };
  const result = validator.validateContent(content);
  if (result.isValid || !result.errors.find(e => e.field === 'slug')) {
    throw new Error('Should reject empty slug');
  }
});

runTest('Accept valid title and slug', () => {
  const content: ParsedContent = {
    title: 'Valid Title',
    slug: 'valid-slug',
    sections: [],
    images: [],
    videos: [],
    links: [],
    metadata: { filename: 'test.txt' },
  };
  const result = validator.validateContent(content);
  const criticalErrors = result.errors.filter(e => e.severity === 'critical');
  if (criticalErrors.length > 0) {
    throw new Error('Should accept valid content');
  }
});

console.log('\n📋 Slug Format Validation:');

runTest('Reject uppercase in slug', () => {
  const content: ParsedContent = {
    title: 'Valid Title',
    slug: 'Invalid-Uppercase',
    sections: [],
    images: [],
    videos: [],
    links: [],
    metadata: { filename: 'test.txt' },
  };
  const result = validator.validateContent(content);
  const slugError = result.errors.find(e => e.field === 'slug');
  if (!slugError) {
    throw new Error('Should reject uppercase in slug');
  }
});

runTest('Reject spaces in slug', () => {
  const content: ParsedContent = {
    title: 'Valid Title',
    slug: 'invalid slug',
    sections: [],
    images: [],
    videos: [],
    links: [],
    metadata: { filename: 'test.txt' },
  };
  const result = validator.validateContent(content);
  const slugError = result.errors.find(e => e.field === 'slug');
  if (!slugError) {
    throw new Error('Should reject spaces in slug');
  }
});

runTest('Accept valid slug format', () => {
  const content: ParsedContent = {
    title: 'Valid Title',
    slug: 'valid-slug-123',
    sections: [],
    images: [],
    videos: [],
    links: [],
    metadata: { filename: 'test.txt' },
  };
  const result = validator.validateContent(content);
  const slugError = result.errors.find(e => e.field === 'slug');
  if (slugError) {
    throw new Error('Should accept valid slug');
  }
});

console.log('\n📋 Component Props Validation:');

runTest('Reject hero without title', () => {
  const props = { subtitle: 'Subtitle' };
  const result = validator.validateComponentProps('hero-centered-bg-image', props);
  if (result.isValid) {
    throw new Error('Should reject hero without title');
  }
});

runTest('Accept valid hero props', () => {
  const props = {
    title: 'Hero Title',
    subtitle: 'Subtitle',
    backgroundImage: 'https://example.com/image.jpg',
  };
  const result = validator.validateComponentProps('hero-centered-bg-image', props);
  if (!result.isValid) {
    throw new Error('Should accept valid hero props');
  }
});

runTest('Reject features without array', () => {
  const props = { title: 'Features' };
  const result = validator.validateComponentProps('features-grid', props);
  if (result.isValid) {
    throw new Error('Should reject features without array');
  }
});

runTest('Accept valid features props', () => {
  const props = {
    features: [
      { title: 'Feature 1', description: 'Desc 1' },
    ],
  };
  const result = validator.validateComponentProps('features-grid', props);
  if (!result.isValid) {
    throw new Error('Should accept valid features');
  }
});

runTest('Reject workflow tabs without mainTabs', () => {
  const props = { title: 'Workflow' };
  const result = validator.validateComponentProps('workflow-tabs', props);
  if (result.isValid) {
    throw new Error('Should reject workflow tabs without mainTabs');
  }
});

runTest('Accept valid workflow tabs', () => {
  const props = {
    mainTabs: [
      { id: 'tab1', label: 'Tab 1', icon: 'icon1', subTabs: [] },
    ],
  };
  const result = validator.validateComponentProps('workflow-tabs', props);
  if (!result.isValid) {
    throw new Error('Should accept valid workflow tabs');
  }
});

console.log('\n📋 Image Validation:');

runTest('Detect broken image references', () => {
  const images: ImageReference[] = [
    { originalUrl: 'https://old.com/img.jpg', altText: 'Image', context: 'hero' },
  ];
  const mediaMapping: MediaMapping = {};
  const result = validator.checkBrokenImages(images, mediaMapping);
  if (result.warnings.length === 0) {
    throw new Error('Should detect broken images');
  }
});

runTest('Accept mapped images', () => {
  const images: ImageReference[] = [
    { originalUrl: 'https://old.com/img.jpg', altText: 'Image', context: 'hero' },
  ];
  const mediaMapping: MediaMapping = {
    'https://old.com/img.jpg': 'https://new.com/img.jpg',
  };
  const result = validator.checkBrokenImages(images, mediaMapping);
  const missingWarnings = result.warnings.filter(w => w.message.includes('not found'));
  if (missingWarnings.length > 0) {
    throw new Error('Should not warn about mapped images');
  }
});

runTest('Reject empty image URLs', () => {
  const images: ImageReference[] = [
    { originalUrl: '', altText: 'Image', context: 'hero' },
  ];
  const mediaMapping: MediaMapping = {};
  const result = validator.checkBrokenImages(images, mediaMapping);
  if (result.isValid) {
    throw new Error('Should reject empty URLs');
  }
});

console.log('\n📋 Report Generation:');

runTest('Generate validation report', () => {
  const contentValidation = {
    isValid: false,
    errors: [{ field: 'title', message: 'Required', severity: 'critical' as const }],
    warnings: [],
  };
  const imageValidation = {
    isValid: true,
    errors: [],
    warnings: [],
  };
  const report = validator.generateValidationReport(contentValidation, imageValidation);
  if (!report.includes('Validation Report') || !report.includes('title')) {
    throw new Error('Report should contain validation info');
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
  console.log('\n✅ All unit tests passed!');
  process.exit(0);
}
