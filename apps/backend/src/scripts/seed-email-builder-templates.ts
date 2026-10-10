import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { seedEmailBuilderTemplates } from '../core/database/seeds/email-builder-template.seed';

async function bootstrap() {
  console.log('🌱 Seeding Email Builder templates...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    await seedEmailBuilderTemplates(dataSource);
    console.log('\n✅ Seeding completed successfully!');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
