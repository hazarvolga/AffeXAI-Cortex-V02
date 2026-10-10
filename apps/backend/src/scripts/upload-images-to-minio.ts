import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import { S3Client, PutObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';

/**
 * Upload WordPress images to MinIO
 * Uses IMAGE_URL_MAPPING.json to know which images to upload
 */

async function uploadImagesToMinIO() {
  console.log('📤 Uploading images to MinIO...\n');

  // MinIO configuration
  const s3Client = new S3Client({
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9007',
    region: 'us-east-1',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
      secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
    },
    forcePathStyle: true,
  });

  const bucketName = process.env.S3_BUCKET_NAME || 'affexai-files';

  try {
    // Check if bucket exists
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    console.log(`✅ Connected to MinIO bucket: ${bucketName}\n`);
  } catch (error) {
    console.error(`❌ Cannot connect to MinIO bucket: ${bucketName}`);
    console.error('Make sure MinIO is running and bucket exists');
    process.exit(1);
  }

  // Load image mapping (created from USED_IMAGES.json - only images used in migrated pages)
  const mappingPath = path.join(__dirname, '../../extracted_pages/IMAGE_URL_MAPPING.json');
  if (!fs.existsSync(mappingPath)) {
    console.error('❌ IMAGE_URL_MAPPING.json not found');
    console.error('Run: npm run fix:image-urls first');
    process.exit(1);
  }

  const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
  console.log(`📋 Found ${mapping.total} images to upload`);
  console.log(`   (Only images used in migrated CMS pages)\n`);

  const uploadsDir = path.join(__dirname, '../../extracted_pages/uploads');
  
  let uploadedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const img of mapping.images) {
    try {
      // Extract path from MinIO URL: /api/media/wordpress-images/2023/11/image.png
      const minioPath = img.minioUrl.replace('/api/media/', '');
      
      // Local file path
      const localPath = path.join(uploadsDir, img.localPath.replace('extracted_pages/uploads/', ''));
      
      if (!fs.existsSync(localPath)) {
        console.log(`⏭️  ${img.filename} - file not found locally`);
        skippedCount++;
        continue;
      }

      // Read file
      const fileContent = fs.readFileSync(localPath);
      
      // Determine content type
      const ext = path.extname(img.filename).toLowerCase();
      const contentTypeMap: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
      };
      const contentType = contentTypeMap[ext] || 'application/octet-stream';

      // Upload to MinIO
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: minioPath,
        Body: fileContent,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000',
      }));

      uploadedCount++;
      
      if (uploadedCount % 50 === 0) {
        console.log(`   Uploaded ${uploadedCount}/${mapping.total} images...`);
      }

    } catch (error: any) {
      console.error(`❌ ${img.filename}: ${error.message}`);
      errorCount++;
    }
  }

  console.log(`\n📊 Upload Results:`);
  console.log(`   ✅ Uploaded: ${uploadedCount}`);
  console.log(`   ⏭️  Skipped: ${skippedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  
  if (uploadedCount > 0) {
    console.log(`\n✅ Images are now available at: ${process.env.S3_ENDPOINT}/${bucketName}/wordpress-images/...`);
  }
}

uploadImagesToMinIO();
