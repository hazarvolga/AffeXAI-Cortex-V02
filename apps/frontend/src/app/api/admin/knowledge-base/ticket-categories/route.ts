import { NextRequest } from 'next/server';
import { forwardKnowledgeTaxonomy, taxonomyToken } from '../taxonomy-proxy';

export function GET(request: NextRequest) {
  return forwardKnowledgeTaxonomy(
    taxonomyToken(request, request.cookies.get('auth_token')?.value || ''),
    'GET',
    '/ticket-categories',
  );
}
