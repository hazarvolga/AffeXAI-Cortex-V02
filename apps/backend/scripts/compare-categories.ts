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
        console.log('📊 Kategori Karşılaştırması\n');
        console.log('='.repeat(60));

        // Ticket Categories
        const ticketCategories = await dataSource.query(`
            SELECT id, name, description, "isActive"
            FROM ticket_categories
            ORDER BY name ASC
        `);

        console.log('\n🎫 TICKET KATEGORİLERİ (' + ticketCategories.length + ' adet):');
        console.log('-'.repeat(60));
        ticketCategories.forEach((cat: any, index: number) => {
            console.log(`${index + 1}. ${cat.name}`);
            console.log(`   Açıklama: ${cat.description || 'Yok'}`);
            console.log(`   Aktif: ${cat.isActive ? 'Evet' : 'Hayır'}`);
            console.log('');
        });

        // KB Categories
        const kbCategories = await dataSource.query(`
            SELECT id, name, description, "isActive"
            FROM knowledge_base_categories
            ORDER BY name ASC
        `);

        console.log('\n📚 KB KATEGORİLERİ (' + kbCategories.length + ' adet):');
        console.log('-'.repeat(60));
        kbCategories.forEach((cat: any, index: number) => {
            console.log(`${index + 1}. ${cat.name}`);
            console.log(`   Açıklama: ${cat.description || 'Yok'}`);
            console.log(`   Aktif: ${cat.isActive ? 'Evet' : 'Hayır'}`);
            console.log('');
        });

        console.log('\n💡 ÖNERİ:');
        console.log('-'.repeat(60));
        console.log('Fazla KB kategorilerini silmek için:');
        console.log('  npx tsx scripts/cleanup-kb-categories.ts');
        console.log('');
        console.log('Ticket kategorileriyle senkronize etmek için:');
        console.log('  npx tsx scripts/sync-kb-categories.ts');

        await dataSource.destroy();
        process.exit(0);
    } catch (error) {
        console.error('❌ Hata:', error.message);
        await dataSource.destroy();
        process.exit(1);
    }
}

bootstrap();
