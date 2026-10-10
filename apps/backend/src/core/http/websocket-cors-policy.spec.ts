import {
  configuredWebSocketOrigins,
  createWebSocketOriginValidator,
} from "./websocket-cors-policy";

function validate(
  origin: string | undefined,
  environment: string,
  allowedOrigins: string[],
): Promise<boolean> {
  return new Promise((resolve) => {
    createWebSocketOriginValidator(environment, allowedOrigins)(
      origin,
      (error) => {
        resolve(!error);
      },
    );
  });
}

describe("WebSocket CORS origin boundary", () => {
  it("normalizes configured API and frontend origins", () => {
    expect(
      configuredWebSocketOrigins({
        CORS_ORIGINS: "https://a.example, https://b.example",
        FRONTEND_URL: "https://a.example",
      } as NodeJS.ProcessEnv),
    ).toEqual(["https://a.example", "https://b.example"]);
  });

  it("fails closed for unconfigured browser origins in production", async () => {
    await expect(
      validate("https://attacker.example", "production", []),
    ).resolves.toBe(false);
    await expect(validate(undefined, "production", [])).resolves.toBe(false);
  });

  it("accepts only exact configured production origins", async () => {
    const allowed = ["https://app.example"];
    await expect(
      validate("https://app.example", "production", allowed),
    ).resolves.toBe(true);
    await expect(
      validate("https://app.example.attacker.test", "production", allowed),
    ).resolves.toBe(false);
  });

  it("keeps loopback convenience limited to development", async () => {
    await expect(
      validate("http://localhost:9003", "development", []),
    ).resolves.toBe(true);
    await expect(
      validate("http://localhost:9003", "production", []),
    ).resolves.toBe(false);
  });
});
