import { DataSource } from 'typeorm';
import { Page } from '../src/modules/cms/entities/page.entity';

async function addSpecialBlocks() {
  // Database connection
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5434'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'affexai_dev',
    entities: [Page],
    synchronize: false,
  });

  await dataSource.initialize();
  console.log('✅ Database connected');

  const pageRepository = dataSource.getRepository(Page);

  // 1. Products sayfasını bul veya oluştur
  let productsPage = await pageRepository.findOne({ where: { slug: 'products' } });

  if (!productsPage) {
    console.log('📄 Creating products page...');
    productsPage = pageRepository.create({
      title: 'Ürünler',
      slug: 'products',
      metaTitle: 'Ürünler - Affexai',
      metaDescription: 'Affexai ürünleri',
      status: 'published',
      components: [],
      layoutOptions: {
        showHeader: true,
        showFooter: true,
        isFullWidth: false,
      },
    });
    await pageRepository.save(productsPage);
    console.log('✅ Products page created');
  } else {
    console.log('✅ Products page found');
  }

  // 2. Downloads sayfasını bul veya oluştur
  let downloadsPage = await pageRepository.findOne({ where: { slug: 'downloads' } });

  if (!downloadsPage) {
    console.log('📄 Creating downloads page...');
    downloadsPage = pageRepository.create({
      title: 'İndirme Merkezi',
      slug: 'downloads',
      metaTitle: 'İndirme Merkezi - Affexai',
      metaDescription: 'Dokümanlar, yazılımlar ve kaynaklar',
      status: 'published',
      components: [],
      layoutOptions: {
        showHeader: true,
        showFooter: true,
        isFullWidth: false,
      },
    });
    await pageRepository.save(downloadsPage);
    console.log('✅ Downloads page created');
  } else {
    console.log('✅ Downloads page found');
  }

  // 3. Products sayfasına special-product-grid ekle
  const productGridBlock = {
    id: 'product-grid-' + Date.now(),
    type: 'special-product-grid',
    props: {
      title: 'Ürünlerimiz',
      description: 'Size en uygun ürünü keşfedin',
    },
    children: [],
  };

  const existingProductsComponents = Array.isArray(productsPage.components)
    ? productsPage.components
    : [];

  // Eğer zaten yoksa ekle
  const hasProductGrid = existingProductsComponents.some(
    (c: any) => c.type === 'special-product-grid'
  );

  if (!hasProductGrid) {
    productsPage.components = [...existingProductsComponents, productGridBlock];
    await pageRepository.save(productsPage);
    console.log('✅ special-product-grid added to products page');
  } else {
    console.log('ℹ️  special-product-grid already exists in products page');
  }

  // 4. Downloads sayfasına special-resource-tabs ekle
  const resourceTabsBlock = {
    id: 'resource-tabs-' + Date.now(),
    type: 'special-resource-tabs',
    props: {
      title: 'Kaynaklar',
      description: 'İhtiyacınız olan tüm kaynaklar',
    },
    children: [],
  };

  const existingDownloadsComponents = Array.isArray(downloadsPage.components)
    ? downloadsPage.components
    : [];

  // Eğer zaten yoksa ekle
  const hasResourceTabs = existingDownloadsComponents.some(
    (c: any) => c.type === 'special-resource-tabs'
  );

  if (!hasResourceTabs) {
    downloadsPage.components = [...existingDownloadsComponents, resourceTabsBlock];
    await pageRepository.save(downloadsPage);
    console.log('✅ special-resource-tabs added to downloads page');
  } else {
    console.log('ℹ️  special-resource-tabs already exists in downloads page');
  }

  console.log('\n🎉 All special blocks added successfully!');
  console.log('\n📋 Summary:');
  console.log(`  - Products page: ${productsPage.components.length} components`);
  console.log(`  - Downloads page: ${downloadsPage.components.length} components`);

  await dataSource.destroy();
}

addSpecialBlocks()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
