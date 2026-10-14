import assert from "node:assert/strict";
import { test } from "node:test";
import { backendApiUrl } from "./backend-api-url";

test("server routes prefer BACKEND_URL over the browser-facing API URL", () => {
  assert.equal(
    backendApiUrl({
      BACKEND_URL: "http://backend:9006",
      NEXT_PUBLIC_API_URL: "https://app.example/api",
    }),
    "http://backend:9006/api",
  );
});

test("the public API URL is used only when no internal URL is set", () => {
  assert.equal(
    backendApiUrl({ NEXT_PUBLIC_API_URL: "https://api.example/api/" }),
    "https://api.example/api",
  );
});

test("with nothing configured the local backend is assumed, always with one /api prefix", () => {
  assert.equal(backendApiUrl({}), "http://127.0.0.1:9006/api");
  assert.equal(
    backendApiUrl({ BACKEND_URL: " http://backend:9006/api/ " }),
    "http://backend:9006/api",
  );
});
