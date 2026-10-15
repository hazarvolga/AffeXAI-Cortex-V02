import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ACCESS_TOKEN_KEY,
  LEGACY_ACCESS_TOKEN_KEY,
  SESSION_STORAGE_KEYS,
  readAccessToken,
} from "./session-keys";

test("the current names win and a session stored under the old name still reads", () => {
  const store = new Map<string, string>([[LEGACY_ACCESS_TOKEN_KEY, "old"]]);
  assert.equal(
    readAccessToken((key) => store.get(key)),
    "old",
  );
  store.set(ACCESS_TOKEN_KEY, "new");
  assert.equal(
    readAccessToken((key) => store.get(key)),
    "new",
  );
  assert.equal(
    readAccessToken(() => undefined),
    null,
  );
});

test("sign-out clears both the current and the legacy names", () => {
  assert.ok(SESSION_STORAGE_KEYS.includes(ACCESS_TOKEN_KEY));
  assert.ok(SESSION_STORAGE_KEYS.includes(LEGACY_ACCESS_TOKEN_KEY));
});
