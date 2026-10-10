'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { login, type LoginState } from './actions';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { KeyRound, LogIn, Mail, Terminal } from "lucide-react";
import Link from "next/link";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Giriş Yapılıyor...' : <><LogIn className="mr-2 h-4 w-4"/> Giriş Yap</>}
    </Button>
  );
}

export default function LoginPage() {
  const initialState: LoginState = { message: '' };
  const [state, formAction] = useActionState(login, initialState);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Yönetim Paneli Girişi</CardTitle>
        <CardDescription>Hesabınıza erişmek için e-posta ve şifrenizi girin.</CardDescription>
      </CardHeader>
      <form action={formAction}>
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
                <Link href="/admin/forgot-password" className="text-sm font-medium text-primary hover:underline">
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
           {state.message && (
             <Alert variant={state.issues ? 'destructive' : 'default'}>
                <Terminal className="h-4 w-4" />
                <AlertTitle>{state.issues ? 'Hata' : 'Durum'}</AlertTitle>
                <AlertDescription>
                {state.message}
                {state.issues && (
                    <ul className="list-disc list-inside mt-2">
                        {state.issues.map((issue, i) => <li key={i}>{issue}</li>)}
                    </ul>
                )}
                </AlertDescription>
            </Alert>
           )}
          <SubmitButton />
           <div className="text-center text-sm text-muted-foreground">
                Hesabınız yok mu? <Link href="/admin/signup" className="font-medium text-primary hover:underline">Kayıt Olun</Link>
            </div>
        </CardFooter>
      </form>
    </Card>
  );
}