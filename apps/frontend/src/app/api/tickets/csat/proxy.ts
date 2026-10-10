export function csatBackendUrl(value = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9006'): string {
  const base = value.replace(/\/+$/, '');
  return base.endsWith('/api') ? base : `${base}/api`;
}

export async function forwardCSAT(token: string, method: 'GET' | 'POST', body?: unknown, userAgent?: string): Promise<Response> {
  const headers = { 'Cache-Control': 'no-store' };
  if (!/^[a-f0-9]{64}$/.test(token)) return Response.json({ message: 'Anket bulunamadı veya bağlantının süresi doldu.' }, { status: 404, headers });
  if (method === 'POST' && (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !['rating', 'feedback', 'responses'].includes(key)))) return Response.json({ message: 'Geçersiz anket yanıtı.' }, { status: 400, headers });
  try {
    const response = await fetch(`${csatBackendUrl()}/tickets/csat/survey/${token}${method === 'POST' ? '/submit' : ''}`, {
      method, cache: 'no-store', signal: AbortSignal.timeout(10000),
      headers: { 'Content-Type': 'application/json', ...(userAgent ? { 'User-Agent': userAgent.slice(0, 255) } : {}) },
      ...(method === 'POST' ? { body: JSON.stringify(body) } : {}),
    });
    const payload = await response.json();
    if (!response.ok) return Response.json({ message: response.status === 404 ? 'Anket bulunamadı veya bağlantının süresi doldu.' : 'Anket yanıtı işlenemedi. Bağlantı kullanılmış veya bilgiler geçersiz olabilir.' }, { status: response.status, headers });
    const data = payload?.success === true && Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload;
    return Response.json(data, { status: response.status, headers });
  } catch {
    return Response.json({ message: 'Anket hizmetine şu anda ulaşılamıyor. Lütfen tekrar deneyin.' }, { status: 503, headers });
  }
}
