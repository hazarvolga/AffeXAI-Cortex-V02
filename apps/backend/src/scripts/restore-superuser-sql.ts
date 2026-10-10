import { Client } from 'pg';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

function requiredStrongPassword(name: string): string {
    const value = process.env[name];
    if (!value || value.length < 16) {
        throw new Error(`${name} must be set to a password of at least 16 characters`);
    }
    return value;
}

async function restore() {
    console.log('🔄 Starting Superuser Restoration (Schema-Aware Mode)...');

    const email = process.env.SUPERUSER_EMAIL || 'superuser@affexai.com';
    const password = requiredStrongPassword('SUPERUSER_PASSWORD');

    const client = new Client({
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432', 10),
        user: process.env.DATABASE_USERNAME || 'postgres',
        password: process.env.DATABASE_PASSWORD || 'postgres',
        database: process.env.DATABASE_NAME || 'affexai_dev',
    });

    try {
        await client.connect();
        console.log('✅ Connected to Database.');

        const hashedPassword = await bcrypt.hash(password, 10);

        // 1. Role
        let roleRes = await client.query(`SELECT id, name FROM roles WHERE name IN ($1, $2, $3)`, ['super_admin', 'superadmin', 'SUPER_ADMIN']);
        let roleId;

        if (roleRes.rows.length === 0) {
            console.log('✨ Creating Super Admin role...');
            const insertRoleSpan = await client.query(
                `INSERT INTO roles (name, description, is_system) VALUES ($1, $2, $3) RETURNING id`,
                ['super_admin', 'Full system access', true]
            );
            roleId = insertRoleSpan.rows[0].id;
        } else {
            roleId = roleRes.rows[0].id;
        }
        console.log(`✅ Role ID: ${roleId}`);

        // 2. User
        // Note: 'isActive' and 'emailVerified' columns are MISSING in DB schema, so we skip them.
        // We use 'roleId' (camelCase) and 'tenant_id' (snake_case).

        const userCheck = await client.query(`SELECT id FROM users WHERE email = $1`, [email]);
        let userId;

        if (userCheck.rows.length > 0) {
            const user = userCheck.rows[0];
            userId = user.id;
            console.log(`ℹ️ User found (ID: ${userId}). Updating...`);

            // Removed deleted_at, is_active checks as they might cause issues if columns correspond differently.
            // Just update password and deprecated roleId for completeness
            await client.query(
                `UPDATE users SET 
                    password = $1, 
                    "roleId" = $2,
                    "firstName" = 'Super',
                    "lastName" = 'User',
                    "tenant_id" = 'affexai'
                 WHERE id = $3`,
                [hashedPassword, roleId, userId]
            );
            console.log('✅ User updated.');
        } else {
            console.log('🆕 Creating new superuser...');
            // Insert with specific column names
            const insertUserRes = await client.query(
                `INSERT INTO users (email, password, "firstName", "lastName", "roleId", tenant_id)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                [email, hashedPassword, 'Super', 'User', roleId, 'affexai']
            );
            userId = insertUserRes.rows[0].id;
            console.log(`✅ User created (ID: ${userId}).`);
        }

        // 3. User Role mapping
        // user_roles uses "userId" and "roleId" (camelCase)
        try {
            const roleCheck = await client.query(
                `SELECT * FROM user_roles WHERE "userId" = $1 AND "roleId" = $2`,
                [userId, roleId]
            );

            if (roleCheck.rows.length === 0) {
                await client.query(
                    `INSERT INTO user_roles ("userId", "roleId", "isPrimary") VALUES ($1, $2, $3)`,
                    [userId, roleId, true]
                );
                console.log('✅ Role assigned in user_roles.');
            } else {
                console.log('ℹ️ Role assignment already exists.');
            }
        } catch (err) {
            console.error('⚠️ UserRole assignment failed:', err);
        }

        console.log('\n🎉 Superuser Restored Successfully!');
        console.log(`📧 Email:    ${email}`);
        console.log('🔑 Password was read from SUPERUSER_PASSWORD and was not logged.');

    } catch (error) {
        console.error('❌ SQL Restoration failed:', error);
    } finally {
        await client.end();
    }
}

restore();
