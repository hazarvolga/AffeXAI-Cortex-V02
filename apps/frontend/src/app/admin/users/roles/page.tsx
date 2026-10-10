'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import {
  PlusCircle,
  Users,
  Shield,
  ShieldCheck,
  MoreHorizontal,
  Trash2,
  Edit,
} from 'lucide-react';
import Link from 'next/link';
import { rolesService } from '@/lib/api';
import { Role } from '@affexai/shared-types';
import { useToast } from '@/hooks/use-toast';

export default function RolesPage() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCounts, setUserCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const rolesData = await rolesService.getRoles();
      setRoles(rolesData);

      // Load user counts for each role
      const counts: Record<string, number> = {};
      await Promise.all(
        rolesData.map(async (role) => {
          try {
            const { count } = await rolesService.getRoleUserCount(role.id);
            counts[role.id] = count;
          } catch (error) {
            console.error(`Failed to load user count for role ${role.id}:`, error);
            counts[role.id] = 0;
          }
        })
      );
      setUserCounts(counts);
    } catch (error) {
      console.error('Failed to load roles:', error);
      toast({
        title: 'Hata',
        description: 'Roller yüklenirken bir hata oluştu',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (roleId: string, isSystem: boolean) => {
    if (isSystem) {
      toast({
        title: 'Uyarı',
        description: 'Sistem rolleri silinemez',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm('Bu rolü silmek istediğinizden emin misiniz?')) return;

    try {
      await rolesService.deleteRole(roleId);
      toast({
        title: 'Başarılı',
        description: 'Rol başarıyla silindi',
      });
      loadRoles();
    } catch (error: any) {
      console.error('Failed to delete role:', error);
      toast({
        title: 'Hata',
        description: error.message || 'Rol silinirken bir hata oluştu',
        variant: 'destructive',
      });
    }
  };

  const totalRoles = roles.length;
  const systemRoles = roles.filter(r => r.isSystem).length;
  const customRoles = roles.filter(r => !r.isSystem).length;
  const activeRoles = roles.filter(r => r.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Rol Yönetimi</h2>
          <p className="text-muted-foreground">
            Sistemdeki rolleri ve izinleri yönetin.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/users/roles/create-new-role">
            <PlusCircle className="mr-2 h-4 w-4" />
            Yeni Rol Ekle
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Rol</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRoles}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sistem Rolleri</CardTitle>
            <ShieldCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemRoles}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Özel Roller</CardTitle>
            <Shield className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customRoles}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Roller</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRoles}</div>
          </CardContent>
        </Card>
      </div>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Roller Listesi</CardTitle>
          <CardDescription>
            {loading ? 'Yükleniyor...' : `${totalRoles} rol bulundu`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rol Adı</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead>İzinler</TableHead>
                <TableHead>Kullanıcılar</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead><span className="sr-only">Eylemler</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">Yükleniyor...</TableCell>
                </TableRow>
              ) : roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">Rol bulunamadı</TableCell>
                </TableRow>
              ) : (
                roles.map(role => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">
                      <div>{role.displayName}</div>
                      <div className="text-sm text-muted-foreground">{role.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate text-sm text-muted-foreground">
                        {role.description || 'Açıklama yok'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {role.permissions?.length || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{userCounts[role.id] || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={role.isActive ? 'default' : 'outline'}
                        className={role.isActive ? 'bg-green-500' : ''}
                      >
                        {role.isActive ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {role.isSystem ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          Sistem
                        </Badge>
                      ) : (
                        <Badge variant="outline">Özel</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Menüyü aç</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/users/roles/${role.id}`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Düzenle
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={role.isSystem}
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDelete(role.id, role.isSystem)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Sil {role.isSystem && '(Sistem Rolü)'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
