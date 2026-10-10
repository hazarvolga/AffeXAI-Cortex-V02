import { QueryRunner } from "typeorm";
import { TenantAdminPermissions1791417600000 } from "./1791417600000-TenantAdminPermissions";

describe("TenantAdminPermissions migration", () => {
  it("locks roles, audits unknown privileged rows and expands legacy tenant admin wildcard", async () => {
    const calls: Array<{ sql: string; params?: unknown[] }> = [];
    const runner = {
      query: jest.fn(async (sql: string, params?: unknown[]) => {
        calls.push({ sql: sql.trim(), params });
        return [];
      }),
    } as unknown as QueryRunner;

    await new TenantAdminPermissions1791417600000().up(runner);

    expect(calls[0].sql).toBe('LOCK TABLE "roles" IN ACCESS EXCLUSIVE MODE');
    expect(calls.map(({ sql }) => sql).join("\n")).toContain("system.admin");
    expect(calls.map(({ sql }) => sql).join("\n")).toContain("organization_owner");
    expect(calls.at(-1)?.sql).toContain("lower(btrim(wildcard_permission.value)) = '*'");
    const update = calls.at(-1);
    const permissions = JSON.parse(update?.params?.[0] as string) as string[];
    expect(permissions).toContain("users.view");
    expect(permissions).not.toContain("*");
    expect(permissions).not.toContain("system.admin");
    expect(new Set(permissions).size).toBe(permissions.length);
  });

  it("refuses wildcard or platform permissions on an unknown tenant role", async () => {
    const runner = {
      query: jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: "unsafe-role", name: "custom_root" }]),
    } as unknown as QueryRunner;

    await expect(
      new TenantAdminPermissions1791417600000().up(runner),
    ).rejects.toThrow("unknown privileged tenant roles");
  });
});
