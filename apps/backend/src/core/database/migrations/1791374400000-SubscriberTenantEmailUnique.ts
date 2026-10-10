import { MigrationInterface, QueryRunner, TableIndex, TableUnique } from 'typeorm';

export class SubscriberTenantEmailUnique1791374400000 implements MigrationInterface {
  private readonly tenantUnique = 'UQ_subscribers_tenant_email';
  private readonly legacyUnique = 'UQ_subscribers_legacy_email';
  private readonly oldUnique = 'UQ_1a7163c08f0e57bd1c9821508b1';

  async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('subscribers');
    if (!table) throw new Error('Subscribers table is required');
    // Establish replacement constraints before dropping the old global key.
    await queryRunner.createUniqueConstraint(table, new TableUnique({
      name: this.tenantUnique, columnNames: ['tenant_id', 'email'],
    }));
    // Preserve legacy null-tenant rows without assigning or deleting user data.
    await queryRunner.createIndex(table, new TableIndex({
      name: this.legacyUnique, columnNames: ['email'], isUnique: true, where: '"tenant_id" IS NULL',
    }));
    for (const constraint of table.uniques) {
      if (constraint.columnNames.length === 1 && constraint.columnNames[0] === 'email') {
        await queryRunner.dropUniqueConstraint(table, constraint);
      }
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback must never delete or merge cross-tenant subscribers to recreate a global key.
    const duplicates: unknown[] = await queryRunner.query('SELECT 1 FROM "subscribers" GROUP BY "email" HAVING COUNT(*) > 1 LIMIT 1');
    if (duplicates.length) throw new Error('Cannot restore global email uniqueness: cross-tenant duplicates require an explicit data migration');
    const table = await queryRunner.getTable('subscribers');
    if (!table) throw new Error('Subscribers table is required');
    await queryRunner.createUniqueConstraint(table, new TableUnique({ name: this.oldUnique, columnNames: ['email'] }));
    await queryRunner.dropUniqueConstraint(table, this.tenantUnique);
    await queryRunner.dropIndex(table, this.legacyUnique);
  }
}
