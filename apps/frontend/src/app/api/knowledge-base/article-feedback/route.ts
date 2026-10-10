import { NextRequest } from 'next/server';
import { forwardPublicKnowledge } from '../public-proxy';

export async function POST(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug') || '';
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return Response.json({ message: 'Geçersiz makale bağlantısı.' }, { status: 400 });
  }
  const body = await request.json().catch(() => undefined);
  if (!body || typeof body.helpful !== 'boolean' || Object.keys(body).some(key => key !== 'helpful')) {
    return Response.json({ message: 'Geçersiz geri bildirim.' }, { status: 400 });
  }
  const tenantId = request.headers.get('x-tenant-id');
  const articleResponse = await forwardPublicKnowledge(
    tenantId,
    `/knowledge-base/articles/slug/${encodeURIComponent(slug)}`,
  );
  if (!articleResponse.ok) return articleResponse;
  const article = await articleResponse.json();
  if (!article?.id) return Response.json({ message: 'Makale bulunamadı.' }, { status: 404 });
  return forwardPublicKnowledge(
    tenantId,
    `/knowledge-base/articles/${article.id}/feedback`,
    { method: 'POST', body: { isHelpful: body.helpful } },
  );
}
