import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { seedThemeSettings } from './theme-settings.seed';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5434'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'affexai_dev',
  entities: [__dirname + '/../../../modules/**/*.entity{.ts,.js}'],
  synchronize: false,
});

async function runSeed() {
  try {
    await dataSource.initialize();
    console.log('📦 Database connection initialized');

    await seedThemeSettings(dataSource);

    console.log('✅ Theme settings seed completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running theme settings seed:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

runSeed();
