/** Where the session tokens live in cookies and Web Storage. */
export const ACCESS_TOKEN_KEY = "affexai_access_token";
export const REFRESH_TOKEN_KEY = "affexai_refresh_token";

/**
 * Names earlier releases stored the session under. They are only read as a
 * fallback, so existing sessions survive the rename, and always cleared on
 * sign-out. Remove once a release has been live for a full refresh-token
 * lifetime (30 days).
 */
export const LEGACY_ACCESS_TOKEN_KEY = "aluplan_access_token";
export const LEGACY_REFRESH_TOKEN_KEY = "aluplan_refresh_token";

/** Every access-token name, newest first, for readers that accept any of them. */
export const ACCESS_TOKEN_KEYS = [
  "auth_token",
  ACCESS_TOKEN_KEY,
  LEGACY_ACCESS_TOKEN_KEY,
] as const;

/** Every name a session may be stored under; sign-out clears them all. */
export const SESSION_STORAGE_KEYS = [
  "auth_token",
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  LEGACY_ACCESS_TOKEN_KEY,
  LEGACY_REFRESH_TOKEN_KEY,
  "cortex_access_token",
  "cortex_refresh_token",
  "access_token",
  "refresh_token",
] as const;

/** The first token found under any accepted name. */
export function readAccessToken(
  get: (key: string) => string | null | undefined,
): string | null {
  for (const key of ACCESS_TOKEN_KEYS) {
    const value = get(key);
    if (value) return value;
  }
  return null;
}
