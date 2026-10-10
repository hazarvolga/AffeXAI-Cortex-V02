

'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Building, Phone, MapPin, Globe, GraduationCap, Briefcase, Bell } from "lucide-react";
import { authService, usersService, type CurrentUser } from '@/lib/api';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function UserProfilePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any | null>(null); // Full user object from backend
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    country: '',
    address: '',
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
    // Newsletter preferences
    newsletterEmail: false,
    newsletterProductUpdates: false,
    newsletterEventUpdates: false,
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = authService.getUserFromToken();
        if (!currentUser) {
          router.push('/login');
          return;
        }

        // Fetch full user details from backend
        const fullUser = await usersService.getCurrentUser();
        setUser(fullUser);
        
        // Extract customer data from metadata
        const customerData = fullUser.metadata?.customerData || {};
        const studentData = fullUser.metadata?.studentData || {};
        const newsletterPrefs = fullUser.metadata?.newsletterPreferences || {};
        
        setFormData({
          firstName: fullUser.firstName || '',
          lastName: fullUser.lastName || '',
          email: fullUser.email || '',
          phone: fullUser.phone || '',
          city: fullUser.city || '',
          country: fullUser.country || '',
          address: fullUser.address || '',
          // Customer fields
          customerNumber: customerData.customerNumber || fullUser.customerNumber || '',
          companyName: customerData.companyName || '',
          taxNumber: customerData.taxNumber || '',
          companyPhone: customerData.companyPhone || '',
          companyAddress: customerData.companyAddress || '',
          companyCity: customerData.companyCity || '',
          // Student fields
          schoolName: studentData.schoolName || fullUser.schoolName || '',
          studentId: studentData.studentId || fullUser.studentId || '',
          // Newsletter preferences
          newsletterEmail: newsletterPrefs.email || false,
          newsletterProductUpdates: newsletterPrefs.productUpdates || false,
          newsletterEventUpdates: newsletterPrefs.eventUpdates || false,
        });
      } catch (error) {
        console.error('Error loading user:', error);
        toast({
          title: 'Hata',
          description: 'Kullanıcı bilgileri yüklenirken bir hata oluştu',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [router, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleCheckboxChange = (id: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [id]: checked }));
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Prepare update data with metadata
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        city: formData.city,
        country: formData.country,
        address: formData.address,
        metadata: {
          ...user.metadata,
          customerData: {
            customerNumber: formData.customerNumber,
            companyName: formData.companyName,
            taxNumber: formData.taxNumber,
            companyPhone: formData.companyPhone,
            companyAddress: formData.companyAddress,
            companyCity: formData.companyCity,
          },
          studentData: {
            schoolName: formData.schoolName,
            studentId: formData.studentId,
          },
          newsletterPreferences: {
            email: formData.newsletterEmail,
            productUpdates: formData.newsletterProductUpdates,
            eventUpdates: formData.newsletterEventUpdates,
          },
        },
      };

      await usersService.updateUser(user.id, updateData);
      
      toast({
        title: 'Başarılı',
        description: 'Profil bilgileriniz güncellendi',
      });

      // Reload user data
      const updatedUser = await usersService.getCurrentUser();
      setUser(updatedUser);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Hata',
        description: error.message || 'Profil güncellenirken bir hata oluştu',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8">
        <Card>
            <CardHeader>
                <CardTitle>Profil Bilgilerim</CardTitle>
                <CardDescription>Kişisel bilgilerinizi ve tercihlerinizi buradan yönetebilirsiniz.</CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-8">
                    <div className="flex items-center gap-6">
                        <Avatar className="h-20 w-20">
                            <AvatarFallback className="text-2xl font-semibold">{getUserInitials()}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold">{user?.firstName} {user?.lastName}</h3>
                            <p className="text-muted-foreground">{user?.email}</p>
                             <Button variant="outline" size="sm" className="mt-2" type="button">Resmi Değiştir</Button>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <Label htmlFor="firstName">Ad</Label>
                            <div className="relative flex items-center">
                                <User className="absolute left-3 h-4 w-4 text-muted-foreground" />
                                <Input id="firstName" value={formData.firstName} onChange={handleInputChange} className="pl-10" />
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="lastName">Soyad</Label>
                            <div className="relative flex items-center">
                                <User className="absolute left-3 h-4 w-4 text-muted-foreground" />
                                <Input id="lastName" value={formData.lastName} onChange={handleInputChange} className="pl-10" />
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="email">E-posta Adresi</Label>
                             <div className="relative flex items-center">
                                <Mail className="absolute left-3 h-4 w-4 text-muted-foreground" />
                                <Input id="email" type="email" value={formData.email} onChange={handleInputChange} className="pl-10" disabled />
                            </div>
                            <p className="text-xs text-muted-foreground">E-posta adresi değiştirilemez</p>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="phone">Telefon Numarası</Label>
                            <div className="relative flex items-center">
                                <Phone className="absolute left-3 h-4 w-4 text-muted-foreground" />
                                <Input id="phone" type="tel" value={formData.phone} onChange={handleInputChange} className="pl-10" />
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="city">Şehir</Label>
                            <div className="relative flex items-center">
                                <MapPin className="absolute left-3 h-4 w-4 text-muted-foreground" />
                                <Input id="city" value={formData.city} onChange={handleInputChange} className="pl-10" />
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="country">Ülke</Label>
                            <div className="relative flex items-center">
                                <Globe className="absolute left-3 h-4 w-4 text-muted-foreground" />
                                <Input id="country" value={formData.country} onChange={handleInputChange} className="pl-10" />
                            </div>
                        </div>
                         <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="address">Adres</Label>
                            <div className="relative flex items-center">
                                <Building className="absolute left-3 h-4 w-4 text-muted-foreground" />
                                <Input id="address" value={formData.address} onChange={handleInputChange} className="pl-10" />
                            </div>
                        </div>
                    </div>
                </form>
            </CardContent>
            <CardFooter className="border-t pt-6">
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </Button>
            </CardFooter>
        </Card>

        {/* Customer Information Section */}
        {(formData.customerNumber || formData.companyName) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Müşteri Bilgileri
              </CardTitle>
              <CardDescription>Firma ve müşteri bilgilerinizi yönetin</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="customerNumber">Müşteri Numarası</Label>
                  <Input 
                    id="customerNumber" 
                    value={formData.customerNumber} 
                    onChange={handleInputChange}
                    placeholder="Örn: C-12345"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Firma Adı</Label>
                  <Input 
                    id="companyName" 
                    value={formData.companyName} 
                    onChange={handleInputChange}
                    placeholder="Firma adınızı girin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxNumber">Vergi Numarası</Label>
                  <Input 
                    id="taxNumber" 
                    value={formData.taxNumber} 
                    onChange={handleInputChange}
                    placeholder="Vergi numaranızı girin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Firma Telefonu</Label>
                  <Input 
                    id="companyPhone" 
                    value={formData.companyPhone} 
                    onChange={handleInputChange}
                    placeholder="Firma telefon numarası"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyCity">Firma Şehri</Label>
                  <Input 
                    id="companyCity" 
                    value={formData.companyCity} 
                    onChange={handleInputChange}
                    placeholder="Firma şehri"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="companyAddress">Firma Adresi</Label>
                  <Input 
                    id="companyAddress" 
                    value={formData.companyAddress} 
                    onChange={handleInputChange}
                    placeholder="Firma adresini girin"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Student Information Section */}
        {(formData.schoolName || formData.studentId) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Öğrenci Bilgileri
              </CardTitle>
              <CardDescription>Eğitim ve öğrenci bilgilerinizi yönetin</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="schoolName">Okul Adı</Label>
                  <Input 
                    id="schoolName" 
                    value={formData.schoolName} 
                    onChange={handleInputChange}
                    placeholder="Okul adınızı girin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentId">Öğrenci Numarası</Label>
                  <Input 
                    id="studentId" 
                    value={formData.studentId} 
                    onChange={handleInputChange}
                    placeholder="Öğrenci numaranızı girin"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Newsletter Preferences Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Bülten Tercihleri
            </CardTitle>
            <CardDescription>E-posta bildirimleri ve bülten tercihlerinizi yönetin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="newsletterEmail" 
                checked={formData.newsletterEmail}
                onCheckedChange={(checked) => handleCheckboxChange('newsletterEmail', checked as boolean)}
              />
              <Label htmlFor="newsletterEmail" className="cursor-pointer">
                E-bültene abone ol
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="newsletterProductUpdates" 
                checked={formData.newsletterProductUpdates}
                onCheckedChange={(checked) => handleCheckboxChange('newsletterProductUpdates', checked as boolean)}
              />
              <Label htmlFor="newsletterProductUpdates" className="cursor-pointer">
                Ürün güncellemeleri ve yenilikler hakkında bilgi al
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="newsletterEventUpdates" 
                checked={formData.newsletterEventUpdates}
                onCheckedChange={(checked) => handleCheckboxChange('newsletterEventUpdates', checked as boolean)}
              />
              <Label htmlFor="newsletterEventUpdates" className="cursor-pointer">
                Etkinlik ve webinar duyuruları al
              </Label>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button onClick={handleSaveProfile} disabled={saving}>
              {saving ? 'Kaydediliyor...' : 'Tercihleri Kaydet'}
            </Button>
          </CardFooter>
        </Card>

         <Card>
            <CardHeader>
                <CardTitle>Şifre Değiştir</CardTitle>
                <CardDescription>Güvenliğiniz için şifrenizi düzenli olarak değiştirmenizi öneririz.</CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-4 max-w-md">
                     <div className="space-y-2">
                        <Label htmlFor="current-password">Mevcut Şifre</Label>
                        <Input id="current-password" type="password" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="new-password">Yeni Şifre</Label>
                        <Input id="new-password" type="password" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="confirm-password">Yeni Şifre (Tekrar)</Label>
                        <Input id="confirm-password" type="password" />
                    </div>
                </form>
            </CardContent>
            <CardFooter className="border-t pt-6">
                <Button>Şifreyi Güncelle</Button>
            </CardFooter>
        </Card>
    </div>
  );
}