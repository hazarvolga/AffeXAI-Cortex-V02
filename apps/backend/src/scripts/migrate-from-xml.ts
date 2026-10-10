import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import * as xml2js from 'xml2js';

// WordPress XML to CMS Migration Script
// Uses WordPress WXR export with Elementor data

interface WordPressPage {
  title: string;
  link: string;
  pubDate: string;
  creator: string;
  guid: string;
  content: string;
  postId: string;
  postDate: string;
  postModified: string;
  postName: string;
  status: string;
  postParent: string;
  menuOrder: string;
  postType: string;
  postMeta: Array<{
    key: string;
    value: string;
  }>;
}

interface ElementorWidget {
  id: string;
  elType: string;
  widgetType?: string;
  settings?: any;
  elements?: ElementorWidget[];
}

interface UsedImage {
  url: string;
  filename: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
}

// Complete template mapping from PAGE_MAPPING_REPORT.md
const TEMPLATE_MAPPING: Record<string, string> = {
  // Homepage (2 files)
  '2024 Ana Sayfa': 'Corporate Homepage',
  '2025 Ana Sayfa': 'Corporate Homepage',
  
  // Product Pages (9 files)
  'Product ALLPLAN 2025': 'Product Landing Page',
  'Product ALLPLAN Civil': 'Product Landing Page',
  'Product ALLPLAN Cloud Services': 'Product Landing Page',
  '2024 Product Allplan Bridge': 'Product Landing Page',
  '2024 Product Bimplus by Allplan': 'Product Landing Page',
  '2024 Allplan Precast Product': 'Product Landing Page',
  '2024 Allplan Precast Software for precast': 'Product Landing Page',
  '2025 Allplan Precast Software for precast': 'Product Landing Page',
  '2024 Allplan AEC': 'Product Landing Page',
  
  // Editions/Pricing (7 files)
  'Editions ALLPLAN Basic 2025': 'Pricing Page',
  'Editions ALLPLAN Concept 2025': 'Pricing Page',
  'Editions ALLPLAN Professional 2025': 'Pricing Page',
  'Editions ALLPLAN Ultimate 2025': 'Pricing Page',
  'Package Overview 2025': 'Pricing Page',
  '2024 Paket Karşılaştırma': 'Pricing Page',
  '2025 Farklı abonelik sürelerinin faydaları': 'Pricing Page',
  
  // Industry Solutions (9 files)
  '2024 ARCHITECTURE': 'Industry Solution',
  '2024 Civil Engineering Endüstri Çözümleri': 'Industry Solution',
  '2024 Structural Engineering': 'Industry Solution',
  '2024 Bridge Design': 'Industry Solution',
  '2024 Road and Rail Design': 'Industry Solution',
  '2024 Site Planning': 'Industry Solution',
  '2024 Steel Detailing Fabrication': 'Industry Solution',
  'BIM Bridge Workflow 1': 'Industry Solution',
  'MODELING OF PRECAST GIRDER BRIDGES': 'Industry Solution',
  
  // Features Pages (7 files)
  'Allplan 2025 Özellikleri': 'Product Landing Page',
  'ALLPLAN 2026nın Özellikleri': 'Product Landing Page',
  'FEATURES ALLPLAN 2024 BUILDING DESIGN': 'Services Page',
  'FEATURES ALLPLAN 2024 CONSTRUCTION PLANNING': 'Services Page',
  'FEATURES ALLPLAN 2024 INFRASTRUCTURE DESIGN': 'Services Page',
  'Features Allplan Bridge 2024': 'Services Page',
  'Hello ALLPLAN 2024': 'Services Page',
  
  // Campaign Pages (5 files)
  'Q1 Kampanya 2023': 'Lead Magnet Page',
  'Q2 Kampanya 2023': 'Lead Magnet Page',
  'Q3 Kampanya 2023': 'Lead Magnet Page',
  'Q4 Kampanya 2023 Kasım': 'Lead Magnet Page',
  'Q4 Kampanya ALLTO 2023 Kasım': 'Lead Magnet Page',
  
  // Cloud Services (5 files)
  '2026 Cloud': 'Services Page',
  '2026 Information Modeling Management': 'Services Page',
  'Allplan Bulut Hizmetleri şunları içerir': 'Services Page',
  'Allplan Cloud Ücretsiz': 'Free Trial Signup',
  'ALLPLAN Connect Şirket Ağı Yönetimi': 'Services Page',
  
  // Education/Webinar (2 files)
  'Road Webinar Series': 'Event Page',
  'Üniversiteler': 'Services Page', // Education Page yok, Services kullan
  
  // Licensing/Support (5 files)
  '10 Duke Yeni Lisanslama': 'Services Page',
  'CONNECT Giriş Problemleri veya Parola Unutma': 'FAQ Page',
  'Önemli Bilgiler Bağlantılar': 'Services Page', // Resources Page yok
  'Best Architectural Tool': 'About Us Page',
  'SDS': 'Services Page',
  
  // Form/Landing Pages (4 files)
  'Kişisel bir demo talep edin': 'Free Trial Signup',
  'Allplan Demo Talep Teşekkürler Sayfası': 'Thank You Page',
  'Türkçe Eklenti Talep Formu': 'Contact Page',
  'Türkçe eklentilerimizi indirdiğiniz için teşekkür': 'Thank You Page',
  
  // Legal (1 file)
  'Yasal Uyarı': 'Services Page', // Legal Page yok, Services kullan
  
  // Architecture variations
  'Architecture': 'Industry Solution',
  'Allplan Architecture 2020': 'Product Landing Page',
  
  // Common variations (case-insensitive matching will handle these)
};

