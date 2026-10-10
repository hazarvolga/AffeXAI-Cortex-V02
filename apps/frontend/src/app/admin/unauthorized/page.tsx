'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

export default function UnauthorizedPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <ShieldAlert className="h-16 w-16 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Erişim Engellendi</CardTitle>
          <CardDescription>
            Bu sayfaya erişim yetkiniz bulunmamaktadır.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            {user && (
              <p>
                Kullanıcı: <span className="font-medium">{user.email}</span>
                <br />
                Rol: <span className="font-medium">{user.roleId}</span>
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={() => router.push('/admin')} className="w-full">
              Ana Sayfaya Dön
            </Button>
            <Button onClick={() => router.back()} variant="outline" className="w-full">
              Geri Git
            </Button>
            <Button onClick={() => logout()} variant="ghost" className="w-full">
              Çıkış Yap
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
