
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Building, Phone } from "lucide-react";

export default function UserProfilePage() {
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
                            <AvatarImage src="https://i.pravatar.cc/150?u=ahmet-yilmaz" alt="Ahmet Yılmaz" />
                            <AvatarFallback>AY</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold">Ahmet Yılmaz</h3>
                            <p className="text-muted-foreground">Proje Yöneticisi</p>
                             <Button variant="outline" size="sm" className="mt-2">Resmi Değiştir</Button>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <Label htmlFor="name">Adınız Soyadınız</Label>
                            <div className="relative flex items-center">
                                <User className="absolute left-3 h-4 w-4 text-muted-foreground" />
                                <Input id="name" defaultValue="Ahmet Yılmaz" className="pl-10" />
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="email">E-posta Adresi</Label>
                             <div className="relative flex items-center">
                                <Mail className="absolute left-3 h-4 w-4 text-muted-foreground" />
                                <Input id="email" type="email" defaultValue="ahmet.yilmaz@example.com" className="pl-10" />
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="company">Firma</Label>
                            <div className="relative flex items-center">
                                <Building className="absolute left-3 h-4 w-4 text-muted-foreground" />
                                <Input id="company" defaultValue="Örnek İnşaat A.Ş." className="pl-10" />
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="phone">Telefon Numarası</Label>
                            <div className="relative flex items-center">
                                <Phone className="absolute left-3 h-4 w-4 text-muted-foreground" />
                                <Input id="phone" type="tel" defaultValue="+90 555 123 45 67" className="pl-10" />
                            </div>
                        </div>
                    </div>
                </form>
            </CardContent>
            <CardFooter className="border-t pt-6">
                <Button>Değişiklikleri Kaydet</Button>
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
