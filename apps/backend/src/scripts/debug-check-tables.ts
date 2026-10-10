
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'affexai_dev',
});

async function checkTables() {
    await AppDataSource.initialize();
    const queryRunner = AppDataSource.createQueryRunner();
    const tables = await queryRunner.getTables(['products', 'prices', 'subscriptions', 'usage_records']);

    console.log('Existing tables:');
    tables.forEach(t => console.log(`- ${t.name}`));

    await AppDataSource.destroy();
}

checkTables().catch(console.error);
