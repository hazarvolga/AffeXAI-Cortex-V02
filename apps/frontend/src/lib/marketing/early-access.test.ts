import assert from "node:assert/strict";
import { test } from "node:test";
import { getPublicCopy } from "../i18n/public-copy";
import {
  EMPTY_EARLY_ACCESS_VALUES,
  earlyAccessFormTarget,
  isLikelyBot,
  newIdempotencyKey,
  payloadSignature,
  toSubmissionData,
  validateEarlyAccess,
} from "./early-access";

const errors = getPublicCopy("tr").earlyAccess.form.errors;
const valid = {
  ...EMPTY_EARLY_ACCESS_VALUES,
  contactName: " Ada Yılmaz ",
  email: " Ada@Example.com ",
  companyName: "XYZ Company",
};

test("required fields report their own Turkish message", () => {
  assert.deepEqual(validateEarlyAccess(EMPTY_EARLY_ACCESS_VALUES, errors), {
    contactName: errors.nameRequired,
    email: errors.emailRequired,
    companyName: errors.companyRequired,
  });
});

test("an invalid email is explained, a valid form has no errors", () => {
  assert.equal(
    validateEarlyAccess({ ...valid, email: "ada@" }, errors).email,
    errors.emailInvalid,
  );
  assert.deepEqual(validateEarlyAccess(valid, errors), {});
});

test("the optional message is capped at the backend string limit", () => {
  const result = validateEarlyAccess(
    { ...valid, message: "x".repeat(2001) },
    errors,
  );
  assert.equal(result.message, "Bu alan en fazla 2000 karakter olabilir.");
});

test("submission data is trimmed, omits an empty message and never carries the honeypot", () => {
  assert.deepEqual(toSubmissionData({ ...valid, website: "spam" }), {
    contactName: "Ada Yılmaz",
    email: "ada@example.com",
    companyName: "XYZ Company",
  });
  assert.equal(toSubmissionData({ ...valid, message: " CRM " }).message, "CRM");
});

test("a filled honeypot marks the request as a bot", () => {
  assert.equal(isLikelyBot(valid), false);
  assert.equal(isLikelyBot({ ...valid, website: "http://x" }), true);
});

test("retries of the same data share a signature; changed data does not", () => {
  const a = payloadSignature({ email: "a@b.co", contactName: "A" });
  assert.equal(a, payloadSignature({ contactName: "A", email: "a@b.co" }));
  assert.notEqual(a, payloadSignature({ contactName: "B", email: "a@b.co" }));
});

test("idempotency keys satisfy the backend header pattern", () => {
  const key = newIdempotencyKey();
  assert.match(key, /^[A-Za-z0-9_-]{16,80}$/);
  assert.notEqual(key, newIdempotencyKey());
});

test("the form target is only used when both settings are well formed", () => {
  const id = "3f2c8a6e-1b4d-4c7e-9a2f-5d6e7f8a9b0c";
  assert.deepEqual(earlyAccessFormTarget(" affexai ", id), {
    tenant: "affexai",
    formId: id,
  });
  assert.equal(earlyAccessFormTarget(undefined, id), null);
  assert.equal(earlyAccessFormTarget("affexai", "not-a-uuid"), null);
  assert.equal(earlyAccessFormTarget("../x", id), null);
});
