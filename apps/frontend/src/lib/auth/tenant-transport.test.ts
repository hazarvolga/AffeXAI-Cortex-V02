import assert from "node:assert/strict";
import { test } from "node:test";
import { authService } from "../api/authService";
import { httpClient } from "../api/http-client";
import { LoginError } from "./login-outcome";

test("login forwards only credentials in body and explicit workspace in header", async () => {
  const previous = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (_url, options) => {
    calls++;
    assert.equal(
      new Headers(options?.headers).get("x-tenant-id"),
      "xyz-company",
    );
    assert.deepEqual(JSON.parse(String(options?.body)), {
      email: "demo@xyz.example",
      password: "not-a-real-password",
    });
    return Response.json({ error: "expected-test-rejection" }, { status: 401 });
  };
  try {
    await assert.rejects(
      authService.login({
        email: "demo@xyz.example",
        password: "not-a-real-password",
        tenantId: "xyz-company",
      }),
      (error: unknown) => error instanceof LoginError && error.status === 401,
    );
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = previous;
  }
});

test("login without a workspace sends no tenant header and returns the workspace choice untouched", async () => {
  const previous = globalThis.fetch;
  const selection = {
    requiresTenantSelection: true,
    tenants: [
      { slug: "a", name: "A" },
      { slug: "b", name: "B" },
    ],
  };
  globalThis.fetch = async (_url, options) => {
    assert.equal(new Headers(options?.headers).get("x-tenant-id"), null);
    return Response.json(selection);
  };
  try {
    assert.deepEqual(
      await authService.login({
        email: "demo@xyz.example",
        password: "not-a-real-password",
      }),
      selection,
    );
  } finally {
    globalThis.fetch = previous;
  }
});

test("a malformed workspace code is rejected before any request", async () => {
  const previous = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return Response.json({});
  };
  try {
    await assert.rejects(
      authService.login({
        email: "demo@xyz.example",
        password: "x",
        tenantId: "../other",
      }),
      /çalışma alanı/,
    );
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = previous;
  }
});

test("registration and duplicate checks carry explicit tenant headers", async () => {
  const previous = httpClient.postWrapped;
  const seen: string[] = [];
  httpClient.postWrapped = async (url, _body, config) => {
    assert.equal(config?.headers?.["x-tenant-id"], "xyz-company");
    seen.push(url);
    throw new Error("captured-test-request");
  };
  try {
    await assert.rejects(
      authService.checkEmailExists("demo@xyz.example", "xyz-company"),
      /captured-test-request/,
    );
    await assert.rejects(
      authService.register(
        {
          firstName: "Demo",
          lastName: "User",
          email: "demo@xyz.example",
          password: "not-a-real-password",
        },
        "xyz-company",
      ),
      /captured-test-request/,
    );
    await assert.rejects(
      authService.checkEmailExists("demo@xyz.example"),
      /çalışma alanı/,
    );
    assert.deepEqual(seen, ["/auth/check-email", "/auth/register"]);
  } finally {
    httpClient.postWrapped = previous;
  }
});

test("login BFF routes by header only and never trusts a tenant in the body", async () => {
  const { POST } = await import("../../app/api/auth/login/route");
  const { NextRequest } = await import("next/server");
  const previous = globalThis.fetch;
  const seen: Array<{ url: string; tenant: string | null; body: unknown }> = [];
  globalThis.fetch = async (url, options) => {
    seen.push({
      url: String(url),
      tenant: new Headers(options?.headers).get("x-tenant-id"),
      body: JSON.parse(String(options?.body)),
    });
    return Response.json(
      { message: "expected-test-rejection" },
      { status: 401 },
    );
  };
  try {
    const malformed = await POST(
      new NextRequest("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "x-tenant-id": "../x" },
        body: JSON.stringify({ email: "demo@xyz.example", password: "p" }),
      }),
    );
    assert.equal(malformed.status, 400);
    assert.equal(seen.length, 0);

    const discovery = await POST(
      new NextRequest("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "demo@xyz.example",
          password: "not-a-real-password",
          tenantId: "body-is-not-authority",
        }),
      }),
    );
    assert.equal(discovery.status, 401);
    assert.match(seen[0].url, /\/auth\/login\/discover$/);
    assert.equal(seen[0].tenant, null);
    assert.deepEqual(seen[0].body, {
      email: "demo@xyz.example",
      password: "not-a-real-password",
    });

    const tenantLogin = await POST(
      new NextRequest("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "x-tenant-id": "xyz-company" },
        body: JSON.stringify({
          email: "demo@xyz.example",
          password: "not-a-real-password",
          tenantId: "ignored-body-tenant",
        }),
      }),
    );
    assert.equal(tenantLogin.status, 401);
    assert.match(seen[1].url, /\/auth\/login$/);
    assert.equal(seen[1].tenant, "xyz-company");
  } finally {
    globalThis.fetch = previous;
  }
});
