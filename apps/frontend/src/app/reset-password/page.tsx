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

function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get('token') || '';
  const [tenantId, setTenantId] = useTenantSelection();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!/^reset_[a-f0-9]{64}$/.test(token)) {
      setError('Şifre sıfırlama bağlantısı geçersiz.');
      return;
    }
    if (password !== confirmation) {
      setError('Şifreler eşleşmiyor.');
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword(token, password, tenantId);
      setComplete(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Şifre güncellenemedi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>{complete ? 'Şifreniz Güncellendi' : 'Yeni Şifre Belirleyin'}</CardTitle>
          <CardDescription>
            {complete ? 'Eski oturumlarınız kapatıldı. Yeni şifrenizle giriş yapabilirsiniz.' : 'Çalışma alanınızı ve yeni şifrenizi girin.'}
          </CardDescription>
        </CardHeader>
        {complete ? (
          <CardFooter>
            <Button asChild className="w-full"><Link href="/login">Giriş Sayfasına Git</Link></Button>
          </CardFooter>
        ) : (
          <form onSubmit={submit}>
            <CardContent className="space-y-4">
              <TenantSelector value={tenantId} onChange={setTenantId} disabled={loading} />
              <div className="space-y-2">
                <Label htmlFor="password">Yeni şifre</Label>
                <Input id="password" type="password" minLength={8} maxLength={128} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmation">Yeni şifreyi doğrulayın</Label>
                <Input id="confirmation" type="password" minLength={8} maxLength={128} autoComplete="new-password" value={confirmation} onChange={event => setConfirmation(event.target.value)} required />
              </div>
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}</Button>
              <Button asChild variant="outline" className="w-full"><Link href="/login">Giriş Sayfasına Dön</Link></Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<div className="min-h-screen" />}><ResetPasswordForm /></Suspense>;
}
