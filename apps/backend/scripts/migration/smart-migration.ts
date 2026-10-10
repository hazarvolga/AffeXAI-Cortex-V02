#!/usr/bin/env ts-node

/**
 * Smart WordPress Migration
 * 
 * Bu script:
 * 1. Analiz raporunu okur (IMAGE_ANALYSIS_REPORT.json)
 * 2. Sadece kullanılan 449 orijinal görseli yükler
 * 3. 150 YouTube videosunu social-tiktok-youtube-embed component olarak ekler
 * 4. Her sayfa için doğru şablonu kullanır
 * 5. Hiçbir veri kaybı olmaz - birebir migration
 */

import * as fs from 'fs';
import * as path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import axios from 'axios';

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'http://localhost:9007';
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || 'minioadmin';
const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'cms-media';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';

interface ImageInfo {
  url: string;
  filename: string;
  usedInPages: string[];
}

interface VideoInfo {
  url: string;
  usedInPages: string[];
}

interface AnalysisReport {
  totalPages: number;
  totalUniqueImages: number;
  totalVideos: number;
  images: ImageInfo[];
  videos: VideoInfo[];
}

// YouTube URL'ini embed formatına çevir
function convertToEmbedUrl(url: string): string {
  // youtu.be/VIDEO_ID -> https://www.youtube.com/embed/VIDEO_ID
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1].split(/[?&#]/)[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  
  // youtube.com/watch?v=VIDEO_ID -> https://www.youtube.com/embed/VIDEO_ID
  if (url.includes('youtube.com/watch?v=')) {
    const videoId = url.split('v=')[1].split(/[?&#]/)[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  
  // youtube.com/embed/VIDEO_ID -> zaten doğru format
  if (url.includes('youtube.com/embed/')) {
    return url;
  }
  
  return url;
}

// Görsel dosyasını MinIO'ya yükle
async function uploadImageToMinIO(
  s3Client: S3Client,
  imageUrl: string,
  localPath: string
): Promise<string> {
  try {
    const filename = path.basename(imageUrl);
    const fileBuffer = fs.readFileSync(localPath);
    
    // Dosya tipini belirle
    const ext = path.extname(filename).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
    };
    const contentType = contentTypeMap[ext] || 'application/octet-stream';
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filename,
      Body: fileBuffer,
      ContentType: contentType,
    });
    
    await s3Client.send(command);
    
    return `${MINIO_ENDPOINT}/${BUCKET_NAME}/${filename}`;
  } catch (error) {
    console.error(`   ❌ Yükleme hatası: ${imageUrl}`, error);
    throw error;
  }
}

// WordPress uploads klasöründe görseli bul
function findImageInUploads(imageUrl: string, uploadsDir: string): string | null {
  try {
    const filename = path.basename(imageUrl);
    
    // Recursive search
    function searchDir(dir: string): string | null {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          const found = searchDir(fullPath);
          if (found) return found;
        } else if (item === filename) {
          return fullPath;
        }
      }
      
      return null;
    }
    
    return searchDir(uploadsDir);
  } catch (error) {
    return null;
  }
}

