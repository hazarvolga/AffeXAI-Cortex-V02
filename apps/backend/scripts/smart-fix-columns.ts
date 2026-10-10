import * as fs from 'fs';
import * as path from 'path';

const MIGRATIONS_DIR = path.join(__dirname, '../src/database/migrations');

function toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

async function main() {
    console.log(`🔧 Starting smart column fix (Round 2) in: ${MIGRATIONS_DIR}`);

    if (!fs.existsSync(MIGRATIONS_DIR)) {
        console.error(`❌ Directory not found: ${MIGRATIONS_DIR}`);
        process.exit(1);
    }

    const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.ts'));
    let fixedCount = 0;
    let totalReplacements = 0;

    for (const file of files) {
        const filePath = path.join(MIGRATIONS_DIR, file);
        let content = fs.readFileSync(filePath, 'utf-8');
        let modified = false;

        // 1. Fix name: 'camelCase' (Already ran, but running again checks for leftovers)
        content = content.replace(/name:\s*(['"])([^'"]+)(['"])/g, (match, q1, colName, q2) => {
            if (colName === 'id') return match;
            if (/[A-Z]/.test(colName)) {
                const snake = toSnakeCase(colName);
                if (snake !== colName) {
                    console.log(`   [name] ${file}: ${colName} -> ${snake}`);
                    modified = true;
                    totalReplacements++;
                    return `name: ${q1}${snake}${q2}`;
                }
            }
            return match;
        });

        // 2. Fix columnNames: ['camelCase']
        // Regex looks for columnNames: [ ... ] and captures inner content
        // This is simple for single-line arrays. Multi-line arrays might need logic.
        // Let's assume single strings inside first: columnNames: ['foo']
        content = content.replace(/(columnNames|referencedColumnNames):\s*\[\s*(['"])([^'"]+)(['"])\s*\]/g, (match, prop, q1, colName, q2) => {
            if (/[A-Z]/.test(colName)) {
                const snake = toSnakeCase(colName);
                if (snake !== colName) {
                    console.log(`   [${prop}] ${file}: ${colName} -> ${snake}`);
                    modified = true;
                    totalReplacements++;
                    return `${prop}: [${q1}${snake}${q2}]`;
                }
            }
            return match;
        });

        // 3. Global replacement for known problematic ID columns in quoted strings
        // This acts as a fallback for complex usage
        const knownProblems = ['createdById', 'updatedById', 'deletedById', 'eventId', 'categoryId', 'templateId', 'organizerId', 'pageId', 'parentId', 'subscriberId'];
        for (const prob of knownProblems) {
            const regex = new RegExp(`(['"])${prob}(['"])`, 'g');
            if (regex.test(content)) {
                content = content.replace(regex, (match, q1, q2) => {
                    const snake = toSnakeCase(prob);
                    console.log(`   [global] ${file}: ${prob} -> ${snake}`);
                    modified = true;
                    totalReplacements++;
                    return `${q1}${snake}${q2}`;
                });
            }
        }

        if (modified) {
            fs.writeFileSync(filePath, content);
            fixedCount++;
        }
    }

    console.log(`\n🎉 Smart fix Round 2 complete.`);
    console.log(`   Modified ${fixedCount} files`);
    console.log(`   Replaced ${totalReplacements} patterns`);
}

main().catch(console.error);
