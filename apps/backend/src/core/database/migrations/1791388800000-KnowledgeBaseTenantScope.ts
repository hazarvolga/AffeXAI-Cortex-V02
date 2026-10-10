import { MigrationInterface, QueryRunner } from 'typeorm';

export class KnowledgeBaseTenantScope1791388800000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query('ALTER TABLE knowledge_base_articles ADD COLUMN tenant_id varchar');
    await runner.query(`UPDATE knowledge_base_articles a SET tenant_id = u.tenant_id FROM users u
      WHERE u.id = a."authorId" AND u.tenant_id IS NOT NULL AND
      (a."categoryId" IS NULL OR EXISTS (SELECT 1 FROM ticket_categories c WHERE c.id = a."categoryId" AND c.tenant_id = u.tenant_id))`);
    await runner.query('ALTER TABLE ticket_categories ADD CONSTRAINT uq_kb_category_tenant UNIQUE (id, tenant_id)');
    await runner.query(`ALTER TABLE knowledge_base_articles ADD CONSTRAINT fk_kb_author_tenant
      FOREIGN KEY ("authorId", tenant_id) REFERENCES users(id, tenant_id) ON DELETE RESTRICT`);
    await runner.query(`ALTER TABLE knowledge_base_articles ADD CONSTRAINT fk_kb_category_tenant
      FOREIGN KEY ("categoryId", tenant_id) REFERENCES ticket_categories(id, tenant_id) ON DELETE RESTRICT`);
    await runner.query('ALTER TABLE knowledge_base_articles ADD CONSTRAINT uq_kb_tenant_slug UNIQUE (tenant_id, slug)');
    await runner.query('CREATE UNIQUE INDEX uq_kb_legacy_slug ON knowledge_base_articles(slug) WHERE tenant_id IS NULL');
    await runner.query('ALTER TABLE knowledge_base_articles DROP CONSTRAINT "UQ_7898a3cf5aaa89123c602493678"');
  }
  async down(runner: QueryRunner): Promise<void> {
    if (!runner.isTransactionActive) throw new Error('Knowledge base rollback requires a transaction');
    await runner.query('LOCK TABLE knowledge_base_articles IN ACCESS EXCLUSIVE MODE');
    if ((await runner.query('SELECT 1 FROM knowledge_base_articles LIMIT 1')).length) throw new Error('Knowledge base tenant metadata requires explicit recovery before rollback');
    await runner.query('ALTER TABLE knowledge_base_articles ADD CONSTRAINT "UQ_7898a3cf5aaa89123c602493678" UNIQUE (slug)');
    await runner.query('DROP INDEX uq_kb_legacy_slug');
    await runner.query('ALTER TABLE knowledge_base_articles DROP CONSTRAINT uq_kb_tenant_slug, DROP CONSTRAINT fk_kb_category_tenant, DROP CONSTRAINT fk_kb_author_tenant, DROP COLUMN tenant_id');
    await runner.query('ALTER TABLE ticket_categories DROP CONSTRAINT uq_kb_category_tenant');
  }
}
