
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, KeyRound } from "lucide-react";
import Link from "next/link";

export default function UserPortalLoginPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <div className="absolute top-8 left-8">
            <Link href="/" className="text-2xl font-bold text-primary">
                Aluplan Digital
            </Link>
        </div>
        <Card className="w-full max-w-md">
        <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Kullanıcı Portalı</CardTitle>
            <CardDescription>Hesabınıza erişmek için bilgilerinizi girin.</CardDescription>
        </CardHeader>
        <form>
            <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="email">E-posta Adresi</Label>
                <div className="relative flex items-center">
                    <Mail className="absolute left-3 h-4 w-4 text-muted-foreground" />
                    <Input id="email" name="email" type="email" placeholder="ornek@example.com" required className="pl-10" />
                </div>
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="password">Şifre</Label>
                    <Link href="#" className="text-sm font-medium text-primary hover:underline">
                        Şifrenizi mi unuttunuz?
                    </Link>
                </div>
                <div className="relative flex items-center">
                    <KeyRound className="absolute left-3 h-4 w-4 text-muted-foreground" />
                    <Input id="password" name="password" type="password" required className="pl-10" />
                </div>
            </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full">
                <LogIn className="mr-2"/> Giriş Yap
            </Button>
            <div className="text-center text-sm text-muted-foreground">
                    Hesabınız yok mu? <Link href="#" className="font-medium text-primary hover:underline">Destek ile İletişime Geçin</Link>
                </div>
            </CardFooter>
        </form>
        </Card>
    </div>
  );
}
