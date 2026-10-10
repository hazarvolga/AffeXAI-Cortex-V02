#!/usr/bin/env ts-node

/**
 * Analyze Used Images in 56 Pages
 * 
 * Bu script:
 * 1. 56 sayfayı tarar
 * 2. Kullanılan görselleri tespit eder
 * 3. YouTube videolarını tespit eder
 * 4. Hangi görsellerin yüklenmesi gerektiğini listeler
 */

import * as fs from 'fs';
import * as path from 'path';

interface ImageInfo {
  url: string;
  filename: string;
  usedInPages: string[];
}

interface VideoInfo {
  url: string;
  usedInPages: string[];
}

interface PageAnalysis {
  filename: string;
  template: string;
  imageCount: number;
  videoCount: number;
  images: string[];
  videos: string[];
}

function extractImagesFromContent(content: string): string[] {
  const images: string[] = [];
  
  // <img src="..." pattern
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match;
  
  while ((match = imgRegex.exec(content)) !== null) {
    const url = match[1];
    // Sadece aluplan.com.tr/wp-content/uploads görselleri
    if (url.includes('aluplan.com.tr/wp-content/uploads')) {
      images.push(url);
    }
  }
  
  // background-image: url(...) pattern
  const bgRegex = /background-image:\s*url\(['"]?([^'")\s]+)['"]?\)/gi;
  while ((match = bgRegex.exec(content)) !== null) {
    const url = match[1];
    if (url.includes('aluplan.com.tr/wp-content/uploads')) {
      images.push(url);
    }
  }
  
  return [...new Set(images)]; // Unique
}

function extractVideosFromContent(content: string): string[] {
  const videos: string[] = [];
  
  // YouTube embed patterns
  const patterns = [
    /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/gi,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/gi,
    /youtu\.be\/([a-zA-Z0-9_-]+)/gi,
    /<iframe[^>]+src=["']([^"']*youtube[^"']*)["']/gi,
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      videos.push(match[0]);
    }
  });
  
  return [...new Set(videos)]; // Unique
}

function getOriginalImageUrl(url: string): string {
  // WordPress thumbnail pattern: image-300x200.jpg -> image.jpg
  // Remove size suffixes like -300x200, -150x150, etc.
  const filename = path.basename(url);
  const originalFilename = filename.replace(/-\d+x\d+(\.(jpg|jpeg|png|gif|webp))$/i, '$1');
  return url.replace(filename, originalFilename);
}

async function analyzePages() {
  console.log('🔍 56 Sayfa Analizi Başlıyor...\n');
  console.log('='.repeat(80));
  console.log('\n');
  
  const extractedPagesDir = path.join(process.cwd(), 'apps/backend/extracted_pages');
  const files = fs.readdirSync(extractedPagesDir)
    .filter(f => f.endsWith('.txt') && !f.startsWith('.') && f !== 'test.txt');
  
  console.log(`📁 Toplam ${files.length} sayfa bulundu\n`);
  
  const pageAnalyses: PageAnalysis[] = [];
  const allImages = new Map<string, ImageInfo>();
  const allVideos = new Map<string, VideoInfo>();
  
  // Her sayfayı analiz et
  for (const file of files) {
    const filePath = path.join(extractedPagesDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    const images = extractImagesFromContent(content);
    const videos = extractVideosFromContent(content);
    
    pageAnalyses.push({
      filename: file,
      template: 'TBD', // Mapping'den alınacak
      imageCount: images.length,
      videoCount: videos.length,
      images,
      videos,
    });
    
    // Görselleri topla
    images.forEach(imgUrl => {
      const originalUrl = getOriginalImageUrl(imgUrl);
      const filename = path.basename(originalUrl);
      
      if (!allImages.has(originalUrl)) {
        allImages.set(originalUrl, {
          url: originalUrl,
          filename,
          usedInPages: [],
        });
      }
      allImages.get(originalUrl)!.usedInPages.push(file);
    });
    
    // Videoları topla
    videos.forEach(videoUrl => {
      if (!allVideos.has(videoUrl)) {
        allVideos.set(videoUrl, {
          url: videoUrl,
          usedInPages: [],
        });
      }
      allVideos.get(videoUrl)!.usedInPages.push(file);
    });
  }
  
  // Sonuçları yazdır
  console.log('📊 ANALİZ SONUÇLARI\n');
  console.log('='.repeat(80));
  console.log('\n');
  
  console.log(`✅ Toplam Sayfa: ${pageAnalyses.length}`);
  console.log(`🖼️  Toplam Benzersiz Görsel (Orijinal): ${allImages.size}`);
  console.log(`🎥 Toplam YouTube Video: ${allVideos.size}`);
  console.log('\n');
  
  // En çok görsel kullanan sayfalar
  console.log('📈 EN ÇOK GÖRSEL KULLANAN SAYFALAR (Top 10):\n');
  const topPages = [...pageAnalyses]
    .sort((a, b) => b.imageCount - a.imageCount)
    .slice(0, 10);
  
  topPages.forEach((page, index) => {
    console.log(`${index + 1}. ${page.filename}`);
    console.log(`   Görseller: ${page.imageCount}, Videolar: ${page.videoCount}`);
  });
  console.log('\n');
  
  // En çok kullanılan görseller
  console.log('🔥 EN ÇOK KULLANILAN GÖRSELLER (Top 10):\n');
  const topImages = [...allImages.values()]
    .sort((a, b) => b.usedInPages.length - a.usedInPages.length)
    .slice(0, 10);
  
  topImages.forEach((img, index) => {
    console.log(`${index + 1}. ${img.filename}`);
    console.log(`   Kullanıldığı sayfa sayısı: ${img.usedInPages.length}`);
    console.log(`   URL: ${img.url}`);
    console.log('');
  });
  
  // Videoları listele
  if (allVideos.size > 0) {
    console.log('🎥 YOUTUBE VİDEOLARI:\n');
    allVideos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.url}`);
      console.log(`   Kullanıldığı sayfalar: ${video.usedInPages.join(', ')}`);
      console.log('');
    });
  }
  
  // Rapor dosyası oluştur
  const report = {
    generatedAt: new Date().toISOString(),
    totalPages: pageAnalyses.length,
    totalUniqueImages: allImages.size,
    totalVideos: allVideos.size,
    pages: pageAnalyses,
    images: Array.from(allImages.values()),
    videos: Array.from(allVideos.values()),
  };
  
  const reportPath = path.join(extractedPagesDir, 'IMAGE_ANALYSIS_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('='.repeat(80));
  console.log(`\n✅ Rapor kaydedildi: ${reportPath}\n`);
  
  // Özet
  console.log('📋 ÖNEMLİ NOTLAR:\n');
  console.log('1. Sadece ORİJİNAL görseller yüklenecek (thumbnail/webp değil)');
  console.log('2. YouTube videoları component olarak eklenecek');
  console.log('3. Her sayfa için doğru şablon kullanılacak');
  console.log('4. Hiçbir veri kaybı olmayacak - birebir migration\n');
  
  return report;
}

// Çalıştır
if (require.main === module) {
  analyzePages()
    .then(() => {
      console.log('✅ Analiz tamamlandı!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Analiz hatası:', error);
      process.exit(1);
    });
}

export { analyzePages };
