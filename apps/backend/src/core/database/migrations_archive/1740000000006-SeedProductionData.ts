import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Production Data Seeding Migration
 *
 * This migration seeds all critical production data in a single, idempotent operation.
 * It includes:
 * - Company settings (16 entries)
 * - System roles (10 entries)
 * - Default admin user
 *
 * IMPORTANT: This migration is designed to be:
 * - Idempotent: Can be run multiple times safely
 * - Production-safe: Uses ON CONFLICT DO NOTHING to prevent duplicates
 * - Rollback-capable: Includes down() method for cleanup
 * - Environment-aware: Uses environment variables where appropriate
 */
export class SeedProductionData1740000000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================
    // 1. SEED ROLES (10 roles - matches local database structure)
    // ============================================
    await queryRunner.query(`
      INSERT INTO roles (
        id,
        name,
        "displayName",
        description,
        permissions,
        "is_active",
        "isSystem",
        "created_at",
        "updated_at"
      ) VALUES
        (
          gen_random_uuid(),
          'admin',
          'Administrator',
          'Full system access',
          '["*"]',
          true,
          true,
          NOW(),
          NOW()
        ),
        (
          gen_random_uuid(),
          'editor',
          'Editor',
          'CMS, Events, Certificates management',
          '["cms.*", "events.*", "certificates.*"]',
          true,
          true,
          NOW(),
          NOW()
        ),
        (
          gen_random_uuid(),
          'customer',
          'Customer',
          'Customer portal access',
          '["profile.*", "events.view", "certificates.view"]',
          true,
          true,
          NOW(),
          NOW()
        ),
        (
          gen_random_uuid(),
          'support_team',
          'Support Team',
          'Support and ticket management',
          '["support.*", "tickets.*", "chat.*"]',
          true,
          true,
          NOW(),
          NOW()
        ),
        (
          gen_random_uuid(),
          'viewer',
          'Viewer',
          'Read-only access',
          '["*.view"]',
          true,
          true,
          NOW(),
          NOW()
        ),
        (
          gen_random_uuid(),
          'marketing_manager',
          'Marketing Manager',
          'Marketing campaigns and analytics',
          '["marketing.*", "campaigns.*", "analytics.view", "content.approve"]',
          true,
          false,
          NOW(),
          NOW()
        ),
        (
          gen_random_uuid(),
          'social_media_manager',
          'Social Media Manager',
          'Social media management',
          '["social.*", "posts.*", "engagement.*", "community.*"]',
          true,
          false,
          NOW(),
          NOW()
        ),
        (
          gen_random_uuid(),
          'content_creator',
          'Content Creator',
          'Content creation',
          '["content.create", "content.edit", "media.upload"]',
          true,
          false,
          NOW(),
          NOW()
        ),
        (
          gen_random_uuid(),
          'subscriber',
          'Subscriber',
          'Newsletter subscriber',
          '["newsletter.receive", "content.view", "events.view"]',
          true,
          false,
          NOW(),
          NOW()
        ),
        (
          gen_random_uuid(),
          'partner',
          'Partner',
          'Business partner',
          '["api.access", "partner.dashboard", "integration.*"]',
          true,
          false,
          NOW(),
          NOW()
        )
      ON CONFLICT (name) DO NOTHING;
    `);

    // ============================================
    // 2. SEED COMPANY SETTINGS (16 settings)
    // ============================================
    await queryRunner.query(`
      INSERT INTO settings (
        id,
        category,
        key,
        value,
        is_encrypted,
        created_at,
        updated_at
      ) VALUES
        -- Company Information
        (
          gen_random_uuid(),
          'company',
          'name',
          'Affexai Platform',
          false,
          NOW(),
          NOW()
        ),
        (
          gen_random_uuid(),
          'company',
          'tagline',
          'AI-Powered Customer Support & Marketing Platform',
          false,
          NOW(),
          NOW()
        ),
        (
          gen_random_uuid(),
          'company',
          'email',
          'info@affexai.com',
          false,
          NOW(),
          NOW()
        ),
        (
          gen_random_uuid(),
          'company',
          'supportEmail',
          'support@affexai.com',
          false,
          NOW(),
          NOW()
        ),
        (
          gen_random_uuid(),
          'company',
          'phone',
          '+90 (XXX) XXX XX XX',
          false,
          NOW(),
          NOW()
        ),
        (
          gen_random_uuid(),
          'company',
          'timezone',
          'Europe/Istanbul',
          false,
          NOW(),
          NOW()
        ),
        (
          gen_random_uuid(),
          'company',
          'language',
          'tr',
          false,
          NOW(),
          NOW()
        ),

        -- Email Settings
        (
          gen_random_uuid(),
          'email',
          'provider',
          'resend',
          false,
          NOW(),
          NOW()
        ),
        (
          gen_random_uuid(),
          'email',
          'from.email',
          'noreply@affexai.com',
          false,
          NOW(),
          NOW()
        ),
        (
          gen_random_uuid(),
          'email',
          'from.name',
          'Affexai Platform',
          false,
          NOW(),
          NOW()
        ),

        -- Analytics Settings
        (
          gen_random_uuid(),
          'analytics',
          'enabled',
          'true',
          false,
          NOW(),
          NOW()
        ),

        -- AI Settings (use environment variables in production)
        (
          gen_random_uuid(),
          'ai',
          'useSingleApiKey',
          'true',
          false,
          NOW(),
          NOW()
        ),
        (
          gen_random_uuid(),
          'ai',
          'global.provider',
          COALESCE(NULLIF(current_setting('app.ai_provider', true), ''), 'google'),
          false,
          NOW(),
          NOW()
        ),
        (
          gen_random_uuid(),
          'ai',
          'global.model',
          COALESCE(NULLIF(current_setting('app.ai_model', true), ''), 'gemini-2.5-flash'),
          false,
          NOW(),
          NOW()
        ),
        (
          gen_random_uuid(),
          'ai',
          'global.apiKey',
          COALESCE(NULLIF(current_setting('app.ai_api_key', true), ''), 'CHANGEME'),
          true,
          NOW(),
          NOW()
        ),
        (
          gen_random_uuid(),
          'ai',
          'global.enabled',
          'true',
          false,
          NOW(),
          NOW()
        )
      ON CONFLICT (category, key) DO NOTHING;
    `);

    // ============================================
    // 3. SEED ADMIN USER
    // ============================================
    // Note: Default password is "admin123" - MUST BE CHANGED in production
    await queryRunner.query(`
      INSERT INTO users (
        id,
        "created_at",
        "updated_at",
        email,
        password,
        "firstName",
        "lastName"
      ) VALUES (
        gen_random_uuid(),
        NOW(),
        NOW(),
        'admin@affexai.com',
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyE0ksJfPGDm',
        'Admin',
        'User'
      )
      ON CONFLICT (email) DO NOTHING;
    `);

    // ============================================
    // 4. ASSIGN ADMIN ROLE TO ADMIN USER
    // ============================================
    await queryRunner.query(`
      INSERT INTO user_roles (
        "user_id",
        "role_id"
      )
      SELECT
        u.id,
        r.id
      FROM users u, roles r
      WHERE u.email = 'admin@affexai.com'
        AND r.name = 'admin'
      ON CONFLICT ("user_id", "role_id") DO NOTHING;
    `);

    console.log('✅ Production data seeded successfully!');
    console.log('   - 10 roles created');
    console.log('   - 16 company settings created');
    console.log('   - 1 admin user created (admin@affexai.com / admin123)');
    console.log('');
    console.log('⚠️  IMPORTANT: Change admin password immediately in production!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove seeded data in reverse order
    console.log('⏮️  Rolling back production data seed...');

    // 1. Remove admin user role assignment
    await queryRunner.query(`
      DELETE FROM user_roles
      WHERE "user_id" IN (
        SELECT id FROM users WHERE email = 'admin@affexai.com'
      );
    `);

    // 2. Remove admin user
    await queryRunner.query(`
      DELETE FROM users WHERE email = 'admin@affexai.com';
    `);

    // 3. Remove settings
    await queryRunner.query(`
      DELETE FROM settings
      WHERE category IN ('company', 'email', 'analytics', 'ai');
    `);

    // 4. Remove roles
    await queryRunner.query(`
      DELETE FROM roles
      WHERE name IN (
        'admin', 'editor', 'customer', 'support_team', 'viewer',
        'marketing_manager', 'social_media_manager', 'content_creator',
        'subscriber', 'partner'
      );
    `);

    console.log('✅ Production data rollback completed!');
  }
}
