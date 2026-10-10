/** Explicit deployment origins; development convenience is limited to true loopback hosts. */
export const API_ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'x-request-start-time',
  'x-tenant-id',
  'x-api-key',
  'Idempotency-Key',
] as const;

export function isAllowedOrigin(origin: string | undefined, allowedOrigins: readonly string[], environment?: string): boolean {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (environment !== 'development') return false;
  try {
    const url = new URL(origin);
    return ['http:', 'https:'].includes(url.protocol) &&
      ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) &&
      !url.username && !url.password && url.origin === origin;
  } catch { return false; }
}
