import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddComplainedStatusToSubscriber1728908333930 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add 'complained' to subscriber_status enum
    // Check if enum exists first, if not skip this migration
    const enumExists = await queryRunner.query(`
      SELECT 1 FROM pg_type WHERE typname = 'subscribers_status_enum'
    `);
    
    if (enumExists.length > 0) {
      await queryRunner.query(`
        ALTER TYPE "subscribers_status_enum" ADD VALUE IF NOT EXISTS 'complained';
      `);
    } else {
      console.log('subscribers_status_enum does not exist, skipping migration');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL doesn't support removing enum values directly
    // Would require recreating the enum and column
    console.log('Cannot remove enum value in PostgreSQL - this migration is not reversible');
  }
}
