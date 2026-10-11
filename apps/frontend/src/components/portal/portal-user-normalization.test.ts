import assert from "node:assert/strict";
import test from "node:test";
import type { User } from "@affexai/shared-types";
import { normalizeSyncedUser } from "./portal-user-normalization";

const baseUser = {
  id: "user-1",
  tenantId: "tenant-1",
  createdAt: new Date("2026-10-11T08:00:00.000Z"),
  updatedAt: new Date("2026-10-11T08:00:00.000Z"),
  email: "user@example.test",
  firstName: "Deniz",
  lastName: "Kaya",
  isActive: true,
  emailVerified: true,
} as User;

test("normalizes Date values returned by typed clients", () => {
  assert.equal(
    normalizeSyncedUser(baseUser).createdAt,
    "2026-10-11T08:00:00.000Z",
  );
});

test("preserves JSON date strings returned at runtime", () => {
  const jsonUser = {
    ...baseUser,
    createdAt: "2026-10-11T09:00:00.000Z" as unknown as Date,
  };
  assert.equal(
    normalizeSyncedUser(jsonUser).createdAt,
    "2026-10-11T09:00:00.000Z",
  );
});
