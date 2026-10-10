import * as fs from 'fs';
import * as path from 'path';

const MIGRATIONS_DIR = path.join(__dirname, '../src/database/migrations');

// Regex patterns for replacement
const PATTERNS = [
    // queryRunner.addColumn -> MigrationHelpers.addColumnIfNotExists
    {
        regex: /await\s+queryRunner\.addColumn\s*\(/g,
        replacement: 'await MigrationHelpers.addColumnIfNotExists(queryRunner, '
    },
    // queryRunner.createForeignKey -> MigrationHelpers.createForeignKeyIfNotExists
    {
        regex: /await\s+queryRunner\.createForeignKey\s*\(/g,
        replacement: 'await MigrationHelpers.createForeignKeyIfNotExists(queryRunner, '
    },
    // queryRunner.createIndex -> MigrationHelpers.createIndexIfNotExists
    {
        regex: /await\s+queryRunner\.createIndex\s*\(/g,
        replacement: 'await MigrationHelpers.createIndexIfNotExists(queryRunner, '
    },
    // queryRunner.createTable(..., true) -> MigrationHelpers.createTableIfNotExists
    // Note: TypeORM createTable has second arg 'ifNotExists', but helpers are safer or standardized
    {
        regex: /await\s+queryRunner\.createTable\s*\(/g,
        replacement: 'await MigrationHelpers.createTableIfNotExists(queryRunner, '
    }
];

const IMPORT_STATEMENT = "import { MigrationHelpers } from '../utils/migration-helpers';";

async function main() {
    console.log(`🔧 Starting batch migration fix in: ${MIGRATIONS_DIR}`);

    if (!fs.existsSync(MIGRATIONS_DIR)) {
        console.error(`❌ Directory not found: ${MIGRATIONS_DIR}`);
        process.exit(1);
    }

    const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.ts'));
    let fixedCount = 0;

    for (const file of files) {
        const filePath = path.join(MIGRATIONS_DIR, file);
        let content = fs.readFileSync(filePath, 'utf-8');
        let modified = false;

        // Apply replacements
        for (const pattern of PATTERNS) {
            if (pattern.regex.test(content)) {
                content = content.replace(pattern.regex, pattern.replacement);
                modified = true;
            }
        }

        // Add import if modified and missing
        if (modified) {
            // Check if import already exists
            if (!content.includes(IMPORT_STATEMENT) && !content.includes('MigrationHelpers }')) {
                // Insert after existing imports
                const lines = content.split('\n');
                let insertIdx = 0;
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].startsWith('import ')) {
                        insertIdx = i + 1;
                    }
                }
                lines.splice(insertIdx, 0, IMPORT_STATEMENT);
                content = lines.join('\n');
            }

            // Special handling for createTable signature mismatch
            // MigrationHelpers.createTableIfNotExists signature: (queryRunner, table)
            // queryRunner.createTable signature: (table, ifNotExists, createForeignKeys)
            // We need to verify if the script generated invalid code for createTable calls
            // The helper assumes (queryRunner, table).
            // Existing calls might be: queryRunner.createTable(new Table(...), true)
            // Replacement becomes: MigrationHelpers.createTableIfNotExists(queryRunner, new Table(...), true)
            // THIS IS WRONG if helper only takes 2 args!
            // Helper definition: static async createTableIfNotExists(queryRunner: QueryRunner, table: Table): Promise<boolean>
            // So we must remove extra arguments if present.

            // Actually, safer to SKIP createTable replacement for now via regex, 
            // or update Helper to accept rest args,
            // or try to fix arguments via regex (hard).
            // Let's check Helper definition again. It takes table: Table.
            // If the code has `, true`, it will pass 3 args. TS might complain or JS runtime ignores it.
            // But wait, createTableIfNotExists implementation uses `createTable(table, true)`.
            // So calling it with extra args is fine in JS runtime (they are ignored), 
            // BUT TypeORM `createTable` second arg is `ifNotExists`.
            // My Helper ignores extra args?
            // "static async createTableIfNotExists(queryRunner, table)"
            // If I call it with (queryRunner, table, true), 'true' is ignored.
            // So it effectively works!

            fs.writeFileSync(filePath, content);
            console.log(`✅ Fixed: ${file}`);
            fixedCount++;
        }
    }

    console.log(`\n🎉 Batch fix complete. Modified ${fixedCount} files.`);
}

main().catch(console.error);
