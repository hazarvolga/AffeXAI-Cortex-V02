'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cmsService } from '@/lib/cms/cms-service';
import { Edit, Plus, Search, Trash2, Copy, Eye, EyeOff, FileText, Archive, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { Page, PageStatus } from '@affexai/shared-types';
import { CreatePageDialog } from '@/components/cms/create-page-dialog';

const CmsAdminPage = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<PageStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchPages();
  }, [selectedStatus]);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const status = selectedStatus === 'all' ? undefined : (selectedStatus as PageStatus);
      const pagesData = await cmsService.getPages(status);
      setPages(pagesData);
    } catch (error) {
      console.error('Failed to fetch pages:', error);
      toast({
        title: 'Hata',
        description: 'Sayfalar yüklenirken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter pages based on search query
  const filteredPages = useMemo(() => {
    if (!searchQuery) return pages;

    const query = searchQuery.toLowerCase();
    return pages.filter(page =>
      page.title.toLowerCase().includes(query) ||
      page.slug.toLowerCase().includes(query) ||
      (page.description && page.description.toLowerCase().includes(query))
    );
  }, [pages, searchQuery]);

  const handleCreatePage = () => {
    setCreateDialogOpen(true);
  };

  const handleCreateSuccess = (pageId: string) => {
    fetchPages();
    router.push(`/admin/cms/editor?pageId=${pageId}`);
  };

  const handlePublishPage = async (id: string) => {
    try {
      setActionLoading(id);
      await cmsService.publishPage(id);

      toast({
        title: 'Sayfa yayınlandı',
        description: 'Sayfa başarıyla yayınlandı.',
      });

      fetchPages();
    } catch (error) {
      console.error('Failed to publish page:', error);
      toast({
        title: 'Hata',
        description: 'Sayfa yayınlanırken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnpublishPage = async (id: string) => {
    try {
      setActionLoading(id);
      await cmsService.unpublishPage(id);

      toast({
        title: 'Yayından kaldırıldı',
        description: 'Sayfa başarıyla yayından kaldırıldı.',
      });

      fetchPages();
    } catch (error) {
      console.error('Failed to unpublish page:', error);
      toast({
        title: 'Hata',
        description: 'Sayfa yayından kaldırılırken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleClonePage = async (id: string, title: string) => {
    try {
      setActionLoading(id);
      await cmsService.clonePage(id);

      toast({
        title: 'Sayfa klonlandı',
        description: `"${title}" başarıyla klonlandı.`,
      });

      fetchPages();
    } catch (error) {
      console.error('Failed to clone page:', error);
      toast({
        title: 'Hata',
        description: 'Sayfa klonlanırken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteClick = (page: Page) => {
    setPageToDelete({ id: page.id, title: page.title });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pageToDelete) return;

    setIsDeleting(true);
    try {
      await cmsService.deletePage(pageToDelete.id);

      toast({
        title: 'Sayfa silindi',
        description: `"${pageToDelete.title}" başarıyla silindi.`,
      });

      fetchPages();
    } catch (error) {
      console.error('Failed to delete page:', error);

      toast({
        title: 'Hata',
        description: 'Sayfa silinirken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setPageToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleEditPage = (pageId: string) => {
    router.push(`/admin/cms/editor?pageId=${pageId}`);
  };

  // ============ BULK SELECTION HANDLERS ============

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredPages.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectPage = (pageId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, pageId]);
    } else {
      setSelectedIds(prev => prev.filter(id => id !== pageId));
    }
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const isAllSelected = filteredPages.length > 0 && selectedIds.length === filteredPages.length;
  const isPartiallySelected = selectedIds.length > 0 && selectedIds.length < filteredPages.length;

  // ============ BULK ACTION HANDLERS ============

  const handleBulkPublish = async () => {
    if (selectedIds.length === 0) return;

    try {
      setBulkActionLoading(true);
      const result = await cmsService.bulkPublish(selectedIds);

      toast({
        title: 'Toplu Yayınlama',
        description: `${result.successCount} sayfa yayınlandı${result.failedCount > 0 ? `, ${result.failedCount} başarısız` : ''}.`,
      });

      setSelectedIds([]);
      fetchPages();
    } catch (error) {
      console.error('Bulk publish failed:', error);
      toast({
        title: 'Hata',
        description: 'Sayfalar yayınlanırken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkUnpublish = async () => {
    if (selectedIds.length === 0) return;

    try {
      setBulkActionLoading(true);
      const result = await cmsService.bulkUnpublish(selectedIds);

      toast({
        title: 'Toplu Yayından Kaldırma',
        description: `${result.successCount} sayfa taslağa çekildi${result.failedCount > 0 ? `, ${result.failedCount} başarısız` : ''}.`,
      });

      setSelectedIds([]);
      fetchPages();
    } catch (error) {
      console.error('Bulk unpublish failed:', error);
      toast({
        title: 'Hata',
        description: 'Sayfalar yayından kaldırılırken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkArchive = async () => {
    if (selectedIds.length === 0) return;

    try {
      setBulkActionLoading(true);
      const result = await cmsService.bulkArchive(selectedIds);

      toast({
        title: 'Toplu Arşivleme',
        description: `${result.successCount} sayfa arşivlendi${result.failedCount > 0 ? `, ${result.failedCount} başarısız` : ''}.`,
      });

      setSelectedIds([]);
      fetchPages();
    } catch (error) {
      console.error('Bulk archive failed:', error);
      toast({
        title: 'Hata',
        description: 'Sayfalar arşivlenirken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDeleteClick = () => {
    if (selectedIds.length === 0) return;
    setBulkDeleteDialogOpen(true);
  };

  const handleConfirmBulkDelete = async () => {
    try {
      setBulkActionLoading(true);
      const result = await cmsService.bulkDelete(selectedIds);

      toast({
        title: 'Toplu Silme',
        description: `${result.successCount} sayfa silindi${result.failedCount > 0 ? `, ${result.failedCount} başarısız` : ''}.`,
      });

      setSelectedIds([]);
      fetchPages();
    } catch (error) {
      console.error('Bulk delete failed:', error);
      toast({
        title: 'Hata',
        description: 'Sayfalar silinirken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setBulkActionLoading(false);
      setBulkDeleteDialogOpen(false);
    }
  };

  const getStatusBadge = (status: PageStatus) => {
    const variants: Record<PageStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'secondary',
      published: 'default',
      archived: 'outline',
    };

    const labels: Record<PageStatus, string> = {
      draft: 'Taslak',
      published: 'Yayında',
      archived: 'Arşiv',
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Sayfa Yönetimi</h1>
            <p className="text-muted-foreground">CMS sayfalarını görüntüleyin ve yönetin</p>
          </div>
          <Button onClick={handleCreatePage}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Sayfa
          </Button>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Başlık veya slug'a göre ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={selectedStatus}
            onValueChange={(value: PageStatus | 'all') => setSelectedStatus(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Durum filtrele" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Sayfalar</SelectItem>
              <SelectItem value="draft">Taslak</SelectItem>
              <SelectItem value="published">Yayında</SelectItem>
              <SelectItem value="archived">Arşiv</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="mb-4 p-4 bg-muted rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium">{selectedIds.length} sayfa seçildi</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="h-8 px-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkPublish}
              disabled={bulkActionLoading}
            >
              <Eye className="h-4 w-4 mr-2" />
              Yayınla
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkUnpublish}
              disabled={bulkActionLoading}
            >
              <EyeOff className="h-4 w-4 mr-2" />
              Taslağa Çek
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkArchive}
              disabled={bulkActionLoading}
            >
              <Archive className="h-4 w-4 mr-2" />
              Arşivle
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDeleteClick}
              disabled={bulkActionLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Sil
            </Button>
          </div>
        </div>
      )}

      {/* Pages Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Sayfalar ({filteredPages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Sayfalar yükleniyor...</p>
            </div>
          ) : filteredPages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Sayfa bulunamadı.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                        aria-label="Tümünü seç"
                        className={isPartiallySelected ? 'data-[state=checked]:bg-primary/50' : ''}
                      />
                    </TableHead>
                    <TableHead className="w-[300px]">Başlık</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Son Güncelleme</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPages.map((page) => (
                    <TableRow key={page.id} className={selectedIds.includes(page.id) ? 'bg-muted/50' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(page.id)}
                          onCheckedChange={(checked) => handleSelectPage(page.id, checked as boolean)}
                          aria-label={`${page.title} sayfasını seç`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{page.title}</span>
                          {page.description && (
                            <span className="text-xs text-muted-foreground line-clamp-1">
                              {page.description}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          /{page.slug}
                        </code>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(page.status)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(page.updatedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPage(page.id)}
                            disabled={actionLoading === page.id}
                            title="Düzenle"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          {page.status !== 'published' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePublishPage(page.id)}
                              disabled={actionLoading === page.id}
                              title="Yayınla"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnpublishPage(page.id)}
                              disabled={actionLoading === page.id}
                              title="Yayından Kaldır"
                            >
                              <EyeOff className="h-4 w-4" />
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleClonePage(page.id, page.title)}
                            disabled={actionLoading === page.id}
                            title="Klonla"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(page)}
                            disabled={actionLoading === page.id}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Sayfayı Sil"
        description="Bu sayfayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        itemName={pageToDelete?.title}
        isDeleting={isDeleting}
        confirmText="Evet, Sil"
        cancelText="İptal"
      />

      {/* Create Page Dialog */}
      <CreatePageDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        onConfirm={handleConfirmBulkDelete}
        title="Seçili Sayfaları Sil"
        description={`${selectedIds.length} sayfa silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        itemName={`${selectedIds.length} sayfa`}
        isDeleting={bulkActionLoading}
        confirmText="Evet, Sil"
        cancelText="İptal"
      />
    </div>
  );
};

export default CmsAdminPage;
