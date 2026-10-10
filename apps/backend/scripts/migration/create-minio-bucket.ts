#!/usr/bin/env ts-node

/**
 * Create MinIO Bucket
 * 
 * cms-media bucket'ını oluşturur
 */

import { S3Client, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';

async function createBucket() {
  console.log('📦 MinIO Bucket Oluşturuluyor...\n');
  
  const s3Client = new S3Client({
    endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9007',
    region: 'us-east-1',
    credentials: {
      accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    },
    forcePathStyle: true,
  });
  
  const bucketName = process.env.MINIO_BUCKET || 'cms-media';
  
  try {
    // Bucket var mı kontrol et
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
      console.log(`✅ Bucket zaten mevcut: ${bucketName}\n`);
      return;
    } catch (error: any) {
      if (error.name !== 'NotFound' && error.Code !== 'NoSuchBucket') {
        throw error;
      }
      // Bucket yok, oluştur
    }
    
    // Bucket oluştur
    await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
    console.log(`✅ Bucket oluşturuldu: ${bucketName}\n`);
    
  } catch (error) {
    console.error('❌ Bucket oluşturma hatası:', error);
    throw error;
  }
}

if (require.main === module) {
  createBucket()
    .then(() => {
      console.log('✅ İşlem tamamlandı!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Hata:', error);
      process.exit(1);
    });
}

export { createBucket };
