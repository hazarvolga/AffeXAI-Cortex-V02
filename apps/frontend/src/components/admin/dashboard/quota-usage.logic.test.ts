import assert from "node:assert/strict";
import { test } from "node:test";
import { describeQuota } from "./quota-usage.logic";

const NOW = new Date("2026-10-14T12:00:00Z");

test("used share and days to reset come from the API values", () => {
  const view = describeQuota(
    {
      used: 12_500,
      limit: 50_000,
      remaining: 37_500,
      periodEnd: "2026-10-26T12:00:00Z",
    },
    NOW,
  );
  assert.equal(view.usedPercent, 25);
  assert.equal(view.daysToReset, 12);
  assert.equal(view.level, "ok");
});

test("usage at or above 90% is critical and capped at 100%", () => {
  assert.equal(
    describeQuota(
      {
        used: 46_000,
        limit: 50_000,
        remaining: 4_000,
        periodEnd: "2026-10-15T00:00:00Z",
      },
      NOW,
    ).level,
    "critical",
  );
  assert.equal(
    describeQuota(
      {
        used: 60_000,
        limit: 50_000,
        remaining: 0,
        periodEnd: "2026-10-15T00:00:00Z",
      },
      NOW,
    ).usedPercent,
    100,
  );
});

test("a zero limit or a past period end never produces NaN or negative days", () => {
  const view = describeQuota(
    { used: 0, limit: 0, remaining: 0, periodEnd: "2026-10-01T00:00:00Z" },
    NOW,
  );
  assert.equal(view.usedPercent, 0);
  assert.equal(view.daysToReset, 0);
});
