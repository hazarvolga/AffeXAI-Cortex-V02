import { QueryRunner } from "typeorm";
import { MissingModuleTables1791453600000 } from "./1791453600000-MissingModuleTables";

const TABLES = [
  "social_accounts",
  "social_posts",
  "post_analytics",
  "social_post_feedback",
  "email_validation_jobs",
  "theme_settings",
  "ai_usage_logs",
  "token_usage",
];

const recorder = () => {
  const statements: string[] = [];
  const runner = {
    query: jest.fn(async (sql: string) => {
      statements.push(sql.replace(/\s+/g, " ").trim());
      return [];
    }),
  } as unknown as QueryRunner;
  return { runner, statements };
};

describe("MissingModuleTables migration", () => {
  it("creates every mapped table idempotently, parents before children", async () => {
    const { runner, statements } = recorder();
    await new MissingModuleTables1791453600000().up(runner);
    const creates = statements
      .filter((sql) => sql.startsWith("CREATE TABLE IF NOT EXISTS"))
      .map((sql) => /"([a-z_]+)"/.exec(sql)?.[1]);
    expect(creates).toEqual(TABLES);
    expect(
      creates.indexOf("social_accounts") < creates.indexOf("social_posts"),
    ).toBe(true);
    const types = statements.filter((sql) => sql.includes("CREATE TYPE"));
    expect(types).toHaveLength(6);
    expect(types.every((sql) => sql.includes("duplicate_object"))).toBe(true);
    expect(
      statements
        .filter((sql) => sql.startsWith("CREATE INDEX"))
        .every((sql) => sql.startsWith("CREATE INDEX IF NOT EXISTS")),
    ).toBe(true);
  });

  it("guards foreign keys and keeps the delete rules the entities declare", async () => {
    const { runner, statements } = recorder();
    await new MissingModuleTables1791453600000().up(runner);
    const sql = statements.join("\n");
    expect(sql).toContain(
      'ALTER TABLE "social_posts" ADD CONSTRAINT "FK_social_posts_account" FOREIGN KEY ("accountId") REFERENCES "social_accounts"("id") ON DELETE CASCADE',
    );
    expect(sql).toContain(
      'ALTER TABLE "theme_settings" ADD CONSTRAINT "FK_theme_settings_header_menu" FOREIGN KEY ("header_menu_id") REFERENCES "cms_menus"("id") ON DELETE SET NULL',
    );
    expect(sql).toContain(
      'ALTER TABLE "social_post_feedback" ADD CONSTRAINT "FK_social_post_feedback_post" FOREIGN KEY ("postId") REFERENCES "social_posts"("id") ON DELETE NO ACTION',
    );
    expect(
      statements
        .filter((s) => s.includes("ADD CONSTRAINT"))
        .every((s) => s.includes("duplicate_object")),
    ).toBe(true);
  });

  it("drops children before parents, then the enum types", async () => {
    const { runner, statements } = recorder();
    await new MissingModuleTables1791453600000().down(runner);
    expect(statements.slice(0, TABLES.length)).toEqual(
      [...TABLES].reverse().map((table) => `DROP TABLE IF EXISTS "${table}"`),
    );
    expect(statements.slice(TABLES.length)).toHaveLength(6);
    expect(
      statements
        .slice(TABLES.length)
        .every((sql) => sql.startsWith('DROP TYPE IF EXISTS "public".')),
    ).toBe(true);
  });
});
