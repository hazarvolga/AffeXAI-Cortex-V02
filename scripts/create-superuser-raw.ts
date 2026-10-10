
import { Client } from 'pg';
import * as bcrypt from 'bcryptjs';

const client = new Client({
    host: 'localhost',
    port: 5434,
    user: 'postgres',
    password: 'postgres',
    database: 'affexai_dev',
});

async function createSuperuser() {
    try {
        await client.connect();
        console.log('✅ Connected to database');

        const email = 'superuser@affexai.com';
        const password = 'Superuser123!';
        const roleId = 'a1b2c3d4-e5f6-4789-abcd-000000000001'; // Admin Role ID from seed

        // Check if user exists
        const checkRes = await client.query('SELECT * FROM users WHERE email = $1', [email]);
        if (checkRes.rows.length > 0) {
            console.log('⚠️ User already exists. Updating password...');
            const hashedPassword = await bcrypt.hash(password, 10);
            await client.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);
            console.log(`✅ Password updated for ${email}`);
        } else {
            console.log('✨ Creating new superuser...');
            const hashedPassword = await bcrypt.hash(password, 10);

            await client.query(`
        INSERT INTO users (
          id, 
          email, 
          password, 
          "firstName", 
          "lastName", 
          "roleId", 
          "isActive", 
          "emailVerified", 
          "emailVerifiedAt",
          created_at, 
          updated_at
        ) VALUES (
          gen_random_uuid(),
          $1,
          $2,
          'Super',
          'User',
          $3,
          true,
          true,
          NOW(),
          NOW(),
          NOW()
        )
      `, [email, hashedPassword, roleId]);

            console.log(`✅ Created user: ${email}`);
        }

        console.log(`\n🔐 Login Credentials:`);
        console.log(`   Email:    ${email}`);
        console.log(`   Password: ${password}`);

        await client.end();
    } catch (err) {
        console.error('❌ Database error:', err);
        process.exit(1);
    }
}

createSuperuser();