async function migrate() {
  console.log('🚀 WordPress XML → CMS Migration\n');

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
    // Load templates
    const templates = await dataSource.query(
      'SELECT id, name FROM page_templates WHERE "isActive" = true'
    );
    const templateMap = new Map<string, string>();
    templates.forEach((t: any) => templateMap.set(t.name, t.id));
    console.log(`📋 Loaded ${templates.length} templates\n`);

    // Parse XML
    const xmlPath = path.join(__dirname, '../../extracted_pages/aluplanprogramsistemleriallplantrkiyedistribtr.WordPress.2025-11-10.Pagesxml.xml');
    console.log('📄 Parsing XML file...');
    const xmlContent = fs.readFileSync(xmlPath, 'utf-8');
    
    const parser = new xml2js.Parser({
      explicitArray: true,
      mergeAttrs: true,
      explicitCharkey: true,
      charkey: '_text'
    });
    
    const result = await parser.parseStringPromise(xmlContent);
    const items = result.rss.channel[0].item || [];
    
    console.log(`📊 Found ${items.length} total items\n`);

    // Filter pages only (not attachments)
    const pages = items.filter((item: any) => {
      const postType = item['wp:post_type']?.[0]?._text || item['wp:post_type']?.[0];
      const status = item['wp:status']?.[0]?._text || item['wp:status']?.[0];
      return postType === 'page' && status === 'publish';
    });

    console.log(`📄 Found ${pages.length} published pages\n`);

    // Track used images
    const usedImages = new Set<string>();
    const imageMetadata = new Map<string, UsedImage>();

    // Extract attachments for metadata
    const attachments = items.filter((item: any) => {
      const postType = item['wp:post_type']?.[0]?._text || item['wp:post_type']?.[0];
      return postType === 'attachment';
    });

    console.log(`🖼️  Found ${attachments.length} attachments\n`);

    // Process attachments to build metadata map
    attachments.forEach((attachment: any) => {
      const url = attachment.guid?.[0]?._text || attachment.guid?.[0] || '';
      const filename = path.basename(url);
      const title = attachment.title?.[0]?._text || attachment.title?.[0] || '';
      
      // Get attachment metadata
      const postmeta = attachment['wp:postmeta'] || [];
      let width, height, alt;
      
      postmeta.forEach((meta: any) => {
        const key = meta['wp:meta_key']?.[0]?._text || meta['wp:meta_key']?.[0];
        const value = meta['wp:meta_value']?.[0]?._text || meta['wp:meta_value']?.[0];
        
        if (key === '_wp_attachment_metadata' && value) {
          try {
            // Parse serialized PHP data (simplified)
            const widthMatch = value.match(/width";i:(\d+)/);
            const heightMatch = value.match(/height";i:(\d+)/);
            if (widthMatch) width = parseInt(widthMatch[1]);
            if (heightMatch) height = parseInt(heightMatch[1]);
          } catch (e) {
            // Ignore parse errors
          }
        } else if (key === '_wp_attachment_image_alt') {
          alt = value;
        }
      });

      if (url) {
        imageMetadata.set(url, {
          url,
          filename,
          alt: alt || title,
          width,
          height
        });
      }
    });

    console.log(`📸 Processed ${imageMetadata.size} image metadata\n`);

    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process each page
    for (const item of pages) {
      try {
        const title = item.title?.[0]?._text || item.title?.[0] || '';
        const content = item['content:encoded']?.[0]?._text || item['content:encoded']?.[0] || '';
        const postName = item['wp:post_name']?.[0]?._text || item['wp:post_name']?.[0] || '';
        const postDate = item['wp:post_date']?.[0]?._text || item['wp:post_date']?.[0] || '';
        const postModified = item['wp:post_modified']?.[0]?._text || item['wp:post_modified']?.[0] || '';
        
        if (!title || title.length < 2) {
          console.log(`⏭️  Skipping: empty title`);
          skippedCount++;
          continue;
        }

        const slug = postName || title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        
        // Get template with fuzzy matching
        let templateName = TEMPLATE_MAPPING[title];
        
        // If exact match not found, try case-insensitive and normalized
        if (!templateName) {
          const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
          const matchedKey = Object.keys(TEMPLATE_MAPPING).find(key => {
            const normalizedKey = key.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
            return normalizedKey === normalizedTitle || normalizedTitle.includes(normalizedKey);
          });
          templateName = matchedKey ? TEMPLATE_MAPPING[matchedKey] : null;
        }
        
        // Fallback: Intelligent guessing based on title keywords
        if (!templateName) {
          const lowerTitle = title.toLowerCase();
          if (lowerTitle.includes('ana sayfa') || lowerTitle.includes('homepage')) {
            templateName = 'Corporate Homepage';
          } else if (lowerTitle.includes('product') || lowerTitle.includes('ürün')) {
            templateName = 'Product Landing Page';
          } else if (lowerTitle.includes('edition') || lowerTitle.includes('paket') || lowerTitle.includes('pricing')) {
            templateName = 'Pricing Page';
          } else if (lowerTitle.includes('architecture') || lowerTitle.includes('engineering') || lowerTitle.includes('endüstri')) {
            templateName = 'Industry Solution';
          } else if (lowerTitle.includes('demo') || lowerTitle.includes('trial') || lowerTitle.includes('deneme')) {
            templateName = 'Free Trial Signup';
          } else if (lowerTitle.includes('teşekkür') || lowerTitle.includes('thank')) {
            templateName = 'Thank You Page';
          } else if (lowerTitle.includes('contact') || lowerTitle.includes('iletişim') || lowerTitle.includes('form')) {
            templateName = 'Contact Page';
          } else if (lowerTitle.includes('event') || lowerTitle.includes('webinar')) {
            templateName = 'Event Page';
          } else if (lowerTitle.includes('about') || lowerTitle.includes('hakkında')) {
            templateName = 'About Us Page';
          } else if (lowerTitle.includes('faq') || lowerTitle.includes('sss')) {
            templateName = 'FAQ Page';
          } else {
            templateName = 'Services Page'; // Default fallback
          }
        }
        
        const templateId = templateMap.get(templateName);
        
        if (!templateId) {
          console.log(`⏭️  ${title} - template "${templateName}" not found`);
          skippedCount++;
          continue;
        }

        // Check if exists
        const existing = await dataSource.query(
          'SELECT id FROM cms_pages WHERE slug = $1',
          [slug]
        );
        
        if (existing.length > 0) {
          console.log(`⏭️  ${title} - already exists`);
          skippedCount++;
          continue;
        }

        // Extract postmeta
        const postmeta = item['wp:postmeta'] || [];
        let elementorData: any = null;
        let seoTitle = title;
        let seoDescription = '';
        
        postmeta.forEach((meta: any) => {
          const key = meta['wp:meta_key']?.[0]?._text || meta['wp:meta_key']?.[0];
          const value = meta['wp:meta_value']?.[0]?._text || meta['wp:meta_value']?.[0];
          
          if (key === '_elementor_data' && value) {
            try {
              elementorData = JSON.parse(value);
            } catch (e) {
              console.log(`   ⚠️  Failed to parse Elementor data`);
            }
          } else if (key === '_yoast_wpseo_title' || key === 'rank_math_title') {
            seoTitle = value || title;
          } else if (key === '_yoast_wpseo_metadesc' || key === 'rank_math_description') {
            seoDescription = value || '';
          }
        });

        // Create page
        const layoutOptions = {
          templateId,
          templateName,
          useTemplateBlocks: true,
          publishedAt: postDate,
          modifiedAt: postModified
        };

        const pageResult = await dataSource.query(
          `INSERT INTO cms_pages (title, slug, description, status, created_at, updated_at, layout_options)
           VALUES ($1, $2, $3, $4, NOW(), NOW(), $5)
           RETURNING id`,
          [title, slug, seoDescription || title.substring(0, 160), 'draft', JSON.stringify(layoutOptions)]
        );

        const pageId = pageResult[0].id;

        // Extract images from content
        const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
        let imgMatch;
        while ((imgMatch = imgRegex.exec(content)) !== null) {
          usedImages.add(imgMatch[1]);
        }

        // Process Elementor data if available
        let components: any[] = [];
        let orderIndex = 0;

        if (elementorData && Array.isArray(elementorData)) {
          components = await processElementorData(elementorData, pageId, usedImages, imageMetadata);
          orderIndex = components.length;
        }

        // Fallback: Parse HTML content if no Elementor data
        if (components.length === 0 && content) {
          components = await parseHtmlContent(content, pageId, usedImages, imageMetadata);
        }

        // Insert components
        if (components.length > 0) {
          for (const comp of components) {
            try {
              if (!comp[1]) continue; // Skip if no type
              
              await dataSource.query(
                `INSERT INTO cms_components (page_id, type, props, order_index, parent_id, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
                comp
              );
            } catch (error: any) {
              console.error(`   ⚠️  Component error:`, error.message);
            }
          }
        }

        console.log(`✅ ${title} → ${templateName} (${components.length} components)`);
        successCount++;

      } catch (error: any) {
        console.error(`❌ Error:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Migration Results:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);

    // Report used images
    console.log(`\n🖼️  Used Images: ${usedImages.size}`);
    
    // Save used images list
    const usedImagesList = Array.from(usedImages).map(url => {
      const metadata = imageMetadata.get(url);
      return {
        url,
        filename: path.basename(url),
        metadata: metadata || null
      };
    });

    fs.writeFileSync(
      path.join(__dirname, '../../extracted_pages/USED_IMAGES.json'),
      JSON.stringify({ usedImages: usedImagesList, total: usedImagesList.length }, null, 2)
    );

    console.log(`📝 Saved used images list to USED_IMAGES.json`);

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

async function processElementorData(
  data: any[],
  pageId: string,
  usedImages: Set<string>,
  imageMetadata: Map<string, UsedImage>
): Promise<any[]> {
  const components: any[] = [];
  let orderIndex = 0;

  function processElement(element: any, parentId: string | null = null) {
    if (!element) return;

    const elType = element.elType;
    const widgetType = element.widgetType;
    const settings = element.settings || {};

    // Process based on element type
    if (elType === 'widget' && widgetType) {
      // Map Elementor widgets to CMS components
      switch (widgetType) {
        case 'heading':
          if (settings.title) {
            components.push([
              pageId,
              'text',
              JSON.stringify({
                content: settings.title,
                variant: settings.header_size || 'h2',
                align: settings.align || 'left',
                color: settings.color
              }),
              orderIndex++,
              parentId
            ]);
          }
          break;

        case 'text-editor':
          if (settings.editor) {
            // Extract images from editor content
            const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
            let match;
            while ((match = imgRegex.exec(settings.editor)) !== null) {
              usedImages.add(match[1]);
            }

            components.push([
              pageId,
              'text',
              JSON.stringify({
                content: settings.editor,
                variant: 'p',
                align: settings.align || 'left'
              }),
              orderIndex++,
              parentId
            ]);
          }
          break;

        case 'image':
          if (settings.image?.url) {
            usedImages.add(settings.image.url);
            const metadata = imageMetadata.get(settings.image.url);
            
            components.push([
              pageId,
              'image',
              JSON.stringify({
                src: settings.image.url,
                alt: settings.image.alt || metadata?.alt || '',
                width: settings.image_size?.width || metadata?.width || '100%',
                height: settings.image_size?.height || metadata?.height || 'auto',
                link: settings.link?.url
              }),
              orderIndex++,
              parentId
            ]);
          }
          break;

        case 'button':
          if (settings.text) {
            components.push([
              pageId,
              'button',
              JSON.stringify({
                text: settings.text,
                url: settings.link?.url || '#',
                variant: settings.button_type || 'primary',
                size: settings.size || 'md',
                target: settings.link?.is_external ? '_blank' : '_self'
              }),
              orderIndex++,
              parentId
            ]);
          }
          break;

        case 'video':
          const videoUrl = settings.youtube_url || settings.vimeo_url || settings.hosted_url;
          if (videoUrl) {
            // Extract YouTube ID
            const youtubeMatch = videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
            
            components.push([
              pageId,
              'block',
              JSON.stringify({
                blockType: 'video',
                videoId: youtubeMatch ? youtubeMatch[1] : videoUrl,
                platform: settings.video_type || 'youtube',
                autoplay: settings.autoplay === 'yes',
                aspectRatio: settings.aspect_ratio || '16:9'
              }),
              orderIndex++,
              parentId
            ]);
          }
          break;

        case 'icon-list':
          if (settings.icon_list && Array.isArray(settings.icon_list)) {
            const items = settings.icon_list.map((item: any) => item.text).filter(Boolean);
            if (items.length > 0) {
              components.push([
                pageId,
                'text',
                JSON.stringify({
                  content: items.join('\n'),
                  variant: 'list',
                  listType: 'ul'
                }),
                orderIndex++,
                parentId
              ]);
            }
          }
          break;

        // Add more widget types as needed
        default:
          // console.log(`   ⚠️  Unknown widget type: ${widgetType}`);
          break;
      }
    }

    // Process child elements recursively
    if (element.elements && Array.isArray(element.elements)) {
      element.elements.forEach((child: any) => processElement(child, parentId));
    }
  }

  // Process all sections
  data.forEach(section => processElement(section));

  return components;
}

async function parseHtmlContent(
  content: string,
  pageId: string,
  usedImages: Set<string>,
  imageMetadata: Map<string, UsedImage>
): Promise<any[]> {
  const cheerio = require('cheerio');
  const $ = cheerio.load(`<div class="content">${content}</div>`);
  const components: any[] = [];
  let orderIndex = 0;

  $('.content').children().each((_: any, el: any) => {
    const $el = $(el);
    const tagName = el.tagName?.toLowerCase();

    if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3' || tagName === 'h4') {
      const text = $el.text().trim();
      if (text && text.length > 2) {
        components.push([
          pageId,
          'text',
          JSON.stringify({ content: text, variant: tagName, align: 'left' }),
          orderIndex++,
          null
        ]);
      }
    } else if (tagName === 'p') {
      const text = $el.text().trim();
      if (text && text.length > 5) {
        components.push([
          pageId,
          'text',
          JSON.stringify({ content: text, variant: 'p', align: 'left' }),
          orderIndex++,
          null
        ]);
      }
    } else if (tagName === 'img') {
      const src = $el.attr('src');
      if (src) {
        usedImages.add(src);
        const metadata = imageMetadata.get(src);
        components.push([
          pageId,
          'image',
          JSON.stringify({
            src,
            alt: $el.attr('alt') || metadata?.alt || '',
            width: '100%',
            height: 'auto'
          }),
          orderIndex++,
          null
        ]);
      }
    }
  });

  return components;
}

migrate();
