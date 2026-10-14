import { THROTTLER_SKIP } from "@nestjs/throttler/dist/throttler.constants";
import { AuthController } from "./auth.controller";

/**
 * Every protected page load validates the session through GET /auth/me from the
 * frontend server, so all users share that server's IP. The global per-IP limit
 * must not apply there; brute-force limits stay on the credential endpoints.
 */
describe("auth session validation throttling", () => {
  const skips = (method: keyof AuthController) =>
    Reflect.getMetadata(
      `${THROTTLER_SKIP}default`,
      AuthController.prototype[method],
    );

  it("does not rate-limit GET /auth/me by IP", () => {
    expect(skips("getCurrentUser")).toBe(true);
  });

  it("keeps the IP rate limit on login discovery", () => {
    expect(skips("discoverLogin")).toBeUndefined();
  });
});
