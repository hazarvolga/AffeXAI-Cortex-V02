import { isAllowedOrigin } from "./cors-policy";

type OriginCallback = (error: Error | null, allow?: boolean) => void;

export function configuredWebSocketOrigins(
  environment = process.env,
): string[] {
  const configured = [environment.CORS_ORIGINS, environment.FRONTEND_URL]
    .filter((value): value is string => Boolean(value))
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);

  return [...new Set(configured)];
}

/**
 * Socket.IO calls this function during the HTTP upgrade. Exact configured
 * origins are accepted; development additionally permits true loopback hosts.
 * An empty production allowlist therefore rejects every browser origin.
 */
export function createWebSocketOriginValidator(
  environment = process.env.NODE_ENV,
  allowedOrigins = configuredWebSocketOrigins(),
) {
  return (origin: string | undefined, callback: OriginCallback): void => {
    if (environment === "production" && allowedOrigins.length === 0) {
      callback(new Error("WebSocket origin allowlist is not configured"));
      return;
    }

    if (isAllowedOrigin(origin, allowedOrigins, environment)) {
      callback(null, true);
      return;
    }

    callback(new Error("Origin not allowed"));
  };
}
