'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, ShieldCheck, ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { Checkbox } from "../ui/checkbox";
import { Textarea } from '../ui/textarea';
import { rolesService } from '@/lib/api';
import { Role, CreateRoleDto, UpdateRoleDto } from '@affexai/shared-types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth/auth-context';

type RoleFormProps = {
    role?: Role;
};

// Available permissions - Backend'de bunları bir endpoint'ten alabiliriz ileride
const AVAILABLE_PERMISSIONS = [
    // User Management
    { id: 'users.view', name: 'Kullanıcıları Görüntüle', category: 'Kullanıcı Yönetimi' },
    { id: 'users.create', name: 'Kullanıcı Oluştur', category: 'Kullanıcı Yönetimi' },
    { id: 'users.update', name: 'Kullanıcı Düzenle', category: 'Kullanıcı Yönetimi' },
    { id: 'users.delete', name: 'Kullanıcı Sil', category: 'Kullanıcı Yönetimi' },
    { id: 'roles.view', name: 'Rolleri Görüntüle', category: 'Kullanıcı Yönetimi' },
    { id: 'roles.manage', name: 'Rolleri Yönet', category: 'Kullanıcı Yönetimi' },

    // Event Management
    { id: 'events.view', name: 'Etkinlikleri Görüntüle', category: 'Etkinlik Yönetimi' },
    { id: 'events.create', name: 'Etkinlik Oluştur', category: 'Etkinlik Yönetimi' },
    { id: 'events.update', name: 'Etkinlik Düzenle', category: 'Etkinlik Yönetimi' },
    { id: 'events.delete', name: 'Etkinlik Sil', category: 'Etkinlik Yönetimi' },
    { id: 'events.participants', name: 'Katılımcıları Yönet', category: 'Etkinlik Yönetimi' },

    // Certificate Management
    { id: 'certificates.view', name: 'Sertifikaları Görüntüle', category: 'Sertifika Yönetimi' },
    { id: 'certificates.create', name: 'Sertifika Oluştur', category: 'Sertifika Yönetimi' },
    { id: 'certificates.update', name: 'Sertifika Düzenle', category: 'Sertifika Yönetimi' },
    { id: 'certificates.revoke', name: 'Sertifika İptal Et', category: 'Sertifika Yönetimi' },

    // Support Management
    { id: 'support.view', name: 'Destek Taleplerini Görüntüle', category: 'Destek Yönetimi' },
    { id: 'support.respond', name: 'Talep Yanıtla', category: 'Destek Yönetimi' },
    { id: 'support.assign', name: 'Talep Ata', category: 'Destek Yönetimi' },

    // Marketing Management
    { id: 'marketing.manage', name: 'Pazarlama İçeriklerini Yönet', category: 'Pazarlama Yönetimi' },
    { id: 'marketing.campaigns', name: 'Kampanya Yönet', category: 'Pazarlama Yönetimi' },

    // CMS Management
    { id: 'cms.pages.view', name: 'Sayfaları Görüntüle', category: 'CMS Yönetimi' },
    { id: 'cms.pages.create', name: 'Sayfa Oluştur', category: 'CMS Yönetimi' },
    { id: 'cms.pages.update', name: 'Sayfa Düzenle', category: 'CMS Yönetimi' },
    { id: 'cms.pages.delete', name: 'Sayfa Sil', category: 'CMS Yönetimi' },
    { id: 'cms.menus.manage', name: 'Menüleri Yönet', category: 'CMS Yönetimi' },

    // System Settings
    { id: 'system.settings', name: 'Sistem Ayarlarını Yönet', category: 'Sistem Ayarları' },
    { id: 'system.logs', name: 'Sistem Loglarını Görüntüle', category: 'Sistem Ayarları' },
];

