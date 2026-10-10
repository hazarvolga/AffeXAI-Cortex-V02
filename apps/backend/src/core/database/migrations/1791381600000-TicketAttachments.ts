import { MigrationInterface, QueryRunner } from 'typeorm';

/** Private bytes are owned by this table; never silently discard their metadata. */
export class TicketAttachments1791381600000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query('ALTER TABLE users ADD CONSTRAINT uq_attachment_owner_tenant UNIQUE (id, tenant_id)');
    await runner.query('ALTER TABLE tickets ADD CONSTRAINT uq_attachment_ticket_tenant UNIQUE (id, tenant_id)');
    await runner.query('ALTER TABLE ticket_messages ADD CONSTRAINT uq_attachment_message_scope UNIQUE (id, tenant_id, "ticketId")');
    await runner.query(`CREATE TABLE ticket_attachments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id varchar NOT NULL,
      owner_id uuid NOT NULL,
      ticket_id uuid,
      message_id uuid,
      original_name varchar(255) NOT NULL,
      storage_key uuid NOT NULL UNIQUE,
      mime_type varchar(127) NOT NULL,
      size integer NOT NULL CHECK (size > 0 AND size <= 10485760),
      sha256 char(64) NOT NULL CHECK (sha256 ~ '^[a-f0-9]{64}$'),
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT fk_attachment_owner FOREIGN KEY (owner_id, tenant_id) REFERENCES users(id, tenant_id) ON DELETE RESTRICT,
      CONSTRAINT fk_attachment_ticket FOREIGN KEY (ticket_id, tenant_id) REFERENCES tickets(id, tenant_id) ON DELETE RESTRICT,
      CONSTRAINT fk_attachment_message FOREIGN KEY (message_id, tenant_id, ticket_id) REFERENCES ticket_messages(id, tenant_id, "ticketId") ON UPDATE CASCADE ON DELETE RESTRICT,
      CONSTRAINT ck_attachment_message_ticket CHECK (message_id IS NULL OR ticket_id IS NOT NULL)
    )`);
    await runner.query('CREATE INDEX idx_ticket_attachment_owner ON ticket_attachments(tenant_id, owner_id, created_at)');
    await runner.query('CREATE INDEX idx_ticket_attachment_ticket ON ticket_attachments(tenant_id, ticket_id) WHERE ticket_id IS NOT NULL');
  }
  async down(runner: QueryRunner): Promise<void> {
    if (!runner.isTransactionActive) throw new Error('Attachment rollback requires a transaction');
    await runner.query('LOCK TABLE ticket_attachments IN ACCESS EXCLUSIVE MODE');
    if ((await runner.query('SELECT 1 FROM ticket_attachments LIMIT 1')).length) throw new Error('Stored attachments require explicit file recovery before rollback');
    await runner.query('DROP TABLE ticket_attachments');
    await runner.query('ALTER TABLE ticket_messages DROP CONSTRAINT uq_attachment_message_scope');
    await runner.query('ALTER TABLE tickets DROP CONSTRAINT uq_attachment_ticket_tenant');
    await runner.query('ALTER TABLE users DROP CONSTRAINT uq_attachment_owner_tenant');
  }
}
