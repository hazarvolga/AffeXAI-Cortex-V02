'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import { ReusableSectionsService, type ReusableSection, type SectionFilters } from '@/services/reusable-content.service';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Copy,
  Star,
  BarChart,
  Filter,
  RefreshCw,
  Layers
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const ReusableSectionsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sectionType, setSectionType] = useState<string>('all');
  const [filterPublic, setFilterPublic] = useState<string>('all');
  const [filterFeatured, setFilterFeatured] = useState<string>('all');
  const [filterMySections, setFilterMySections] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt' | 'usageCount' | 'featured'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<{ id: string; name: string } | null>(null);

  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Build filters object
  const filters: SectionFilters = useMemo(() => {
    const f: SectionFilters = {
      sortBy,
      sortOrder,
      page: currentPage,
      limit: 20,
    };

    if (searchQuery) f.search = searchQuery;
    if (sectionType !== 'all') f.sectionType = sectionType;
    if (filterPublic === 'public') f.isPublic = true;
    if (filterPublic === 'private') f.isPublic = false;
    if (filterFeatured === 'featured') f.isFeatured = true;
    if (filterFeatured === 'not-featured') f.isFeatured = false;
    if (filterMySections) f.mySections = true;

    return f;
  }, [searchQuery, sectionType, filterPublic, filterFeatured, filterMySections, sortBy, sortOrder, currentPage]);

  // Fetch sections with React Query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['reusable-sections', filters],
    queryFn: () => ReusableSectionsService.getAll(filters),
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => ReusableSectionsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reusable-sections'] });
      toast({
        title: 'Section silindi',
        description: `"${sectionToDelete?.name}" başarıyla silindi.`,
      });
    },
    onError: (error) => {
      console.error('Failed to delete section:', error);
      toast({
        title: 'Hata',
        description: 'Section silinirken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      ReusableSectionsService.duplicate(id, name, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reusable-sections'] });
      toast({
        title: 'Section kopyalandı',
        description: 'Section başarıyla kopyalandı.',
      });
    },
    onError: (error) => {
      console.error('Failed to duplicate section:', error);
      toast({
        title: 'Hata',
        description: 'Section kopyalanırken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      if (isFavorite) {
        await ReusableSectionsService.removeFromFavorites(id);
      } else {
        await ReusableSectionsService.addToFavorites(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reusable-sections'] });
    },
  });

  const handleDeleteClick = (section: ReusableSection) => {
    setSectionToDelete({ id: section.id, name: section.name });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!sectionToDelete) return;
    deleteMutation.mutate(sectionToDelete.id);
    setSectionToDelete(null);
  };

  const handleDuplicate = (section: ReusableSection) => {
    duplicateMutation.mutate({
      id: section.id,
      name: `${section.name} (Copy)`,
    });
  };

  const handleToggleFavorite = (section: ReusableSection) => {
    toggleFavoriteMutation.mutate({
      id: section.id,
      isFavorite: false, // TODO: Track favorites state
    });
  };

  const handleEdit = (sectionId: string) => {
    // Navigate to section builder
    router.push(`/admin/cms/reusable-sections/${sectionId}`);
  };

  const handleCreate = () => {
    // Navigate to section builder
    router.push('/admin/cms/reusable-sections/new');
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSectionType('all');
    setFilterPublic('all');
    setFilterFeatured('all');
    setFilterMySections(false);
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
            <h1 className="text-3xl font-bold">Yeniden Kullanılabilir Section'lar</h1>
            <p className="text-muted-foreground">
              Birden fazla bileşenden oluşan section'ları yönetin
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Yenile
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Section
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
                placeholder="Section ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Section Type */}
            <Select value={sectionType} onValueChange={setSectionType}>
              <SelectTrigger>
                <SelectValue placeholder="Section Tipi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Tipler</SelectItem>
                <SelectItem value="header">Header</SelectItem>
                <SelectItem value="footer">Footer</SelectItem>
                <SelectItem value="hero">Hero</SelectItem>
                <SelectItem value="features">Features</SelectItem>
                <SelectItem value="testimonials">Testimonials</SelectItem>
                <SelectItem value="gallery">Gallery</SelectItem>
                <SelectItem value="pricing">Pricing</SelectItem>
                <SelectItem value="stats">Stats</SelectItem>
                <SelectItem value="cta">CTA</SelectItem>
                <SelectItem value="content">Content</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
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
                  checked={filterMySections}
                  onChange={(e) => setFilterMySections(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Sadece Benim Section'larım</span>
              </label>
            </div>
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Filtreleri Temizle
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sections List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Section'lar</CardTitle>
              <CardDescription>
                {data ? `${data.total} section bulundu` : 'Yükleniyor...'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Section'lar yükleniyor...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              <p>Section'lar yüklenirken bir hata oluştu.</p>
            </div>
          ) : data && data.data.length === 0 ? (
            <div className="text-center py-8">
              <p>Hiç section bulunamadı.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {data?.data.map((section) => (
                  <div
                    key={section.id}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-lg">{section.name}</h3>
                            {section.isFeatured && (
                              <Badge variant="secondary">
                                <Star className="h-3 w-3 mr-1" />
                                Öne Çıkan
                              </Badge>
                            )}
                            {section.isPublic ? (
                              <Badge variant="outline">Herkese Açık</Badge>
                            ) : (
                              <Badge variant="secondary">Özel</Badge>
                            )}
                            {section.components && section.components.length > 0 && (
                              <Badge variant="outline">
                                <Layers className="h-3 w-3 mr-1" />
                                {section.components.length} bileşen
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {section.description || 'Açıklama yok'}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span>Tip: <span className="font-medium">{section.sectionType}</span></span>
                            <span className="flex items-center gap-1">
                              <BarChart className="h-3 w-3" />
                              {section.usageCount} kullanım
                            </span>
                            <span>
                              Güncellenme: {new Date(section.updatedAt).toLocaleDateString('tr-TR')}
                            </span>
                            {section.author && (
                              <span>
                                Yazar: {section.author.firstName} {section.author.lastName}
                              </span>
                            )}
                          </div>
                          {section.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {section.tags.map((tag, idx) => (
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
                        onClick={() => handleToggleFavorite(section)}
                        title="Favorilere Ekle"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(section.id)}
                        title="Düzenle"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Düzenle
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDuplicate(section)}
                        title="Kopyala"
                        disabled={duplicateMutation.isPending}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Kopyala
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(section)}
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
        title="Section'ı Sil"
        description="Bu section'ı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        itemName={sectionToDelete?.name}
        isDeleting={deleteMutation.isPending}
        confirmText="Evet, Sil"
        cancelText="İptal"
      />
    </div>
  );
};

export default ReusableSectionsPage;
