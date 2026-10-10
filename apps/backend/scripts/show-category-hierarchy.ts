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
        console.log('📊 Ticket Kategori Hiyerarşisi\n');
        console.log('='.repeat(70));

        // Parent Categories
        const parentCategories = await dataSource.query(`
            SELECT id, name, description, "isActive"
            FROM ticket_categories
            WHERE "parentId" IS NULL
            ORDER BY name ASC
        `);

        console.log('\n🔝 PARENT KATEGORİLER (' + parentCategories.length + ' adet):');
        console.log('-'.repeat(70));

        for (const parent of parentCategories) {
            console.log(`\n📁 ${parent.name}`);
            console.log(`   ID: ${parent.id}`);
            console.log(`   Açıklama: ${parent.description || 'Yok'}`);

            // Get children
            const children = await dataSource.query(`
                SELECT id, name, description
                FROM ticket_categories
                WHERE "parentId" = $1
                ORDER BY name ASC
            `, [parent.id]);

            if (children.length > 0) {
                console.log(`   Alt Kategoriler (${children.length}):`);
                children.forEach((child: any) => {
                    console.log(`      └─ ${child.name}`);
                });
            } else {
                console.log(`   Alt Kategoriler: Yok`);
            }
        }

        // Orphan categories (no parent but should have)
        const orphans = await dataSource.query(`
            SELECT id, name, "parentId"
            FROM ticket_categories
            WHERE "parentId" IS NOT NULL
            ORDER BY name ASC
        `);

        if (orphans.length > 0) {
            console.log('\n\n🔗 ALT KATEGORİLER (Toplam ' + orphans.length + ' adet)');
            console.log('-'.repeat(70));
        }

        await dataSource.destroy();
        process.exit(0);
    } catch (error) {
        console.error('❌ Hata:', error.message);
        await dataSource.destroy();
        process.exit(1);
    }
}

bootstrap();
