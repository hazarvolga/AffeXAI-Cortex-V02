import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import * as cheerio from 'cheerio';

/**
 * Fix Migrated Content Script
 * 
 * Bu script migration sonrası oluşan sorunları düzeltir:
 * 1. Raw HTML içeriği parse edip structured data'ya çevirir
 * 2. Component type'ları prebuild component'lere map'ler
 * 3. Media URL'lerini düzeltir
 * 4. BlockId'leri prebuild component'lerle eşleştirir
 * 
 * PRODUCTION WARNING: Bu script production'da çalıştırılmamalıdır!
 */

interface PrebuiltComponent {
  blockId: string;
  type: string;
  category: string;
}

// Prebuild component mapping
const PREBUILD_COMPONENTS: PrebuiltComponent[] = [
  // Hero components
  { blockId: 'hero-1', type: 'hero', category: 'hero' },
  { blockId: 'hero-2', type: 'hero', category: 'hero' },
  { blockId: 'hero-3', type: 'hero', category: 'hero' },
  
  // Text components
  { blockId: 'text-1', type: 'text', category: 'content' },
  { blockId: 'text-2', type: 'text', category: 'content' },
  { blockId: 'rich-text-1', type: 'text', category: 'content' },
  
  // Image components
  { blockId: 'image-1', type: 'image', category: 'media' },
  { blockId: 'image-2', type: 'image', category: 'media' },
  { blockId: 'image-gallery-1', type: 'gallery', category: 'media' },
  
  // Video components
  { blockId: 'video-1', type: 'video', category: 'media' },
  { blockId: 'video-embed-1', type: 'video', category: 'media' },
  
  // Card components
  { blockId: 'card-1', type: 'card', category: 'content' },
  { blockId: 'card-grid-1', type: 'grid', category: 'layout' },
  { blockId: 'feature-card-1', type: 'features', category: 'content' },
  
  // CTA components
  { blockId: 'cta-1', type: 'cta', category: 'marketing' },
  { blockId: 'cta-2', type: 'cta', category: 'marketing' },
  
  // Button components
  { blockId: 'button-1', type: 'button', category: 'interactive' },
  { blockId: 'button-group-1', type: 'button', category: 'interactive' },
];

function parseHtmlToStructuredData(html: string, componentType: string): any {
  const $ = cheerio.load(html);
  
  // Remove script and style tags
  $('script, style').remove();
  
  switch (componentType) {
    case 'text':
    case 'rich-text':
      return {
        content: $.html(),
        format: 'html',
      };
      
    case 'image':
      const img = $('img').first();
      return {
        src: img.attr('src') || '',
        alt: img.attr('alt') || '',
        title: img.attr('title') || '',
        caption: $('figcaption').text() || '',
      };
      
    case 'video':
      const video = $('video, iframe').first();
      return {
        src: video.attr('src') || video.attr('data-src') || '',
        type: video.is('iframe') ? 'embed' : 'video',
        title: video.attr('title') || '',
      };
      
    case 'heading':
      const heading = $('h1, h2, h3, h4, h5, h6').first();
      return {
        text: heading.text(),
        level: parseInt(heading.prop('tagName')?.substring(1) || '2'),
      };
      
    default:
      return {
        html: $.html(),
        text: $.text(),
      };
  }
}

function mapToPrebuiltComponent(type: string): string {
  const component = PREBUILD_COMPONENTS.find(c => c.type === type);
  return component?.blockId || `${type}-1`;
}

async function fixMigratedContent() {
  console.log('🔧 Starting Content Fix...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  let fixedCount = 0;
  let errorCount = 0;

  try {
    // Get all components
    const components = await dataSource.query(`
      SELECT 
        c.id,
        c.type,
        c."blockId",
        c.data,
        c."pageId",
        p.slug as page_slug
      FROM cms_components c
      LEFT JOIN cms_pages p ON p.id = c."pageId"
      ORDER BY c."createdAt" DESC
    `);

    console.log(`📦 Found ${components.length} components to check\n`);

    for (const component of components) {
      let needsUpdate = false;
      let newData = { ...component.data };
      let newBlockId = component.blockId;
      let newType = component.type;

      console.log(`\n🔍 Checking component ${component.id} (${component.type}) on page ${component.page_slug}`);

      // Fix 1: Check for raw HTML in data
      if (component.data) {
        const dataStr = JSON.stringify(component.data);
        
        if (dataStr.includes('<h1') || dataStr.includes('<h2') || dataStr.includes('<div') || dataStr.includes('<p>')) {
          console.log('  ⚠️  Found raw HTML, parsing...');
          
          // If data has a content field with HTML
          if (component.data.content && typeof component.data.content === 'string') {
            const parsed = parseHtmlToStructuredData(component.data.content, component.type);
            newData = { ...newData, ...parsed };
            needsUpdate = true;
            console.log('  ✅ Parsed HTML to structured data');
          }
        }
      }

      // Fix 2: Map to prebuild component if blockId is missing or invalid
      if (!component.blockId || component.blockId === 'custom' || component.blockId === 'block') {
        const prebuiltBlockId = mapToPrebuiltComponent(component.type);
        newBlockId = prebuiltBlockId;
        needsUpdate = true;
        console.log(`  ✅ Mapped to prebuild component: ${prebuiltBlockId}`);
      }

      // Fix 3: Fix unknown component types
      const validTypes = ['hero', 'text', 'image', 'video', 'carousel', 'grid', 'card', 'button', 'cta', 'features', 'gallery'];
      if (!validTypes.includes(component.type)) {
        // Try to infer type from blockId or data
        if (component.blockId?.includes('hero')) {
          newType = 'hero';
        } else if (component.blockId?.includes('image') || newData.src || newData.imageUrl) {
          newType = 'image';
        } else if (component.blockId?.includes('video') || newData.videoUrl) {
          newType = 'video';
        } else {
          newType = 'text'; // Default to text
        }
        needsUpdate = true;
        console.log(`  ✅ Fixed component type: ${component.type} → ${newType}`);
      }

      // Fix 4: Ensure media components have proper structure
      if (newType === 'image') {
        if (!newData.src && (newData.url || newData.imageUrl)) {
          newData.src = newData.url || newData.imageUrl;
          delete newData.url;
          delete newData.imageUrl;
          needsUpdate = true;
          console.log('  ✅ Normalized image data structure');
        }
      }

      if (newType === 'video') {
        if (!newData.src && (newData.url || newData.videoUrl)) {
          newData.src = newData.url || newData.videoUrl;
          delete newData.url;
          delete newData.videoUrl;
          needsUpdate = true;
          console.log('  ✅ Normalized video data structure');
        }
      }

      // Update component if needed
      if (needsUpdate) {
        try {
          await dataSource.query(`
            UPDATE cms_components
            SET 
              type = $1,
              "blockId" = $2,
              data = $3,
              "updatedAt" = NOW()
            WHERE id = $4
          `, [newType, newBlockId, newData, component.id]);
          
          fixedCount++;
          console.log(`  ✅ Component updated successfully`);
        } catch (error) {
          errorCount++;
          console.error(`  ❌ Error updating component:`, error.message);
        }
      } else {
        console.log('  ℹ️  No changes needed');
      }
    }

    console.log('\n\n📊 SUMMARY\n');
    console.log(`Total Components Checked: ${components.length}`);
    console.log(`Components Fixed: ${fixedCount}`);
    console.log(`Errors: ${errorCount}`);

  } catch (error) {
    console.error('❌ Error during fix:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Run fix
fixMigratedContent()
  .then(() => {
    console.log('\n✅ Content fix completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Content fix failed:', error);
    process.exit(1);
  });
