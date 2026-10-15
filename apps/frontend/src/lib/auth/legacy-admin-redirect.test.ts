import assert from "node:assert/strict";
import { test } from "node:test";
import { legacyAdminTarget, tokenTenant } from "./legacy-admin-redirect";

test("legacy admin pages move to the same page in the user's workspace", () => {
  assert.equal(legacyAdminTarget("/admin", "acme"), "/acme/admin");
  assert.equal(legacyAdminTarget("/admin/", "acme"), "/acme/admin");
  assert.equal(
    legacyAdminTarget("/admin/cms/pages", "acme"),
    "/acme/admin/cms/pages",
  );
  assert.equal(
    legacyAdminTarget("/admin/support/faq-learning/review", "acme"),
    "/acme/admin/support/faq-learning/review",
  );
  assert.equal(
    legacyAdminTarget("/admin/settings", "acme co"),
    "/acme%20co/admin/settings",
  );
});

test("pages keyed by id in the legacy tree land on the matching list or form", () => {
  assert.equal(
    legacyAdminTarget("/admin/events/123e4567", "acme"),
    "/acme/admin/events",
  );
  assert.equal(
    legacyAdminTarget("/admin/events/new", "acme"),
    "/acme/admin/events/new",
  );
  assert.equal(
    legacyAdminTarget("/admin/users/u-1", "acme"),
    "/acme/admin/users",
  );
  assert.equal(
    legacyAdminTarget("/admin/users/new", "acme"),
    "/acme/admin/users/new",
  );
  assert.equal(
    legacyAdminTarget("/admin/users/roles/r-1", "acme"),
    "/acme/admin/roles",
  );
  assert.equal(
    legacyAdminTarget("/admin/users/roles", "acme"),
    "/acme/admin/roles",
  );
  assert.equal(
    legacyAdminTarget("/admin/users/roles/create-new-role", "acme"),
    "/acme/admin/roles",
  );
  assert.equal(
    legacyAdminTarget("/admin/email-marketing/campaigns", "acme"),
    "/acme/admin/email/campaigns",
  );
});

test("sign-in pages, pages without a workspace equivalent and tenantless users stay", () => {
  for (const path of [
    "/admin/login",
    "/admin/signup",
    "/admin/forgot-password",
    "/admin/unauthorized",
  ]) {
    assert.equal(legacyAdminTarget(path, "acme"), null, path);
  }
  for (const path of [
    "/admin/settings/billing",
    "/admin/events/email-templates",
    "/admin/users/email-templates",
  ]) {
    assert.equal(legacyAdminTarget(path, "acme"), null, path);
  }
  assert.equal(legacyAdminTarget("/admin/cms", null), null);
  assert.equal(
    legacyAdminTarget("/acme/admin/cms", "acme"),
    null,
    "already in a workspace",
  );
  assert.equal(legacyAdminTarget("/administrator", "acme"), null);
});

test("the workspace is read from the validated token's tenantId claim", () => {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const token = (claims: object) =>
    `${encode({ alg: "HS256" })}.${encode(claims)}.signature`;
  assert.equal(tokenTenant(token({ sub: "u", tenantId: "acme" })), "acme");
  assert.equal(tokenTenant(token({ sub: "u", tenantId: null })), null);
  assert.equal(
    tokenTenant(token({ sub: "u", tenantId: "admin" })),
    null,
    "reserved slugs are not workspaces",
  );
  assert.equal(tokenTenant("not-a-jwt"), null);
});
