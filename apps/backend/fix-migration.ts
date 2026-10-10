
import { AppDataSource } from './src/database/data-source';

async function fixMigration() {
    try {
        await AppDataSource.initialize();
        console.log('DataSource initialized.');

        const query = `INSERT INTO migrations (timestamp, name) VALUES (1728000000002, 'AddEmailTables1728000000002') ON CONFLICT DO NOTHING;`;
        await AppDataSource.query(query);
        console.log('Migration record inserted (or already existed).');

        await AppDataSource.destroy();
        console.log('DataSource destroyed.');
    } catch (error) {
        console.error('Error fixing migration:', error);
        process.exit(1);
    }
}

fixMigration();
