#!/usr/bin/env tsx
/**
 * Cleanup script to remove test pages created during migration testing
 */

import axios from 'axios';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9006/api';

async function cleanupTestPages() {
  console.log('🧹 Cleaning up test pages...\n');

  try {
    // Get all pages
    const response = await axios.get(`${API_URL}/cms/pages`);
    const pages = response.data.data || response.data;

    // Filter all draft pages (migration creates pages as draft by default)
    const testPages = pages.filter((page: any) => 
      page.status === 'draft'
    );

    console.log(`Found ${testPages.length} test pages to delete\n`);

    if (testPages.length === 0) {
      console.log('✅ No test pages to clean up');
      return;
    }

    // Delete each test page
    let deleted = 0;
    let failed = 0;

    for (const page of testPages) {
      try {
        await axios.delete(`${API_URL}/cms/pages/${page.id}`);
        deleted++;
        if (deleted % 100 === 0) {
          console.log(`Deleted ${deleted}/${testPages.length} pages...`);
        }
      } catch (error) {
        failed++;
        console.error(`Failed to delete page ${page.slug}: ${error}`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Deleted: ${deleted}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

cleanupTestPages();
