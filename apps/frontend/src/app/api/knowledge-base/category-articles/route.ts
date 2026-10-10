import { NextRequest } from 'next/server';
import { forwardPublicKnowledge } from '../public-proxy';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams;
  const categoryId = query.get('categoryId') || '';
  const limit = query.get('limit') || '20';
  const offset = query.get('offset') || '0';
  const descendants = query.get('includeSubcategories') || 'false';
  if (!UUID.test(categoryId) || !/^\d+$/.test(limit) || Number(limit) < 1 || Number(limit) > 100 ||
      !/^\d+$/.test(offset) || Number(offset) > 10_000 || !['true', 'false'].includes(descendants)) {
    return Response.json({ message: 'Geçersiz kategori veya sayfalama.' }, { status: 400 });
  }
  const backendQuery = new URLSearchParams({ limit, offset, includeSubcategories: descendants });
  return forwardPublicKnowledge(
    request.headers.get('x-tenant-id'),
    `/public/knowledge-base/categories/${categoryId}/articles?${backendQuery}`,
  );
}
