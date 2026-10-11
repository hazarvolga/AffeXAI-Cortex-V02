import assert from "node:assert/strict";
import test from "node:test";
import { activityDate } from "./PortalActivityPanel";
import { eventDate } from "./PortalEventsPanel";

test("portal dates use the explicit Istanbul timezone", () => {
  assert.match(activityDate("2026-10-11T08:00:00.000Z"), /11:00/);
  assert.match(eventDate("2026-10-11T23:30:00.000Z"), /12 Ekim 2026/);
});

test("invalid API dates render a stable fallback", () => {
  assert.equal(activityDate("invalid"), "Tarih bilgisi yok");
  assert.equal(eventDate("invalid"), "Tarih bilgisi yok");
});
