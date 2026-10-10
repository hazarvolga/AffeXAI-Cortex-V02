import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubscriberRole1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add Subscriber role
    await queryRunner.query(`
      INSERT INTO roles (id, name, "displayName", description, permissions, "isActive", "isSystem", "createdAt", "updatedAt")
      VALUES (
        gen_random_uuid(),
        'subscriber',
        'Subscriber',
        'Email abonesi - Newsletter ve pazarlama emaillerini alır',
        '["email.receive", "profile.manage", "preferences.manage"]'::jsonb,
        true,
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (name) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM roles WHERE name = 'subscriber';
    `);
  }
}