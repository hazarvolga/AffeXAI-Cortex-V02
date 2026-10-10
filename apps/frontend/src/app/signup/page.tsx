'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { User, Mail, KeyRound, Phone, Building2, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authService } from '@/lib/api';
import { TenantSelector, useTenantSelection } from '@/lib/auth/tenant-selector';
import { requireTenantSlug } from '@/lib/auth/tenant-selection';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [tenantId, setTenantId] = useTenantSelection();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [emailValidating, setEmailValidating] = useState(false);
  const [emailValidation, setEmailValidation] = useState<{
    isValid: boolean;
    message: string;
    suggestion?: string;
  } | null>(null);
  const [emailExists, setEmailExists] = useState(false);
  
  // Newsletter preferences
  const [newsletterPreferences, setNewsletterPreferences] = useState({
    productUpdates: false,
    events: false,
    promotions: false,
  });

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    
    // Reset email validation when email changes
    if (id === 'email') {
      setEmailValidation(null);
      setEmailExists(false);
    }
  };

  // Public signup checks format and availability within the selected workspace.
  // A changed email/selector cancels stale results from the previous request.
  useEffect(() => {
    let active = true;
    setEmailValidation(null);
    setEmailExists(false);
    setEmailValidating(false);
    if (!formData.email) return;
    try { requireTenantSlug(tenantId); } catch { return; }
    const timeout = setTimeout(async () => {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setEmailValidation({ isValid: false, message: 'Geçersiz email formatı' });
        return;
      }
      setEmailValidating(true);
      try {
        const { exists } = await authService.checkEmailExists(formData.email, tenantId);
        if (!active) return;
        setEmailExists(exists);
        setEmailValidation({ isValid: !exists, message: exists ? 'Bu email adresi bu çalışma alanında zaten kayıtlı' : 'Email kullanılabilir' });
      } catch {
        if (active) setEmailValidation({ isValid: false, message: 'Çalışma alanı ve email doğrulanamadı' });
      } finally {
        if (active) setEmailValidating(false);
      }
    }, 800);
    return () => { active = false; clearTimeout(timeout); };
  }, [formData.email, tenantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!emailValidation?.isValid) {
      toast({
        title: 'Hata',
        description: 'Lütfen geçerli bir email adresi girin',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Hata',
        description: 'Şifreler eşleşmiyor',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: 'Hata',
        description: 'Şifre en az 8 karakter olmalıdır',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Prepare user data - simplified, no account type selection
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        // roleId will be automatically assigned to 'viewer' by backend
        // Store newsletter preferences only
        metadata: {
          newsletterPreferences: {
            productUpdates: newsletterPreferences.productUpdates,
            events: newsletterPreferences.events,
            promotions: newsletterPreferences.promotions,
          },
        },
      };

      // Register user (creates account and sends verification email)
      const result = await authService.register(userData, tenantId);

      // Show success message with email verification instructions
      toast({
        title: 'Başarılı! 🎉',
        description: 'Hesabınız oluşturuldu. Email adresinize doğrulama linki gönderildi. Email adresinizi onayladıktan sonra portal kullanıma hazır olacak.',
      });

      // Redirect to login page with registered flag
      setTimeout(() => {
        router.push('/login?registered=true');
      }, 2000);

    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Check for duplicate email error
      if (error.message?.includes('email') || error.message?.includes('duplicate')) {
        toast({
          title: 'Email Zaten Kayıtlı',
          description: 'Bu email adresi ile zaten bir hesap var. Giriş yapmak ister misiniz?',
          variant: 'destructive',
        });
        setEmailExists(true);
      } else {
        toast({
          title: 'Hata',
          description: error.message || 'Kayıt sırasında bir hata oluştu',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">AffeXAI Cortex’e Katılın</CardTitle>
          <CardDescription className="text-center">
            Yeni bir hesap oluşturun
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <TenantSelector value={tenantId} onChange={setTenantId} disabled={loading} />
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Ad *</Label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Ahmet"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Soyad *</Label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Yılmaz"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Email with validation */}
            <div className="space-y-2">
              <Label htmlFor="email">E-posta *</Label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="ornek@xyz.example"
                  className={`pl-10 ${
                    emailValidation?.isValid === false ? 'border-red-500' : 
                    emailValidation?.isValid === true ? 'border-green-500' : ''
                  }`}
                  required
                />
                {emailValidating && (
                  <div className="absolute right-3">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                )}
                {!emailValidating && emailValidation?.isValid === true && (
                  <CheckCircle2 className="absolute right-3 h-4 w-4 text-green-500" />
                )}
                {!emailValidating && emailValidation?.isValid === false && (
                  <AlertCircle className="absolute right-3 h-4 w-4 text-red-500" />
                )}
              </div>
              {emailValidation && (
                <p className={`text-xs ${emailValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                  {emailValidation.message}
                </p>
              )}
              {emailExists && (
                <p className="text-xs text-red-600">
                  Bu email zaten kayıtlı.{' '}
                  <Link href="/login" className="underline font-medium">
                    Giriş yapmak ister misiniz?
                  </Link>
                </p>
              )}
            </div>

            {/* Newsletter Preferences */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Bülten Tercihleri (İsteğe Bağlı)</Label>
              <p className="text-sm text-muted-foreground">
                Hangi konularda bilgilendirme almak istersiniz?
              </p>

              <div className="space-y-2">
                {/* Product Updates */}
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="productUpdates"
                    checked={newsletterPreferences.productUpdates}
                    onCheckedChange={(checked) =>
                      setNewsletterPreferences(prev => ({ ...prev, productUpdates: checked as boolean }))
                    }
                  />
                  <Label htmlFor="productUpdates" className="text-sm cursor-pointer">
                    Ürün güncellemeleri ve yenilikler
                  </Label>
                </div>

                {/* Events */}
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="events"
                    checked={newsletterPreferences.events}
                    onCheckedChange={(checked) =>
                      setNewsletterPreferences(prev => ({ ...prev, events: checked as boolean }))
                    }
                  />
                  <Label htmlFor="events" className="text-sm cursor-pointer">
                    Etkinlikler ve eğitimler
                  </Label>
                </div>

                {/* Promotions */}
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="promotions"
                    checked={newsletterPreferences.promotions}
                    onCheckedChange={(checked) =>
                      setNewsletterPreferences(prev => ({ ...prev, promotions: checked as boolean }))
                    }
                  />
                  <Label htmlFor="promotions" className="text-sm cursor-pointer">
                    Kampanyalar ve özel teklifler
                  </Label>
                </div>
              </div>
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Şifre *</Label>
                <div className="relative flex items-center">
                  <KeyRound className="absolute left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Şifre Tekrar *</Label>
                <div className="relative flex items-center">
                  <KeyRound className="absolute left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              * Gerekli alanlar. Şifre en az 8 karakter olmalıdır.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || emailValidating || emailValidation?.isValid === false}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {loading ? 'Kaydediliyor...' : 'Kayıt Ol'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Zaten hesabınız var mı?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Giriş Yap
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
