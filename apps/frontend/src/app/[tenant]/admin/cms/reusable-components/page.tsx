'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import { ReusableComponentsService, type ReusableComponent, type ComponentFilters } from '@/services/reusable-content.service';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Copy,
  Star,
  Eye,
  BarChart,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const ReusableComponentsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [componentType, setComponentType] = useState<string>('all');
  const [blockType, setBlockType] = useState<string>('all');
  const [filterPublic, setFilterPublic] = useState<string>('all');
  const [filterFeatured, setFilterFeatured] = useState<string>('all');
  const [filterMyComponents, setFilterMyComponents] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt' | 'usageCount' | 'featured'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [componentToDelete, setComponentToDelete] = useState<{ id: string; name: string } | null>(null);

  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Build filters object
  const filters: ComponentFilters = useMemo(() => {
    const f: ComponentFilters = {
      sortBy,
      sortOrder,
      page: currentPage,
      limit: 20,
    };

    if (searchQuery) f.search = searchQuery;
    if (componentType !== 'all') f.componentType = componentType;
    if (blockType !== 'all') f.blockType = blockType;
    if (filterPublic === 'public') f.isPublic = true;
    if (filterPublic === 'private') f.isPublic = false;
    if (filterFeatured === 'featured') f.isFeatured = true;
    if (filterFeatured === 'not-featured') f.isFeatured = false;
    if (filterMyComponents) f.myComponents = true;

    return f;
  }, [searchQuery, componentType, blockType, filterPublic, filterFeatured, filterMyComponents, sortBy, sortOrder, currentPage]);

  // Fetch components with React Query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['reusable-components', filters],
    queryFn: () => ReusableComponentsService.getAll(filters),
    refetchInterval: 30000, // Refetch every 30s
    staleTime: 10000,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => ReusableComponentsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reusable-components'] });
      toast({
        title: 'Bileşen silindi',
        description: `"${componentToDelete?.name}" başarıyla silindi.`,
      });
    },
    onError: (error) => {
      console.error('Failed to delete component:', error);
      toast({
        title: 'Hata',
        description: 'Bileşen silinirken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      ReusableComponentsService.duplicate(id, name, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reusable-components'] });
      toast({
        title: 'Bileşen kopyalandı',
        description: 'Bileşen başarıyla kopyalandı.',
      });
    },
    onError: (error) => {
      console.error('Failed to duplicate component:', error);
      toast({
        title: 'Hata',
        description: 'Bileşen kopyalanırken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      if (isFavorite) {
        await ReusableComponentsService.removeFromFavorites(id);
      } else {
        await ReusableComponentsService.addToFavorites(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reusable-components'] });
    },
  });

  const handleDeleteClick = (component: ReusableComponent) => {
    setComponentToDelete({ id: component.id, name: component.name });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!componentToDelete) return;
    deleteMutation.mutate(componentToDelete.id);
    setComponentToDelete(null);
  };

  const handleDuplicate = (component: ReusableComponent) => {
    duplicateMutation.mutate({
      id: component.id,
      name: `${component.name} (Copy)`,
    });
  };

  const handleToggleFavorite = (component: ReusableComponent) => {
    // Note: We need to track favorites client-side or add an isFavorite field to the response
    // For now, we'll call the API directly
    toggleFavoriteMutation.mutate({
      id: component.id,
      isFavorite: false, // TODO: Track favorites state
    });
  };

  const handleEdit = (componentId: string) => {
    // TODO: Navigate to edit page when created
    router.push(`/admin/cms/reusable-components/${componentId}`);
  };

  const handleCreate = () => {
    // TODO: Navigate to create page when created
    router.push('/admin/cms/reusable-components/new');
  };

  const resetFilters = () => {
    setSearchQuery('');
    setComponentType('all');
    setBlockType('all');
    setFilterPublic('all');
    setFilterFeatured('all');
    setFilterMyComponents(false);
    setSortBy('createdAt');
    setSortOrder('DESC');
    setCurrentPage(1);
  };

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Yeniden Kullanılabilir Bileşenler</h1>
            <p className="text-muted-foreground">
              Tekrar kullanılabilir UI bileşenlerini yönetin
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Yenile
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Bileşen
            </Button>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtreler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Bileşen ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Component Type */}
            <Select value={componentType} onValueChange={setComponentType}>
              <SelectTrigger>
                <SelectValue placeholder="Bileşen Tipi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Tipler</SelectItem>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="button">Button</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="form">Form</SelectItem>
                <SelectItem value="input">Input</SelectItem>
                <SelectItem value="container">Container</SelectItem>
                <SelectItem value="grid">Grid</SelectItem>
                <SelectItem value="block">Block</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>

            {/* Block Type */}
            <Select value={blockType} onValueChange={setBlockType}>
              <SelectTrigger>
                <SelectValue placeholder="Blok Tipi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Bloklar</SelectItem>
                <SelectItem value="hero">Hero</SelectItem>
                <SelectItem value="content">Content</SelectItem>
                <SelectItem value="features">Features</SelectItem>
                <SelectItem value="testimonials">Testimonials</SelectItem>
                <SelectItem value="gallery">Gallery</SelectItem>
                <SelectItem value="pricing">Pricing</SelectItem>
                <SelectItem value="stats">Stats</SelectItem>
                <SelectItem value="footer">Footer</SelectItem>
              </SelectContent>
            </Select>

            {/* Public Filter */}
            <Select value={filterPublic} onValueChange={setFilterPublic}>
              <SelectTrigger>
                <SelectValue placeholder="Görünürlük" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="public">Herkese Açık</SelectItem>
                <SelectItem value="private">Özel</SelectItem>
              </SelectContent>
            </Select>

            {/* Featured Filter */}
            <Select value={filterFeatured} onValueChange={setFilterFeatured}>
              <SelectTrigger>
                <SelectValue placeholder="Öne Çıkan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="featured">Öne Çıkanlar</SelectItem>
                <SelectItem value="not-featured">Normal</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Sıralama" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">İsim</SelectItem>
                <SelectItem value="createdAt">Oluşturma Tarihi</SelectItem>
                <SelectItem value="updatedAt">Güncellenme Tarihi</SelectItem>
                <SelectItem value="usageCount">Kullanım Sayısı</SelectItem>
                <SelectItem value="featured">Öne Çıkanlar</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Order */}
            <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Sıra" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ASC">Artan</SelectItem>
                <SelectItem value="DESC">Azalan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterMyComponents}
                  onChange={(e) => setFilterMyComponents(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Sadece Benim Bileşenlerim</span>
              </label>
            </div>
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Filtreleri Temizle
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Components List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Bileşenler</CardTitle>
              <CardDescription>
                {data ? `${data.total} bileşen bulundu` : 'Yükleniyor...'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Bileşenler yükleniyor...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              <p>Bileşenler yüklenirken bir hata oluştu.</p>
            </div>
          ) : data && data.data.length === 0 ? (
            <div className="text-center py-8">
              <p>Hiç bileşen bulunamadı.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {data?.data.map((component) => (
                  <div
                    key={component.id}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-lg">{component.name}</h3>
                            {component.isFeatured && (
                              <Badge variant="secondary">
                                <Star className="h-3 w-3 mr-1" />
                                Öne Çıkan
                              </Badge>
                            )}
                            {component.isPublic ? (
                              <Badge variant="outline">Herkese Açık</Badge>
                            ) : (
                              <Badge variant="secondary">Özel</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {component.description || 'Açıklama yok'}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span>Tip: <span className="font-medium">{component.componentType}</span></span>
                            {component.blockType && (
                              <span>Blok: <span className="font-medium">{component.blockType}</span></span>
                            )}
                            <span className="flex items-center gap-1">
                              <BarChart className="h-3 w-3" />
                              {component.usageCount} kullanım
                            </span>
                            <span>
                              Güncellenme: {new Date(component.updatedAt).toLocaleDateString('tr-TR')}
                            </span>
                            {component.author && (
                              <span>
                                Yazar: {component.author.firstName} {component.author.lastName}
                              </span>
                            )}
                          </div>
                          {component.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {component.tags.map((tag, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleFavorite(component)}
                        title="Favorilere Ekle"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(component.id)}
                        title="Düzenle"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Düzenle
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDuplicate(component)}
                        title="Kopyala"
                        disabled={duplicateMutation.isPending}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Kopyala
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(component)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Sil
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Sayfa {data.page} / {data.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Önceki
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(data.totalPages, prev + 1))}
                      disabled={currentPage === data.totalPages}
                    >
                      Sonraki
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Bileşeni Sil"
        description="Bu bileşeni silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        itemName={componentToDelete?.name}
        isDeleting={deleteMutation.isPending}
        confirmText="Evet, Sil"
        cancelText="İptal"
      />
    </div>
  );
};

export default ReusableComponentsPage;
