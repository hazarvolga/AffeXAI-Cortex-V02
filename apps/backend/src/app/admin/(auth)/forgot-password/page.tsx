
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Şifrenizi mi Unuttunuz?</CardTitle>
        <CardDescription>
          Endişelenmeyin, olur böyle şeyler. E-posta adresinizi girin, size şifrenizi sıfırlamanız için bir bağlantı gönderelim.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">E-posta Adresi</Label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <Input id="email" type="email" placeholder="ornek@example.com" className="pl-10" />
            </div>
          </div>
          <Button type="submit" className="w-full">
            Sıfırlama Bağlantısı Gönder
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Şifrenizi hatırladınız mı?{' '}
          <Link href="/admin/login" className="font-medium text-primary hover:underline">
            Giriş yapın
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
