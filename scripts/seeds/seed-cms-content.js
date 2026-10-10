const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5434,
  database: 'affexai_dev',
  user: 'postgres',
  password: 'postgres',
});

// CMS Pages - Homepage, Products, Contact
const pages = [
  {
    title: 'Home',
    slug: 'home',
    description: 'Affexai Platform - Enterprise Customer Portal & AI-Powered Support',
    status: 'published',
    layoutOptions: {
      template: 'homepage',
      showHeader: true,
      showFooter: true
    }
  },
  {
    title: 'Products',
    slug: 'products',
    description: 'Explore our comprehensive product suite for enterprise customers',
    status: 'published',
    layoutOptions: {
      template: 'standard',
      showHeader: true,
      showFooter: true
    }
  },
  {
    title: 'Solutions',
    slug: 'solutions',
    description: 'Industry-specific solutions tailored to your needs',
    status: 'published',
    layoutOptions: {
      template: 'standard',
      showHeader: true,
      showFooter: true
    }
  },
  {
    title: 'Support',
    slug: 'support',
    description: 'Get help with our comprehensive support resources',
    status: 'published',
    layoutOptions: {
      template: 'standard',
      showHeader: true,
      showFooter: true
    }
  },
  {
    title: 'Contact Us',
    slug: 'contact',
    description: 'Get in touch with our team',
    status: 'published',
    layoutOptions: {
      template: 'contact',
      showHeader: true,
      showFooter: true
    }
  },
  {
    title: 'About',
    slug: 'about',
    description: 'Learn more about Affexai and our mission',
    status: 'published',
    layoutOptions: {
      template: 'standard',
      showHeader: true,
      showFooter: true
    }
  }
];

// Navigation Menus
const menus = [
  {
    name: 'Main Navigation',
    slug: 'main-nav',
    description: 'Primary navigation menu',
    location: 'header',
    isActive: true
  },
  {
    name: 'Footer Links',
    slug: 'footer-links',
    description: 'Footer navigation menu',
    location: 'footer',
    isActive: true
  }
];

// Menu Items for Main Navigation
const mainNavItems = [
  { label: 'Home', url: '/', order: 1, menuSlug: 'main-nav', pageSlug: 'home' },
  { label: 'Products', url: '/products', order: 2, menuSlug: 'main-nav', pageSlug: 'products' },
  { label: 'Solutions', url: '/solutions', order: 3, menuSlug: 'main-nav', pageSlug: 'solutions' },
  { label: 'Support', url: '/support', order: 4, menuSlug: 'main-nav', pageSlug: 'support' },
  { label: 'Contact', url: '/contact', order: 5, menuSlug: 'main-nav', pageSlug: 'contact' }
];

// Menu Items for Footer
const footerNavItems = [
  { label: 'About Us', url: '/about', order: 1, menuSlug: 'footer-links', pageSlug: 'about' },
  { label: 'Knowledge Base', url: '/portal/kb', order: 2, menuSlug: 'footer-links', pageSlug: null },
  { label: 'Support Center', url: '/portal/support', order: 3, menuSlug: 'footer-links', pageSlug: null },
  { label: 'Privacy Policy', url: '/privacy', order: 4, menuSlug: 'footer-links', pageSlug: null },
  { label: 'Terms of Service', url: '/terms', order: 5, menuSlug: 'footer-links', pageSlug: null }
];

async function seedCMSContent() {
  try {
    console.log('🌱 Starting CMS content seed...\n');

    await client.connect();
    console.log('✅ Connected to database\n');

    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Get admin user ID
    const adminResult = await client.query(`
      SELECT id FROM users WHERE email = 'admin@affexai.com' LIMIT 1
    `);

    if (adminResult.rows.length === 0) {
      throw new Error('Admin user not found');
    }

    const adminId = adminResult.rows[0].id;
    console.log(`📌 Using admin user: ${adminId}\n`);

    // Seed Pages
    console.log('📄 Seeding CMS pages...\n');
    const pageIds = {};

    for (const page of pages) {
      const escapedTitle = page.title.replace(/'/g, "''");
      const escapedDescription = page.description.replace(/'/g, "''");
      const layoutOptionsJson = JSON.stringify(page.layoutOptions).replace(/'/g, "''");

      const result = await client.query(`
        INSERT INTO cms_pages (
          id, title, slug, description, status,
          created_at, updated_at, published_at,
          created_by, updated_by, layout_options, category_id
        ) VALUES (
          uuid_generate_v4(),
          '${escapedTitle}',
          '${page.slug}',
          '${escapedDescription}',
          '${page.status}',
          NOW(),
          NOW(),
          ${page.status === 'published' ? 'NOW()' : 'NULL'},
          '${adminId}',
          '${adminId}',
          '${layoutOptionsJson}',
          NULL
        )
        RETURNING id
      `);

      pageIds[page.slug] = result.rows[0].id;
      console.log(`✅ Created page: ${page.title} (/${page.slug})`);
    }

    // Seed Menus
    console.log('\n🗂️  Seeding navigation menus...\n');
    const menuIds = {};

    for (const menu of menus) {
      const escapedName = menu.name.replace(/'/g, "''");
      const escapedDescription = menu.description.replace(/'/g, "''");

      const result = await client.query(`
        INSERT INTO cms_menus (
          id, name, slug, location,
          is_active, created_at, updated_at
        ) VALUES (
          uuid_generate_v4(),
          '${escapedName}',
          '${menu.slug}',
          '${menu.location}',
          ${menu.isActive},
          NOW(),
          NOW()
        )
        RETURNING id
      `);

      menuIds[menu.slug] = result.rows[0].id;
      console.log(`✅ Created menu: ${menu.name}`);
    }

    // Seed Menu Items
    console.log('\n📋 Seeding menu items...\n');

    const allMenuItems = [...mainNavItems, ...footerNavItems];

    for (const item of allMenuItems) {
      const menuId = menuIds[item.menuSlug];
      const pageId = item.pageSlug ? pageIds[item.pageSlug] : null;
      const escapedLabel = item.label.replace(/'/g, "''");

      await client.query(`
        INSERT INTO cms_menu_items (
          id, label, url, order_index, menu_id, page_id,
          parent_id, is_active, type, target,
          created_at, updated_at
        ) VALUES (
          uuid_generate_v4(),
          '${escapedLabel}',
          '${item.url}',
          ${item.order},
          '${menuId}',
          ${pageId ? `'${pageId}'` : 'NULL'},
          NULL,
          true,
          'page',
          '_self',
          NOW(),
          NOW()
        )
      `);

      console.log(`✅ Added menu item: ${item.label} → ${item.url}`);
    }

    console.log('\n🎉 CMS content seeded successfully!\n');

    // Verification
    const pagesResult = await client.query(`
      SELECT id, title, slug, status FROM cms_pages ORDER BY created_at
    `);

    console.log('📊 Pages in database:');
    console.table(pagesResult.rows);

    const menusResult = await client.query(`
      SELECT m.name, m.location, COUNT(mi.id) as item_count
      FROM cms_menus m
      LEFT JOIN cms_menu_items mi ON m.id = mi.menu_id
      GROUP BY m.id, m.name, m.location
      ORDER BY m.name
    `);

    console.log('\n📊 Menus with item counts:');
    console.table(menusResult.rows);

    await client.end();
    console.log('\n✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error seeding CMS content:', error);
    process.exit(1);
  }
}

seedCMSContent();
