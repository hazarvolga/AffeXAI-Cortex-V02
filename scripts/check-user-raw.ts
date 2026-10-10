
import { Client } from 'pg';

const client = new Client({
    host: 'localhost',
    port: 5434,
    user: 'postgres',
    password: 'postgres',
    database: 'affexai_dev',
});

async function checkUser() {
    try {
        await client.connect();
        console.log('✅ Connected to database');

        const res = await client.query('SELECT id, email, "firstName", "lastName" FROM users WHERE email = $1', ['superuser@affexai.com']);

        if (res.rows.length > 0) {
            console.log('✅ User FOUND:', res.rows[0]);
        } else {
            console.log('❌ User superuser@affexai.com NOT FOUND');
        }

        await client.end();
    } catch (err) {
        console.error('❌ Database error:', err);
        process.exit(1);
    }
}

checkUser();
