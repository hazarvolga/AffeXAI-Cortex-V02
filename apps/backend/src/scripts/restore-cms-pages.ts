import 'reflect-metadata';
import { DataSource } from 'typeorm';

async function restorePages() {
  console.log('🔄 Restoring CMS pages from seed...\n');

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
    // Import and run seed
    const { seedMigratedPublicPages } = await import('../core/database/seeds/migrate-public-pages.seed');
    await seedMigratedPublicPages(dataSource);
    
    console.log('\n✅ Pages restored successfully!');
  } catch (error: any) {
    console.error('\n❌ Restore failed:', error.message);
    console.error(error.stack);
  } finally {
    await dataSource.destroy();
  }
}

restorePages();
