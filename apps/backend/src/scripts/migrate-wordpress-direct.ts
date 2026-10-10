import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';
import { ComponentType } from '@affexai/shared-types';

// Template name to file mapping from PAGE_MAPPING_REPORT.md
const FILE_TO_TEMPLATE_NAME: Record<string, string> = {
  // Homepage (2 files)
  '2024-Ana-Sayfa': 'Corporate Homepage',
  '2025-Ana-Sayfa': 'Corporate Homepage',
  
  // Product Pages (9 files)
  'Product-ALLPLAN-2025': 'Product Landing Page',
  'Product-ALLPLAN-Civil': 'Product Landing Page',
  'Product-ALLPLAN-Cloud-Services': 'Product Landing Page',
  '2024-Product-Allplan-Bridge': 'Product Landing Page',
  '2024-Product-Bimplus-by-Allplan': 'Product Landing Page',
  '2024-Allplan-Precast-Product': 'Product Landing Page',
  '2024-Allplan-Precast-Software-for-precast': 'Product Landing Page',
  '2025-Allplan-Precast-Software-for-precast': 'Product Landing Page',
  '2024-Allplan-AEC': 'Product Landing Page',
  
  // Editions/Pricing (7 files)
  'Editions-ALLPLAN-Basic-2025': 'Pricing Page',
  'Editions-ALLPLAN-Concept-2025': 'Pricing Page',
  'Editions-ALLPLAN-Professional-2025': 'Pricing Page',
  'Editions-ALLPLAN-Ultimate-2025': 'Pricing Page',
  'Package-Overview-2025': 'Pricing Page',
  '2024-Paket-Karşılaştırma': 'Pricing Page',
  '2025-Farklı-abonelik-sürelerinin-faydaları': 'Pricing Page',
  
  // Industry Solutions (9 files)
  '2024-ARCHITECTURE': 'Industry Solution',
  '2024-Civil-Engineering-Endüstri-Çözümleri': 'Industry Solution',
  '2024-Structural-Engineering': 'Industry Solution',
  '2024-Bridge-Design': 'Industry Solution',
  '2024-Road-and-Rail-Design': 'Industry Solution',
  '2024-Site-Planning': 'Industry Solution',
  '2024-Steel-Detailing-Fabrication': 'Industry Solution',
  'BIM-Bridge-Workflow-1': 'Industry Solution',
  'MODELING-OF-PRECAST-GIRDER-BRIDGES': 'Industry Solution',
  
  // Features Pages (7 files)
  'Allplan-2025-Özellikleri': 'Product Landing Page',
  'ALLPLAN-2026nın-Özellikleri': 'Product Landing Page',
  'FEATURES-ALLPLAN-2024-BUILDING-DESIGN': 'Services Page',
  'FEATURES-ALLPLAN-2024-CONSTRUCTION-PLANNING': 'Services Page',
  'FEATURES-ALLPLAN-2024-INFRASTRUCTURE-DESIGN': 'Services Page',
  'Features-Allplan-Bridge-2024': 'Services Page',
  'Hello-ALLPLAN-2024': 'Services Page',
  
  // Campaign Pages (5 files)
  'Q1-Kampanya-2023': 'Lead Magnet Page',
  'Q2-Kampanya-2023': 'Lead Magnet Page',
  'Q3-Kampanya-2023': 'Lead Magnet Page',
  'Q4-Kampanya-2023-Kasım': 'Lead Magnet Page',
  'Q4-Kampanya-ALLTO-2023-Kasım': 'Lead Magnet Page',
  
  // Cloud Services (5 files)
  '2026-Cloud': 'Services Page',
  '2026-Information-Modeling-Management': 'Services Page',
  'Allplan-Bulut-Hizmetleri-şunları-içerir': 'Services Page',
  'Allplan-Cloud-Ücretsiz': 'Free Trial Signup',
  'ALLPLAN-Connect-Şirket-Ağı-Yönetimi': 'Services Page',
  
  // Education/Webinar (2 files)
  'Road-Webinar-Series': 'Event Page',
  'Üniversiteler': 'Services Page', // Education Page yok, Services kullan
  
  // Licensing/Support (5 files)
  '10-Duke-Yeni-Lisanslama': 'Services Page',
  'CONNECT-Giriş-Problemleri-veya-Parola-Unutma': 'FAQ Page',
  'Önemli-Bilgiler-Bağlantılar': 'Services Page', // Resources Page yok
  'Best-Architectural-Tool': 'About Us Page',
  'SDS': 'Services Page',
  
  // Form/Landing Pages (4 files)
  'Kişisel-bir-demo-talep-edin': 'Free Trial Signup',
  'Allplan-Demo-Talep-Teşekkürler-Sayfası': 'Thank You Page',
  'Türkçe-Eklenti-Talep-Formu': 'Contact Page',
  'Türkçe-eklentilerimizi-indirdiğiniz-için-teşekkür-': 'Thank You Page',
  
  // Legal (1 file)
  'Yasal-Uyarı': 'Services Page', // Legal Page yok, Services kullan
};

