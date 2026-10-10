
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { permissions as allPermissions } from "@/lib/roles-data";
import { Save, ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from '@/components/ui/textarea';

export default function CreateNewRolePage() {
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    
    const handlePermissionChange = (permissionId: string) => {
        setSelectedPermissions(prev => 
            prev.includes(permissionId) 
            ? prev.filter(id => id !== permissionId) 
            : [...prev, permissionId]
        );
    };

    const groupedPermissions = allPermissions.reduce((acc, permission) => {
        const category = permission.category || 'Diğer';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(permission);
        return acc;
    }, {} as Record<string, typeof allPermissions>);

    const orderedCategories = [
        'Kullanıcı Yönetimi',
        'Etkinlik Yönetimi',
        'Sertifika Yönetimi',
        'Destek Yönetimi',
        'Pazarlama Yönetimi',
        'CMS Yönetimi',
        'Sistem Ayarları',
    ].filter(c => groupedPermissions[c]);


    return (
        <form>
             <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Yeni Rol Oluştur</h1>
                    <p className="text-muted-foreground">Yeni bir rol için detayları ve izinleri yapılandırın.</p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/admin/users/roles">
                        <ArrowLeft className="mr-2 h-4 w-4"/>
                        İzin Matrisine Geri Dön
                    </Link>
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Rol Bilgileri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="role-name">Rol Adı</Label>
                        <Input id="role-name" placeholder="Örn: Pazarlama Uzmanı"/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="role-description">Açıklama</Label>
                        <Textarea id="role-description" placeholder="Bu rolün amacını ve yetkilerini kısaca açıklayın."/>
                    </div>
                </CardContent>
            </Card>

            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>İzinler</CardTitle>
                    <CardDescription>Bu role atanacak izinleri seçin.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     {orderedCategories.map((category) => (
                        <div key={category}>
                             <h4 className="font-medium mb-4 flex items-center gap-2 border-b pb-2"><ShieldCheck className="h-5 w-5 text-muted-foreground"/> {category}</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {groupedPermissions[category].map(permission => (
                                    <div key={permission.id} className="flex items-center space-x-2">
                                        <Checkbox 
                                            id={permission.id} 
                                            checked={selectedPermissions.includes(permission.id)}
                                            onCheckedChange={() => handlePermissionChange(permission.id)}
                                        />
                                        <Label htmlFor={permission.id} className="font-normal">{permission.name}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
            
            <div className="mt-8 flex justify-end">
                <Button type="submit">
                    <Save className="mr-2 h-4 w-4"/>
                    Rolü Oluştur
                </Button>
            </div>
        </form>
    );
}
