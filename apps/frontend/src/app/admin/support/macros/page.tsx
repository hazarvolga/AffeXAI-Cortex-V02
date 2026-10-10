'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Wand2,
  Plus,
  Search,
  Edit,
  Trash2,
  Play,
  Loader2,
  TrendingUp,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

interface MacroAction {
  type: 'update_status' | 'assign' | 'set_priority' | 'add_category' | 'add_tags' | 'add_note' | 'send_email';
  value: string;
  label?: string;
}

interface Macro {
  id: string;
  name: string;
  description: string;
  actions: MacroAction[];
  usageCount: number;
  isPublic: boolean;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function MacrosAdminPage() {
  const [macros, setMacros] = useState<Macro[]>([]);
  const [filteredMacros, setFilteredMacros] = useState<Macro[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [macroToDelete, setMacroToDelete] = useState<Macro | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchMacros();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = macros.filter(
        (macro) =>
          macro.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          macro.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMacros(filtered);
    } else {
      setFilteredMacros(macros);
    }
  }, [searchQuery, macros]);

  const fetchMacros = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/macros');

      if (response.ok) {
        const data = await response.json();
        setMacros(data);
        setFilteredMacros(data);
      }
    } catch (error) {
      console.error('Failed to fetch macros:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!macroToDelete) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/admin/macros/${macroToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchMacros();
        setDeleteDialogOpen(false);
        setMacroToDelete(null);
      }
    } catch (error) {
      console.error('Failed to delete macro:', error);
    } finally {
      setDeleting(false);
    }
  };

  const getActionTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      update_status: 'Durum Değiştir',
      assign: 'Ata',
      set_priority: 'Öncelik Ayarla',
      add_category: 'Kategori Ekle',
      add_tags: 'Etiket Ekle',
      add_note: 'Not Ekle',
      send_email: 'Email Gönder',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Wand2 className="h-8 w-8 text-purple-600" />
            Makro Yönetimi
          </h1>
          <p className="text-muted-foreground mt-2">
            Toplu işlem makrolarını yönetin
          </p>
        </div>
        <Link href="/admin/support/macros/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Makro
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Makro</CardTitle>
            <Wand2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{macros.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Genel Makrolar</CardTitle>
            <Zap className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {macros.filter((m) => m.isPublic).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kullanım</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {macros.reduce((sum, m) => sum + m.usageCount, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Makro ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Macros Table */}
      <Card>
        <CardHeader>
          <CardTitle>Makrolar</CardTitle>
          <CardDescription>
            Tüm makroları görüntüleyin ve yönetin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>İsim</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead>İşlemler</TableHead>
                <TableHead>Oluşturan</TableHead>
                <TableHead className="text-right">Kullanım</TableHead>
                <TableHead className="text-right">Eylemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMacros.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">Makro bulunamadı</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMacros.map((macro) => (
                  <TableRow key={macro.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Wand2 className="h-4 w-4 text-purple-600" />
                        <span className="font-medium">{macro.name}</span>
                        {macro.isPublic && (
                          <Badge variant="secondary" className="text-xs">
                            Genel
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {macro.description}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {macro.actions.slice(0, 3).map((action, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {getActionTypeLabel(action.type)}
                          </Badge>
                        ))}
                        {macro.actions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{macro.actions.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {macro.createdBy.firstName} {macro.createdBy.lastName}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Play className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-medium">{macro.usageCount}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/support/macros/${macro.id}/edit`}>
                          <Button size="sm" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setMacroToDelete(macro);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Makroyu Sil</DialogTitle>
            <DialogDescription>
              Bu makroyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          {macroToDelete && (
            <div className="py-4">
              <p className="font-medium">{macroToDelete.name}</p>
              <p className="text-sm text-muted-foreground">{macroToDelete.description}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {macroToDelete.usageCount} kez kullanıldı
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              İptal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Siliniyor...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Sil
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
