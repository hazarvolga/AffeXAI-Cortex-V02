import axios from 'axios';

const API_URL = 'http://localhost:9006/api';

async function addSpecialBlocks() {
  try {
    console.log('🚀 Starting to add special blocks via API...\n');

    // 1. Products sayfasını kontrol et
    console.log('📄 Checking products page...');
    let productsPage;
    try {
      const response = await axios.get(`${API_URL}/cms/pages/slug/products`);
      productsPage = response.data.data;
      console.log(`✅ Products page found (ID: ${productsPage.id})`);
      console.log(`   Current components: ${productsPage.components?.length || 0}`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('❌ Products page not found, creating...');
        const createResponse = await axios.post(`${API_URL}/cms/pages`, {
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
        productsPage = createResponse.data.data;
        console.log('✅ Products page created');
      } else {
        throw error;
      }
    }

    // 2. Downloads sayfasını kontrol et
    console.log('\n📄 Checking downloads page...');
    let downloadsPage;
    try {
      const response = await axios.get(`${API_URL}/cms/pages/slug/downloads`);
      downloadsPage = response.data.data;
      console.log(`✅ Downloads page found (ID: ${downloadsPage.id})`);
      console.log(`   Current components: ${downloadsPage.components?.length || 0}`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('❌ Downloads page not found, creating...');
        const createResponse = await axios.post(`${API_URL}/cms/pages`, {
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
        downloadsPage = createResponse.data.data;
        console.log('✅ Downloads page created');
      } else {
        throw error;
      }
    }

    // 3. Products sayfasına special-product-grid ekle
    console.log('\n🎨 Adding special-product-grid to products page...');
    const existingProductsComponents = Array.isArray(productsPage.components)
      ? productsPage.components
      : [];

    const hasProductGrid = existingProductsComponents.some(
      (c: any) => c.type === 'special-product-grid'
    );

    if (!hasProductGrid) {
      const productGridBlock = {
        id: 'product-grid-' + Date.now(),
        type: 'special-product-grid',
        props: {
          title: 'Ürünlerimiz',
          description: 'Size en uygun ürünü keşfedin',
        },
        children: [],
      };

      const updatedProductsComponents = [...existingProductsComponents, productGridBlock];

      await axios.patch(`${API_URL}/cms/pages/${productsPage.id}`, {
        components: updatedProductsComponents,
      });

      console.log('✅ special-product-grid added to products page');
    } else {
      console.log('ℹ️  special-product-grid already exists in products page');
    }

    // 4. Downloads sayfasına special-resource-tabs ekle
    console.log('\n🎨 Adding special-resource-tabs to downloads page...');
    const existingDownloadsComponents = Array.isArray(downloadsPage.components)
      ? downloadsPage.components
      : [];

    const hasResourceTabs = existingDownloadsComponents.some(
      (c: any) => c.type === 'special-resource-tabs'
    );

    if (!hasResourceTabs) {
      const resourceTabsBlock = {
        id: 'resource-tabs-' + Date.now(),
        type: 'special-resource-tabs',
        props: {
          title: 'Kaynaklar',
          description: 'İhtiyacınız olan tüm kaynaklar',
        },
        children: [],
      };

      const updatedDownloadsComponents = [...existingDownloadsComponents, resourceTabsBlock];

      await axios.patch(`${API_URL}/cms/pages/${downloadsPage.id}`, {
        components: updatedDownloadsComponents,
      });

      console.log('✅ special-resource-tabs added to downloads page');
    } else {
      console.log('ℹ️  special-resource-tabs already exists in downloads page');
    }

    // 5. Sonuçları kontrol et
    console.log('\n📊 Verifying results...');
    const finalProductsPage = await axios.get(`${API_URL}/cms/pages/slug/products`);
    const finalDownloadsPage = await axios.get(`${API_URL}/cms/pages/slug/downloads`);

    console.log('\n🎉 All special blocks added successfully!');
    console.log('\n📋 Summary:');
    console.log(`  ✅ Products page: ${finalProductsPage.data.data.components?.length || 0} components`);
    console.log(`     - Has special-product-grid: ${finalProductsPage.data.data.components?.some((c: any) => c.type === 'special-product-grid') ? 'YES' : 'NO'}`);
    console.log(`  ✅ Downloads page: ${finalDownloadsPage.data.data.components?.length || 0} components`);
    console.log(`     - Has special-resource-tabs: ${finalDownloadsPage.data.data.components?.some((c: any) => c.type === 'special-resource-tabs') ? 'YES' : 'NO'}`);
    console.log('\n🌐 View pages:');
    console.log(`  - Products: http://localhost:9003/products`);
    console.log(`  - Downloads: http://localhost:9003/downloads`);

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

addSpecialBlocks()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed');
    process.exit(1);
  });
