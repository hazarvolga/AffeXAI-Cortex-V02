import { NextRequest } from 'next/server';
import { forwardPublicKnowledge } from '../public-proxy';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  const categoryId = request.nextUrl.searchParams.get('categoryId') || '';
  if (!UUID.test(categoryId)) return Response.json({ message: 'Geçersiz kategori.' }, { status: 400 });
  return forwardPublicKnowledge(
    request.headers.get('x-tenant-id'),
    `/public/knowledge-base/categories/${categoryId}/path`,
  );
}
