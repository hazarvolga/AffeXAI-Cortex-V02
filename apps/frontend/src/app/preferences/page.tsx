'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { httpClient } from '@/lib/api/http-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

interface Preferences { marketingEmails: boolean; emailNotifications: boolean; status: string; }
export default function PreferencesPage() {
  const { user, isLoading } = useAuth();
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!user?.email) return;
    let current = true;
    httpClient.getWrapped<Preferences>(`/email-marketing/subscription/preferences/${encodeURIComponent(user.email)}`)
      .then(data => { if (current) setPreferences(data); })
      .catch(() => { if (current) setMessage('Abonelik tercihleri yüklenemedi. Önce bülten aboneliğinizi onayladığınızdan emin olun.'); });
    return () => { current = false; };
  }, [user?.email]);
  async function save() {
    if (!user?.email || !preferences) return;
    setSaving(true); setMessage('');
    try {
      const saved = await httpClient.putWrapped<Preferences>('/email-marketing/subscription/preferences', {
        email: user.email, marketingEmails: preferences.marketingEmails, emailNotifications: preferences.emailNotifications,
      });
      setPreferences(saved); setMessage('Tercihleriniz kaydedildi.');
    } catch { setMessage('Tercihler kaydedilemedi. Pazarlama iletilerini açmak için onaylanmış abonelik gerekir.'); }
    finally { setSaving(false); }
  }
  return <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6"><Card className="w-full max-w-lg">
    <CardHeader><CardTitle>E-posta tercihlerim</CardTitle><CardDescription>Yalnız kendi hesabınızın bülten tercihlerini yönetebilirsiniz.</CardDescription></CardHeader>
    <CardContent className="space-y-5">{isLoading ? <p>Hesabınız yükleniyor…</p> : !user ? <>
      <p>Tercihlerinize güvenli biçimde erişmek için çalışma alanınızdaki hesabınıza giriş yapın.</p>
      <Button asChild><Link href="/login?redirect=/preferences">Giriş yap</Link></Button>
      <p className="text-sm text-slate-600">Hesabınız yoksa, size gönderilen bültenin abonelikten çıkma bağlantısını kullanabilirsiniz.</p>
    </> : <><p className="text-sm">{user.email}</p>{preferences && <>
      <label className="flex items-center justify-between gap-4">Pazarlama e-postaları<Switch checked={preferences.marketingEmails} onCheckedChange={checked => setPreferences({ ...preferences, marketingEmails: checked })} /></label>
      <label className="flex items-center justify-between gap-4">Bülten bildirimleri<Switch checked={preferences.emailNotifications} onCheckedChange={checked => setPreferences({ ...preferences, emailNotifications: checked })} /></label>
      <Button onClick={save} disabled={saving}>{saving ? 'Kaydediliyor…' : 'Tercihleri kaydet'}</Button>
    </>}</>}{message && <p role="status" className="text-sm">{message}</p>}<p><Link href="/resubscribe" className="text-sm underline">Bülten aboneliğini onayla</Link></p></CardContent>
  </Card></main>;
}
