import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5434'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'affexai_dev',
    });

    try {
        await dataSource.initialize();
        console.log('✅ Connected to database\n');

        // Check if columns exist
        const iconExists = await dataSource.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='ticket_categories' AND column_name='icon'
        `);

        const colorExists = await dataSource.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='ticket_categories' AND column_name='color'
        `);

        if (iconExists.length === 0) {
            console.log('📝 Adding icon column...');
            await dataSource.query(`
                ALTER TABLE ticket_categories 
                ADD COLUMN icon VARCHAR(50) DEFAULT 'folder'
            `);
            console.log('✅ Icon column added');
        } else {
            console.log('⏭️  Icon column already exists');
        }

        if (colorExists.length === 0) {
            console.log('📝 Adding color column...');
            await dataSource.query(`
                ALTER TABLE ticket_categories 
                ADD COLUMN color VARCHAR(50) DEFAULT 'gray'
            `);
            console.log('✅ Color column added');
        } else {
            console.log('⏭️  Color column already exists');
        }

        console.log('\n🎉 Migration complete!');

        await dataSource.destroy();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        await dataSource.destroy();
        process.exit(1);
    }
}

bootstrap();
