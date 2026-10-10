import { MigrationInterface, QueryRunner } from 'typeorm';

/** Preserve ambiguous legacy recipients without granting access to a guessed identity. */
export class NotificationRecipientIntegrity1791399600000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    if (!runner.isTransactionActive) throw new Error('Notification migration requires a transaction');
    await runner.query('LOCK TABLE notifications IN ACCESS EXCLUSIVE MODE');
    await runner.query('ALTER TABLE notifications DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"');
    await runner.query('ALTER TABLE notifications ADD COLUMN recipient_id uuid, ADD COLUMN legacy_tenant_id varchar');
    await runner.query('UPDATE notifications SET legacy_tenant_id = tenant_id');
    // CASE guarantees malformed legacy values are never cast, irrespective of query planning.
    await runner.query(`WITH candidates AS (
      SELECT id, CASE
        WHEN "userId" IS NULL OR btrim("userId") = '' THEN user_id
        WHEN "userId" ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          THEN CASE WHEN user_id IS NULL OR user_id = "userId"::uuid THEN "userId"::uuid END
        ELSE NULL END AS recipient FROM notifications
    ) UPDATE notifications n SET recipient_id = u.id
      FROM candidates c, users u
      WHERE n.id = c.id AND u.id = c.recipient AND n.tenant_id = u.tenant_id
      AND n.tenant_id IS NOT NULL AND btrim(n.tenant_id) <> ''`);
    await runner.query('UPDATE notifications SET tenant_id = NULL WHERE recipient_id IS NULL');
    await runner.query(`ALTER TABLE notifications ADD CONSTRAINT ck_notification_recipient_scope CHECK (
      (recipient_id IS NULL AND tenant_id IS NULL) OR
      (recipient_id IS NOT NULL AND tenant_id IS NOT NULL AND btrim(tenant_id) <> '')
    )`);
    await runner.query(`ALTER TABLE notifications ADD CONSTRAINT fk_notification_recipient_tenant
      FOREIGN KEY (recipient_id, tenant_id) REFERENCES users(id, tenant_id)
      ON DELETE CASCADE ON UPDATE RESTRICT`);
    await runner.query(`CREATE INDEX idx_notification_recipient_list
      ON notifications (tenant_id, recipient_id, created_at DESC, id DESC) WHERE deleted_at IS NULL`);
  }

  async down(runner: QueryRunner): Promise<void> {
    if (!runner.isTransactionActive) throw new Error('Notification rollback requires a transaction');
    await runner.query('LOCK TABLE notifications IN ACCESS EXCLUSIVE MODE');
    const [row] = await runner.query('SELECT EXISTS(SELECT 1 FROM notifications) AS populated');
    if (row.populated) throw new Error('Notification rollback requires an empty table to preserve recipient data');
    await runner.query('DROP INDEX idx_notification_recipient_list');
    await runner.query('ALTER TABLE notifications DROP CONSTRAINT fk_notification_recipient_tenant, DROP CONSTRAINT ck_notification_recipient_scope');
    await runner.query('ALTER TABLE notifications DROP COLUMN recipient_id, DROP COLUMN legacy_tenant_id');
    await runner.query('ALTER TABLE notifications ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE NO ACTION');
  }
}
