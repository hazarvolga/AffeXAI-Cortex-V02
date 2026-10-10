

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, Users, UserCheck, UserX, ArrowRight } from "lucide-react";
import Link from "next/link";
import { roles } from "@/lib/roles-data";


// Örnek kullanıcı verileri
const users = [
  { id: 'usr-001', name: 'Ahmet Yılmaz', email: 'ahmet.yilmaz@example.com', role: 'Admin', createdAt: '2023-01-15', status: 'Active' },
  { id: 'usr-002', name: 'Zeynep Kaya', email: 'zeynep.kaya@example.com', role: 'Editor', createdAt: '2023-02-20', status: 'Active' },
  { id: 'usr-003', name: 'Mehmet Öztürk', email: 'mehmet.ozturk@example.com', role: 'Viewer', createdAt: '2023-03-10', status: 'Inactive' },
  { id: 'usr-004', name: 'Elif Demir', email: 'elif.demir@example.com', role: 'Support Team', createdAt: '2023-04-05', status: 'Active' },
];

export default function UsersPage() {
    const activeUsers = users.filter(u => u.status === 'Active').length;
    const inactiveUsers = users.filter(u => u.status === 'Inactive').length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Kullanıcı Yönetimi</h2>
                    <p className="text-muted-foreground">
                    Sistemdeki kullanıcıları ve rollerini yönetin.
                    </p>
                </div>
                 <Button asChild>
                    <Link href="/admin/users/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Yeni Kullanıcı Ekle
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{users.length}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Aktif Kullanıcılar</CardTitle>
                        <UserCheck className="h-4 w-4 text-green-500"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeUsers}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pasif Kullanıcılar</CardTitle>
                        <UserX className="h-4 w-4 text-destructive"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{inactiveUsers}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Toplam Rol</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{roles.length}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                 <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Kullanıcı Listesi</CardTitle>
                        <CardDescription>Mevcut tüm kullanıcıları görüntüleyin ve yönetin.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Adı Soyadı</TableHead>
                                    <TableHead>Rol</TableHead>
                                    <TableHead>Durum</TableHead>
                                    <TableHead><span className="sr-only">Eylemler</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map(user => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">
                                            <div>{user.name}</div>
                                            <div className="text-sm text-muted-foreground">{user.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.role === 'Admin' ? 'destructive' : 'secondary'}>{user.role}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.status === 'Active' ? 'default' : 'outline'} className={user.status === 'Active' ? 'bg-green-500' : ''}>
                                                {user.status}
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
                                                    <DropdownMenuItem>Şifre Sıfırla</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-destructive focus:text-destructive">
                                                        Sil
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex items-center justify-between">
                        <div>
                            <CardTitle>Kullanıcı Rolleri</CardTitle>
                            <CardDescription>Rolleri ve izinleri yönetin.</CardDescription>
                        </div>
                        <Button asChild size="sm" variant="outline">
                            <Link href="/admin/users/roles">Tümünü Yönet <ArrowRight className="ml-2 h-4 w-4"/></Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                           <TableHeader>
                               <TableRow>
                                   <TableHead>Rol</TableHead>
                                   <TableHead>Kullanıcılar</TableHead>
                               </TableRow>
                           </TableHeader>
                            <TableBody>
                                {roles.map(role => (
                                    <TableRow key={role.id}>
                                        <TableCell className="font-medium">{role.name}</TableCell>
                                        <TableCell>
                                             <Badge variant="secondary">{role.userCount}</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                 </Card>
            </div>
        </div>
    );
}
