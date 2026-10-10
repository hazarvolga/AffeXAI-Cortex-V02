import { MigrationInterface, QueryRunner } from 'typeorm';

const TENANT_FOREIGN_KEYS = [
  ['ticket_attachments', 'fk_attachment_message'], ['ticket_attachments', 'fk_attachment_owner'],
  ['ticket_attachments', 'fk_attachment_ticket'], ['cortex_outbox', 'fk_cortex_event'],
  ['ticket_csat', 'fk_csat_customer_tenant'], ['ticket_csat', 'fk_csat_ticket_tenant'],
  ['knowledge_base_categories', 'fk_help_ticket_category'],
  ['knowledge_base_articles', 'fk_kb_author_tenant'], ['knowledge_base_articles', 'fk_kb_category_tenant'],
  ['notifications', 'fk_notification_recipient_tenant'],
] as const;

export class OrganizationLifecycle1791406800000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    if (!runner.isTransactionActive) throw new Error('Organization lifecycle migration requires transaction');
    await runner.query('LOCK TABLE organizations, users, roles, user_roles IN ACCESS EXCLUSIVE MODE');
    await runner.query(`CREATE TEMP TABLE organization_tenant_map ON COMMIT DROP AS
      SELECT id, slug AS old_slug, lower(COALESCE(NULLIF(btrim(slug),''),id::text)) AS new_slug FROM organizations`);
    await runner.query(`DO $$ BEGIN
      IF EXISTS(SELECT 1 FROM organization_tenant_map WHERE new_slug !~ '^[a-z0-9_-]{1,128}$') THEN
        RAISE EXCEPTION 'Invalid organization slug prevents lifecycle migration';
      END IF;
      IF EXISTS(SELECT new_slug FROM organization_tenant_map GROUP BY new_slug HAVING count(*)>1) THEN
        RAISE EXCEPTION 'Organization slug normalization collision prevents lifecycle migration';
      END IF;
      IF EXISTS(SELECT 1 FROM organization_tenant_map a JOIN organization_tenant_map b ON a.id<>b.id AND a.new_slug=b.id::text) THEN
        RAISE EXCEPTION 'Organization slug collides with a legacy tenant UUID';
      END IF;
    END $$`);

    for (const [table, constraint] of TENANT_FOREIGN_KEYS) {
      await runner.query(`ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${constraint}"`);
    }
    // Older CMS migrations used UUID tenant columns while the runtime contract uses string slugs.
    await runner.query(`DO $$ DECLARE c record; BEGIN
      FOR c IN SELECT table_name,column_name FROM information_schema.columns
        WHERE table_schema='public' AND column_name IN ('tenant_id','tenantId') AND data_type='uuid'
      LOOP
        EXECUTE format('ALTER TABLE %I ALTER COLUMN %I TYPE varchar USING %I::text', c.table_name,c.column_name,c.column_name);
      END LOOP;
    END $$`);
    // Remap both legacy UUID tenant keys and pre-existing mixed-case slugs across every tenant-bearing table.
    await runner.query(`DO $$ DECLARE c record; BEGIN
      FOR c IN SELECT table_name,column_name FROM information_schema.columns
        WHERE table_schema='public' AND column_name IN ('tenant_id','tenantId')
      LOOP
        EXECUTE format('UPDATE %I t SET %I=m.new_slug FROM organization_tenant_map m WHERE t.%I=m.id::text OR t.%I=m.old_slug',
          c.table_name,c.column_name,c.column_name,c.column_name);
      END LOOP;
    END $$`);
    await runner.query(`UPDATE organizations o SET slug=m.new_slug FROM organization_tenant_map m WHERE o.id=m.id`);
    await runner.query(`UPDATE user_roles ur SET tenant_id=u.tenant_id FROM users u,roles r
      WHERE ur."userId"=u.id AND ur."roleId"=r.id AND u.tenant_id=r.tenant_id
        AND (ur.tenant_id IS NULL OR btrim(ur.tenant_id)='')`);
    await runner.query(`DO $$ BEGIN
      IF EXISTS(SELECT 1 FROM users u JOIN organizations o ON o.id=u."organizationId" WHERE u.tenant_id IS DISTINCT FROM o.slug) THEN
        RAISE EXCEPTION 'Linked user tenant does not match organization slug';
      END IF;
      IF EXISTS(SELECT 1 FROM user_roles ur LEFT JOIN users u ON u.id=ur."userId"
        LEFT JOIN roles r ON r.id=ur."roleId" WHERE ur.tenant_id IS NULL OR u.id IS NULL OR r.id IS NULL
          OR ur.tenant_id IS DISTINCT FROM u.tenant_id OR ur.tenant_id IS DISTINCT FROM r.tenant_id) THEN
        RAISE EXCEPTION 'Role assignment tenant mismatch prevents lifecycle migration';
      END IF;
      IF EXISTS(SELECT 1 FROM roles WHERE tenant_id IS NULL OR btrim(tenant_id)='') THEN
        RAISE EXCEPTION 'Tenantless role prevents lifecycle migration';
      END IF;
    END $$`);

    await runner.query(`ALTER TABLE organizations ALTER COLUMN slug SET NOT NULL,
      ADD CONSTRAINT ck_organization_slug CHECK (slug=lower(slug) AND slug ~ '^[a-z0-9_-]{1,128}$'),
      ADD CONSTRAINT uq_organization_id_slug UNIQUE(id,slug)`);
    await runner.query(`ALTER TABLE roles ALTER COLUMN tenant_id SET NOT NULL,
      ADD CONSTRAINT uq_role_id_tenant UNIQUE(id,tenant_id)`);
    await runner.query(`ALTER TABLE user_roles ALTER COLUMN tenant_id SET NOT NULL,
      DROP CONSTRAINT "FK_472b25323af01488f1f66a06b67",
      DROP CONSTRAINT "FK_86033897c009fcca8b6505d6be2",
      ADD CONSTRAINT fk_user_role_user_tenant FOREIGN KEY("userId",tenant_id) REFERENCES users(id,tenant_id) ON DELETE CASCADE,
      ADD CONSTRAINT fk_user_role_role_tenant FOREIGN KEY("roleId",tenant_id) REFERENCES roles(id,tenant_id) ON DELETE RESTRICT`);
    await runner.query(`ALTER TABLE users DROP CONSTRAINT "FK_368e146b785b574f42ae9e53d5e",
      ADD CONSTRAINT fk_user_legacy_role_tenant FOREIGN KEY("roleId",tenant_id) REFERENCES roles(id,tenant_id) ON DELETE RESTRICT,
      DROP CONSTRAINT "FK_f3d6aea8fcca58182b2e80ce979",
      ADD CONSTRAINT fk_user_organization_tenant FOREIGN KEY("organizationId",tenant_id)
        REFERENCES organizations(id,slug) ON DELETE RESTRICT ON UPDATE RESTRICT`);

    await runner.query(`ALTER TABLE ticket_attachments ADD CONSTRAINT fk_attachment_owner FOREIGN KEY(owner_id,tenant_id) REFERENCES users(id,tenant_id) ON DELETE RESTRICT,
      ADD CONSTRAINT fk_attachment_ticket FOREIGN KEY(ticket_id,tenant_id) REFERENCES tickets(id,tenant_id) ON DELETE RESTRICT,
      ADD CONSTRAINT fk_attachment_message FOREIGN KEY(message_id,tenant_id,ticket_id) REFERENCES ticket_messages(id,tenant_id,"ticketId") ON UPDATE CASCADE ON DELETE RESTRICT`);
    await runner.query('ALTER TABLE cortex_outbox ADD CONSTRAINT fk_cortex_event FOREIGN KEY(event_id,tenant_id) REFERENCES platform_events(id,tenant_id) ON DELETE RESTRICT');
    await runner.query('ALTER TABLE ticket_csat ADD CONSTRAINT fk_csat_customer_tenant FOREIGN KEY("customerId",tenant_id) REFERENCES users(id,tenant_id) ON DELETE RESTRICT, ADD CONSTRAINT fk_csat_ticket_tenant FOREIGN KEY("ticketId",tenant_id) REFERENCES tickets(id,tenant_id) ON DELETE CASCADE');
    await runner.query('ALTER TABLE knowledge_base_categories ADD CONSTRAINT fk_help_ticket_category FOREIGN KEY(ticket_category_id,tenant_id) REFERENCES ticket_categories(id,tenant_id) ON UPDATE RESTRICT ON DELETE RESTRICT');
    await runner.query('ALTER TABLE knowledge_base_articles ADD CONSTRAINT fk_kb_author_tenant FOREIGN KEY("authorId",tenant_id) REFERENCES users(id,tenant_id) ON DELETE RESTRICT, ADD CONSTRAINT fk_kb_category_tenant FOREIGN KEY("categoryId",tenant_id) REFERENCES ticket_categories(id,tenant_id) ON DELETE RESTRICT');
    await runner.query('ALTER TABLE notifications ADD CONSTRAINT fk_notification_recipient_tenant FOREIGN KEY(recipient_id,tenant_id) REFERENCES users(id,tenant_id) ON UPDATE RESTRICT ON DELETE CASCADE');

    await runner.query(`CREATE TABLE organization_audit_logs(
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), tenant_id varchar(128) NOT NULL,
      organization_id uuid NOT NULL, actor_id uuid, target_user_id uuid,
      action varchar(64) NOT NULL, metadata jsonb, created_at timestamp NOT NULL DEFAULT now(),
      CONSTRAINT fk_organization_audit_organization FOREIGN KEY(organization_id,tenant_id)
        REFERENCES organizations(id,slug) ON DELETE RESTRICT ON UPDATE RESTRICT)`);
    await runner.query('CREATE INDEX idx_organization_audit_tenant_created ON organization_audit_logs(tenant_id,created_at DESC)');
    await runner.query('CREATE INDEX idx_organization_audit_target ON organization_audit_logs(tenant_id,target_user_id)');
  }

  async down(runner: QueryRunner): Promise<void> {
    if (!runner.isTransactionActive) throw new Error('Organization lifecycle rollback requires transaction');
    await runner.query('LOCK TABLE organizations, users, roles, user_roles, organization_audit_logs IN ACCESS EXCLUSIVE MODE');
    const [state] = await runner.query('SELECT EXISTS(SELECT 1 FROM organization_audit_logs) AS audited');
    if (state.audited) throw new Error('Organization audit history prevents safe rollback');
    await runner.query('DROP INDEX idx_organization_audit_target');
    await runner.query('DROP INDEX idx_organization_audit_tenant_created');
    await runner.query('DROP TABLE organization_audit_logs');
    await runner.query(`ALTER TABLE users DROP CONSTRAINT fk_user_organization_tenant,
      DROP CONSTRAINT fk_user_legacy_role_tenant,
      ADD CONSTRAINT "FK_f3d6aea8fcca58182b2e80ce979" FOREIGN KEY("organizationId") REFERENCES organizations(id) ON DELETE NO ACTION ON UPDATE NO ACTION,
      ADD CONSTRAINT "FK_368e146b785b574f42ae9e53d5e" FOREIGN KEY("roleId") REFERENCES roles(id)`);
    await runner.query(`ALTER TABLE user_roles DROP CONSTRAINT fk_user_role_user_tenant,
      DROP CONSTRAINT fk_user_role_role_tenant, ALTER COLUMN tenant_id DROP NOT NULL,
      ADD CONSTRAINT "FK_472b25323af01488f1f66a06b67" FOREIGN KEY("userId") REFERENCES users(id) ON DELETE CASCADE,
      ADD CONSTRAINT "FK_86033897c009fcca8b6505d6be2" FOREIGN KEY("roleId") REFERENCES roles(id) ON DELETE RESTRICT`);
    await runner.query('ALTER TABLE roles DROP CONSTRAINT uq_role_id_tenant, ALTER COLUMN tenant_id DROP NOT NULL');
    await runner.query('ALTER TABLE organizations DROP CONSTRAINT uq_organization_id_slug, DROP CONSTRAINT ck_organization_slug, ALTER COLUMN slug DROP NOT NULL');
  }
}
