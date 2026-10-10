import { MigrationInterface, QueryRunner } from 'typeorm';

export class CommerceSubscriptionIntegrity1791410400000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    if (!runner.isTransactionActive) throw new Error('Commerce subscription integrity migration requires transaction');
    await runner.query('LOCK TABLE organizations, users, subscriptions IN ACCESS EXCLUSIVE MODE');
    await runner.query(`UPDATE users u SET "organizationId"=o.id FROM organizations o
      WHERE u."organizationId" IS NULL AND u.tenant_id=o.slug`);
    await runner.query(`DO $$ BEGIN
      IF EXISTS(
        SELECT 1 FROM users u LEFT JOIN organizations o
          ON o.id=u."organizationId" AND o.slug=u.tenant_id
        WHERE u."isActive"=true AND u.deleted_at IS NULL AND o.id IS NULL
      ) THEN
        RAISE EXCEPTION 'Active user without canonical organization prevents identity enforcement';
      END IF;
      IF EXISTS(
        SELECT "stripeCustomerId" FROM subscriptions
        WHERE "stripeCustomerId" IS NOT NULL
        GROUP BY "stripeCustomerId" HAVING count(DISTINCT "tenantId") > 1
      ) THEN
        RAISE EXCEPTION 'Stripe customer bound to multiple tenants prevents commerce integrity migration';
      END IF;
    END $$`);
    await runner.query(`CREATE TABLE commerce_customer_bindings(
      stripe_customer_id varchar PRIMARY KEY,
      tenant_id varchar(128) NOT NULL,
      created_at timestamp NOT NULL DEFAULT now(),
      CONSTRAINT fk_commerce_customer_tenant FOREIGN KEY(tenant_id)
        REFERENCES organizations(slug) ON DELETE RESTRICT ON UPDATE RESTRICT
    )`);
    await runner.query(`INSERT INTO commerce_customer_bindings(stripe_customer_id,tenant_id)
      SELECT "stripeCustomerId",min("tenantId") FROM subscriptions
      WHERE "stripeCustomerId" IS NOT NULL GROUP BY "stripeCustomerId"`);
    await runner.query(`DO $$ BEGIN
      IF EXISTS(
        SELECT "tenantId" FROM subscriptions
        WHERE status IN ('active','trialing')
        GROUP BY "tenantId" HAVING count(*) > 1
      ) THEN
        RAISE EXCEPTION 'Multiple active subscriptions prevent commerce integrity migration';
      END IF;
    END $$`);
    await runner.query(`CREATE UNIQUE INDEX uq_subscriptions_one_active_tenant
      ON subscriptions("tenantId") WHERE status IN ('active','trialing')`);
    await runner.query(`CREATE INDEX idx_subscriptions_customer_binding
      ON subscriptions("stripeCustomerId") WHERE "stripeCustomerId" IS NOT NULL`);
  }

  async down(runner: QueryRunner): Promise<void> {
    if (!runner.isTransactionActive) throw new Error('Commerce subscription integrity rollback requires transaction');
    await runner.query('DROP INDEX idx_subscriptions_customer_binding');
    await runner.query('DROP INDEX uq_subscriptions_one_active_tenant');
    await runner.query('DROP TABLE commerce_customer_bindings');
  }
}
