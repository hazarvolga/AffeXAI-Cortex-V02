const LOCAL_BACKEND = "http://127.0.0.1:9006";

interface BackendEnv {
  BACKEND_URL?: string;
  NEXT_PUBLIC_API_URL?: string;
}

/**
 * Base URL (ending in /api) for server-side calls from Next route handlers.
 * BACKEND_URL is the internal address; NEXT_PUBLIC_API_URL may point back at
 * this frontend (same-origin setups), so it is only a fallback.
 */
export function backendApiUrl(
  env: BackendEnv = {
    BACKEND_URL: process.env.BACKEND_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
): string {
  const configured =
    env.BACKEND_URL?.trim() || env.NEXT_PUBLIC_API_URL?.trim() || LOCAL_BACKEND;
  const normalized = configured.replace(/\/+$/, "");
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
}
