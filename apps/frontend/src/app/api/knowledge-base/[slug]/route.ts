import { NextRequest } from 'next/server';
import { forwardPublicKnowledge } from '../public-proxy';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return Response.json({ message: 'Geçersiz makale bağlantısı.' }, { status: 400 });
  }
  return forwardPublicKnowledge(
    request.headers.get('x-tenant-id'),
    `/knowledge-base/articles/slug/${encodeURIComponent(slug)}`,
  );
}
