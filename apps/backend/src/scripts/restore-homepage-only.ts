import 'reflect-metadata';
import { DataSource } from 'typeorm';

async function restoreHomepage() {
  console.log('🏠 Restoring Homepage...\n');

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
    // Check if homepage exists
    const existing = await dataSource.query(
      'SELECT id FROM cms_pages WHERE slug = $1',
      ['home']
    );

    if (existing.length > 0) {
      console.log('⏭️  Homepage already exists');
      return;
    }

    // Create homepage
    const pageResult = await dataSource.query(
      `INSERT INTO cms_pages (title, slug, description, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id`,
      [
        'Ana Sayfa',
        'home',
        'Affexai ana sayfası - İnşaat ve AEC sektörü için yapay zeka destekli çözümler',
        'published'
      ]
    );

    const pageId = pageResult[0].id;
    console.log(`✅ Created homepage with ID: ${pageId}`);

    // Create basic components
    const components = [
      // Hero section
      {
        type: 'block',
        props: {
          blockId: 'hero-with-image-and-text-overlay',
          title: 'BIM ile Geleceği İnşa Edin',
          subtitle: 'Allplan ile Türkiye\'de yapı tasarımında yeni bir dönem',
          ctaText: 'Ürünlerimizi Keşfedin',
          ctaLink: '/products',
        },
        orderIndex: 0
      },
      // Solutions section
      {
        type: 'block',
        props: {
          blockId: 'content-section-with-title',
          title: 'Çözümlerimiz',
          subtitle: 'Her sektör için özelleştirilmiş BIM çözümleri',
          content: 'Mimarlık, mühendislik ve inşaat sektörlerinde uzmanlaşmış çözümlerimizle projelerinizi başarıya taşıyın.',
        },
        orderIndex: 1
      },
      // Products section
      {
        type: 'block',
        props: {
          blockId: 'hero-with-background-image',
          title: 'Ürünlerimizi Keşfedin',
          subtitle: 'Allplan ürün ailesi ile tüm ihtiyaçlarınızı karşılayın',
        },
        orderIndex: 2
      }
    ];

    for (const comp of components) {
      await dataSource.query(
        `INSERT INTO cms_components (page_id, type, props, order_index, parent_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [pageId, comp.type, JSON.stringify(comp.props), comp.orderIndex, null]
      );
    }

    console.log(`✅ Created ${components.length} components`);
    console.log('\n✅ Homepage restored successfully!');

  } catch (error: any) {
    console.error('\n❌ Restore failed:', error.message);
    console.error(error.stack);
  } finally {
    await dataSource.destroy();
  }
}

restoreHomepage();
