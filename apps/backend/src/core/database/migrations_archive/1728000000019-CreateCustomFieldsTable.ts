import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCustomFieldsTable1728000000019 implements MigrationInterface {
  name = 'CreateCustomFieldsTable1760621189176';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create custom_fields table
    await queryRunner.query(`
      CREATE TABLE custom_fields (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) UNIQUE NOT NULL,
        label VARCHAR(255) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('TEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT', 'MULTI_SELECT')),
        description TEXT,
        required BOOLEAN DEFAULT FALSE,
        options JSON,
        default_value VARCHAR(500),
        placeholder VARCHAR(255),
        validation JSON,
        active BOOLEAN DEFAULT TRUE,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX IDX_custom_fields_name ON custom_fields (name)`);
    await queryRunner.query(`CREATE INDEX IDX_custom_fields_active ON custom_fields (active)`);
    await queryRunner.query(`CREATE INDEX IDX_custom_fields_sort_order ON custom_fields (sort_order)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_custom_fields_name`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_custom_fields_active`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_custom_fields_sort_order`);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS custom_fields`);
  }
}