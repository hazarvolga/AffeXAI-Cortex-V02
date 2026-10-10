#!/usr/bin/env tsx

/**
 * Script to validate CMS components
 * This script checks that all CMS components are properly exported and can be imported
 */

import path from 'path';
import fs from 'fs';

// Function to check if a file exists
function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

// Function to validate component exports
async function validateComponents() {
  console.log('Validating CMS components...\n');
  
  const componentsDir = path.join(__dirname, '../src/components/cms');
  const indexFile = path.join(componentsDir, 'index.ts');
  
  // Check if components directory exists
  if (!fileExists(componentsDir)) {
    console.error('❌ Components directory not found');
    return false;
  }
  
  // Check if index file exists
  if (!fileExists(indexFile)) {
    console.error('❌ Components index file not found');
    return false;
  }
  
  // List of expected components
  const expectedComponents = [
    'text-component.tsx',
    'button-component.tsx',
    'image-component.tsx',
    'container-component.tsx',
    'card-component.tsx',
    'grid-component.tsx',
    'page-renderer.tsx',
    'component-config.tsx',
    'drag-drop-demo.tsx'
  ];
  
  let allValid = true;
  
  // Check each component file
  for (const component of expectedComponents) {
    const componentPath = path.join(componentsDir, component);
    if (fileExists(componentPath)) {
      console.log(`✅ ${component} exists`);
    } else {
      console.error(`❌ ${component} is missing`);
      allValid = false;
    }
  }
  
  // Check demo pages
  const demoPages = [
    'cms-demo/page.tsx',
    'cms-demo-enhanced/page.tsx',
    'cms-drag-drop-demo/page.tsx',
    'cms-responsive-demo/page.tsx'
  ];
  
  console.log('\nValidating demo pages...\n');
  
  for (const page of demoPages) {
    const pagePath = path.join(__dirname, '../src/app', page);
    if (fileExists(pagePath)) {
      console.log(`✅ ${page} exists`);
    } else {
      console.error(`❌ ${page} is missing`);
      allValid = false;
    }
  }
  
  // Check documentation files
  const docs = [
    'DESIGN_SYSTEM.md',
    'CMS_DATABASE_SCHEMA.md',
    'CMS_IMPLEMENTATION_PLAN.md',
    'CMS_COMPONENTS_GUIDE.md'
  ];
  
  console.log('\nValidating documentation...\n');
  
  for (const doc of docs) {
    const docPath = path.join(__dirname, '../', doc);
    if (fileExists(docPath)) {
      console.log(`✅ ${doc} exists`);
    } else {
      console.error(`❌ ${doc} is missing`);
      allValid = false;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  if (allValid) {
    console.log('🎉 All CMS components and files are valid!');
  } else {
    console.log('❌ Some files are missing. Please check the errors above.');
  }
  console.log('='.repeat(50));
  
  return allValid;
}

// Run validation
validateComponents().catch(console.error);