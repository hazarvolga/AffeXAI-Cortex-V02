'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ReusableComponentsService,
  ReusableSectionsService,
  type ReusableComponent,
  type ReusableSection,
} from '@/services/reusable-content.service';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Star,
  Edit,
  Trash2,
  RefreshCw,
  Loader2,
  Box,
  Layers,
  BarChart,
} from 'lucide-react';

const FavoritesPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'components' | 'sections'>('components');

  // Fetch favorite components
  const {
    data: favoriteComponents,
    isLoading: loadingComponents,
    refetch: refetchComponents,
  } = useQuery({
    queryKey: ['favorite-components'],
    queryFn: () => ReusableComponentsService.getFavorites(),
    refetchInterval: 30000,
  });

  // Fetch favorite sections
  const {
    data: favoriteSections,
    isLoading: loadingSections,
    refetch: refetchSections,
  } = useQuery({
    queryKey: ['favorite-sections'],
    queryFn: () => ReusableSectionsService.getFavorites(),
    refetchInterval: 30000,
  });

  // Remove component from favorites
  const removeComponentMutation = useMutation({
    mutationFn: (id: string) => ReusableComponentsService.removeFromFavorites(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite-components'] });
      queryClient.invalidateQueries({ queryKey: ['reusable-components'] });
      toast({
        title: 'Favorilerden çıkarıldı',
        description: 'Bileşen favorilerden çıkarıldı.',
      });
    },
    onError: (error) => {
      console.error('Failed to remove from favorites:', error);
      toast({
        title: 'Hata',
        description: 'Favorilerden çıkarılırken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  // Remove section from favorites
  const removeSectionMutation = useMutation({
    mutationFn: (id: string) => ReusableSectionsService.removeFromFavorites(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite-sections'] });
      queryClient.invalidateQueries({ queryKey: ['reusable-sections'] });
      toast({
        title: 'Favorilerden çıkarıldı',
        description: 'Section favorilerden çıkarıldı.',
      });
    },
    onError: (error) => {
      console.error('Failed to remove from favorites:', error);
      toast({
        title: 'Hata',
        description: 'Favorilerden çıkarılırken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  const handleEditComponent = (componentId: string) => {
    router.push(`/admin/cms/reusable-components/${componentId}`);
  };

  const handleEditSection = (sectionId: string) => {
    router.push(`/admin/cms/reusable-sections/${sectionId}`);
  };

  const handleRemoveComponentFromFavorites = (componentId: string) => {
    removeComponentMutation.mutate(componentId);
  };

  const handleRemoveSectionFromFavorites = (sectionId: string) => {
    removeSectionMutation.mutate(sectionId);
  };

  const renderComponentCard = (component: ReusableComponent) => (
    <div
      key={component.id}
      className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Box className="h-4 w-4 text-muted-foreground" />
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
          <span>
            Tip: <span className="font-medium">{component.componentType}</span>
          </span>
          {component.blockType && (
            <span>
              Blok: <span className="font-medium">{component.blockType}</span>
            </span>
          )}
          <span className="flex items-center gap-1">
            <BarChart className="h-3 w-3" />
            {component.usageCount} kullanım
          </span>
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
      <div className="flex gap-2 ml-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleEditComponent(component.id)}
          title="Düzenle"
        >
          <Edit className="h-4 w-4 mr-1" />
          Düzenle
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleRemoveComponentFromFavorites(component.id)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          title="Favorilerden Çıkar"
          disabled={removeComponentMutation.isPending}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Çıkar
        </Button>
      </div>
    </div>
  );

  const renderSectionCard = (section: ReusableSection) => (
    <div
      key={section.id}
      className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Layers className="h-4 w-4 text-muted-foreground" />
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
              <Box className="h-3 w-3 mr-1" />
              {section.components.length} bileşen
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          {section.description || 'Açıklama yok'}
        </p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>
            Tip: <span className="font-medium">{section.sectionType}</span>
          </span>
          <span className="flex items-center gap-1">
            <BarChart className="h-3 w-3" />
            {section.usageCount} kullanım
          </span>
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
      <div className="flex gap-2 ml-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleEditSection(section.id)}
          title="Düzenle"
        >
          <Edit className="h-4 w-4 mr-1" />
          Düzenle
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleRemoveSectionFromFavorites(section.id)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          title="Favorilerden Çıkar"
          disabled={removeSectionMutation.isPending}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Çıkar
        </Button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
              Favorilerim
            </h1>
            <p className="text-muted-foreground">
              Favori olarak işaretlediğiniz bileşenler ve section'lar
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                activeTab === 'components' ? refetchComponents() : refetchSections()
              }
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Yenile
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="components" className="flex items-center gap-2">
            <Box className="h-4 w-4" />
            Bileşenler
            {favoriteComponents && (
              <Badge variant="secondary">{favoriteComponents.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sections" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Section'lar
            {favoriteSections && (
              <Badge variant="secondary">{favoriteSections.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Components Tab */}
        <TabsContent value="components" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Favori Bileşenler</CardTitle>
              <CardDescription>
                {favoriteComponents
                  ? `${favoriteComponents.length} favori bileşen`
                  : 'Yükleniyor...'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingComponents ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p>Favoriler yükleniyor...</p>
                </div>
              ) : !favoriteComponents || favoriteComponents.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Henüz favori bileşen yok</p>
                  <p className="text-sm text-muted-foreground">
                    Bileşen listesinden yıldız ikonuna tıklayarak favorilere ekleyin
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => router.push('/admin/cms/reusable-components')}
                  >
                    Bileşenlere Git
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {favoriteComponents.map((component) => renderComponentCard(component))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sections Tab */}
        <TabsContent value="sections" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Favori Section'lar</CardTitle>
              <CardDescription>
                {favoriteSections
                  ? `${favoriteSections.length} favori section`
                  : 'Yükleniyor...'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSections ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p>Favoriler yükleniyor...</p>
                </div>
              ) : !favoriteSections || favoriteSections.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Henüz favori section yok</p>
                  <p className="text-sm text-muted-foreground">
                    Section listesinden yıldız ikonuna tıklayarak favorilere ekleyin
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => router.push('/admin/cms/reusable-sections')}
                  >
                    Section'lara Git
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {favoriteSections.map((section) => renderSectionCard(section))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FavoritesPage;
