import { QueryRunner } from "typeorm";
import { FaqPipelineState1791450000000 } from "./1791450000000-FaqPipelineState";

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

describe("FaqPipelineState migration", () => {
  it("creates the table the faq-learning dashboard reads, safely when it already exists", async () => {
    const { runner, statements } = recorder();
    await new FaqPipelineState1791450000000().up(runner);
    const sql = statements.join("\n");
    expect(sql).toContain(
      "CREATE TYPE \"public\".\"faq_pipeline_state_status_enum\" AS ENUM('running', 'stopped', 'error')",
    );
    expect(sql).toContain("EXCEPTION WHEN duplicate_object");
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS "faq_pipeline_state"');
    for (const column of [
      '"tenantId" character varying(255)',
      '"status"',
      '"lastRun"',
      '"nextScheduledRun"',
      '"dailyProcessingCount"',
      '"totalFaqsGenerated"',
      '"lastError" jsonb',
      '"processingConfig" jsonb',
      '"createdAt"',
      '"updatedAt"',
    ]) {
      expect(sql).toContain(column);
    }
    expect(sql).toContain(
      'CREATE INDEX IF NOT EXISTS "IDX_faq_pipeline_state_tenant" ON "faq_pipeline_state" ("tenantId")',
    );
  });

  it("drops the table and its enum type on revert", async () => {
    const { runner, statements } = recorder();
    await new FaqPipelineState1791450000000().down(runner);
    expect(statements).toEqual([
      'DROP TABLE IF EXISTS "faq_pipeline_state"',
      'DROP TYPE IF EXISTS "public"."faq_pipeline_state_status_enum"',
    ]);
  });
});
