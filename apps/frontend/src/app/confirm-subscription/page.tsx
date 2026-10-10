'use client';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
function Confirm() {
  const token = useSearchParams().get('token');
  const [state, setState] = useState<'ready' | 'pending' | 'success' | 'error'>('ready');
  async function confirm() {
    if (!token) return;
    setState('pending');
    try {
      const response = await fetch(`/api/email-marketing/subscription/confirm/${encodeURIComponent(token)}`, { method: 'POST', cache: 'no-store' });
      setState(response.ok ? 'success' : 'error');
    } catch { setState('error'); }
  }
  return <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6"><Card className="max-w-md w-full"><CardHeader><CardTitle>Bülten aboneliğini onayla</CardTitle></CardHeader><CardContent className="space-y-4">
    {!token || state === 'error' ? <><p role="alert">Bağlantı eksik, kullanılmış veya süresi dolmuş. Yeni bir onay bağlantısı isteyin.</p><Link href="/resubscribe" className="underline">Yeni bağlantı iste</Link></> : state === 'success' ? <p role="status">Aboneliğiniz onaylandı.</p> : <><p>Bu bültene abone olmak istiyorsanız onaylayın. Bağlantı 24 saat geçerlidir ve tek kullanımlıktır.</p><Button onClick={confirm} disabled={state === 'pending'}>{state === 'pending' ? 'Onaylanıyor…' : 'Aboneliği onayla'}</Button></>}
    <p><Link href="/preferences" className="text-sm underline">Tercihlerim</Link></p>
  </CardContent></Card></main>;
}
export default function ConfirmPage() { return <Suspense fallback={<p>Yükleniyor…</p>}><Confirm /></Suspense>; }
