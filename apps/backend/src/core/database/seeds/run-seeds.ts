import AppDataSource from '../data-source';
import { seedCriticalSettings } from './01-critical-settings.seed';
import { seedCoreEmailTemplates } from './core-email-templates.seed';
import { seedDefaultOrganization } from './02-seed-default-organization';

async function runSeeds() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Initialize data source
    console.log('📦 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connected!\n');

    await seedCriticalSettings(AppDataSource);
    await seedDefaultOrganization(AppDataSource); // Run before other seeds that might need org context
    await seedCoreEmailTemplates(AppDataSource);

    // Add more seeds here as we create them:
    // await seedCertificateTemplates(AppDataSource);
    // await seedEmailTemplates(AppDataSource);
    // await seedTicketSetup(AppDataSource);

    await AppDataSource.destroy();
    console.log('\n🎉 All seeds completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

runSeeds();
