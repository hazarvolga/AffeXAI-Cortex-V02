import { readdirSync, readFileSync } from "fs";
import { join } from "path";

const SRC = join(__dirname, "..", "..");
const MIGRATION_DIRS = [
  join(__dirname, "migrations"),
  join(SRC, "database", "migrations"),
];

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)],
  );

function entityTables(): Map<string, string> {
  const tables = new Map<string, string>();
  for (const file of walk(join(SRC, "modules"))) {
    if (!file.endsWith(".entity.ts")) continue;
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(
      /@Entity\(\s*(?:\{[^}]*name:\s*)?["'`]([a-z0-9_]+)["'`]/g,
    )) {
      tables.set(match[1], file.slice(SRC.length + 1));
    }
  }
  return tables;
}

function migratedTables(): Set<string> {
  const tables = new Set<string>();
  for (const dir of MIGRATION_DIRS) {
    for (const file of readdirSync(dir)) {
      if (!/^\d{13}-.+\.ts$/.test(file)) continue;
      const source = readFileSync(join(dir, file), "utf8");
      for (const match of source.matchAll(
        /CREATE TABLE (?:IF NOT EXISTS )?(?:"public"\.)?"?([a-z0-9_]+)"?/g,
      )) {
        tables.add(match[1]);
      }
      for (const match of source.matchAll(
        /createTable\(\s*new Table\(\{\s*name:\s*["'`]([a-z0-9_]+)["'`]/g,
      )) {
        tables.add(match[1]);
      }
      // Table names a migration builds statements from (see MissingModuleTables).
      for (const match of source.matchAll(/^\s+"([a-z0-9_]+)",\n\s+`/gm)) {
        tables.add(match[1]);
      }
    }
  }
  return tables;
}

describe("entity ↔ migration coverage", () => {
  it("creates a table in the active migration history for every mapped entity", () => {
    const migrated = migratedTables();
    const missing = [...entityTables()]
      .filter(([table]) => !migrated.has(table))
      .map(([table, file]) => `${table} (${file})`);
    expect(missing).toEqual([]);
  });

  it("finds the entities it guards", () => {
    expect(entityTables().size).toBeGreaterThan(90);
  });
});
