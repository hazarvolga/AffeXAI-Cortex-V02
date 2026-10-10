'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { authService } from '@/lib/api/authService';
import { TenantSelector, useTenantSelection } from '@/lib/auth/tenant-selector';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function InvitationForm() {
  const token = useSearchParams().get('token') || '';
  const [tenantId, setTenantId] = useTenantSelection();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!/^invite_[a-f0-9]{64}$/.test(token)) return setError('Davet bağlantısı geçersiz.');
    if (password !== confirmation) return setError('Şifreler eşleşmiyor.');
    setLoading(true);
    try {
      await authService.acceptInvitation(token, password, tenantId);
      setComplete(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Davet kabul edilemedi.');
    } finally {
      setLoading(false);
    }
  };

  return <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>{complete ? 'Hesabınız Hazır' : 'AffeXAI Cortex Daveti'}</CardTitle>
        <CardDescription>{complete ? 'E-posta adresiniz doğrulandı. Şimdi giriş yapabilirsiniz.' : 'Çalışma alanınızı doğrulayın ve hesabınız için bir şifre belirleyin.'}</CardDescription>
      </CardHeader>
      {complete ? <CardFooter><Button asChild className="w-full"><Link href="/login">Giriş Yap</Link></Button></CardFooter> :
        <form onSubmit={submit}>
          <CardContent className="space-y-4">
            <TenantSelector value={tenantId} onChange={setTenantId} disabled={loading} />
            <div className="space-y-2"><Label htmlFor="password">Şifre</Label><Input id="password" type="password" minLength={8} maxLength={128} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="confirmation">Şifreyi doğrulayın</Label><Input id="confirmation" type="password" minLength={8} maxLength={128} autoComplete="new-password" value={confirmation} onChange={event => setConfirmation(event.target.value)} required /></div>
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          </CardContent>
          <CardFooter><Button className="w-full" type="submit" disabled={loading}>{loading ? 'Hesap hazırlanıyor...' : 'Daveti Kabul Et'}</Button></CardFooter>
        </form>}
    </Card>
  </div>;
}

export default function AcceptInvitationPage() {
  return <Suspense fallback={<div className="min-h-screen" />}><InvitationForm /></Suspense>;
}
