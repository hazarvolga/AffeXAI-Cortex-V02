import { tenantHeaders } from '@/lib/auth/tenant-selection';

export function knowledgePublicBackendUrl(
  value = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9006',
): string {
  const base = value.replace(/\/+$/, '').replace('localhost', '127.0.0.1');
  return base.endsWith('/api') ? base : `${base}/api`;
}

export async function forwardPublicKnowledge(
  tenantId: unknown,
  path: string,
  options: { method?: 'GET' | 'POST'; body?: unknown } = {},
): Promise<Response> {
  const responseHeaders = { 'Cache-Control': 'public, max-age=0, must-revalidate' };
  let selector: Record<'x-tenant-id', string>;
  try {
    selector = tenantHeaders(tenantId);
  } catch {
    return Response.json(
      { message: 'Geçerli bir çalışma alanı bağlantısı kullanın.' },
      { status: 400, headers: responseHeaders },
    );
  }

  try {
    const result = await fetch(`${knowledgePublicBackendUrl()}${path}`, {
      method: options.method || 'GET',
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
      headers: {
        Accept: 'application/json',
        ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...selector,
      },
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    });
    const json = await result.json().catch(() => undefined);
    if (!result.ok) {
      return Response.json(
        { message: json?.message || 'Bilgi bankası isteği tamamlanamadı.' },
        { status: result.status, headers: responseHeaders },
      );
    }
    const data = json?.success === true && Object.prototype.hasOwnProperty.call(json, 'data')
      ? json.data
      : json;
    return Response.json(data, { status: result.status, headers: responseHeaders });
  } catch {
    return Response.json(
      { message: 'Bilgi bankası hizmetine ulaşılamıyor.' },
      { status: 503, headers: responseHeaders },
    );
  }
}
