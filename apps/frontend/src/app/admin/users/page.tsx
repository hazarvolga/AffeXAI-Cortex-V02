'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, PlusCircle, Users, UserCheck, UserX, Mail, Search, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import Link from "next/link";
import { usersService, rolesService, authService } from '@/lib/api';
import { User, Role, UserStats } from '@affexai/shared-types';
import { useToast } from '@/hooks/use-toast';
import { DeleteUserDialog } from '@/components/admin/DeleteUserDialog';

export default function UsersPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);

    // Delete dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Pagination
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;

    useEffect(() => {
        // Check authentication
        if (!authService.isAuthenticated()) {
            router.push('/login');
            return;
        }

        loadData();
    }, []);

    useEffect(() => {
        if (authService.isAuthenticated()) {
            loadUsers();
        }
    }, [page, searchQuery, roleFilter, statusFilter]);

    const handleLogout = () => {
        authService.logout();
    };

    const loadData = async () => {
        try {
            const [statsData, rolesData] = await Promise.all([
                usersService.getStats(),
                rolesService.getRoles()
            ]);
            setStats(statsData);
            setRoles(rolesData);
        } catch (error: any) {
            // If unauthorized, redirect to login
            if (error.status === 401) {
                toast({
                    title: 'Oturum Süresi Doldu',
                    description: 'Lütfen tekrar giriş yapın',
                    variant: 'destructive',
                });
                router.push('/login');
                return;
            }
            console.error('Failed to load data:', error);
            toast({
                title: 'Hata',
                description: 'Veriler yüklenirken bir hata oluştu',
                variant: 'destructive',
            });
        }
    };

    const loadUsers = async () => {
        setLoading(true);
        try {
            const params: any = {
                page,
                limit,
            };

            if (searchQuery) params.search = searchQuery;
            if (roleFilter && roleFilter !== 'all') params.roleId = roleFilter;
            if (statusFilter && statusFilter !== 'all') params.isActive = statusFilter === 'active';

            const response = await usersService.getUsersList(params);
            setUsers(response.data);
            setTotal(response.total);
        } catch (error) {
            console.error('Failed to load users:', error);
            toast({
                title: 'Hata',
                description: 'Kullanıcılar yüklenirken bir hata oluştu',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (userId: string) => {
        try {
            await usersService.toggleUserActive(userId);
            toast({
                title: 'Başarılı',
                description: 'Kullanıcı durumu güncellendi',
            });
            loadUsers();
            loadData(); // Refresh stats
        } catch (error) {
            console.error('Failed to toggle user status:', error);
            toast({
                title: 'Hata',
                description: 'Kullanıcı durumu güncellenemedi',
                variant: 'destructive',
            });
        }
    };

    const handleDelete = async (userId: string, hardDelete: boolean) => {
        try {
            if (hardDelete) {
                await usersService.hardDeleteUser(userId);
                toast({
                    title: 'Başarılı',
                    description: 'Kullanıcı kalıcı olarak silindi. Email adresi artık kullanılabilir.',
                });
            } else {
                await usersService.deleteUser(userId);
                toast({
                    title: 'Başarılı',
                    description: 'Kullanıcı devre dışı bırakıldı (Soft Delete). Gerekirse geri yüklenebilir.',
                });
            }
            loadUsers();
            loadData(); // Refresh stats
        } catch (error) {
            console.error('Failed to delete user:', error);
            toast({
                title: 'Hata',
                description: 'Kullanıcı silinemedi',
                variant: 'destructive',
            });
            throw error; // Re-throw to keep dialog open on error
        }
    };

    const openDeleteDialog = (user: User) => {
        setUserToDelete(user);
        setDeleteDialogOpen(true);
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Kullanıcı Yönetimi</h2>
                    <p className="text-muted-foreground">
                        Sistemdeki kullanıcıları ve rollerini yönetin.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Çıkış Yap
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/admin/users/roles">
                            <Users className="mr-2 h-4 w-4" />
                            Tüm Rolleri Yönet
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/admin/users/new">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Yeni Kullanıcı Ekle
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.total || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Aktif Kullanıcılar</CardTitle>
                        <UserCheck className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.active || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pasif Kullanıcılar</CardTitle>
                        <UserX className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.inactive || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Email Doğrulanmış</CardTitle>
                        <Mail className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.verified || 0}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filtrele</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Email ile ara..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Rol seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tümü</SelectItem>
                                {roles.map(role => (
                                    <SelectItem key={role.id} value={role.id}>{role.displayName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Durum seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tümü</SelectItem>
                                <SelectItem value="active">Aktif</SelectItem>
                                <SelectItem value="inactive">Pasif</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Kullanıcı Listesi</CardTitle>
                    <CardDescription>
                        {loading ? 'Yükleniyor...' : `${total} kullanıcı bulundu`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Adı Soyadı</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Rol</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead><span className="sr-only">Eylemler</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">Yükleniyor...</TableCell>
                                </TableRow>
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">Kullanıcı bulunamadı</TableCell>
                                </TableRow>
                            ) : (
                                users.map(user => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">
                                            <div>{user.firstName} {user.lastName}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm text-muted-foreground">{user.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {/* Primary role - NEW: Use primaryRole from multi-role system */}
                                                {user.primaryRole ? (
                                                    <Badge variant={(user.primaryRole as any).name === 'admin' ? 'destructive' : 'default'}>
                                                        {(user.primaryRole as any).displayName || (user.primaryRole as any).name}
                                                    </Badge>
                                                ) : (user as any).roleEntity ? (
                                                    // FALLBACK: Use legacy roleEntity if primaryRole not available
                                                    <Badge variant={(user as any).roleEntity.name === 'admin' ? 'destructive' : 'default'}>
                                                        {(user as any).roleEntity.displayName || (user as any).roleEntity.name}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline">N/A</Badge>
                                                )}

                                                {/* Additional roles */}
                                                {user.roles?.filter(role => role.id !== user.primaryRole?.id).map((role, index) => (
                                                    <Badge key={`${user.id}-${role.id}-${index}`} variant="secondary" className="text-xs">
                                                        {(role as any).displayName || (role as any).name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={user.isActive ? 'default' : 'outline'}
                                                className={user.isActive ? 'bg-green-500' : ''}
                                            >
                                                {user.isActive ? 'Aktif' : 'Pasif'}
                                            </Badge>
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
                                                        <Link href={`/admin/users/${user.id}`}>Düzenle</Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleToggleActive(user.id)}>
                                                        {user.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => openDeleteDialog(user)}
                                                    >
                                                        Sil
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-muted-foreground">
                                Sayfa {page} / {totalPages}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Önceki
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                >
                                    Sonraki
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete User Dialog */}
            {userToDelete && (
                <DeleteUserDialog
                    user={userToDelete}
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    onConfirm={handleDelete}
                />
            )}
        </div>
    );
}
