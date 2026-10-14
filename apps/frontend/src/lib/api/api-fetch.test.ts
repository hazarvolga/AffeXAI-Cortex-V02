import assert from "node:assert/strict";
import { test } from "node:test";
import { readApiData, withSessionHeaders } from "./api-fetch";

test("adds the bearer token and the tenant from the current route", () => {
  const headers = withSessionHeaders(undefined, {
    token: "t-1",
    tenant: "acme",
  });
  assert.equal(headers.get("Authorization"), "Bearer t-1");
  assert.equal(headers.get("x-tenant-id"), "acme");
});

test("never overrides headers the caller set explicitly", () => {
  const headers = withSessionHeaders(
    { Authorization: "Bearer own", "x-tenant-id": "other" },
    { token: "t-1", tenant: "acme" },
  );
  assert.equal(headers.get("Authorization"), "Bearer own");
  assert.equal(headers.get("x-tenant-id"), "other");
});

test("signed-out callers send no Authorization header at all", () => {
  const headers = withSessionHeaders(
    { "Content-Type": "application/json" },
    { token: null, tenant: undefined },
  );
  assert.equal(headers.has("Authorization"), false);
  assert.equal(headers.has("x-tenant-id"), false);
  assert.equal(headers.get("Content-Type"), "application/json");
});

test("readApiData unwraps the backend success envelope and passes plain bodies through", async () => {
  const wrapped = new Response(
    JSON.stringify({ success: true, data: [{ id: 1 }], meta: {} }),
  );
  assert.deepEqual(await readApiData(wrapped), [{ id: 1 }]);
  assert.deepEqual(
    await readApiData(new Response(JSON.stringify([{ id: 2 }]))),
    [{ id: 2 }],
  );
});
