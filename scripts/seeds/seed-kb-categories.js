const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5434,
  database: 'affexai_dev',
  user: 'postgres',
  password: 'postgres',
});

const kbCategories = [
  {
    name: 'Getting Started',
    description: 'Essential guides for new users',
    slug: 'getting-started',
    color: 'green',
    icon: 'rocket',
    sortOrder: 1
  },
  {
    name: 'Installation & Setup',
    description: 'How to install and configure the software',
    slug: 'installation-setup',
    color: 'blue',
    icon: 'download',
    sortOrder: 2
  },
  {
    name: 'Features & Functions',
    description: 'Detailed guides on software features',
    slug: 'features-functions',
    color: 'purple',
    icon: 'star',
    sortOrder: 3
  },
  {
    name: 'Troubleshooting',
    description: 'Common issues and solutions',
    slug: 'troubleshooting',
    color: 'orange',
    icon: 'alert-circle',
    sortOrder: 4
  },
  {
    name: 'Best Practices',
    description: 'Tips and recommendations for optimal use',
    slug: 'best-practices',
    color: 'indigo',
    icon: 'lightbulb',
    sortOrder: 5
  },
  {
    name: 'Billing & Licensing',
    description: 'Information about licenses and payments',
    slug: 'billing-licensing',
    color: 'yellow',
    icon: 'credit-card',
    sortOrder: 6
  },
  {
    name: 'Updates & Releases',
    description: 'What\'s new in each version',
    slug: 'updates-releases',
    color: 'teal',
    icon: 'package',
    sortOrder: 7
  },
  {
    name: 'FAQ',
    description: 'Frequently asked questions',
    slug: 'faq',
    color: 'red',
    icon: 'help-circle',
    sortOrder: 8
  }
];

async function seedKBCategories() {
  try {
    console.log('🌱 Starting knowledge base categories seed...\n');

    await client.connect();
    console.log('✅ Connected to database\n');

    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Get admin user ID for createdBy/updatedBy
    const adminResult = await client.query(`
      SELECT id FROM users WHERE email = 'admin@affexai.com' LIMIT 1
    `);

    if (adminResult.rows.length === 0) {
      throw new Error('Admin user not found. Please run user seed first.');
    }

    const adminId = adminResult.rows[0].id;
    console.log(`📌 Using admin user: ${adminId}\n`);

    console.log('📚 Seeding KB categories...\n');

    for (const category of kbCategories) {
      const escapedDescription = category.description.replace(/'/g, "''");

      await client.query(`
        INSERT INTO knowledge_base_categories (
          id, name, description, slug, color, icon, "sortOrder",
          "isActive", "parentId", "articleCount",
          "createdBy", "updatedBy", "createdAt", "updatedAt"
        ) VALUES (
          uuid_generate_v4(),
          '${category.name}',
          '${escapedDescription}',
          '${category.slug}',
          '${category.color}',
          '${category.icon}',
          ${category.sortOrder},
          true,
          NULL,
          0,
          '${adminId}',
          '${adminId}',
          NOW(),
          NOW()
        )
      `);

      console.log(`✅ Created category: ${category.name} (${category.slug})`);
    }

    console.log('\n🎉 KB categories seeded successfully!\n');

    // Verification
    const result = await client.query(`
      SELECT id, name, slug, color, icon, "sortOrder", "articleCount"
      FROM knowledge_base_categories
      ORDER BY "sortOrder"
    `);

    console.log('📊 Categories in database:');
    console.table(result.rows);

    await client.end();
    console.log('\n✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error seeding KB categories:', error);
    process.exit(1);
  }
}

seedKBCategories();
