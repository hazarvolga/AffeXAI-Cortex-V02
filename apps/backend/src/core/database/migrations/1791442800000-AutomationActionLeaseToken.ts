import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutomationActionLeaseToken1791442800000
  implements MigrationInterface
{
  name = 'AutomationActionLeaseToken1791442800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SET LOCAL lock_timeout = '5s'`);
    await queryRunner.query(`SET LOCAL statement_timeout = '30s'`);
    await queryRunner.query(`LOCK TABLE automation_action_executions IN ACCESS EXCLUSIVE MODE`);
    await queryRunner.query(`
      ALTER TABLE automation_action_executions
      ADD COLUMN lease_token uuid NOT NULL DEFAULT gen_random_uuid()
    `);
    await queryRunner.query(`
      ALTER TABLE automation_action_executions
      ALTER COLUMN lease_token DROP DEFAULT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE automation_action_executions
      DROP COLUMN lease_token
    `);
  }
}
