'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, MailCheck } from 'lucide-react';
import { httpClient } from '@/lib/api/http-client';
import { useToast } from '@/hooks/use-toast';

interface EmailVerificationResult { success: boolean; message: string }

export default function VerifyEmailPage() {
  const token = useParams<{ token: string }>().token;
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyEmail = async () => {
    if (!/^verify_[a-f0-9]{64}$/.test(token || '')) {
      setAttempted(true);
      setError('Doğrulama bağlantısı geçersiz.');
      return;
    }
    setLoading(true);
    setAttempted(true);
    setError(null);
    try {
      const response = await httpClient.postWrapped<EmailVerificationResult>('/auth/verify-email', { token });
      setSuccess(response.success);
      toast({ title: 'E-posta doğrulandı', description: response.message });
      setTimeout(() => router.push('/login'), 1500);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Doğrulama sırasında bir hata oluştu.');
      toast({ title: 'Doğrulama başarısız', description: 'Bağlantı geçersiz veya süresi dolmuş olabilir.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center pb-4">
        {loading ? <><Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" /><CardTitle>E-posta Doğrulanıyor</CardTitle></> :
          success ? <><CheckCircle2 className="mx-auto h-12 w-12 text-green-600" /><CardTitle className="text-green-600">Doğrulama Başarılı</CardTitle></> :
            attempted ? <><XCircle className="mx-auto h-12 w-12 text-red-600" /><CardTitle className="text-red-600">Doğrulama Başarısız</CardTitle></> :
              <><MailCheck className="mx-auto h-12 w-12 text-blue-600" /><CardTitle>E-posta Adresinizi Doğrulayın</CardTitle></>}
        <CardDescription>
          {success ? 'E-posta adresiniz doğrulandı. Giriş sayfasına yönlendiriliyorsunuz.' :
            attempted ? error : 'Hesabınızı etkinleştirmek için aşağıdaki düğmeye basın.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center text-sm text-muted-foreground">
        Doğrulama bağlantıları tek kullanımlıktır ve 24 saat geçerlidir.
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        {!attempted && <Button onClick={verifyEmail} disabled={loading} className="w-full">E-postamı Doğrula</Button>}
        {attempted && !success && <Button onClick={() => router.push('/signup')} className="w-full">Yeni Bağlantı İste</Button>}
        {!success && <Button variant="ghost" onClick={() => router.push('/login')} className="w-full">Giriş Sayfasına Dön</Button>}
      </CardFooter>
    </Card>
  </div>;
}
