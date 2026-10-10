#!/usr/bin/env node
/**
 * Upload Industry Solution Images to Media Library
 *
 * This script uploads the 107 images needed for Industry Solution pages
 * and generates a URL mapping file for content replacement.
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const API_BASE_URL = 'http://localhost:9006/api';
const EXTRACTED_PAGES_DIR = '/Users/hazarekiz/Projects/v06/Affexai/extracted_pages';
const IMAGE_LIST_FILE = '/tmp/industry_images_original.txt';
const MAPPING_OUTPUT_FILE = '/tmp/industry_images_mapping.json';

// Function to convert URL to local file path
function urlToLocalPath(url) {
  // URL format: https://aluplan.com.tr/wp-content/uploads/2022/10/filename.png
  // Local format: /extracted_pages/uploads/2022/10/filename.png
  const match = url.match(/\/wp-content\/uploads\/(\d{4})\/(\d{2})\/(.+)$/);
  if (match) {
    const [, year, month, filename] = match;
    return path.join(EXTRACTED_PAGES_DIR, 'uploads', year, month, filename);
  }
  return null;
}

// Function to determine file's mimetype
function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

async function uploadImage(localPath, originalUrl) {
  const filename = path.basename(localPath);
  const mimeType = getMimeType(filename);

  // Create form data
  const formData = new FormData();
  formData.append('file', fs.createReadStream(localPath), {
    filename: filename,
    contentType: mimeType
  });

  const queryParams = new URLSearchParams({
    module: 'cms',
    category: 'gallery',
    tags: 'industry-solutions,imported'
  });

  try {
    const response = await fetch(`${API_BASE_URL}/media/upload?${queryParams}`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`Failed to upload ${filename}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting Industry Solutions Image Upload...\n');

  // Read image list
  const imageListContent = fs.readFileSync(IMAGE_LIST_FILE, 'utf-8');
  const imageUrls = imageListContent.split('\n').filter(line => line.trim());

  console.log(`📋 Found ${imageUrls.length} images to upload\n`);

  const mapping = {};
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < imageUrls.length; i++) {
    const originalUrl = imageUrls[i].trim();
    if (!originalUrl) continue;

    const localPath = urlToLocalPath(originalUrl);

    if (!localPath) {
      console.log(`⚠️  [${i + 1}/${imageUrls.length}] Invalid URL format: ${originalUrl}`);
      errorCount++;
      continue;
    }

    if (!fs.existsSync(localPath)) {
      console.log(`⚠️  [${i + 1}/${imageUrls.length}] File not found: ${localPath}`);
      errorCount++;
      continue;
    }

    process.stdout.write(`📤 [${i + 1}/${imageUrls.length}] Uploading ${path.basename(localPath)}... `);

    const result = await uploadImage(localPath, originalUrl);

    if (result) {
      // Store mapping: old URL -> new URL
      const newUrl = result.url || result.data?.url;
      mapping[originalUrl] = {
        newUrl: newUrl,
        mediaId: result.id || result.data?.id,
        filename: result.filename || result.data?.filename
      };
      console.log('✅');
      successCount++;
    } else {
      console.log('❌');
      errorCount++;
    }

    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Save mapping to file
  fs.writeFileSync(MAPPING_OUTPUT_FILE, JSON.stringify(mapping, null, 2));

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Successfully uploaded: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📄 Mapping saved to: ${MAPPING_OUTPUT_FILE}`);
  console.log('='.repeat(50));
}

main().catch(console.error);
