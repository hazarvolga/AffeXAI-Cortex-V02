import assert from "node:assert/strict";
import { test } from "node:test";
import { postLoginDestination } from "./post-login-destination";

const staff = {
  tenantId: "tenant-a",
  roleId: "admin",
  roles: [{ name: "admin" }],
};
const customer = {
  tenantId: "tenant-a",
  roleId: "customer",
  roles: [{ name: "customer" }],
};

test("platform authority opens the editorial console", () => {
  assert.equal(
    postLoginDestination({ isPlatformAdmin: true, roleId: "customer" }),
    "/editorial-console",
  );
});

test("tenant staff land in their own tenant admin shell", () => {
  assert.equal(postLoginDestination(staff), "/tenant-a/admin");
  assert.equal(
    postLoginDestination({ tenantId: "tenant-a", roleId: "support_agent" }),
    "/tenant-a/admin/support",
  );
});

test("staff redirects stay inside their own tenant", () => {
  assert.equal(
    postLoginDestination(staff, "/tenant-a/admin/crm?tab=leads"),
    "/tenant-a/admin/crm?tab=leads",
  );
  assert.equal(
    postLoginDestination(staff, "/tenant-b/admin/crm"),
    "/tenant-a/admin",
  );
  assert.equal(
    postLoginDestination(staff, "https://evil.example/x"),
    "/tenant-a/admin",
  );
});

test("portal users land on the portal dashboard and only follow portal redirects", () => {
  assert.equal(postLoginDestination(customer), "/portal/dashboard");
  assert.equal(
    postLoginDestination(customer, "/portal/events"),
    "/portal/events",
  );
  assert.equal(
    postLoginDestination(customer, "/tenant-a/admin"),
    "/portal/dashboard",
  );
  assert.equal(
    postLoginDestination(customer, "//evil.example"),
    "/portal/dashboard",
  );
});

test("an incomplete customer profile is completed before anything else", () => {
  assert.equal(
    postLoginDestination(
      { ...customer, metadata: { isCustomer: true, companyName: "XYZ" } },
      "/portal/events",
    ),
    "/complete-profile",
  );
});

test("role names are matched from every source, case-insensitively", () => {
  assert.equal(
    postLoginDestination({
      tenantId: "t",
      primaryRole: { name: "Support Agent" },
    }),
    "/t/admin",
  );
});

test("a sign-in page is never a destination, so login cannot loop", () => {
  assert.equal(
    postLoginDestination(customer, "/portal/login"),
    "/portal/dashboard",
  );
  assert.equal(
    postLoginDestination(staff, "/tenant-a/admin/login?x=1"),
    "/tenant-a/admin",
  );
  assert.equal(
    postLoginDestination({ isPlatformAdmin: true }, "/admin/login"),
    "/editorial-console",
  );
});
