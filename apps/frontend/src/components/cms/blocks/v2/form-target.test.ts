import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveFormTarget, subscribeToNewsletter } from "./form-target";

test("a contact block is connected only when both tenant and form id are set", () => {
  assert.deepEqual(resolveFormTarget({ formTenant: "acme", formId: "f-1" }), {
    tenant: "acme",
    formId: "f-1",
  });
  assert.equal(resolveFormTarget({ formTenant: "acme" }), null);
  assert.equal(resolveFormTarget({ formTenant: "  ", formId: "f-1" }), null);
  assert.equal(resolveFormTarget({}), null);
});

test("newsletter signup reports success only on a 2xx response", async () => {
  const calls: Array<{ url: string; body: string }> = [];
  const ok = async (url: string, init?: RequestInit) => {
    calls.push({ url, body: String(init?.body) });
    return new Response("{}", { status: 200 });
  };
  assert.equal(await subscribeToNewsletter("a@b.co", ok), "sent");
  assert.equal(calls[0].url, "/api/email-marketing/subscription/subscribe");
  assert.deepEqual(JSON.parse(calls[0].body), { email: "a@b.co" });

  assert.equal(
    await subscribeToNewsletter(
      "a@b.co",
      async () => new Response("", { status: 429 }),
    ),
    "rateLimited",
  );
  assert.equal(
    await subscribeToNewsletter(
      "a@b.co",
      async () => new Response("", { status: 500 }),
    ),
    "error",
  );
  assert.equal(
    await subscribeToNewsletter("a@b.co", async () => {
      throw new TypeError("offline");
    }),
    "error",
  );
});
