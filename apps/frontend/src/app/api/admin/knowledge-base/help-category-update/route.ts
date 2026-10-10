import { NextRequest } from 'next/server';
import { forwardKnowledgeTaxonomy, taxonomyToken, validMutationOrigin, validTaxonomyBody } from '../taxonomy-proxy';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PUT(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id') || '';
  if (!UUID.test(id)) return Response.json({ message: 'Geçersiz kategori.' }, { status: 400 });
  if (!validMutationOrigin(request)) {
    return Response.json({ message: 'Geçersiz istek kaynağı.' }, { status: 403 });
  }
  const body = await request.json().catch(() => undefined);
  if (!validTaxonomyBody(body, false) || Object.keys(body).length === 0) {
    return Response.json({ message: 'Geçersiz kategori alanları.' }, { status: 400 });
  }
  return forwardKnowledgeTaxonomy(
    taxonomyToken(request, request.cookies.get('auth_token')?.value || ''),
    'PUT',
    `/knowledge-base/categories/${id}`,
    body,
  );
}