export function RoleForm({ role }: RoleFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const { isSuperAdmin } = useAuth();
    const isEditing = !!role;

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: role?.name || '',
        displayName: role?.displayName || '',
        description: role?.description || '',
    });
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(role?.permissions || []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        const field = id.replace('role-', '');
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handlePermissionChange = (permissionId: string) => {
        setSelectedPermissions(prev =>
            prev.includes(permissionId)
                ? prev.filter(id => id !== permissionId)
                : [...prev, permissionId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isEditing && role) {
                // Update existing role
                const updateData: UpdateRoleDto = {
                    displayName: formData.displayName,
                    description: formData.description,
                };

                await rolesService.updateRole(role.id, updateData);

                // Update permissions separately
                await rolesService.updateRolePermissions(role.id, selectedPermissions);

                toast({
                    title: 'Başarılı',
                    description: 'Rol başarıyla güncellendi',
                });
            } else {
                // Create new role
                const createData: CreateRoleDto = {
                    name: formData.name,
                    displayName: formData.displayName,
                    description: formData.description,
                    permissions: selectedPermissions,
                };

                await rolesService.createRole(createData);

                toast({
                    title: 'Başarılı',
                    description: 'Rol başarıyla oluşturuldu',
                });
            }

            router.push('/admin/users/roles');
        } catch (error: any) {
            console.error('Failed to save role:', error);
            toast({
                title: 'Hata',
                description: error.message || 'Rol kaydedilirken bir hata oluştu',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!role) return;

        if (role.isSystem) {
            toast({
                title: 'Uyarı',
                description: 'Sistem rolleri silinemez',
                variant: 'destructive',
            });
            return;
        }

        if (!confirm('Bu rolü silmek istediğinizden emin misiniz?')) return;

        try {
            setLoading(true);
            await rolesService.deleteRole(role.id);
            toast({
                title: 'Başarılı',
                description: 'Rol başarıyla silindi',
            });
            router.push('/admin/users/roles');
        } catch (error: any) {
            console.error('Failed to delete role:', error);
            toast({
                title: 'Hata',
                description: error.message || 'Rol silinirken bir hata oluştu',
                variant: 'destructive',
            });
            setLoading(false);
        }
    };

    const groupedPermissions = AVAILABLE_PERMISSIONS.reduce((acc, permission) => {
        const category = permission.category || 'Diğer';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(permission);
        return acc;
    }, {} as Record<string, typeof AVAILABLE_PERMISSIONS>);

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
        <form onSubmit={handleSubmit}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {isEditing ? `Rolü Düzenle: ${role.displayName}` : 'Yeni Rol Oluştur'}
                    </h1>
                    <p className="text-muted-foreground">Rolün detaylarını ve izinlerini yapılandırın.</p>
                </div>
                <div className="flex gap-2">
                    {isEditing && !role?.isSystem && (
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={loading}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Rolü Sil
                        </Button>
                    )}
                    <Button variant="outline" asChild type="button">
                        <Link href="/admin/users/roles">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Geri Dön
                        </Link>
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Rol Bilgileri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!isEditing && (
                        <div className="space-y-2">
                            <Label htmlFor="role-name">Rol Adı (Sistem İçi) *</Label>
                            <Input
                                id="role-name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Örn: marketing_specialist"
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Küçük harf, alt çizgi ile. Oluşturulduktan sonra değiştirilemez.
                            </p>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="role-displayName">Görünen Ad *</Label>
                        <Input
                            id="role-displayName"
                            value={formData.displayName}
                            onChange={handleInputChange}
                            placeholder="Örn: Pazarlama Uzmanı"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="role-description">Açıklama</Label>
                        <Textarea
                            id="role-description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Bu rolün amacını ve yetkilerini kısaca açıklayın."
                            className="min-h-[100px]"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>İzinler</CardTitle>
                    <CardDescription>
                        Bu role atanacak izinleri seçin. {selectedPermissions.length} izin seçildi.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {orderedCategories.map((category) => (
                        <div key={category}>
                            <h4 className="font-medium mb-4 flex items-center gap-2 border-b pb-2">
                                <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                                {category}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {groupedPermissions[category].map(permission => (
                                    <div key={permission.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={permission.id}
                                            checked={selectedPermissions.includes(permission.id)}
                                            onCheckedChange={() => handlePermissionChange(permission.id)}
                                        />
                                        <Label htmlFor={permission.id} className="font-normal cursor-pointer">
                                            {permission.name}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <div className="mt-8 flex justify-end">
                <Button type="submit" disabled={loading}>
                    <Save className="mr-2 h-4 w-4" />
                    {loading ? 'Kaydediliyor...' : (isEditing ? 'Değişiklikleri Kaydet' : 'Rolü Oluştur')}
                </Button>
            </div>
        </form>
    );
}
