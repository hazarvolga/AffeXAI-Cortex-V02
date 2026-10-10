import { NextRequest } from 'next/server';
import { forwardCSAT } from '../../../proxy';
export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  let body: unknown;
  try { body = await request.json(); }
  catch { return Response.json({ message: 'Geçersiz anket yanıtı.' }, { status: 400 }); }
  return forwardCSAT((await params).token, 'POST', body, request.headers.get('user-agent') || undefined);
}
