import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { MigrationHelpers } from '../utils/migration-helpers';

export class AddTicketMessageEditingFields1740000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check and add isEdited column
    const hasIsEdited = await queryRunner.hasColumn('ticket_messages', 'isEdited');
    if (!hasIsEdited) {
      await MigrationHelpers.addColumnIfNotExists(queryRunner, 
        'ticket_messages',
        new TableColumn({
          name: 'is_edited',
          type: 'boolean',
          default: false,
        })
      );
    }

    // Check and add editedAt column
    const hasEditedAt = await queryRunner.hasColumn('ticket_messages', 'editedAt');
    if (!hasEditedAt) {
      await MigrationHelpers.addColumnIfNotExists(queryRunner, 
        'ticket_messages',
        new TableColumn({
          name: 'edited_at',
          type: 'timestamp',
          isNullable: true,
        })
      );
    }

    // Check and add editedById column
    const hasEditedById = await queryRunner.hasColumn('ticket_messages', 'editedById');
    if (!hasEditedById) {
      await MigrationHelpers.addColumnIfNotExists(queryRunner, 
        'ticket_messages',
        new TableColumn({
          name: 'edited_by_id',
          type: 'uuid',
          isNullable: true,
        })
      );
    }

    // Check and add originalContent column
    const hasOriginalContent = await queryRunner.hasColumn('ticket_messages', 'originalContent');
    if (!hasOriginalContent) {
      await MigrationHelpers.addColumnIfNotExists(queryRunner, 
        'ticket_messages',
        new TableColumn({
          name: 'original_content',
          type: 'text',
          isNullable: true,
        })
      );
    }

    // Check and add isDeleted column
    const hasIsDeleted = await queryRunner.hasColumn('ticket_messages', 'isDeleted');
    if (!hasIsDeleted) {
      await MigrationHelpers.addColumnIfNotExists(queryRunner, 
        'ticket_messages',
        new TableColumn({
          name: 'is_deleted',
          type: 'boolean',
          default: false,
        })
      );
    }

    // Check and add deletedAt column
    const hasDeletedAt = await queryRunner.hasColumn('ticket_messages', 'deleted_at');
    if (!hasDeletedAt) {
      await MigrationHelpers.addColumnIfNotExists(queryRunner, 
        'ticket_messages',
        new TableColumn({
          name: 'deleted_at',
          type: 'timestamp',
          isNullable: true,
        })
      );
    }

    // Check and add deletedById column
    const hasDeletedById = await queryRunner.hasColumn('ticket_messages', 'deleted_by_id');
    if (!hasDeletedById) {
      await MigrationHelpers.addColumnIfNotExists(queryRunner, 
        'ticket_messages',
        new TableColumn({
          name: 'deleted_by_id',
          type: 'uuid',
          isNullable: true,
        })
      );
    }

    // Add foreign key for editedById if column was added
    if (!hasEditedById) {
      await queryRunner.query(`
        ALTER TABLE "ticket_messages"
        ADD CONSTRAINT "FK_ticket_messages_editedById"
        FOREIGN KEY ("editedById") REFERENCES "users"("id")
        ON DELETE SET NULL
      `);
    }

    // Add foreign key for deletedById if column was added
    if (!hasDeletedById) {
      await queryRunner.query(`
        ALTER TABLE "ticket_messages"
        ADD CONSTRAINT "FK_ticket_messages_deletedById"
        FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id")
        ON DELETE SET NULL
      `);
    }

    console.log('✅ Migration: Message editing and deletion fields added to ticket_messages table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.query(`ALTER TABLE "ticket_messages" DROP CONSTRAINT IF EXISTS "FK_ticket_messages_deletedById"`);
    await queryRunner.query(`ALTER TABLE "ticket_messages" DROP CONSTRAINT IF EXISTS "FK_ticket_messages_editedById"`);

    // Drop columns
    await queryRunner.dropColumn('ticket_messages', 'deleted_by_id');
    await queryRunner.dropColumn('ticket_messages', 'deleted_at');
    await queryRunner.dropColumn('ticket_messages', 'isDeleted');
    await queryRunner.dropColumn('ticket_messages', 'originalContent');
    await queryRunner.dropColumn('ticket_messages', 'editedById');
    await queryRunner.dropColumn('ticket_messages', 'editedAt');
    await queryRunner.dropColumn('ticket_messages', 'isEdited');

    console.log('✅ Migration: Message editing and deletion fields removed from ticket_messages table');
  }
}
