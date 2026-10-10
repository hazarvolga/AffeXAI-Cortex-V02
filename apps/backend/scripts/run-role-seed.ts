import { AppDataSource } from '../src/database/data-source';
import TemplateRolesSeeder from '../src/database/seeds/1723456789001-TemplateRoles';

async function runSeed() {
    try {
        console.log('🚀 Initializing Data Source...');
        await AppDataSource.initialize();
        console.log('✅ Data Source initialized.');

        console.log('🌱 Starting Role Template Seeding...');
        const seeder = new TemplateRolesSeeder();
        await seeder.run(AppDataSource, null as any);
        console.log('✅ Role Template Seeding finished.');

        await AppDataSource.destroy();
        console.log('👋 Data Source destroyed. Exit.');
    } catch (error) {
        console.error('❌ Error during seeding:', error);
        process.exit(1);
    }
}

runSeed();
