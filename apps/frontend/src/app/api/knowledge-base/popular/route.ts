import { NextRequest } from 'next/server';
import { forwardPublicKnowledge } from '../public-proxy';

export async function GET(request: NextRequest) {
  return forwardPublicKnowledge(request.headers.get('x-tenant-id'), '/knowledge-base/popular');
}
