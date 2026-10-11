import { QueryRunner } from "typeorm";
import { EventPermissionNormalization1791446400000 } from "./1791446400000-EventPermissionNormalization";

describe("EventPermissionNormalization migration", () => {
  it("normalizes the attendee permission and grants portal event read access", async () => {
    const calls: Array<{ sql: string; params?: unknown[] }> = [];
    const runner = {
      query: jest.fn(async (sql: string, params?: unknown[]) => {
        calls.push({ sql: sql.trim(), params });
        return [];
      }),
    } as unknown as QueryRunner;

    await new EventPermissionNormalization1791446400000().up(runner);

    expect(calls[0].sql).toBe('LOCK TABLE "roles" IN ACCESS EXCLUSIVE MODE');
    const sql = calls.map(({ sql }) => sql).join("\n");
    expect(sql).toContain("events.participants");
    expect(sql).toContain("events.manage_attendees");
    expect(sql).toContain("events.view");
    expect(calls.at(-1)?.params?.[0]).toEqual([
      "admin",
      "customer",
      "organization_owner",
      "student",
      "subscriber",
      "viewer",
    ]);
  });

  it("refuses malformed permission documents before changing roles", async () => {
    const runner = {
      query: jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: "bad-role", name: "customer" }]),
    } as unknown as QueryRunner;

    await expect(
      new EventPermissionNormalization1791446400000().up(runner),
    ).rejects.toThrow("malformed permission documents");
  });
});
