import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Comprehensive Migration Synchronization Tool
 * 
 * Purpose: Reconcile migration history with actual database state
 * 
 * This tool:
 * 1. Scans all migration files in the migrations directory
 * 2. Queries the current migration history from the database
 * 3. Identifies missing migration records
 * 4. Generates and executes SQL to insert missing records
 * 5. Validates the final state
 * 
 * Usage:
 *   npm run ts-node apps/backend/scripts/sync-migrations.ts [--dry-run]
 */

interface MigrationFile {
    timestamp: number;
    name: string;
    filename: string;
}

interface MigrationRecord {
    timestamp: number;
    name: string;
}

class MigrationSyncTool {
    private dataSource: DataSource;
    private migrationsDir: string;
    private dryRun: boolean;

    constructor(dryRun: boolean = false) {
        this.dryRun = dryRun;
        this.migrationsDir = path.join(__dirname, '../src/database/migrations');

        this.dataSource = new DataSource({
            type: 'postgres',
            host: process.env.DATABASE_HOST || 'localhost',
            port: parseInt(process.env.DATABASE_PORT || '5434'),
            username: process.env.DATABASE_USERNAME || 'postgres',
            password: process.env.DATABASE_PASSWORD || 'postgres',
            database: process.env.DATABASE_NAME || 'affexai_dev',
        });
    }

    /**
     * Scan migration files from filesystem
     */
    private async scanMigrationFiles(): Promise<MigrationFile[]> {
        console.log('📂 Scanning migration files...');

        const files = fs.readdirSync(this.migrationsDir)
            .filter(f => f.endsWith('.ts') && !f.endsWith('.d.ts'))
            .sort();

        const migrations: MigrationFile[] = files.map(filename => {
            // Extract timestamp and name from filename
            // Format: 1728000000009-CreateBccSignalsTable.ts
            const match = filename.match(/^(\d+)-(.+)\.ts$/);
            if (!match) {
                throw new Error(`Invalid migration filename format: ${filename}`);
            }

            return {
                timestamp: parseInt(match[1]),
                name: match[2],
                filename,
            };
        });

        console.log(`   Found ${migrations.length} migration files`);
        return migrations;
    }

    /**
     * Query existing migration records from database
     */
    private async queryMigrationRecords(): Promise<MigrationRecord[]> {
        console.log('🗄️  Querying migration history from database...');

        const result = await this.dataSource.query(
            'SELECT timestamp, name FROM migrations ORDER BY timestamp'
        );

        console.log(`   Found ${result.length} recorded migrations`);
        return result;
    }

    /**
     * Identify missing migration records
     */
    private identifyMissingMigrations(
        files: MigrationFile[],
        records: MigrationRecord[]
    ): MigrationFile[] {
        console.log('🔍 Identifying missing migration records...');

        const recordedSet = new Set(records.map(r => `${r.timestamp}-${r.name}`));

        const missing = files.filter(file => {
            const key = `${file.timestamp}-${file.name}`;
            return !recordedSet.has(key);
        });

        console.log(`   Found ${missing.length} missing migration records`);

        if (missing.length > 0) {
            console.log('\n   Missing migrations:');
            missing.forEach(m => {
                console.log(`   - ${m.timestamp} | ${m.name}`);
            });
        }

        return missing;
    }

    /**
     * Insert missing migration records
     */
    private async insertMissingRecords(missing: MigrationFile[]): Promise<void> {
        if (missing.length === 0) {
            console.log('✅ No missing migrations to insert');
            return;
        }

        console.log(`\n💾 Inserting ${missing.length} missing migration records...`);

        if (this.dryRun) {
            console.log('   [DRY RUN MODE - No actual inserts will be performed]');
            missing.forEach(m => {
                console.log(`   Would insert: ${m.timestamp} | ${m.name}`);
            });
            return;
        }

        // Use a transaction for safety
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            for (const migration of missing) {
                const sql = `
          INSERT INTO migrations (timestamp, name) 
          VALUES ($1, $2) 
          ON CONFLICT DO NOTHING
        `;

                await queryRunner.query(sql, [migration.timestamp, migration.name]);
                console.log(`   ✓ Inserted: ${migration.name}`);
            }

            await queryRunner.commitTransaction();
            console.log('\n✅ All missing migrations inserted successfully');
        } catch (error) {
            await queryRunner.rollbackTransaction();
            console.error('\n❌ Error inserting migrations:', error);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Validate final state
     */
    private async validateFinalState(expectedCount: number): Promise<boolean> {
        console.log('\n🔬 Validating final state...');

        const records = await this.queryMigrationRecords();

        if (records.length === expectedCount) {
            console.log(`✅ Validation passed: ${records.length} migrations recorded`);
            return true;
        } else {
            console.error(`❌ Validation failed: Expected ${expectedCount}, got ${records.length}`);
            return false;
        }
    }

    /**
     * Main execution flow
     */
    async execute(): Promise<void> {
        console.log('🎯 Migration Synchronization Tool\n');
        console.log(`Mode: ${this.dryRun ? 'DRY RUN' : 'LIVE'}\n`);

        try {
            // Step 1: Connect to database
            console.log('🔌 Connecting to database...');
            await this.dataSource.initialize();
            console.log('   Connected\n');

            // Step 2: Scan migration files
            const files = await this.scanMigrationFiles();

            // Step 3: Query existing records
            const records = await this.queryMigrationRecords();

            // Step 4: Identify missing
            const missing = this.identifyMissingMigrations(files, records);

            // Step 5: Insert missing records
            await this.insertMissingRecords(missing);

            // Step 6: Validate
            if (!this.dryRun) {
                const valid = await this.validateFinalState(files.length);
                if (!valid) {
                    throw new Error('Final validation failed');
                }
            }

            console.log('\n🎉 Migration synchronization complete!');

            if (!this.dryRun && missing.length > 0) {
                console.log('\n📝 Next steps:');
                console.log('   1. Run: npm run typeorm migration:run');
                console.log('   2. Verify: curl http://localhost:3000/api/bcc/status');
                console.log('   3. Check: Forms list in UI');
            }

        } catch (error) {
            console.error('\n💥 Error during migration sync:', error);
            process.exit(1);
        } finally {
            if (this.dataSource.isInitialized) {
                await this.dataSource.destroy();
                console.log('\n🔌 Database connection closed');
            }
        }
    }
}

// CLI execution
const dryRun = process.argv.includes('--dry-run');
const tool = new MigrationSyncTool(dryRun);

tool.execute()
    .then(() => {
        console.log('\n✅ Process completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Process failed:', error);
        process.exit(1);
    });
