import { NextRequest } from 'next/server';
import { forwardCSAT } from '../../proxy';
export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  return forwardCSAT((await params).token, 'GET');
}
