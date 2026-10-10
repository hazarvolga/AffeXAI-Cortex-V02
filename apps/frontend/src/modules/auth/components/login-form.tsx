/**
 * Login Form Component
 * 
 * Client-side login form using the auth context.
 */

'use client';

import { useState } from 'react';
import { TenantSelector, useTenantSelection } from '@/lib/auth/tenant-selector';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LogIn, Mail, KeyRound, AlertCircle } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const [tenantId, setTenantId] = useTenantSelection();
  const searchParams = useSearchParams();
  const { login, isLoading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();

    try {
      await login({ email, password, tenantId });

      // Redirect to return URL or dashboard
      const returnUrl = searchParams.get('returnUrl') || '/admin/dashboard';
      router.push(returnUrl);
    } catch (err) {
      // Error is already set in auth context
      console.error('Login failed:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
            <TenantSelector value={tenantId} onChange={setTenantId} disabled={isLoading} />
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">E-posta Adresi</Label>
        <div className="relative flex items-center">
          <Mail className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="ornek@example.com"
            required
            className="pl-10"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Şifre</Label>
        <div className="relative flex items-center">
          <KeyRound className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            className="pl-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? (
          'Giriş Yapılıyor...'
        ) : (
          <>
            <LogIn className="mr-2 h-4 w-4" /> Giriş Yap
          </>
        )}
      </Button>
    </form>
  );
}
