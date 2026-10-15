import assert from "node:assert/strict";
import { test } from "node:test";
import { activeCmsItem, cmsNavItems, isCmsOverview } from "./cms-workbench-nav";

test("every workbench link stays inside the tenant's CMS", () => {
  const items = cmsNavItems("acme co");
  assert.ok(items.length >= 8);
  for (const item of items)
    assert.match(item.href, /^\/acme%20co\/admin\/cms(\/|$)/);
});

test("the deepest matching section is active and the overview only matches exactly", () => {
  const items = cmsNavItems("acme");
  assert.equal(
    activeCmsItem(items, "/acme/admin/cms/pages/new")?.label,
    "Sayfalar",
  );
  assert.equal(
    activeCmsItem(items, "/acme/admin/cms/analytics/heatmaps")?.label,
    "Analitik",
  );
  assert.equal(activeCmsItem(items, "/acme/admin/cms")?.label, "Genel bakış");
  assert.equal(activeCmsItem(items, "/acme/admin/cms-other"), undefined);
});

test("the overview renders its own shell, every other CMS route gets the frame", () => {
  assert.equal(isCmsOverview("/acme/admin/cms", "acme"), true);
  assert.equal(isCmsOverview("/acme/admin/cms/", "acme"), true);
  assert.equal(isCmsOverview("/acme/admin/cms/pages", "acme"), false);
});
