/**
 * Short-lived memory of tokens the backend has just accepted, so the middleware
 * does not call GET /auth/me on every navigation. Only positive results are
 * kept; a revoked token stays usable for at most `ttlMs`. Keys are SHA-256
 * digests (Web Crypto, edge-runtime safe), never the bearer itself.
 */

export interface SessionValidationCacheOptions {
  ttlMs: number;
  maxEntries: number;
  now?: () => number;
}

export interface SessionValidationCache {
  isFresh: (token: string) => Promise<boolean>;
  remember: (token: string) => Promise<void>;
  /** Stored digests, for tests and diagnostics. */
  keys: () => string[];
}

async function digest(token: string): Promise<string> {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return Array.from(new Uint8Array(bytes), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

export function createSessionValidationCache({
  ttlMs,
  maxEntries,
  now = Date.now,
}: SessionValidationCacheOptions): SessionValidationCache {
  // Map keeps insertion order, so the first key is the oldest entry.
  const expiresAt = new Map<string, number>();

  return {
    async isFresh(token) {
      const key = await digest(token);
      const expiry = expiresAt.get(key);
      if (expiry === undefined) return false;
      if (expiry > now()) return true;
      expiresAt.delete(key);
      return false;
    },
    async remember(token) {
      const key = await digest(token);
      expiresAt.delete(key);
      expiresAt.set(key, now() + ttlMs);
      while (expiresAt.size > maxEntries) {
        const oldest = expiresAt.keys().next().value;
        if (oldest === undefined) break;
        expiresAt.delete(oldest);
      }
    },
    keys: () => [...expiresAt.keys()],
  };
}
