import { knowledgeBackendUrl } from './proxy';

type TaxonomyMethod = 'GET' | 'POST' | 'PUT';

export async function forwardKnowledgeTaxonomy(
  token: string,
  method: TaxonomyMethod,
  path: string,
  body?: unknown,
): Promise<Response> {
  const headers = { 'Cache-Control': 'private, no-store' };
  if (!token) return Response.json({ message: 'Oturum açmanız gerekiyor.' }, { status: 401, headers });
  try {
    const result = await fetch(`${knowledgeBackendUrl()}${path}`, {
      method,
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const json = await result.json().catch(() => undefined);
    if (!result.ok) {
      return Response.json(
        { message: json?.error?.message || json?.message || 'Kategori işlemi tamamlanamadı.' },
        { status: result.status, headers },
      );
    }
    const data = json?.success === true && Object.prototype.hasOwnProperty.call(json, 'data')
      ? json.data
      : json;
    return Response.json(data, { status: result.status, headers });
  } catch {
    return Response.json({ message: 'Kategori hizmetine ulaşılamıyor.' }, { status: 503, headers });
  }
}

export function taxonomyToken(request: Request & { headers: Headers }, cookieToken = ''): string {
  const authorization = request.headers.get('authorization');
  return authorization?.startsWith('Bearer ') ? authorization.slice(7) : cookieToken;
}

export function validMutationOrigin(request: Request & { headers: Headers }): boolean {
  if (request.headers.get('sec-fetch-site') === 'cross-site') return false;
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    const requestHost = request.headers.get('x-forwarded-host') || request.headers.get('host');
    return Boolean(requestHost) && new URL(origin).host === requestHost;
  } catch {
    return false;
  }
}

export function validTaxonomyBody(body: unknown, creating: boolean): body is Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  const record = body as Record<string, unknown>;
  if (Object.keys(record).some(key => !['name', 'description', 'ticketCategoryId'].includes(key))) return false;
  if (creating && (typeof record.name !== 'string' || record.name.trim().length < 2 || record.name.length > 255)) return false;
  if (!creating && record.name !== undefined && (typeof record.name !== 'string' || record.name.trim().length < 2 || record.name.length > 255)) return false;
  if (record.description !== undefined && (typeof record.description !== 'string' || record.description.length > 1000)) return false;
  if (record.ticketCategoryId !== undefined && record.ticketCategoryId !== null &&
      (typeof record.ticketCategoryId !== 'string' || !/^[0-9a-f-]{36}$/i.test(record.ticketCategoryId))) return false;
  return true;
}
