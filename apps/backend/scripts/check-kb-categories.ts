import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function bootstrap() {
    // Create a minimal DataSource just for this query
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
        console.log('🔍 Checking Knowledge Base Categories...\n');

        const categories = await dataSource.query(`
            SELECT id, name, description, "isActive", "sortOrder", "parentId"
            FROM knowledge_base_categories
            ORDER BY "sortOrder" ASC, name ASC
        `);

        console.log(`📊 Total KB Categories: ${categories.length}\n`);

        if (categories.length === 0) {
            console.log('❌ No Knowledge Base categories found in database!');
            console.log('💡 You need to create categories first.\n');

            // Check if table exists
            const tableExists = await dataSource.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'knowledge_base_categories'
                );
            `);

            if (tableExists[0].exists) {
                console.log('✅ Table exists but is empty.');
            } else {
                console.log('❌ Table does not exist!');
            }
        } else {
            console.log('✅ Found categories:\n');
            categories.forEach((cat: any, index: number) => {
                console.log(`${index + 1}. ${cat.name}`);
                console.log(`   - ID: ${cat.id}`);
                console.log(`   - Description: ${cat.description || 'N/A'}`);
                console.log(`   - Active: ${cat.isActive}`);
                console.log(`   - Sort Order: ${cat.sortOrder}`);
                console.log(`   - Parent ID: ${cat.parentId || 'None (Root)'}`);
                console.log('');
            });
        }

        await dataSource.destroy();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        await dataSource.destroy();
        process.exit(1);
    }
}

bootstrap();