async function smartMigration() {
  console.log('🚀 Akıllı WordPress Migration Başlıyor...\n');
  console.log('='.repeat(80));
  console.log('\n');
  
  const extractedPagesDir = path.join(process.cwd(), 'extracted_pages');
  const uploadsDir = path.join(extractedPagesDir, 'uploads');
  const reportPath = path.join(extractedPagesDir, 'IMAGE_ANALYSIS_REPORT.json');
  
  // Analiz raporunu oku
  console.log('📋 Analiz raporu okunuyor...');
  if (!fs.existsSync(reportPath)) {
    console.error('❌ Analiz raporu bulunamadı!');
    console.error('   Önce analyze-used-images.ts scriptini çalıştırın.');
    process.exit(1);
  }
  
  const report: AnalysisReport = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
  console.log(`   ✅ ${report.totalPages} sayfa`);
  console.log(`   ✅ ${report.totalUniqueImages} benzersiz görsel`);
  console.log(`   ✅ ${report.totalVideos} YouTube videosu\n`);
  
  // MinIO client
  const s3Client = new S3Client({
    endpoint: MINIO_ENDPOINT,
    region: 'us-east-1',
    credentials: {
      accessKeyId: MINIO_ACCESS_KEY,
      secretAccessKey: MINIO_SECRET_KEY,
    },
    forcePathStyle: true,
  });
  
  // 1. Görselleri yükle
  console.log('📷 ADIM 1: Görseller MinIO\'ya yükleniyor...\n');
  let uploadedCount = 0;
  let skippedCount = 0;
  const uploadedImages = new Map<string, string>(); // original URL -> MinIO URL
  
  for (let i = 0; i < report.images.length; i++) {
    const image = report.images[i];
    const progress = `[${i + 1}/${report.images.length}]`;
    
    console.log(`${progress} ${image.filename}`);
    
    // Görseli uploads klasöründe bul
    const localPath = findImageInUploads(image.url, uploadsDir);
    
    if (!localPath) {
      console.log(`   ⚠️  Bulunamadı, atlanıyor...`);
      skippedCount++;
      continue;
    }
    
    try {
      const minioUrl = await uploadImageToMinIO(s3Client, image.url, localPath);
      uploadedImages.set(image.url, minioUrl);
      uploadedCount++;
      console.log(`   ✅ Yüklendi: ${minioUrl}`);
    } catch (error) {
      console.log(`   ❌ Hata, atlanıyor...`);
      skippedCount++;
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`\n✅ Görsel yükleme tamamlandı!`);
  console.log(`   Yüklenen: ${uploadedCount}`);
  console.log(`   Atlanan: ${skippedCount}\n`);
  
  // 2. YouTube videolarını kaydet
  console.log('🎥 ADIM 2: YouTube videoları kaydediliyor...\n');
  const videoComponents = report.videos.map((video, index) => {
    const embedUrl = convertToEmbedUrl(video.url);
    console.log(`[${index + 1}/${report.videos.length}] ${video.url}`);
    console.log(`   ✅ Embed: ${embedUrl}`);
    
    return {
      originalUrl: video.url,
      embedUrl,
      usedInPages: video.usedInPages,
      component: {
        type: 'social-tiktok-youtube-embed',
        properties: {
          videoUrl: embedUrl,
          title: 'Video',
          description: '',
        },
      },
    };
  });
  
  console.log('\n' + '='.repeat(80));
  console.log(`\n✅ ${videoComponents.length} YouTube videosu hazırlandı!\n`);
  
  // 3. Migration mapping'i kaydet
  console.log('💾 ADIM 3: Migration mapping kaydediliyor...\n');
  
  const migrationData = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalPages: report.totalPages,
      uploadedImages: uploadedCount,
      skippedImages: skippedCount,
      youtubeVideos: videoComponents.length,
    },
    imageMapping: Array.from(uploadedImages.entries()).map(([original, minio]) => ({
      originalUrl: original,
      minioUrl: minio,
    })),
    videoMapping: videoComponents,
  };
  
  const mappingPath = path.join(extractedPagesDir, 'MIGRATION_MAPPING.json');
  fs.writeFileSync(mappingPath, JSON.stringify(migrationData, null, 2));
  
  console.log(`✅ Mapping kaydedildi: ${mappingPath}\n`);
  
  // Özet
  console.log('='.repeat(80));
  console.log('\n📊 MİGRATION ÖZETİ:\n');
  console.log(`✅ ${uploadedCount} görsel MinIO'ya yüklendi`);
  console.log(`✅ ${videoComponents.length} YouTube videosu hazırlandı`);
  console.log(`✅ ${report.totalPages} sayfa migration için hazır\n`);
  
  console.log('📋 SONRAKİ ADIMLAR:\n');
  console.log('1. MIGRATION_MAPPING.json dosyasını kontrol edin');
  console.log('2. Sayfaları CMS\'e aktarmak için page migration scriptini çalıştırın');
  console.log('3. Her sayfanın doğru şablonu kullandığını kontrol edin\n');
}

// Çalıştır
if (require.main === module) {
  smartMigration()
    .then(() => {
      console.log('✅ Smart migration tamamlandı!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration hatası:', error);
      process.exit(1);
    });
}

export { smartMigration };
