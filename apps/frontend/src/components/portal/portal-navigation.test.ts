import assert from "node:assert/strict";
import test from "node:test";
import {
  PORTAL_NAVIGATION_ITEMS,
  getPortalNavigation,
  hasPortalRole,
  isPortalRouteActive,
  normalizePortalRoles,
} from "./portal-navigation";

const hrefsFor = (user: unknown): string[] =>
  getPortalNavigation(user).map(({ href }) => href);

test("the shared navigation model contains only real portal routes and no debug entry", () => {
  assert.ok(PORTAL_NAVIGATION_ITEMS.length > 0);
  assert.ok(
    PORTAL_NAVIGATION_ITEMS.every(({ href }) => href.startsWith("/portal/")),
  );
  assert.equal(
    PORTAL_NAVIGATION_ITEMS.some(({ href }) => href.includes("caching-test")),
    false,
  );
  assert.equal(
    PORTAL_NAVIGATION_ITEMS.some(({ href }) => /^\/[^/]+\/portal\//.test(href)),
    false,
  );
  assert.equal(Object.isFrozen(PORTAL_NAVIGATION_ITEMS), true);
  assert.ok(PORTAL_NAVIGATION_ITEMS.every((item) => Object.isFrozen(item)));
  assert.ok(
    PORTAL_NAVIGATION_ITEMS.filter(({ access }) => Array.isArray(access)).every(
      ({ access }) => Object.isFrozen(access),
    ),
  );
});

test("role normalization safely unions multi-role, primary and legacy role sources", () => {
  const user = {
    roles: [{ name: " Customer " }, { name: "STUDENT" }, { name: null }, null],
    primaryRole: { name: "Subscriber" },
    roleEntity: { name: "ADMIN" },
  };

  assert.deepEqual(normalizePortalRoles(user), [
    "customer",
    "student",
    "subscriber",
    "admin",
  ]);
  assert.equal(hasPortalRole(user, "CUSTOMER"), true);
  assert.equal(hasPortalRole(user, " viewer "), false);
  assert.deepEqual(normalizePortalRoles(null), []);
  assert.deepEqual(normalizePortalRoles({ roles: "customer" }), []);
});

test("customer and student navigation follows the same role policy", () => {
  const customer = hrefsFor({ roles: [{ name: "CUSTOMER" }] });
  const student = hrefsFor({ primaryRole: { name: "Student" } });

  assert.deepEqual(customer, [
    "/portal/dashboard",
    "/portal/orders",
    "/portal/licenses",
    "/portal/support",
    "/portal/kb",
    "/portal/courses",
    "/portal/certificates",
    "/portal/newsletter",
    "/portal/events",
    "/portal/profile",
  ]);
  assert.deepEqual(student, [
    "/portal/dashboard",
    "/portal/courses",
    "/portal/certificates",
    "/portal/newsletter",
    "/portal/events",
    "/portal/profile",
  ]);
});

test("multi-role access is additive and legacy roleEntity remains supported", () => {
  const multiRole = hrefsFor({
    roles: [{ name: "subscriber" }, { name: "STUDENT" }],
    primaryRole: { name: "customer" },
  });
  const legacyCustomer = hrefsFor({ roleEntity: { name: "CuStOmEr" } });

  assert.ok(multiRole.includes("/portal/orders"));
  assert.ok(multiRole.includes("/portal/courses"));
  assert.deepEqual(legacyCustomer, hrefsFor({ roles: [{ name: "customer" }] }));
});

test("viewer content follows explicit newsletter preferences", () => {
  const noPreferences = hrefsFor({
    primaryRole: { name: "viewer" },
    metadata: { newsletterPreferences: null },
  });
  const eventsOnly = hrefsFor({
    roles: [{ name: "VIEWER" }],
    metadata: { newsletterPreferences: { events: true } },
  });
  const productUpdates = hrefsFor({
    roleEntity: { name: "viewer" },
    metadata: { newsletterPreferences: { productUpdates: true } },
  });
  const promotions = hrefsFor({
    roles: [{ name: "viewer" }],
    metadata: { newsletterPreferences: { promotions: true } },
  });

  assert.deepEqual(noPreferences, ["/portal/dashboard", "/portal/profile"]);
  assert.deepEqual(eventsOnly, [
    "/portal/dashboard",
    "/portal/newsletter",
    "/portal/events",
    "/portal/profile",
  ]);
  assert.deepEqual(productUpdates, [
    "/portal/dashboard",
    "/portal/newsletter",
    "/portal/profile",
  ]);
  assert.deepEqual(promotions, [
    "/portal/dashboard",
    "/portal/newsletter",
    "/portal/profile",
  ]);
});

test("customer privilege overrides viewer newsletter filtering", () => {
  const links = hrefsFor({
    roles: [{ name: "viewer" }, { name: "CUSTOMER" }],
    metadata: { newsletterPreferences: {} },
  });

  assert.ok(links.includes("/portal/newsletter"));
  assert.ok(links.includes("/portal/events"));
  assert.ok(links.includes("/portal/kb"));
});

test("anonymous and malformed user values are handled without throwing", () => {
  assert.deepEqual(hrefsFor(null), [
    "/portal/dashboard",
    "/portal/newsletter",
    "/portal/events",
    "/portal/profile",
  ]);
  assert.deepEqual(hrefsFor({ roles: [{}, 1, "student"] }), hrefsFor(null));
  assert.equal(Object.isFrozen(getPortalNavigation(null)), true);
});

test("active route matching accepts exact and child paths without prefix collisions", () => {
  assert.equal(isPortalRouteActive("/portal/orders", "/portal/orders"), true);
  assert.equal(
    isPortalRouteActive("/portal/orders/123", "/portal/orders"),
    true,
  );
  assert.equal(
    isPortalRouteActive("/portal/orders/123?tab=invoice", "/portal/orders/"),
    true,
  );
  assert.equal(
    isPortalRouteActive("/portal/orders-old", "/portal/orders"),
    false,
  );
  assert.equal(isPortalRouteActive("/portal/order", "/portal/orders"), false);
  assert.equal(isPortalRouteActive(null, "/portal/orders"), false);
  assert.equal(isPortalRouteActive("/portal/orders", "#"), false);
});
