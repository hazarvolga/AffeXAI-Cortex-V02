import assert from "node:assert/strict";
import test from "node:test";
import { applyResponseCachePolicy } from "./response-cache";

for (const path of [
  "/api/auth/me",
  "/api/tickets/attachments/file.png",
  "/portal/support",
  "/survey/token",
  "/help",
]) {
  test(`keeps ${path} private without inventing encoding`, () => {
    const headers = new Headers();
    applyResponseCachePolicy(headers, path);
    assert.equal(headers.get("Cache-Control"), "private, no-store");
    assert.equal(headers.has("Content-Encoding"), false);
  });
}

for (const path of ["/_next/static/chunk.js", "/static/logo.png"]) {
  test(`allows caching explicit static path ${path}`, () => {
    const headers = new Headers();
    applyResponseCachePolicy(headers, path);
    assert.match(headers.get("Cache-Control") ?? "", /immutable/);
  });
}
