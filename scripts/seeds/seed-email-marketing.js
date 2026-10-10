const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5434,
  database: 'affexai_dev',
  user: 'postgres',
  password: 'postgres',
});

// Sample Segments
const segments = [
  {
    name: 'Active Customers',
    description: 'Customers who have logged in within the last 30 days',
    criteria: JSON.stringify({ lastLoginDays: { lte: 30 } })
  },
  {
    name: 'New Users',
    description: 'Users registered within the last 7 days',
    criteria: JSON.stringify({ registeredDays: { lte: 7 } })
  },
  {
    name: 'High Engagement',
    description: 'Users with >75% email open rate',
    criteria: JSON.stringify({ openRate: { gte: 75 } })
  },
  {
    name: 'Support Users',
    description: 'Users who created a support ticket in the last 30 days',
    criteria: JSON.stringify({ hasRecentTicket: true })
  }
];

// Sample Groups
const groups = [
  {
    name: 'Product Updates',
    description: 'Subscribers interested in product news and updates'
  },
  {
    name: 'Training & Education',
    description: 'Subscribers interested in tutorials and training materials'
  },
  {
    name: 'Promotional Offers',
    description: 'Subscribers who want to receive special offers and discounts'
  },
  {
    name: 'Newsletter',
    description: 'General newsletter subscribers'
  }
];

async function seedEmailMarketing() {
  try {
    console.log('🌱 Starting email marketing seed...\n');

    await client.connect();
    console.log('✅ Connected to database\n');

    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Seed Segments
    console.log('📊 Seeding segments...\n');

    for (const segment of segments) {
      const escapedName = segment.name.replace(/'/g, "''");
      const escapedDescription = segment.description.replace(/'/g, "''");
      const escapedCriteria = segment.criteria.replace(/'/g, "''");

      await client.query(`
        INSERT INTO segments (
          id, name, description, "subscriberCount", criteria,
          "openRate", "clickRate", "createdAt", "updatedAt", "deletedAt"
        ) VALUES (
          uuid_generate_v4(),
          '${escapedName}',
          '${escapedDescription}',
          0,
          '${escapedCriteria}',
          0,
          0,
          NOW(),
          NOW(),
          NULL
        )
      `);

      console.log(`✅ Created segment: ${segment.name}`);
    }

    // Seed Groups
    console.log('\n👥 Seeding groups...\n');

    for (const group of groups) {
      const escapedName = group.name.replace(/'/g, "''");
      const escapedDescription = group.description.replace(/'/g, "''");

      await client.query(`
        INSERT INTO groups (
          id, name, description, "subscriberCount",
          "createdAt", "updatedAt", "deletedAt"
        ) VALUES (
          uuid_generate_v4(),
          '${escapedName}',
          '${escapedDescription}',
          0,
          NOW(),
          NOW(),
          NULL
        )
      `);

      console.log(`✅ Created group: ${group.name}`);
    }

    console.log('\n🎉 Email marketing data seeded successfully!\n');

    // Verification
    const segmentsResult = await client.query('SELECT id, name, description FROM segments');
    console.log('📊 Segments in database:');
    console.table(segmentsResult.rows);

    const groupsResult = await client.query('SELECT id, name, description FROM groups');
    console.log('\n📊 Groups in database:');
    console.table(groupsResult.rows);

    await client.end();
    console.log('\n✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error seeding email marketing:', error);
    process.exit(1);
  }
}

seedEmailMarketing();
