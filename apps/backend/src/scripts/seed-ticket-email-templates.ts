#!/usr/bin/env ts-node

/**
 * Seed Ticket Email Templates
 *
 * Creates 9 ticket notification email templates in the database
 * using the Email Builder MJML structure.
 *
 * Usage:
 *   npm run seed:ticket-templates
 */

import { DataSource } from 'typeorm';
import { seedTicketEmailTemplates } from '../core/database/seeds/ticket-email-templates.seed';
import { EmailTemplate } from '../modules/email-marketing/entities/email-template.entity';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function runSeed() {
  console.log('🌱 Starting ticket email templates seed...\n');

  // Create database connection (parse from DATABASE_URL or use individual vars)
  const databaseUrl = process.env.DATABASE_URL;
  let connectionOptions: any;

  if (databaseUrl) {
    // Parse postgresql://user:pass@host:port/database
    const url = new URL(databaseUrl);
    connectionOptions = {
      type: 'postgres' as const,
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      username: url.username,
      password: url.password,
      database: url.pathname.slice(1), // Remove leading /
      entities: [EmailTemplate],
      synchronize: false,
    };
  } else {
    connectionOptions = {
      type: 'postgres' as const,
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USERNAME || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'affexai_dev',
      entities: [EmailTemplate],
      synchronize: false,
    };
  }

  const dataSource = new DataSource(connectionOptions);

  try {
    // Initialize connection
    await dataSource.initialize();
    console.log('✓ Database connection established\n');

    // Run seed
    await seedTicketEmailTemplates(dataSource);

    console.log('\n✅ Ticket email templates seeding completed successfully!');
    console.log('\n📋 Created templates:');
    console.log('   1. ticket-created-customer');
    console.log('   2. ticket-created-support');
    console.log('   3. ticket-assigned');
    console.log('   4. ticket-new-message');
    console.log('   5. ticket-resolved');
    console.log('   6. ticket-escalated');
    console.log('   7. sla-approaching-alert');
    console.log('   8. sla-breach-alert');
    console.log('   9. csat-survey');
    console.log('\n💡 Templates are now ready for use in the ticket system.');
    console.log('   They will be used automatically when tickets are created, updated, or resolved.');

  } catch (error) {
    console.error('\n❌ Error seeding ticket email templates:', error);
    process.exit(1);
  } finally {
    // Close connection
    await dataSource.destroy();
    console.log('\n✓ Database connection closed');
  }
}

// Run the seed
runSeed();
