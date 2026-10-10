import 'reflect-metadata';
import { seedCmsTemplates } from './seed-templates';

async function run() {
  const { default: AppDataSource } = await import('../../../core/database/data-source');
  const dataSource = AppDataSource;

  try {
    console.log('📊 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Database connected');

    await seedCmsTemplates(dataSource);

    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('👋 Database connection closed');
    }
  }
}

run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
