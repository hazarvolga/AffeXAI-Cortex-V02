/** Only explicit static directories may be cached across users. */
export function applyResponseCachePolicy(
  headers: Headers,
  pathname: string,
): void {
  if (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/static/")
  ) {
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    return;
  }
  headers.set("Cache-Control", "private, no-store");
}
