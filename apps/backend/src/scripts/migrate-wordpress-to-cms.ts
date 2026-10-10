import 'reflect-metadata';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';
import { Page } from '../modules/cms/entities/page.entity';
import { Component } from '../modules/cms/entities/component.entity';
import { ComponentType } from '@affexai/shared-types';

interface ImageMapping {
  originalUrl: string;
  minioUrl: string;
}

interface MigrationMapping {
  generatedAt: string;
  summary: {
    totalPages: number;
    uploadedImages: number;
    skippedImages: number;
    youtubeVideos: number;
  };
  imageMapping: ImageMapping[];
}

interface PageImageAnalysis {
  filename: string;
  template: string;
  imageCount: number;
  videoCount: number;
  images: string[];
  videos: string[];
}

interface ImageAnalysisReport {
  generatedAt: string;
  totalPages: number;
  totalUniqueImages: number;
  totalVideos: number;
  pages: PageImageAnalysis[];
}

// Template mapping based on PAGE_MAPPING_REPORT.md
const TEMPLATE_MAPPING: Record<string, string> = {
  // Homepage
  '2024-Ana-Sayfa': 'Corporate Homepage',
  '2025-Ana-Sayfa': 'Corporate Homepage',
  
  // Product Pages
  'Product-ALLPLAN-2025': 'Product Landing Page',
  'Product-ALLPLAN-Civil': 'Product Landing Page',
  'Product-ALLPLAN-Cloud-Services': 'Product Landing Page',
  '2024-Product-Allplan-Bridge': 'Product Landing Page',
  '2024-Product-Bimplus-by-Allplan': 'Product Landing Page',
  '2024-Allplan-Precast-Product': 'Product Landing Page',
  '2024-Allplan-Precast-Software-for-precast': 'Product Landing Page',
  '2025-Allplan-Precast-Software-for-precast': 'Product Landing Page',
  '2024-Allplan-AEC': 'Product Landing Page',
  
  // Edition/Pricing Pages
  'Editions-ALLPLAN-Basic-2025': 'Pricing Page',
  'Editions-ALLPLAN-Concept-2025': 'Pricing Page',
  'Editions-ALLPLAN-Professional-2025': 'Pricing Page',
  'Editions-ALLPLAN-Ultimate-2025': 'Pricing Page',
  'Package-Overview-2025': 'Pricing Page',
  '2024-Paket-Karşılaştırma': 'Pricing Page',
  '2025-Farklı-abonelik-sürelerinin-faydaları': 'Pricing Page',
  
  // Industry Solutions
  '2024-ARCHITECTURE': 'Industry Solution',
  '2024-Civil-Engineering-Endüstri-Çözümleri': 'Industry Solution',
  '2024-Structural-Engineering': 'Industry Solution',
  '2024-Bridge-Design': 'Industry Solution',
  '2024-Road-and-Rail-Design': 'Industry Solution',
  '2024-Site-Planning': 'Industry Solution',
  '2024-Steel-Detailing-Fabrication': 'Industry Solution',
  
  // Features Pages
  'Allplan-2025-Özellikleri': 'Product Landing Page',
  'ALLPLAN-2026nın-Özellikleri': 'Product Landing Page',
  'FEATURES-ALLPLAN-2024-BUILDING-DESIGN': 'Services Page',
  'FEATURES-ALLPLAN-2024-CONSTRUCTION-PLANNING': 'Services Page',
  'FEATURES-ALLPLAN-2024-INFRASTRUCTURE-DESIGN': 'Services Page',
  'Features-Allplan-Bridge-2024': 'Services Page',
  'Hello-ALLPLAN-2024': 'Services Page',
  
  // Cloud Services
  '2026-Cloud': 'Services Page',
  '2026-Information-Modeling-Management': 'Services Page',
  'Allplan-Bulut-Hizmetleri-şunları-içerir': 'Services Page',
  'Allplan-Cloud-Ücretsiz': 'Free Trial Signup',
  'ALLPLAN-Connect-Şirket-Ağı-Yönetimi': 'Services Page',
  
  // Form Pages
  'Kişisel-bir-demo-talep-edin': 'Free Trial Signup',
  'Allplan-Demo-Talep-Teşekkürler-Sayfası': 'Thank You Page',
  'Türkçe-Eklenti-Talep-Formu': 'Contact Page',
};

