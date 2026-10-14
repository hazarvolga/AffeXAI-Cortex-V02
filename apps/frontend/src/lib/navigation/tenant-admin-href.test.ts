import assert from "node:assert/strict";
import { test } from "node:test";
import { tenantAdminHref } from "./tenant-admin-href";

test("prefixes admin paths with the encoded workspace slug", () => {
  assert.equal(
    tenantAdminHref("acme", "/email/subscribers"),
    "/acme/admin/email/subscribers",
  );
  assert.equal(tenantAdminHref("a b", "/email"), "/a%20b/admin/email");
});

test("without a workspace it falls back to the platform admin tree", () => {
  assert.equal(tenantAdminHref(undefined, "/email"), "/admin/email");
});
