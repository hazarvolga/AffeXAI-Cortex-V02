import assert from "node:assert/strict";
import test from "node:test";
import {
  protectedLoginPath,
  safePostLoginRedirect,
  tenantAwareAdminFallback,
} from "./admin-login-routing";

test("tenant admin authentication uses a login route outside the legacy admin layout", () => {
  assert.equal(
    protectedLoginPath(true, "xyz-company-ui"),
    "/xyz-company-ui/admin/login",
  );
  assert.equal(protectedLoginPath(true), "/admin/login");
  assert.equal(protectedLoginPath(false, "xyz-company-ui"), "/login");
});

test("post-login redirect accepts local paths and rejects external destinations", () => {
  const fallback = "/xyz-company-ui/admin";

  assert.equal(
    safePostLoginRedirect("/xyz-company-ui/admin/crm?view=active", fallback),
    "/xyz-company-ui/admin/crm?view=active",
  );
  assert.equal(
    safePostLoginRedirect("https://attacker.example", fallback),
    fallback,
  );
  assert.equal(safePostLoginRedirect("//attacker.example", fallback), fallback);
  assert.equal(
    safePostLoginRedirect("/\\attacker.example", fallback),
    fallback,
  );
  assert.equal(safePostLoginRedirect(null, fallback), fallback);
});

test("tenant login keeps staff fallbacks and redirects inside the current tenant", () => {
  assert.equal(
    tenantAwareAdminFallback("/admin/cms", "xyz-company-ui"),
    "/xyz-company-ui/admin/cms",
  );
  assert.equal(
    tenantAwareAdminFallback("/portal/dashboard", "xyz-company-ui"),
    "/portal/dashboard",
  );
  assert.equal(tenantAwareAdminFallback("/admin", undefined), "/admin");

  const fallback = "/xyz-company-ui/admin";
  assert.equal(
    safePostLoginRedirect(
      "/xyz-company-ui/admin/crm",
      fallback,
      "xyz-company-ui",
    ),
    "/xyz-company-ui/admin/crm",
  );
  assert.equal(
    safePostLoginRedirect("/other-tenant/admin", fallback, "xyz-company-ui"),
    fallback,
  );
  assert.equal(
    safePostLoginRedirect("/admin", fallback, "xyz-company-ui"),
    fallback,
  );
});
