import assert from "node:assert/strict";
import { test } from "node:test";
import { describeValidation } from "./validation-view";

test("each returned check gets a Turkish label and a pass/fail flag, in a stable order", () => {
  const view = describeValidation({
    email: "a@gmial.com",
    isValid: false,
    status: "risky",
    confidence: 42,
    checks: {
      typo: {
        isValid: false,
        details: "Possible typo",
        suggestion: "gmail.com",
      },
      syntax: { isValid: true, details: "ok" },
      mx: { isValid: false, details: "No MX records" },
    },
  });
  assert.equal(view.statusLabel, "Riskli");
  assert.deepEqual(
    view.checks.map((c) => [c.label, c.passed]),
    [
      ["Biçim", true],
      ["MX kaydı", false],
      ["Yazım hatası", false],
    ],
  );
  assert.equal(view.suggestion, "a@gmail.com");
});

test("an unknown result says the check could not be completed", () => {
  const view = describeValidation({
    email: "x@y.co",
    isValid: false,
    status: "unknown",
    confidence: 0,
    error: "timeout",
  });
  assert.equal(view.statusLabel, "Doğrulanamadı");
  assert.deepEqual(view.checks, []);
});
