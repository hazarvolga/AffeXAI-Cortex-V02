'use client';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
function Unsubscribe() {
  const token = useSearchParams().get('token');
  const [state, setState] = useState<'ready' | 'pending' | 'success' | 'error'>('ready');
  const [reason, setReason] = useState('');
  async function unsubscribe() {
    if (!token) return;
    setState('pending');
    try {
      const response = await fetch(`/api/email-marketing/subscription/unsubscribe/${encodeURIComponent(token)}?reason=${encodeURIComponent(reason)}`, { method: 'POST', cache: 'no-store' });
      setState(response.ok ? 'success' : 'error');
    } catch { setState('error'); }
  }
  return <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6"><Card className="max-w-md w-full"><CardHeader><CardTitle>Bülten aboneliğinden çık</CardTitle></CardHeader><CardContent className="space-y-4">
    {!token || state === 'error' ? <><p role="alert">Bağlantı eksik, kullanılmış veya süresi dolmuş. Hesabınıza giriş yaparak tercihlerinizi kapatabilir veya en son bültendeki bağlantıyı kullanabilirsiniz.</p><Link href="/preferences" className="underline">Tercihlerimi yönet</Link></> : state === 'success' ? <p role="status">Abonelikten çıktınız. Pazarlama e-postaları kapatıldı.</p> : <><label htmlFor="reason">Ayrılma nedeniniz (isteğe bağlı)</label><Textarea id="reason" value={reason} maxLength={500} onChange={event => setReason(event.target.value)} /><Button onClick={unsubscribe} disabled={state === 'pending'}>{state === 'pending' ? 'İşleniyor…' : 'Abonelikten çık'}</Button></>}
    <p><Link href="/resubscribe" className="text-sm underline">Yeniden onay bağlantısı iste</Link></p>
  </CardContent></Card></main>;
}
export default function UnsubscribePage() { return <Suspense fallback={<p>Yükleniyor…</p>}><Unsubscribe /></Suspense>; }
