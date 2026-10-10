#!/usr/bin/env ts-node

/**
 * MinIO Cleanup Script
 * 
 * Mevcut tüm görselleri MinIO'dan siler
 * Yeni migration için temiz bir başlangıç sağlar
 */

import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || 'minioadmin';
const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'cms-media';

async function cleanupMinIO() {
  console.log('🧹 MinIO Temizlik Başlıyor...\n');
  console.log('='.repeat(80));
  console.log('\n');
  
  const s3Client = new S3Client({
    endpoint: MINIO_ENDPOINT,
    region: 'us-east-1',
    credentials: {
      accessKeyId: MINIO_ACCESS_KEY,
      secretAccessKey: MINIO_SECRET_KEY,
    },
    forcePathStyle: true,
  });
  
  try {
    console.log(`📦 Bucket: ${BUCKET_NAME}`);
    console.log(`🔗 Endpoint: ${MINIO_ENDPOINT}\n`);
    
    // List all objects
    console.log('📋 Mevcut görseller listeleniyor...');
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
    });
    
    const listResponse = await s3Client.send(listCommand);
    const objects = listResponse.Contents || [];
    
    if (objects.length === 0) {
      console.log('✅ MinIO zaten temiz, silinecek görsel yok.\n');
      return;
    }
    
    console.log(`📊 Toplam ${objects.length} görsel bulundu\n`);
    
    // Confirm deletion
    console.log('⚠️  UYARI: Tüm görseller silinecek!');
    console.log('⚠️  Bu işlem geri alınamaz!\n');
    
    // Delete all objects
    console.log('🗑️  Görseller siliniyor...\n');
    
    const deleteObjects = objects.map(obj => ({ Key: obj.Key! }));
    
    // Delete in batches of 1000 (S3 limit)
    const batchSize = 1000;
    let deletedCount = 0;
    
    for (let i = 0; i < deleteObjects.length; i += batchSize) {
      const batch = deleteObjects.slice(i, i + batchSize);
      
      const deleteCommand = new DeleteObjectsCommand({
        Bucket: BUCKET_NAME,
        Delete: {
          Objects: batch,
          Quiet: false,
        },
      });
      
      const deleteResponse = await s3Client.send(deleteCommand);
      const deleted = deleteResponse.Deleted?.length || 0;
      deletedCount += deleted;
      
      console.log(`   ✓ ${deletedCount}/${objects.length} görsel silindi`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log(`\n✅ Temizlik tamamlandı! ${deletedCount} görsel silindi.\n`);
    
  } catch (error) {
    console.error('\n❌ MinIO temizlik hatası:', error);
    throw error;
  }
}

// Çalıştır
if (require.main === module) {
  cleanupMinIO()
    .then(() => {
      console.log('✅ Script tamamlandı!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script hatası:', error);
      process.exit(1);
    });
}

export { cleanupMinIO };
