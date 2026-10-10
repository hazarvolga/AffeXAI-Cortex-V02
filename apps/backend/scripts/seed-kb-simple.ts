import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config();

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

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

        // Get admin user ID
        const users = await dataSource.query(`SELECT id FROM users LIMIT 1`);
        if (users.length === 0) {
            console.error('❌ No users found in database!');
            process.exit(1);
        }
        const userId = users[0].id;

        const categories = [
            { name: 'Genel', description: 'Genel bilgiler ve SSS', icon: 'info', color: 'blue', sortOrder: 1 },
            { name: 'Teknik Destek', description: 'Teknik sorunlar ve çözümler', icon: 'settings', color: 'red', sortOrder: 2 },
            { name: 'Allplan Kurulum', description: 'Kurulum ve yapılandırma rehberleri', icon: 'download', color: 'green', sortOrder: 3 },
            { name: 'Lisanslama', description: 'Lisans yönetimi ve aktivasyon', icon: 'key', color: 'yellow', sortOrder: 4 },
            { name: 'BIM ve Veri Değişimi', description: 'IFC, dışa aktarma ve BIM iş akışları', icon: 'share-2', color: 'purple', sortOrder: 5 },
        ];

        console.log('🌱 Seeding KB Categories...\n');

        for (const cat of categories) {
            const slug = slugify(cat.name);
            const id = randomUUID();
            const now = new Date();

            // Check if exists
            const existing = await dataSource.query(
                `SELECT id FROM knowledge_base_categories WHERE slug = $1`,
                [slug]
            );

            if (existing.length > 0) {
                console.log(`⏭️  Skipping "${cat.name}" (already exists)`);
                continue;
            }

            await dataSource.query(
                `INSERT INTO knowledge_base_categories 
                (id, name, description, slug, icon, color, "sortOrder", "isActive", "articleCount", "createdBy", "updatedBy", "createdAt", "updatedAt")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                [id, cat.name, cat.description, slug, cat.icon, cat.color, cat.sortOrder, true, 0, userId, userId, now, now]
            );

            console.log(`✅ Created: ${cat.name}`);
        }

        console.log('\n🎉 Done! KB Categories seeded successfully.');

        await dataSource.destroy();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        await dataSource.destroy();
        process.exit(1);
    }
}

bootstrap();
