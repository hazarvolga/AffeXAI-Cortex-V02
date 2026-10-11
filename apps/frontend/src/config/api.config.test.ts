import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildApiUrls } from "./api.config";

describe("buildApiUrls", () => {
  it("builds a single API path from a bare backend origin", () => {
    assert.deepEqual(buildApiUrls("https://api.example.com"), {
      BASE_URL: "https://api.example.com",
      API_URL: "https://api.example.com/api",
    });
  });

  it("removes an existing API suffix before building the API URL", () => {
    assert.deepEqual(buildApiUrls("https://api.example.com/api"), {
      BASE_URL: "https://api.example.com",
      API_URL: "https://api.example.com/api",
    });
  });
});
