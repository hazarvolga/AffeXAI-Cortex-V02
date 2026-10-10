import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';
import { MigrationHelpers } from '../utils/migration-helpers';

export class CreateTicketsTables1728908500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ticket_categories table first (no dependencies)
    await MigrationHelpers.createTableIfNotExists(queryRunner, 
      new Table({
        name: 'ticket_categories',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'parent_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'ticket_count',
            type: 'integer',
            default: 0,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add self-referencing foreign key for parent category
    await MigrationHelpers.createForeignKeyIfNotExists(queryRunner, 
      'ticket_categories',
      new TableForeignKey({
        columnNames: ['parent_id'],
        referencedTableName: 'ticket_categories',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // Create ticket status enum
    await queryRunner.query(`
      CREATE TYPE ticket_status_enum AS ENUM (
        'new',
        'open',
        'pending_customer',
        'pending_internal',
        'resolved',
        'closed',
        'cancelled'
      );
    `);

    // Create ticket priority enum
    await queryRunner.query(`
      CREATE TYPE ticket_priority_enum AS ENUM (
        'low',
        'medium',
        'high',
        'urgent'
      );
    `);

    // Create tickets table
    await MigrationHelpers.createTableIfNotExists(queryRunner, 
      new Table({
        name: 'tickets',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'subject',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'category_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'ticket_status_enum',
            default: "'new'",
          },
          {
            name: 'priority',
            type: 'ticket_priority_enum',
            default: "'medium'",
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'assigned_to_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'company_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'first_response_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'resolved_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'closed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign keys for tickets table
    await MigrationHelpers.createForeignKeyIfNotExists(queryRunner, 
      'tickets',
      new TableForeignKey({
        columnNames: ['category_id'],
        referencedTableName: 'ticket_categories',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await MigrationHelpers.createForeignKeyIfNotExists(queryRunner, 
      'tickets',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await MigrationHelpers.createForeignKeyIfNotExists(queryRunner, 
      'tickets',
      new TableForeignKey({
        columnNames: ['assigned_to_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // Create ticket_messages table
    await MigrationHelpers.createTableIfNotExists(queryRunner, 
      new Table({
        name: 'ticket_messages',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'ticket_id',
            type: 'uuid',
          },
          {
            name: 'author_id',
            type: 'uuid',
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'is_internal',
            type: 'boolean',
            default: false,
          },
          {
            name: 'attachment_ids',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign keys for ticket_messages table
    await MigrationHelpers.createForeignKeyIfNotExists(queryRunner, 
      'ticket_messages',
      new TableForeignKey({
        columnNames: ['ticket_id'],
        referencedTableName: 'tickets',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await MigrationHelpers.createForeignKeyIfNotExists(queryRunner, 
      'ticket_messages',
      new TableForeignKey({
        columnNames: ['author_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Create indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX idx_tickets_status ON tickets(status);
      CREATE INDEX idx_tickets_priority ON tickets(priority);
      CREATE INDEX idx_tickets_user_id ON tickets("user_id");
      CREATE INDEX idx_tickets_assigned_to_id ON tickets("assignedToId");
      CREATE INDEX idx_tickets_category_id ON tickets("category_id");
      CREATE INDEX idx_tickets_created_at ON tickets(created_at);
      CREATE INDEX idx_ticket_messages_ticket_id ON ticket_messages("ticketId");
      CREATE INDEX idx_ticket_messages_author_id ON ticket_messages("authorId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_tickets_status;
      DROP INDEX IF EXISTS idx_tickets_priority;
      DROP INDEX IF EXISTS idx_tickets_user_id;
      DROP INDEX IF EXISTS idx_tickets_assigned_to_id;
      DROP INDEX IF EXISTS idx_tickets_category_id;
      DROP INDEX IF EXISTS idx_tickets_created_at;
      DROP INDEX IF EXISTS idx_ticket_messages_ticket_id;
      DROP INDEX IF EXISTS idx_ticket_messages_author_id;
    `);

    // Drop tables (in reverse order due to foreign keys)
    await queryRunner.dropTable('ticket_messages', true);
    await queryRunner.dropTable('tickets', true);
    await queryRunner.dropTable('ticket_categories', true);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS ticket_status_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS ticket_priority_enum;`);
  }
}
