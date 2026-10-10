import { MigrationInterface, QueryRunner } from 'typeorm';
export class KnowledgeCategoryMapping1791403200000 implements MigrationInterface {
 async up(runner:QueryRunner):Promise<void>{
  if(!runner.isTransactionActive)throw new Error('Category mapping migration requires transaction');
  await runner.query('LOCK TABLE knowledge_base_categories IN ACCESS EXCLUSIVE MODE');
  await runner.query('ALTER TABLE knowledge_base_categories ADD COLUMN ticket_category_id uuid');
  // No inferred mapping. Existing folder IDs, hierarchy and content remain untouched.
  await runner.query(`ALTER TABLE knowledge_base_categories ADD CONSTRAINT ck_help_category_mapping_scope CHECK (ticket_category_id IS NULL OR (tenant_id IS NOT NULL AND btrim(tenant_id)<>'')),
   ADD CONSTRAINT fk_help_ticket_category FOREIGN KEY(ticket_category_id,tenant_id) REFERENCES ticket_categories(id,tenant_id) ON DELETE RESTRICT ON UPDATE RESTRICT`);
  await runner.query('ALTER TABLE knowledge_base_categories DROP CONSTRAINT "UQ_39534cc2139480f2cfbfc76a085", ADD CONSTRAINT uq_help_category_tenant_slug UNIQUE(tenant_id,slug)');
  await runner.query('CREATE UNIQUE INDEX uq_help_category_legacy_slug ON knowledge_base_categories(slug) WHERE tenant_id IS NULL');
  await runner.query('CREATE INDEX idx_help_category_mapping ON knowledge_base_categories(tenant_id,ticket_category_id)');
 }
 async down(runner:QueryRunner):Promise<void>{
  if(!runner.isTransactionActive)throw new Error('Category mapping rollback requires transaction');
  await runner.query('LOCK TABLE knowledge_base_categories IN ACCESS EXCLUSIVE MODE');
  const [state]=await runner.query('SELECT EXISTS(SELECT 1 FROM knowledge_base_categories WHERE ticket_category_id IS NOT NULL) AS mapped, EXISTS(SELECT slug FROM knowledge_base_categories GROUP BY slug HAVING count(*)>1) AS duplicate');
  if(state.mapped||state.duplicate)throw new Error('Category mappings or tenant slugs prevent safe rollback');
  await runner.query('DROP INDEX idx_help_category_mapping');await runner.query('DROP INDEX uq_help_category_legacy_slug');
  await runner.query('ALTER TABLE knowledge_base_categories DROP CONSTRAINT ck_help_category_mapping_scope,DROP CONSTRAINT fk_help_ticket_category,DROP CONSTRAINT uq_help_category_tenant_slug,DROP COLUMN ticket_category_id,ADD CONSTRAINT "UQ_39534cc2139480f2cfbfc76a085" UNIQUE(slug)');
 }
}
