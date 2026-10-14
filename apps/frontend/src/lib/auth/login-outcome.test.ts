import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isTenantSelection,
  LoginError,
  resolveLoginTarget,
} from "./login-outcome";

test("a workspace code selects the tenant login", () => {
  assert.deepEqual(resolveLoginTarget(" xyz-company-ui "), {
    path: "/auth/login",
    headers: { "x-tenant-id": "xyz-company-ui" },
  });
});

test("no workspace code means discovery, with no tenant header at all", () => {
  for (const header of [null, undefined, "", "   "]) {
    assert.deepEqual(resolveLoginTarget(header), {
      path: "/auth/login/discover",
      headers: {},
    });
  }
});

test("a malformed workspace code never reaches the backend", () => {
  assert.throws(() => resolveLoginTarget("../other"));
  assert.throws(() => resolveLoginTarget("a b"));
});

test("only a well-formed selection payload counts as a tenant choice", () => {
  assert.equal(
    isTenantSelection({
      requiresTenantSelection: true,
      tenants: [{ slug: "a", name: "A" }],
    }),
    true,
  );
  assert.equal(isTenantSelection({ access_token: "x", user: {} }), false);
  assert.equal(
    isTenantSelection({
      requiresTenantSelection: true,
      tenants: [{ slug: 1 }],
    }),
    false,
  );
  assert.equal(isTenantSelection(null), false);
});

test("login errors keep their HTTP status", () => {
  const error = new LoginError(429, "Too many");
  assert.equal(error.status, 429);
  assert.ok(error instanceof Error);
});
