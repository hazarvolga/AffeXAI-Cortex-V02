import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomFieldsToSubscribers1740000000004 implements MigrationInterface {
  name = 'AddCustomFieldsToSubscribers1760621189175';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add custom_fields column to subscribers table
    await queryRunner.query(`
      ALTER TABLE subscribers 
      ADD COLUMN custom_fields JSON NULL 
      COMMENT 'Dynamic custom fields data'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop custom_fields column from subscribers table
    await queryRunner.query(`ALTER TABLE subscribers DROP COLUMN custom_fields`);
  }
}