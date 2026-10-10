import { NextRequest } from 'next/server';
import { forwardKnowledgeTaxonomy, taxonomyToken, validMutationOrigin, validTaxonomyBody } from '../taxonomy-proxy';

export function GET(request: NextRequest) {
  return forwardKnowledgeTaxonomy(
    taxonomyToken(request, request.cookies.get('auth_token')?.value || ''),
    'GET',
    '/knowledge-base/categories/admin/all',
  );
}

export async function POST(request: NextRequest) {
  if (!validMutationOrigin(request)) {
    return Response.json({ message: 'Geçersiz istek kaynağı.' }, { status: 403 });
  }
  const body = await request.json().catch(() => undefined);
  if (!validTaxonomyBody(body, true)) return Response.json({ message: 'Geçersiz kategori alanları.' }, { status: 400 });
  return forwardKnowledgeTaxonomy(
    taxonomyToken(request, request.cookies.get('auth_token')?.value || ''),
    'POST',
    '/knowledge-base/categories',
    body,
  );
}
