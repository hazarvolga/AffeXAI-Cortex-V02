
import { Client } from 'pg';

const client = new Client({
    host: 'localhost',
    port: 5434,
    user: 'postgres',
    password: 'postgres',
    database: 'affexai_dev',
});

async function listRoles() {
    try {
        await client.connect();
        console.log('✅ Connected to database');

        const res = await client.query('SELECT id, name, "displayName" FROM roles');

        console.log('📋 Existing Roles:');
        console.table(res.rows);

        await client.end();
    } catch (err) {
        console.error('❌ Database error:', err);
        process.exit(1);
    }
}

listRoles();
