import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';
import { MigrationHelpers } from '../utils/migration-helpers';

export class CreateBccSignalsTable1740000000009 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await MigrationHelpers.createTableIfNotExists(queryRunner, 
            new Table({
                name: 'bcc_signals',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'uuid',
                    },
                    {
                        name: 'type',
                        type: 'varchar',
                        length: '50',
                    },
                    {
                        name: 'source',
                        type: 'varchar',
                        length: '50',
                    },
                    {
                        name: 'intensity',
                        type: 'float',
                    },
                    {
                        name: 'message',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'metadata',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'tenant_id',
                        type: 'varchar',
                        length: '100',
                    },
                    {
                        name: 'user_id',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'NOW()',
                    },
                ],
            }),
            true,
        );

        // Create indexes for multi-tenant performance
        await MigrationHelpers.createIndexIfNotExists(queryRunner, 
            'bcc_signals',
            new TableIndex({
                name: '_i_d_x_bcc_signals_tenant_created',
                columnNames: ['tenant_id', 'created_at'],
            }),
        );

        await MigrationHelpers.createIndexIfNotExists(queryRunner, 
            'bcc_signals',
            new TableIndex({
                name: '_i_d_x_bcc_signals_type',
                columnNames: ['type'],
            }),
        );

        // --- ENABLE ROW LEVEL SECURITY (RLS) ---
        // 1. Enable RLS on the table
        await queryRunner.query('ALTER TABLE bcc_signals ENABLE ROW LEVEL SECURITY;');

        // 2. Create isolation policy
        // Use current_setting('app.current_tenant', true) to handle unset settings gracefully
        await queryRunner.query(`
      CREATE POLICY bcc_signal_tenant_isolation ON bcc_signals
      USING ("tenant_id" = current_setting('app.current_tenant', true));
    `);

        // 3. (Optional) Force RLS for table owner/app user
        await queryRunner.query('ALTER TABLE bcc_signals FORCE ROW LEVEL SECURITY;');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop logic in reverse
        await queryRunner.query('DROP POLICY IF EXISTS bcc_signal_tenant_isolation ON bcc_signals;');
        await queryRunner.query('ALTER TABLE bcc_signals DISABLE ROW LEVEL SECURITY;');
        await queryRunner.dropTable('bcc_signals');
    }
}
