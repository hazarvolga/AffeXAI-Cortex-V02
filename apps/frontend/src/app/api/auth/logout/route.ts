import { tenantHeaders } from '@/lib/auth/tenant-selection';
import { NextRequest, NextResponse } from 'next/server';

function backendApiUrl(): string {
  const configured = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9006';
  const ipv4 = configured.replace('localhost', '127.0.0.1').replace('::1', '127.0.0.1');
  return ipv4.replace(/\/$/, '').endsWith('/api') ? ipv4.replace(/\/$/, '') : `${ipv4.replace(/\/$/, '')}/api`;
}

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get('auth_token')?.value;
  let revoked = false;

  if (accessToken) {
    try {
      const selector = tenantHeaders(request.headers.get('x-tenant-id'));
      const response = await fetch(`${backendApiUrl()}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, ...selector },
        cache: 'no-store',
      });
      revoked = response.ok;
    } catch {
      revoked = false;
    }
  }

  const response = NextResponse.json({ success: true, revoked });
  for (const name of [
    'auth_token',
    'aluplan_access_token',
    'aluplan_refresh_token',
    'cortex_access_token',
    'cortex_refresh_token',
    'access_token',
    'refresh_token',
  ]) {
    response.cookies.set(name, '', { expires: new Date(0), path: '/' });
  }
  return response;
}
