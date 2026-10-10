'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Folder, PlusCircle, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import groupsService, { CreateGroupDto, Group } from '@/lib/api/groupsService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

export default function GroupsManagementPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const data = await groupsService.getAllGroups();
      setGroups(data);
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    try {
      await groupsService.createGroup({
        name: newGroup.name,
        description: newGroup.description,
      });
      
      // Reset form
      setNewGroup({
        name: '',
        description: '',
      });
      
      // Refresh groups list
      fetchGroups();
      
      // Show success message
      alert('Grup başarıyla oluşturuldu!');
      setIsCreating(false);
    } catch (err) {
      console.error('Error creating group:', err);
      alert('Grup oluşturulurken bir hata oluştu.');
    }
  };

  const handleDeleteGroup = async (id: string) => {
    try {
      await groupsService.deleteGroup(id);
      // Refresh groups list
      fetchGroups();
      alert('Grup başarıyla silindi!');
    } catch (err) {
      console.error('Error deleting group:', err);
      alert('Grup silinirken bir hata oluştu.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/newsletter">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Grupları Yönet</h1>
            <p className="text-muted-foreground">Abonelerinizi manuel olarak atadığınız statik listeler halinde yönetin.</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Gruplar yükleniyor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/newsletter">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Grupları Yönet</h1>
          <p className="text-muted-foreground">Abonelerinizi manuel olarak atadığınız statik listeler halinde yönetin.</p>
        </div>
      </div>

      {isCreating ? (
        <Card>
          <CardHeader>
            <CardTitle>Yeni Grup Oluştur</CardTitle>
            <CardDescription>
              Yeni bir grup tanımlayın.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Grup Adı</Label>
              <Input
                id="group-name"
                value={newGroup.name}
                onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                placeholder="Grup adı"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-description">Açıklama</Label>
              <Textarea
                id="group-description"
                value={newGroup.description}
                onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                placeholder="Grup açıklaması"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                İptal
              </Button>
              <Button 
                onClick={handleCreateGroup}
                disabled={!newGroup.name}
              >
                Grup Oluştur
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Gruplar</CardTitle>
                  <CardDescription>
                    Mevcut gruplarınızı görüntüleyin ve yönetin.
                  </CardDescription>
                </div>
                <Button onClick={() => setIsCreating(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Yeni Grup Oluştur
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Folder className="h-12 w-12 text-muted-foreground" />
                  <div className="text-center">
                    <h3 className="text-lg font-semibold">Henüz hiç grubunuz yok</h3>
                    <p className="text-muted-foreground">
                      Yeni gruplar oluşturarak abonelerinizi organize edin.
                    </p>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Grup Adı</TableHead>
                      <TableHead>Açıklama</TableHead>
                      <TableHead>Abone Sayısı</TableHead>
                      <TableHead><span className="sr-only">Eylemler</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell className="font-medium">{group.name}</TableCell>
                        <TableCell className="text-muted-foreground">{group.description || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{group.subscriberCount}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Menüyü aç</span>
                                <span className="text-lg">⋮</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Düzenle
                              </DropdownMenuItem>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Sil
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Bu işlem geri alınamaz. "{group.name}" grubu kalıcı olarak silinecek.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>İptal</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteGroup(group.id)}>
                                      Sil
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}