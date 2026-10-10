import AppDataSource from '../data-source';
import { seedReusableContent } from './reusable-content.seed';

async function run() {
  const dataSource = AppDataSource;

  try {
    console.log('📊 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Database connected');

    await seedReusableContent(dataSource);

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
