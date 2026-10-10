

'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, KeyRound, Save } from "lucide-react";
import Link from "next/link";
import { roles } from "@/lib/roles-data";


type User = {
    id: string;
    name: string;
    email: string;
    role: string;
} | null;

type UserFormProps = {
    user?: User;
}

export function UserForm({ user = null }: UserFormProps) {
    const isEditing = !!user;

    return (
       <form>
            <Card>
                <CardHeader>
                    <CardTitle>{isEditing ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı Oluştur'}</CardTitle>
                    <CardDescription>
                        {isEditing ? 'Kullanıcı bilgilerini ve rolünü güncelleyin.' : 'Sisteme yeni bir kullanıcı ekleyin.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="space-y-2">
                        <Label htmlFor="name">Adı Soyadı</Label>
                         <div className="relative flex items-center">
                           <User className="absolute left-3 h-4 w-4 text-muted-foreground" />
                           <Input id="name" defaultValue={user?.name} placeholder="Ahmet Yılmaz" className="pl-10" />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="email">E-posta</Label>
                        <div className="relative flex items-center">
                           <Mail className="absolute left-3 h-4 w-4 text-muted-foreground" />
                           <Input id="email" type="email" defaultValue={user?.email} placeholder="ornek@example.com" className="pl-10" />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="password">Şifre</Label>
                        <div className="relative flex items-center">
                           <KeyRound className="absolute left-3 h-4 w-4 text-muted-foreground" />
                           <Input id="password" type="password" placeholder={user ? 'Değiştirmek için yeni şifre girin' : 'Yeni kullanıcı şifresi'} className="pl-10" />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="role">Rol</Label>
                        <Select defaultValue={user?.role || 'Viewer'}>
                            <SelectTrigger id="role">
                                <SelectValue placeholder="Bir rol seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map(role => (
                                    <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-4">
                     <Button variant="outline" asChild><Link href="/admin/users">İptal</Link></Button>
                    <Button type="submit">
                        <Save className="mr-2 h-4 w-4" />
                        {isEditing ? 'Değişiklikleri Kaydet' : 'Kullanıcıyı Oluştur'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    )
}