async function migrate() {
  console.log('🚀 WordPress → CMS Migration\n');

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5434'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'affexai_dev',
  });

  await dataSource.initialize();
  console.log('✅ Database connected\n');

  try {
    // Load page templates from database
    const templates = await dataSource.query(
      'SELECT id, name FROM page_templates WHERE "isActive" = true'
    );
    
    const templateMap = new Map<string, string>();
    templates.forEach((t: any) => templateMap.set(t.name, t.id));
    
    console.log(`📋 Loaded ${templates.length} active templates\n`);

    const extractedDir = path.join(__dirname, '../../extracted_pages');
    
    // Load mappings
    const mappingPath = path.join(extractedDir, 'MIGRATION_MAPPING.json');
    const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
    
    const imageAnalysisPath = path.join(extractedDir, 'IMAGE_ANALYSIS_REPORT.json');
    const imageAnalysis = JSON.parse(fs.readFileSync(imageAnalysisPath, 'utf-8'));

    console.log(`📊 Loaded ${mapping.summary.totalPages} pages, ${mapping.summary.uploadedImages} images\n`);

    // Get TXT files
    const files = fs.readdirSync(extractedDir)
      .filter(f => f.endsWith('.txt') && f !== 'test.txt' && f !== 'Taksit-Tablosu.txt');

    console.log(`📄 Processing ${files.length} files...\n`);

    let success = 0, skipped = 0, errors = 0;

    for (const file of files) {
      try {
        const filePath = path.join(extractedDir, file);
        let content = fs.readFileSync(filePath, 'utf-8');

        if (content.length < 100) {
          console.log(`⏭️  ${file} - too small`);
          skipped++;
          continue;
        }

        const baseName = file.replace('.txt', '');
        const lines = content.split('\n');
        const title = lines[0].replace('Title: ', '').trim();
        const slug = baseName.toLowerCase().replace(/\s+/g, '-');
        
        // Remove title line and get HTML content
        const htmlContent = lines.slice(1).join('\n').trim();
        
        // Get template name and ID
        const templateName = FILE_TO_TEMPLATE_NAME[baseName];
        if (!templateName) {
          console.log(`⏭️  ${file} - no template mapping`);
          skipped++;
          continue;
        }
        
        const templateId = templateMap.get(templateName);
        if (!templateId) {
          console.log(`❌ ${file} - template "${templateName}" not found in database`);
          errors++;
          continue;
        }

        // Check if exists
        const existing = await dataSource.query(
          'SELECT id FROM cms_pages WHERE slug = $1',
          [slug]
        );
        
        if (existing.length > 0) {
          console.log(`⏭️  ${file} - already exists`);
          skipped++;
          continue;
        }

        // Replace MinIO URLs (relative paths) in HTML content
        let processedHtml = htmlContent;
        mapping.imageMapping.forEach((img: any) => {
          const relativePath = img.minioUrl.replace('http://localhost:9007', '');
          processedHtml = processedHtml.replace(
            new RegExp(img.originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 
            relativePath
          );
        });

        // Create page with template reference
        const layoutOptions = { 
          templateId,
          templateName,
          useTemplateBlocks: true
        };
        
        const pageResult = await dataSource.query(
          `INSERT INTO cms_pages (title, slug, description, status, created_at, updated_at, layout_options)
           VALUES ($1, $2, $3, $4, NOW(), NOW(), $5)
           RETURNING id`,
          [title, slug, title.substring(0, 160), 'draft', JSON.stringify(layoutOptions)]
        );

        const pageId = pageResult[0].id;

        // Parse HTML content to components
        const $ = cheerio.load(`<div class="content">${processedHtml}</div>`);
        const components: any[] = [];
        let orderIndex = 0;

        // Extract YouTube videos from plain text URLs
        const youtubeRegex = /https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/g;
        const youtubeMatches = [...processedHtml.matchAll(youtubeRegex)];
        const extractedVideoIds = new Set(youtubeMatches.map(m => m[1]));

        // Process all elements in order
        $('.content').children().each((_, el) => {
          const $el = $(el);
          const tagName = el.tagName?.toLowerCase();

          // Headings
          if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3' || tagName === 'h4' || tagName === 'h5') {
            const text = $el.text().trim();
            if (text && text.length > 2 && !text.match(/^https?:\/\//)) {
              components.push([
                pageId,
                ComponentType.TEXT,
                JSON.stringify({ 
                  content: text, 
                  variant: tagName, 
                  align: 'left' 
                }),
                orderIndex++,
                null
              ]);
            }
          }
          
          // Paragraphs
          else if (tagName === 'p') {
            const text = $el.text().trim();
            if (text && text.length > 5 && !text.match(/^https?:\/\//)) {
              components.push([
                pageId,
                ComponentType.TEXT,
                JSON.stringify({ 
                  content: text, 
                  variant: 'p', 
                  align: 'left' 
                }),
                orderIndex++,
                null
              ]);
            }
          }
          
          // Lists (ul/ol)
          else if (tagName === 'ul' || tagName === 'ol') {
            const items: string[] = [];
            $el.find('li').each((_, li) => {
              const itemText = $(li).text().trim();
              if (itemText) {
                items.push(itemText);
              }
            });
            if (items.length > 0) {
              components.push([
                pageId,
                ComponentType.TEXT,
                JSON.stringify({ 
                  content: items.join('\n'), 
                  variant: 'list', 
                  listType: tagName,
                  align: 'left' 
                }),
                orderIndex++,
                null
              ]);
            }
          }
          
          // Images
          else if (tagName === 'img') {
            const src = $el.attr('src');
            const alt = $el.attr('alt') || '';
            if (src && !src.includes('data:image')) {
              components.push([
                pageId,
                ComponentType.IMAGE,
                JSON.stringify({ 
                  src, 
                  alt, 
                  width: '100%', 
                  height: 'auto' 
                }),
                orderIndex++,
                null
              ]);
            }
          }
          
          // Links with images (common pattern)
          else if (tagName === 'a') {
            const $img = $el.find('img').first();
            if ($img.length) {
              const src = $img.attr('src');
              const alt = $img.attr('alt') || '';
              const href = $el.attr('href');
              if (src && !src.includes('data:image')) {
                components.push([
                  pageId,
                  ComponentType.IMAGE,
                  JSON.stringify({ 
                    src, 
                    alt, 
                    link: href,
                    width: '100%', 
                    height: 'auto' 
                  }),
                  orderIndex++,
                  null
                ]);
              }
            }
            // Links without images - store as button/link component
            else {
              const text = $el.text().trim();
              const href = $el.attr('href');
              if (text && href && text.length > 2) {
                components.push([
                  pageId,
                  ComponentType.BUTTON,
                  JSON.stringify({ 
                    text, 
                    url: href,
                    variant: 'link',
                    target: $el.attr('target') || '_self'
                  }),
                  orderIndex++,
                  null
                ]);
              }
            }
          }
        });

        // Add standalone images not in body structure
        $('img').each((_, el) => {
          const $el = $(el);
          const src = $el.attr('src');
          const alt = $el.attr('alt') || '';
          
          // Check if already added
          const alreadyAdded = components.some(c => {
            const props = JSON.parse(c[2]);
            return props.src === src;
          });
          
          if (src && !src.includes('data:image') && !alreadyAdded) {
            components.push([
              pageId,
              ComponentType.IMAGE,
              JSON.stringify({ 
                src, 
                alt, 
                width: '100%', 
                height: 'auto' 
              }),
              orderIndex++,
              null
            ]);
          }
        });

        // Add YouTube videos as BLOCK type (VIDEO enum doesn't exist)
        extractedVideoIds.forEach(videoId => {
          components.push([
            pageId,
            'block', // Use block type for videos
            JSON.stringify({ 
              blockType: 'video',
              videoId, 
              platform: 'youtube', 
              autoplay: false,
              width: '100%',
              aspectRatio: '16:9'
            }),
            orderIndex++,
            null
          ]);
        });

        // Insert components
        if (components.length > 0) {
          for (let i = 0; i < components.length; i++) {
            const comp = components[i];
            try {
              // Validate component has type
              if (!comp[1]) {
                console.warn(`   ⚠️  Skipping component ${i}: missing type`);
                continue;
              }
              
              await dataSource.query(
                `INSERT INTO cms_components (page_id, type, props, order_index, parent_id, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
                comp
              );
            } catch (error: any) {
              console.error(`   ⚠️  Component ${i} error:`, error.message);
              console.error(`   Data:`, JSON.stringify(comp));
              throw error;
            }
          }
        }

        console.log(`✅ ${file} → ${templateName} (${components.length} components)`);
        success++;

      } catch (error: any) {
        console.error(`❌ ${file}: ${error.message}`);
        errors++;
      }
    }

    console.log(`\n📊 Migration Results:`);
    console.log(`   ✅ Success: ${success}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

migrate();
