import assert from "node:assert/strict";
import { test } from "node:test";
import { createSessionValidationCache } from "./session-validation-cache";

test("a validated token is reused until its entry expires", async () => {
  let now = 1_000;
  const cache = createSessionValidationCache({
    ttlMs: 30_000,
    maxEntries: 10,
    now: () => now,
  });
  assert.equal(await cache.isFresh("token-a"), false);
  await cache.remember("token-a");
  assert.equal(await cache.isFresh("token-a"), true);
  now += 30_000;
  assert.equal(await cache.isFresh("token-a"), false);
});

test("the cache keeps at most maxEntries tokens, dropping the oldest", async () => {
  const cache = createSessionValidationCache({
    ttlMs: 30_000,
    maxEntries: 2,
    now: () => 0,
  });
  await cache.remember("a");
  await cache.remember("b");
  await cache.remember("c");
  assert.equal(await cache.isFresh("a"), false);
  assert.equal(await cache.isFresh("b"), true);
  assert.equal(await cache.isFresh("c"), true);
});

test("tokens are stored as SHA-256 digests, never as the raw bearer value", async () => {
  const cache = createSessionValidationCache({
    ttlMs: 30_000,
    maxEntries: 2,
    now: () => 0,
  });
  await cache.remember("secret-bearer");
  const [key] = cache.keys();
  assert.match(key, /^[0-9a-f]{64}$/);
});
