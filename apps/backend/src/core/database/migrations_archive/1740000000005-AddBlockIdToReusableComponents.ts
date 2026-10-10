import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBlockIdToReusableComponents1740000000005 implements MigrationInterface {
  name = 'AddBlockIdToReusableComponents1762200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add blockId column to reusable_components table
    await queryRunner.query(`
      ALTER TABLE "reusable_components"
      ADD COLUMN "block_id" VARCHAR(100)
    `);

    // Create index for blockId to improve query performance
    await queryRunner.query(`
      CREATE INDEX "IDX_reusable_components_block_id"
      ON "reusable_components" ("block_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index first
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_reusable_components_block_id"
    `);

    // Drop blockId column
    await queryRunner.query(`
      ALTER TABLE "reusable_components"
      DROP COLUMN IF EXISTS "block_id"
    `);
  }
}
