import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

const originalBackendUrl = process.env.BACKEND_URL;
const originalFetch = globalThis.fetch;

afterEach(() => {
  if (originalBackendUrl === undefined) {
    delete process.env.BACKEND_URL;
  } else {
    process.env.BACKEND_URL = originalBackendUrl;
  }
  globalThis.fetch = originalFetch;
});

test("allows a protected route when the backend validates the token", async () => {
  process.env.BACKEND_URL = "http://backend:9006";
  let authHeader: string | null = null;
  let requestedUrl = "";
  globalThis.fetch = async (input, init) => {
    requestedUrl = String(input);
    authHeader = new Headers(init?.headers).get("authorization");
    return Response.json({ success: true, data: { id: "user-1" } });
  };

  const request = new NextRequest("http://localhost/admin/dashboard", {
    headers: { cookie: "auth_token=valid-token" },
  });
  const response = await middleware(request);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-middleware-next"), "1");
  assert.equal(requestedUrl, "http://backend:9006/api/auth/me");
  assert.equal(authHeader, "Bearer valid-token");
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
});

test("redirects to login when the backend rejects the token", async () => {
  process.env.BACKEND_URL = "http://backend:9006";
  globalThis.fetch = async () =>
    Response.json({ success: false }, { status: 401 });

  const request = new NextRequest("http://localhost/admin/dashboard", {
    headers: { authorization: "Bearer invalid-token" },
  });
  const response = await middleware(request);

  assert.equal(response.status, 307);
  assert.equal(
    response.headers.get("location"),
    "http://localhost/admin/login?redirect=%2Fadmin%2Fdashboard",
  );
});

test("returns 503 when backend validation responds with a server error", async () => {
  process.env.BACKEND_URL = "http://backend:9006";
  globalThis.fetch = async () =>
    Response.json({ message: "internal error" }, { status: 500 });

  const request = new NextRequest("http://localhost/admin/dashboard", {
    headers: { cookie: "auth_token=valid-looking-token" },
  });
  const response = await middleware(request);

  assert.equal(response.status, 503);
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  assert.equal(response.headers.get("location"), null);
});

test("returns 503 when backend validation is unavailable", async () => {
  process.env.BACKEND_URL = "http://backend:9006";
  globalThis.fetch = async () => {
    throw new Error("backend unavailable");
  };

  const request = new NextRequest("http://localhost/portal/dashboard", {
    headers: { cookie: "auth_token=valid-looking-token" },
  });
  const response = await middleware(request);

  assert.equal(response.status, 503);
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  assert.equal(response.headers.get("location"), null);
});

test("returns 503 when BACKEND_URL is missing", async () => {
  delete process.env.BACKEND_URL;

  const request = new NextRequest("http://localhost/admin/dashboard", {
    headers: { cookie: "auth_token=valid-looking-token" },
  });
  const response = await middleware(request);

  assert.equal(response.status, 503);
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  assert.equal(response.headers.get("location"), null);
});
