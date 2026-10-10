'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Building2,
  GraduationCap,
  Mail,
  CheckCircle2,
  Loader2,
  Building,
} from 'lucide-react';
import { authService, completeProfile, type CurrentUser, type CompleteProfileDto } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function CompleteProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<ReturnType<typeof authService.getUserFromToken>>(null);

  // Form data based on account types
  const [formData, setFormData] = useState({
    // Customer fields
    customerNumber: '',
    companyName: '',
    taxNumber: '',
    companyPhone: '',
    companyAddress: '',
    companyCity: '',

    // Student fields
    schoolName: '',
    studentId: '',

    // Subscriber fields
    isSubscribedToNewsletter: false,
    newsletterCategories: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = authService.getUserFromToken();

        if (!currentUser) {
          toast({
            title: 'Oturum bulunamadı',
            description: 'Lütfen giriş yapın',
            variant: 'destructive',
          });
          router.push('/login');
          return;
        }

        setUser(currentUser);

        // CRITICAL: Staff roles should NEVER see profile completion page
        // Redirect them directly to admin panel
        const primaryRoleName = (currentUser as any)?.primaryRole?.name || currentUser?.roleId || '';
        const userRoles = (currentUser as any)?.roles || [];

        // Check if user has any staff role
        const staffRoles = ['admin', 'editor', 'content editor', 'marketing manager',
          'social media manager', 'event coordinator', 'support manager',
          'support agent', 'support', 'support team'];

        const hasStaffRole = userRoles.some((role: any) =>
          staffRoles.includes(role.name?.toLowerCase())
        ) || staffRoles.includes(primaryRoleName.toLowerCase());

        if (hasStaffRole) {
          console.log('✅ Staff role detected on complete-profile page, redirecting to admin');
          toast({
            title: 'Yönlendiriliyor',
            description: 'Admin paneline yönlendiriliyorsunuz...',
          });
          router.push('/admin');
          return;
        }

        // Pre-fill existing data if any
        if (currentUser.metadata) {
          const meta = currentUser.metadata;
          setFormData(prev => ({
            ...prev,
            customerNumber: meta.customerNumber || '',
            companyName: meta.companyName || '',
            taxNumber: meta.taxNumber || '',
            companyPhone: meta.companyPhone || '',
            companyAddress: meta.companyAddress || '',
            companyCity: meta.companyCity || '',
            schoolName: meta.schoolName || '',
            studentId: meta.studentId || '',
          }));
        }

        // Check if already completed
        const metadata = currentUser.metadata;
        if (metadata) {
          const isCustomerComplete = !metadata.isCustomer ||
            (metadata.customerNumber && metadata.companyName);
          const isStudentComplete = !metadata.isStudent ||
            (metadata.schoolName && metadata.studentId);

          if (isCustomerComplete && isStudentComplete) {
            toast({
              title: 'Profil zaten tamamlanmış',
              description: 'Portale yönlendiriliyorsunuz...',
            });
            router.push('/portal/dashboard');
            return;
          }
        }

      } catch (error) {
        console.error('Error loading user:', error);
        toast({
          title: 'Hata',
          description: 'Kullanıcı bilgileri yüklenirken bir hata oluştu',
          variant: 'destructive',
        });
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [router, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));

    // Clear error when user types
    if (errors[id]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      newsletterCategories: prev.newsletterCategories.includes(category)
        ? prev.newsletterCategories.filter(c => c !== category)
        : [...prev.newsletterCategories, category],
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const metadata = user?.metadata;

    // CRITICAL FIX: If no account type selected, require at least one section to be filled
    const hasAnyAccountType = metadata?.isCustomer || metadata?.isStudent || metadata?.isSubscriber;

    if (!hasAnyAccountType) {
      // User didn't select account type during signup
      // Check if they filled at least customer OR student section
      const hasCustomerData = formData.customerNumber.trim() || formData.companyName.trim();
      const hasStudentData = formData.schoolName.trim() || formData.studentId.trim();
      const hasSubscriberData = formData.isSubscribedToNewsletter;

      if (!hasCustomerData && !hasStudentData && !hasSubscriberData) {
        newErrors.general = 'Lütfen en az bir bölümü doldurun (Firma Bilgileri, Öğrenci Bilgileri veya Bülten Tercihleri)';
      }

      // If customer data partially filled, require both fields
      if (hasCustomerData) {
        if (!formData.customerNumber.trim()) {
          newErrors.customerNumber = 'Müşteri numarası gereklidir';
        }
        if (!formData.companyName.trim()) {
          newErrors.companyName = 'Firma adı gereklidir';
        }
      }

      // If student data partially filled, require both fields
      if (hasStudentData) {
        if (!formData.schoolName.trim()) {
          newErrors.schoolName = 'Okul adı gereklidir';
        }
        if (!formData.studentId.trim()) {
          newErrors.studentId = 'Öğrenci numarası gereklidir';
        }
      }
    } else {
      // User selected account types during signup - validate those sections

      // Customer validation
      if (metadata?.isCustomer) {
        if (!formData.customerNumber.trim()) {
          newErrors.customerNumber = 'Müşteri numarası gereklidir';
        }
        if (!formData.companyName.trim()) {
          newErrors.companyName = 'Firma adı gereklidir';
        }
      }

      // Student validation
      if (metadata?.isStudent) {
        if (!formData.schoolName.trim()) {
          newErrors.schoolName = 'Okul adı gereklidir';
        }
        if (!formData.studentId.trim()) {
          newErrors.studentId = 'Öğrenci numarası gereklidir';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    if (!validateForm()) {
      toast({
        title: 'Eksik Bilgiler',
        description: 'Lütfen tüm gerekli alanları doldurun',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const metadata = user.metadata;

      // Prepare profile completion data using new DTO structure
      const profileData: CompleteProfileDto = {};

      // Customer data - will trigger Customer role assignment
      if (metadata?.isCustomer || formData.customerNumber || formData.companyName) {
        profileData.customerData = {
          customerNumber: formData.customerNumber.trim() || undefined,
          companyName: formData.companyName.trim() || undefined,
          taxNumber: formData.taxNumber.trim() || undefined,
          companyPhone: formData.companyPhone.trim() || undefined,
          companyAddress: formData.companyAddress.trim() || undefined,
          companyCity: formData.companyCity.trim() || undefined,
        };
      }

      // Student data - will trigger Student role assignment
      if (metadata?.isStudent || formData.schoolName || formData.studentId) {
        profileData.studentData = {
          schoolName: formData.schoolName.trim() || undefined,
          studentId: formData.studentId.trim() || undefined,
        };
      }

      // Newsletter preferences - will trigger Subscriber role assignment
      if (metadata?.isSubscriber || formData.isSubscribedToNewsletter) {
        profileData.newsletterPreferences = {
          email: formData.isSubscribedToNewsletter,
          productUpdates: formData.newsletterCategories.includes('products'),
          eventUpdates: formData.newsletterCategories.includes('training'),
        };
      }

      // Keep backward compatibility in metadata
      profileData.metadata = {
        ...metadata,
        isCustomer: metadata?.isCustomer,
        isStudent: metadata?.isStudent,
        isSubscriber: metadata?.isSubscriber,
      };

      console.log('📤 Completing user profile with role assignment:', profileData);

      // Use new complete-profile endpoint that handles role assignment
      await completeProfile(profileData);

      toast({
        title: 'Başarılı! 🎉',
        description: 'Profiliniz tamamlandı ve rolleriniz atandı. Portale yönlendiriliyorsunuz...',
      });

      setTimeout(() => {
        router.push('/portal/dashboard');
      }, 1500);

    } catch (error: any) {
      console.error('❌ Profile completion error:', error);
      toast({
        title: 'Hata',
        description: error.message || 'Profil güncellenirken bir hata oluştu',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const newsletterCategories = [
    { id: 'products', label: 'Ürün Haberleri', icon: Building2 },
    { id: 'training', label: 'Eğitim & Etkinlikler', icon: GraduationCap },
    { id: 'updates', label: 'Güncellemeler', icon: Mail },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const metadata = user?.metadata;

  // CRITICAL FIX: If no account type was selected during signup, show all sections
  // If specific types selected, show ONLY those sections
  const hasAnyAccountType = metadata?.isCustomer || metadata?.isStudent || metadata?.isSubscriber;

  // Logic:
  // - If user selected customer during signup → show ONLY customer section
  // - If user selected student → show ONLY student section
  // - If user selected NOTHING → show ALL sections (let them choose)
  const showCustomerSection = hasAnyAccountType ? metadata?.isCustomer : true;
  const showStudentSection = hasAnyAccountType ? metadata?.isStudent : true;
  const showSubscriberSection = hasAnyAccountType ? metadata?.isSubscriber : true;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg border-border">
          <CardHeader className="space-y-1 border-b border-border pb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center text-foreground">
              Profilinizi Tamamlayın
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Hoş geldiniz {user?.firstName}! Hesabınızı kullanmaya başlamak için lütfen profil bilgilerinizi tamamlayın.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 pt-6">
              {/* General Error */}
              {errors.general && (
                <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-md">
                  <p className="text-sm text-destructive font-medium">{errors.general}</p>
                </div>
              )}

              {/* Customer Section */}
              {showCustomerSection && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-foreground">
                    <Building className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Firma Bilgileri</h3>
                  </div>
                  <Separator className="bg-border" />

                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="customerNumber" className="text-foreground">
                        Müşteri Numarası <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="customerNumber"
                        placeholder="Müşteri numaranızı girin"
                        value={formData.customerNumber}
                        onChange={handleInputChange}
                        className={errors.customerNumber ? 'border-destructive' : ''}
                      />
                      {errors.customerNumber && (
                        <p className="text-sm text-destructive">{errors.customerNumber}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="companyName" className="text-foreground">
                        Firma Adı <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="companyName"
                        placeholder="Firma adınızı girin"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        className={errors.companyName ? 'border-destructive' : ''}
                      />
                      {errors.companyName && (
                        <p className="text-sm text-destructive">{errors.companyName}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="taxNumber" className="text-foreground">
                          Vergi Numarası
                        </Label>
                        <Input
                          id="taxNumber"
                          placeholder="Vergi no"
                          value={formData.taxNumber}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="companyPhone" className="text-foreground">
                          Firma Telefonu
                        </Label>
                        <Input
                          id="companyPhone"
                          type="tel"
                          placeholder="+90 555 123 4567"
                          value={formData.companyPhone}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="companyAddress" className="text-foreground">
                        Firma Adresi
                      </Label>
                      <Input
                        id="companyAddress"
                        placeholder="Adres"
                        value={formData.companyAddress}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="companyCity" className="text-foreground">
                        Şehir
                      </Label>
                      <Input
                        id="companyCity"
                        placeholder="İstanbul, Ankara, vb."
                        value={formData.companyCity}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Student Section */}
              {showStudentSection && (
                <div className="space-y-4">
                  {showCustomerSection && <Separator className="my-6 bg-border" />}

                  <div className="flex items-center gap-2 text-foreground">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Öğrenci Bilgileri</h3>
                  </div>
                  <Separator className="bg-border" />

                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="schoolName" className="text-foreground">
                        Okul Adı <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="schoolName"
                        placeholder="Okul adını girin"
                        value={formData.schoolName}
                        onChange={handleInputChange}
                        className={errors.schoolName ? 'border-destructive' : ''}
                      />
                      {errors.schoolName && (
                        <p className="text-sm text-destructive">{errors.schoolName}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="studentId" className="text-foreground">
                        Öğrenci Numarası <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="studentId"
                        placeholder="Öğrenci numaranızı girin"
                        value={formData.studentId}
                        onChange={handleInputChange}
                        className={errors.studentId ? 'border-destructive' : ''}
                      />
                      {errors.studentId && (
                        <p className="text-sm text-destructive">{errors.studentId}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Subscriber Section */}
              {showSubscriberSection && (
                <div className="space-y-4">
                  {(showCustomerSection || showStudentSection) && (
                    <Separator className="my-6 bg-border" />
                  )}

                  <div className="flex items-center gap-2 text-foreground">
                    <Mail className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Bülten Tercihleri</h3>
                  </div>
                  <Separator className="bg-border" />

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="newsletter"
                        checked={formData.isSubscribedToNewsletter}
                        onCheckedChange={(checked) =>
                          setFormData(prev => ({ ...prev, isSubscribedToNewsletter: checked as boolean }))
                        }
                      />
                      <Label
                        htmlFor="newsletter"
                        className="text-sm font-normal cursor-pointer text-foreground"
                      >
                        E-posta bülteni almak istiyorum
                      </Label>
                    </div>

                    {formData.isSubscribedToNewsletter && (
                      <div className="pl-6 space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Hangi konularda bilgi almak istersiniz?
                        </p>
                        {newsletterCategories.map((category) => (
                          <div key={category.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={category.id}
                              checked={formData.newsletterCategories.includes(category.id)}
                              onCheckedChange={() => handleCategoryToggle(category.id)}
                            />
                            <Label
                              htmlFor={category.id}
                              className="text-sm font-normal cursor-pointer flex items-center gap-2 text-foreground"
                            >
                              <category.icon className="h-4 w-4 text-muted-foreground" />
                              {category.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-6 border-t border-border">
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Profili Tamamla
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Bu bilgileri daha sonra profil ayarlarınızdan güncelleyebilirsiniz.
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
