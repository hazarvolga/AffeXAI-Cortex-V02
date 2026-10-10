#!/usr/bin/env tsx

/**
 * Diagnostic script to identify media upload 500 errors
 */

import axios from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';
import * as path from 'path';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:9006/api';

async function diagnoseMediaUpload() {
  console.log('🔍 Media Upload Diagnostic Tool\n');
  console.log(`API Base URL: ${API_BASE_URL}\n`);

  // Test 1: Check if backend is running
  console.log('Test 1: Backend Health Check');
  try {
    const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
    console.log('✅ Backend is running');
    console.log(`   Status: ${response.status}`);
  } catch (error: any) {
    console.log('❌ Backend is NOT running or not accessible');
    console.log(`   Error: ${error.message}`);
    console.log('\n💡 Solution: Start the backend server:');
    console.log('   cd apps/backend && npm run start:dev\n');
    return;
  }

  // Test 2: Check uploads directory
  console.log('\nTest 2: Uploads Directory Check');
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (fs.existsSync(uploadsDir)) {
    console.log('✅ Uploads directory exists');
    console.log(`   Path: ${uploadsDir}`);
    
    // Check permissions
    try {
      fs.accessSync(uploadsDir, fs.constants.W_OK);
      console.log('✅ Uploads directory is writable');
    } catch (error) {
      console.log('❌ Uploads directory is NOT writable');
      console.log('\n💡 Solution: Fix permissions:');
      console.log(`   chmod 755 ${uploadsDir}\n`);
    }
  } else {
    console.log('❌ Uploads directory does NOT exist');
    console.log('\n💡 Solution: Create uploads directory:');
    console.log(`   mkdir -p ${uploadsDir}\n`);
  }

  // Test 3: Test media upload endpoint with a small test file
  console.log('\nTest 3: Media Upload Endpoint Test');
  
  // Create a tiny test image (1x1 PNG)
  const testImageBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  
  const formData = new FormData();
  formData.append('file', testImageBuffer, {
    filename: 'test-diagnostic.png',
    contentType: 'image/png',
  });

  try {
    const response = await axios.post(
      `${API_BASE_URL}/media/upload?module=general&category=other&tags=migration,wordpress`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 10000,
      }
    );
    
    console.log('✅ Media upload endpoint is working');
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.log('❌ Media upload endpoint failed');
    console.log(`   Status: ${error.response?.status || 'N/A'}`);
    console.log(`   Error: ${error.message}`);
    
    if (error.response?.data) {
      console.log(`   Response:`, JSON.stringify(error.response.data, null, 2));
    }
    
    // Analyze the error
    if (error.response?.status === 500) {
      console.log('\n🔍 500 Error Analysis:');
      console.log('   Possible causes:');
      console.log('   1. Database connection issue');
      console.log('   2. EventBusService not initialized');
      console.log('   3. Missing environment variables');
      console.log('   4. File system permissions');
      console.log('   5. TypeORM entity/repository issue');
      
      console.log('\n💡 Solutions to try:');
      console.log('   1. Check backend logs: tail -f apps/backend/backend.log');
      console.log('   2. Verify database is running: docker ps | grep postgres');
      console.log('   3. Check .env file has all required variables');
      console.log('   4. Restart backend: npm run start:dev');
    }
  }

  // Test 4: Check database connection
  console.log('\nTest 4: Database Connection Check');
  try {
    const response = await axios.get(`${API_BASE_URL}/media`, { timeout: 5000 });
    console.log('✅ Database connection is working');
    console.log(`   Found ${response.data.length || 0} media items`);
  } catch (error: any) {
    console.log('❌ Database connection failed');
    console.log(`   Error: ${error.message}`);
    console.log('\n💡 Solution: Check database:');
    console.log('   docker ps | grep postgres');
    console.log('   docker logs affexai-postgres\n');
  }

  console.log('\n' + '='.repeat(60));
  console.log('Diagnostic Complete');
  console.log('='.repeat(60));
}

// Run diagnostic
diagnoseMediaUpload().catch(console.error);
