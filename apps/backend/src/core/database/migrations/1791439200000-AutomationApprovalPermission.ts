import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutomationApprovalPermission1791439200000
  implements MigrationInterface
{
  name = 'AutomationApprovalPermission1791439200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SET LOCAL lock_timeout = '5s'`);
    await queryRunner.query(`SET LOCAL statement_timeout = '30s'`);
    await queryRunner.query(`LOCK TABLE roles IN SHARE ROW EXCLUSIVE MODE`);
    await queryRunner.query(`
      UPDATE roles
      SET permissions = CASE
            WHEN COALESCE(permissions, '[]'::jsonb) @> '["automation.approve"]'::jsonb
              THEN permissions
            ELSE COALESCE(permissions, '[]'::jsonb) || '["automation.approve"]'::jsonb
          END,
          updated_at = now()
      WHERE deleted_at IS NULL
        AND tenant_id IS NOT NULL
        AND lower(btrim(name)) = 'organization_owner'
    `);
  }

  public async down(): Promise<void> {
    // Permission assignments may have been changed after rollout. A destructive
    // automatic rollback would revoke legitimate tenant governance authority.
  }
}
