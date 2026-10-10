import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { MigrationHelpers } from '../utils/migration-helpers';

/**
 * Migration: Add displayNumber field to tickets table
 *
 * Purpose: Implement human-readable ticket numbering (SUP-00001)
 * instead of showing full UUID in UI
 *
 * Changes:
 * - Add display_number VARCHAR(20) UNIQUE
 * - Create PostgreSQL sequence for auto-increment
 * - Add index for fast lookup
 * - Backfill existing tickets with sequential numbers
 */
export class AddTicketDisplayNumber1730141000000 implements MigrationInterface {
  name = 'AddTicketDisplayNumber1730141000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add display_number column
    await MigrationHelpers.addColumnIfNotExists(queryRunner, 
      'tickets',
      new TableColumn({
        name: 'display_number',
        type: 'varchar',
        length: '20',
        isNullable: true, // Temporarily nullable for backfill
        isUnique: true,
      }),
    );

    // 2. Create sequence for auto-increment
    await queryRunner.query(`
      CREATE SEQUENCE IF NOT EXISTS ticket_display_number_seq START 1;
    `);

    // 3. Backfill existing tickets with sequential numbers
    await queryRunner.query(`
      WITH numbered_tickets AS (
        SELECT
          id,
          'SUP-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 5, '0') AS display_num
        FROM tickets
        WHERE display_number IS NULL
      )
      UPDATE tickets t
      SET display_number = nt.display_num
      FROM numbered_tickets nt
      WHERE t.id = nt.id;
    `);

    // 4. Update sequence to start from next number
    await queryRunner.query(`
      SELECT setval('ticket_display_number_seq', (
        SELECT COALESCE(
          MAX(CAST(SUBSTRING(display_number FROM 5) AS INTEGER)),
          0
        )
        FROM tickets
        WHERE display_number ~ '^SUP-[0-9]+$'
      ) + 1, false);
    `);

    // 5. Make column NOT NULL after backfill
    await queryRunner.query(`
      ALTER TABLE tickets ALTER COLUMN display_number SET NOT NULL;
    `);

    // 6. Create index for fast lookup
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tickets_display_number
      ON tickets(display_number);
    `);

    console.log('✅ Migration completed: Ticket display numbers added (SUP-00001 format)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_tickets_display_number;
    `);

    // Drop sequence
    await queryRunner.query(`
      DROP SEQUENCE IF EXISTS ticket_display_number_seq;
    `);

    // Drop column
    await queryRunner.dropColumn('tickets', 'display_number');

    console.log('✅ Migration reverted: Ticket display numbers removed');
  }
}
