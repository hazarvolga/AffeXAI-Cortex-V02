import { MigrationInterface, QueryRunner } from 'typeorm';

export class TicketSystemNotes1791392400000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query('ALTER TABLE ticket_messages ALTER COLUMN "authorId" DROP NOT NULL');
    await runner.query(`ALTER TABLE ticket_messages ADD CONSTRAINT ck_ticket_system_note_actor CHECK (
      "authorId" IS NOT NULL OR ("isInternal" = true AND tenant_id IS NOT NULL AND metadata IS NOT NULL
      AND COALESCE(metadata->>'actorType', '') = 'system'))`);
  }
  async down(runner: QueryRunner): Promise<void> {
    if (!runner.isTransactionActive) throw new Error('System note rollback requires a transaction');
    await runner.query('LOCK TABLE ticket_messages IN ACCESS EXCLUSIVE MODE');
    if ((await runner.query('SELECT 1 FROM ticket_messages WHERE "authorId" IS NULL LIMIT 1')).length) throw new Error('System notes require explicit actor recovery before rollback');
    await runner.query('ALTER TABLE ticket_messages ALTER COLUMN "authorId" SET NOT NULL');
    await runner.query('ALTER TABLE ticket_messages DROP CONSTRAINT ck_ticket_system_note_actor');
  }
}
