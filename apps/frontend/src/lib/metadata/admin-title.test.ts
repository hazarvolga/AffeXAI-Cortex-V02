import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ADMIN_TITLE_TEMPLATE,
  PORTAL_TITLE_TEMPLATE,
  adminTitle,
  portalTitle,
} from "./admin-title";

test("a module title keeps the suffix template for the pages below it", () => {
  assert.deepEqual(adminTitle("Sayfalar"), {
    default: "Sayfalar",
    template: ADMIN_TITLE_TEMPLATE,
  });
  assert.equal(
    ADMIN_TITLE_TEMPLATE.replace("%s", "Sayfalar"),
    "Sayfalar · AffeXAI Cortex",
  );
});

test("portal module titles keep the portal suffix", () => {
  assert.deepEqual(portalTitle("Etkinlikler"), {
    default: "Etkinlikler",
    template: PORTAL_TITLE_TEMPLATE,
  });
});
