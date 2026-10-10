#!/usr/bin/env tsx

/**
 * Script to test CMS component imports
 * This script checks that all CMS components can be imported without errors
 */

import path from 'path';
import fs from 'fs';

// Function to check if a file exists
function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

// Function to validate CMS component imports
async function validateCmsImports() {
  console.log('Validating CMS component imports...\n');
  
  const cmsDir = path.join(__dirname, '../src/components/cms');
  const editorDir = path.join(__dirname, '../src/components/cms/editor');
  
  // Check if CMS directory exists
  if (!fileExists(cmsDir)) {
    console.error('❌ CMS directory not found');
    return false;
  }
  
  // Check if editor directory exists
  if (!fileExists(editorDir)) {
    console.error('❌ Editor directory not found');
    return false;
  }
  
  // List of expected CMS components
  const expectedCmsComponents = [
    'text-component.tsx',
    'button-component.tsx',
    'image-component.tsx',
    'container-component.tsx',
    'card-component.tsx',
    'grid-component.tsx',
    'page-renderer.tsx',
    'cms-page-renderer.tsx'
  ];
  
  let allValid = true;
  
  // Check each CMS component file
  for (const component of expectedCmsComponents) {
    const componentPath = path.join(cmsDir, component);
    if (fileExists(componentPath)) {
      console.log(`✅ ${component} exists`);
    } else {
      console.error(`❌ ${component} is missing`);
      allValid = false;
    }
  }
  
  // List of expected editor components
  const expectedEditorComponents = [
    'component-library.tsx',
    'editor-canvas.tsx',
    'properties-panel.tsx',
    'visual-editor.tsx',
    'index.ts'
  ];
  
  console.log('\nValidating editor components...\n');
  
  // Check each editor component file
  for (const component of expectedEditorComponents) {
    const componentPath = path.join(editorDir, component);
    if (fileExists(componentPath)) {
      console.log(`✅ ${component} exists`);
    } else {
      console.error(`❌ ${component} is missing`);
      allValid = false;
    }
  }
  
  // Check main CMS index file
  const cmsIndex = path.join(cmsDir, 'index.ts');
  if (fileExists(cmsIndex)) {
    console.log(`\n✅ CMS index file exists`);
  } else {
    console.error(`\n❌ CMS index file is missing`);
    allValid = false;
  }
  
  // Check admin pages
  const adminPages = [
    'admin/cms/page.tsx',
    'admin/cms/editor/page.tsx'
  ];
  
  console.log('\nValidating admin pages...\n');
  
  for (const page of adminPages) {
    const pagePath = path.join(__dirname, '../src/app', page);
    if (fileExists(pagePath)) {
      console.log(`✅ ${page} exists`);
    } else {
      console.error(`❌ ${page} is missing`);
      allValid = false;
    }
  }
  
  // Check CMS service
  const cmsService = path.join(__dirname, '../src/lib/cms/cms-service.ts');
  if (fileExists(cmsService)) {
    console.log(`\n✅ CMS service exists`);
  } else {
    console.error(`\n❌ CMS service is missing`);
    allValid = false;
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
validateCmsImports().catch(console.error);