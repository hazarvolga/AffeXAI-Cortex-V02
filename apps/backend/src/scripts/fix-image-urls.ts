import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Fix WordPress image URLs to use MinIO
 * 
 * WordPress URL: https://aluplan.com.tr/wp-content/uploads/2023/11/image.png
 * MinIO URL: /api/media/wordpress-images/2023/11/image.png
 */

async function fixImageUrls() {
  console.log('🔧 Fixing image URLs...\n');

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
    // Get all image components
    const imageComponents = await dataSource.query(
      `SELECT id, props FROM cms_components WHERE type = 'image'`
    );

    console.log(`📸 Found ${imageComponents.length} image components\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const component of imageComponents) {
      const props = component.props;
      const src = props.src;

      if (!src) {
        skippedCount++;
        continue;
      }

      // Check if it's a WordPress URL
      if (src.includes('aluplan.com.tr/wp-content/uploads/')) {
        // Extract the path after /wp-content/uploads/
        const match = src.match(/\/wp-content\/uploads\/(.+)$/);
        if (match) {
          const imagePath = match[1];
          
          // New MinIO URL
          const newSrc = `/api/media/wordpress-images/${imagePath}`;
          
          // Update props
          props.src = newSrc;
          
          // Update in database
          await dataSource.query(
            `UPDATE cms_components SET props = $1 WHERE id = $2`,
            [JSON.stringify(props), component.id]
          );
          
          updatedCount++;
          
          if (updatedCount % 100 === 0) {
            console.log(`   Updated ${updatedCount} images...`);
          }
        }
      } else {
        skippedCount++;
      }
    }

    console.log(`\n✅ Updated ${updatedCount} image URLs`);
    console.log(`⏭️  Skipped ${skippedCount} (already correct or invalid)`);

    // Also check USED_IMAGES.json and create a mapping file
    const usedImagesPath = path.join(__dirname, '../../extracted_pages/USED_IMAGES.json');
    if (fs.existsSync(usedImagesPath)) {
      const usedImages = JSON.parse(fs.readFileSync(usedImagesPath, 'utf-8'));
      
      const imageMapping = usedImages.usedImages.map((img: any) => {
        const match = img.url.match(/\/wp-content\/uploads\/(.+)$/);
        if (match) {
          return {
            originalUrl: img.url,
            minioUrl: `/api/media/wordpress-images/${match[1]}`,
            filename: img.filename,
            localPath: `extracted_pages/uploads/${match[1]}`
          };
        }
        return null;
      }).filter(Boolean);

      fs.writeFileSync(
        path.join(__dirname, '../../extracted_pages/IMAGE_URL_MAPPING.json'),
        JSON.stringify({ images: imageMapping, total: imageMapping.length }, null, 2)
      );

      console.log(`\n📝 Created IMAGE_URL_MAPPING.json with ${imageMapping.length} mappings`);
    }

  } catch (error: any) {
    console.error('\n❌ Fix failed:', error.message);
    console.error(error.stack);
  } finally {
    await dataSource.destroy();
  }
}

fixImageUrls();