async function migrateWordPressToCMS() {
  console.log('🚀 Starting WordPress → CMS Migration...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    // Load migration mapping
    const mappingPath = path.join(__dirname, '../../extracted_pages/MIGRATION_MAPPING.json');
    const mapping: MigrationMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));

    // Load image analysis
    const imageAnalysisPath = path.join(__dirname, '../../extracted_pages/IMAGE_ANALYSIS_REPORT.json');
    const imageAnalysis: ImageAnalysisReport = JSON.parse(fs.readFileSync(imageAnalysisPath, 'utf-8'));

    console.log(`📊 Migration Summary:`);
    console.log(`   - Total Pages: ${mapping.summary.totalPages}`);
    console.log(`   - Uploaded Images: ${mapping.summary.uploadedImages}`);
    console.log(`   - YouTube Videos: ${mapping.summary.youtubeVideos}\n`);

    // Get all txt files from extracted_pages
    const extractedPagesDir = path.join(__dirname, '../../extracted_pages');
    const files = fs.readdirSync(extractedPagesDir)
      .filter(file => file.endsWith('.txt') && file !== 'test.txt' && file !== 'Taksit-Tablosu.txt');

    console.log(`📄 Found ${files.length} page files to migrate\n`);

    // TESTING: Only process first 3 files
    const filesToProcess = files.slice(0, 3);
    console.log(`🧪 TEST MODE: Processing only ${filesToProcess.length} files\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    const pageRepository = dataSource.getRepository(Page);
    const componentRepository = dataSource.getRepository(Component);

    for (const file of filesToProcess) {
      try {
        const filePath = path.join(extractedPagesDir, file);
        let content = fs.readFileSync(filePath, 'utf-8');

        // Skip empty or very small files
        if (content.length < 100) {
          console.log(`⏭️  Skipping ${file} (too small)`);
          skipCount++;
          continue;
        }

        // Extract page info
        const fileBaseName = file.replace('.txt', '');
        const title = content.split('\n')[0].replace('Title: ', '').trim();
        const slug = fileBaseName.toLowerCase().replace(/\s+/g, '-');
        const template = TEMPLATE_MAPPING[fileBaseName] || 'TBD';

        // Get page-specific images and videos
        const pageAnalysis = imageAnalysis.pages.find(p => p.filename === file);
        
        // Replace image URLs with MinIO URLs (relative paths)
        mapping.imageMapping.forEach(img => {
          const minioRelativePath = img.minioUrl.replace('http://localhost:9007', '');
          content = content.replace(
            new RegExp(img.originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
            minioRelativePath
          );
        });

        // Parse HTML content
        const $ = cheerio.load(content);
        
        // Check if page already exists
        const existingPage = await pageRepository.findOne({ where: { slug } });
        if (existingPage) {
          console.log(`⏭️  Skipping ${file} (already exists)`);
          skipCount++;
          continue;
        }

        // Create page
        const page = pageRepository.create({
          title,
          slug,
          description: `Migrated from WordPress: ${fileBaseName}`,
          status: 'draft' as any,
          layoutOptions: {
            showHeader: true,
            showFooter: true,
            fullWidth: false,
          },
          createdBy: null,
          updatedBy: null,
        });

        await pageRepository.save(page);

        // Parse and create components
        const components = await parseContentToComponents($, page.id, pageAnalysis);
        
        if (components.length > 0) {
          await componentRepository.save(components);
        }

        console.log(`✅ Migrated: ${file} → ${template} (${components.length} components)`);
        successCount++;

      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Migration Results:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ⏭️  Skipped: ${skipCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await app.close();
  }
}

async function parseContentToComponents(
  $: cheerio.CheerioAPI,
  pageId: string,
  pageAnalysis?: PageImageAnalysis
): Promise<Partial<Component>[]> {
  const components: Partial<Component>[] = [];
  let orderIndex = 0;

  // Extract headings
  $('h1, h2, h3').each((_, el) => {
    const text = $(el).text().trim();
    if (text) {
      components.push({
        pageId,
        type: ComponentType.TEXT,
        props: {
          content: text,
          variant: el.tagName,
          align: 'left',
        },
        orderIndex: orderIndex++,
        parentId: null,
      });
    }
  });

  // Extract paragraphs
  $('p').each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length > 10) {
      components.push({
        pageId,
        type: ComponentType.TEXT,
        props: {
          content: text,
          variant: 'body',
          align: 'left',
        },
        orderIndex: orderIndex++,
        parentId: null,
      });
    }
  });

  // Extract images
  $('img').each((_, el) => {
    const src = $(el).attr('src');
    const alt = $(el).attr('alt') || '';
    if (src) {
      components.push({
        pageId,
        type: ComponentType.IMAGE,
        props: {
          src,
          alt,
          width: $(el).attr('width') || 'auto',
          height: $(el).attr('height') || 'auto',
        },
        orderIndex: orderIndex++,
        parentId: null,
      });
    }
  });

  // Extract buttons/links
  $('a').each((_, el) => {
    const href = $(el).attr('href');
    const text = $(el).text().trim();
    if (href && text && text.length > 2 && text.length < 100) {
      components.push({
        pageId,
        type: ComponentType.BUTTON,
        props: {
          text,
          href,
          variant: 'primary',
          target: $(el).attr('target') || '_self',
        },
        orderIndex: orderIndex++,
        parentId: null,
      });
    }
  });

  // Extract YouTube videos
  if (pageAnalysis?.videos && pageAnalysis.videos.length > 0) {
    pageAnalysis.videos.forEach(videoUrl => {
      const videoId = extractYouTubeId(videoUrl);
      if (videoId) {
        components.push({
          pageId,
          type: ComponentType.BLOCK,
          blockType: 'video',
          props: {
            videoId,
            platform: 'youtube',
            autoplay: false,
          },
          orderIndex: orderIndex++,
          parentId: null,
        });
      }
    });
  }

  return components;
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

migrateWordPressToCMS();
