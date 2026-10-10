import 'dotenv/config';
import 'reflect-metadata';
import { resetCmsTemplates } from './seed-templates';

async function run() {
    // Dynamically import AppDataSource and handle its default export
    const { default: AppDataSource } = await import('../../../core/database/data-source');
    const dataSource = AppDataSource;

    try {
        console.log('📊 Connecting to database...');
        await dataSource.initialize();
        console.log('✅ Database connected\n');

        await resetCmsTemplates(dataSource);

        console.log('\n✅ Reset completed successfully!');
    } catch (error) {
        console.error('❌ Error during reset:', error);
        throw error;
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
            console.log('👋 Database connection closed');
        }
    }
}

run().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
