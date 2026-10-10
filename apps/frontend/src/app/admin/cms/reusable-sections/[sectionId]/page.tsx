'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  ReusableSectionsService,
  ReusableComponentsService,
  type SectionComponent,
} from '@/services/reusable-content.service';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Save,
  Loader2,
  X,
  Plus,
  Trash2,
  GripVertical,
  Box,
} from 'lucide-react';

const sectionSchema = z.object({
  name: z.string().min(3, 'İsim en az 3 karakter olmalı').max(255),
  description: z.string().optional(),
  sectionType: z.string().min(1, 'Section tipi gerekli'),
  tags: z.array(z.string()),
  thumbnailUrl: z.string().optional(),
  isPublic: z.boolean(),
  isFeatured: z.boolean(),
});

type SectionFormData = z.infer<typeof sectionSchema>;

interface ComponentItem {
  id: string;
  reusableComponentId?: string;
  componentType: string;
  blockType?: string;
  props: Record<string, any>;
  orderIndex: number;
}

const SectionDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const sectionId = params.sectionId as string;
  const isNewSection = sectionId === 'new';

  const [tagInput, setTagInput] = useState('');
  const [components, setComponents] = useState<ComponentItem[]>([]);
  const [showComponentPicker, setShowComponentPicker] = useState(false);

  // Fetch section if editing
  const { data: section, isLoading } = useQuery({
    queryKey: ['reusable-section', sectionId],
    queryFn: () => ReusableSectionsService.getById(sectionId),
    enabled: !isNewSection,
  });

  // Fetch available components for picker
  const { data: availableComponents } = useQuery({
    queryKey: ['reusable-components', { limit: 100 }],
    queryFn: () => ReusableComponentsService.getAll({ limit: 100 }),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<SectionFormData>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      name: '',
      description: '',
      sectionType: 'custom',
      tags: [],
      isPublic: false,
      isFeatured: false,
    },
  });

  const tags = watch('tags') || [];
  const isPublic = watch('isPublic');
  const isFeatured = watch('isFeatured');

  // Update form when section data is loaded
  useEffect(() => {
    if (section) {
      reset({
        name: section.name,
        description: section.description || '',
        sectionType: section.sectionType,
        tags: section.tags,
        thumbnailUrl: section.thumbnailUrl,
        isPublic: section.isPublic,
        isFeatured: section.isFeatured,
      });

      // Load components
      if (section.components) {
        const loadedComponents: ComponentItem[] = section.components.map((comp, idx) => ({
          id: comp.id || `temp-${idx}`,
          reusableComponentId: comp.reusableComponentId,
          componentType: comp.componentType,
          blockType: comp.blockType,
          props: comp.props,
          orderIndex: comp.orderIndex,
        }));
        setComponents(loadedComponents);
      }
    }
  }, [section, reset]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => ReusableSectionsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reusable-sections'] });
      toast({
        title: 'Section oluşturuldu',
        description: 'Section başarıyla oluşturuldu.',
      });
      router.push('/admin/cms/reusable-sections');
    },
    onError: (error) => {
      console.error('Failed to create section:', error);
      toast({
        title: 'Hata',
        description: 'Section oluşturulurken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => ReusableSectionsService.update(sectionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reusable-sections'] });
      queryClient.invalidateQueries({ queryKey: ['reusable-section', sectionId] });
      toast({
        title: 'Section güncellendi',
        description: 'Section başarıyla güncellendi.',
      });
      router.push('/admin/cms/reusable-sections');
    },
    onError: (error) => {
      console.error('Failed to update section:', error);
      toast({
        title: 'Hata',
        description: 'Section güncellenirken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: SectionFormData) => {
    const payload = {
      ...data,
      components: components.map((comp, idx) => ({
        reusableComponentId: comp.reusableComponentId,
        componentType: comp.componentType,
        blockType: comp.blockType,
        props: comp.props,
        orderIndex: idx,
      })),
    };

    if (isNewSection) {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate(payload);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setValue('tags', [...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setValue('tags', tags.filter((tag) => tag !== tagToRemove));
  };

  const handleAddComponent = (componentId: string) => {
    const reusableComponent = availableComponents?.data.find((c) => c.id === componentId);
    if (!reusableComponent) return;

    const newComponent: ComponentItem = {
      id: `temp-${Date.now()}`,
      reusableComponentId: componentId,
      componentType: reusableComponent.componentType,
      blockType: reusableComponent.blockType,
      props: reusableComponent.props,
      orderIndex: components.length,
    };

    setComponents([...components, newComponent]);
    setShowComponentPicker(false);
  };

  const handleRemoveComponent = (componentId: string) => {
    setComponents(components.filter((c) => c.id !== componentId));
  };

  const handleMoveComponent = (componentId: string, direction: 'up' | 'down') => {
    const index = components.findIndex((c) => c.id === componentId);
    if (index === -1) return;

    const newComponents = [...components];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newComponents.length) return;

    [newComponents[index], newComponents[targetIndex]] = [
      newComponents[targetIndex],
      newComponents[index],
    ];

    setComponents(newComponents);
  };

  if (!isNewSection && isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/cms/reusable-sections')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri
        </Button>
        <h1 className="text-3xl font-bold">
          {isNewSection ? 'Yeni Section Oluştur' : 'Section\'ı Düzenle'}
        </h1>
        <p className="text-muted-foreground">
          {isNewSection
            ? 'Birden fazla bileşenden oluşan yeni bir section oluşturun'
            : 'Mevcut section\'ı düzenleyin'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Temel Bilgiler</CardTitle>
            <CardDescription>Section\'ın temel özelliklerini girin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">İsim *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Örn: Product Features Section"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Section hakkında açıklama..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sectionType">Section Tipi *</Label>
              <Select
                value={watch('sectionType')}
                onValueChange={(value) => setValue('sectionType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
            </div>
          </CardContent>
        </Card>

        {/* Section Components */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Bileşenler ({components.length})</CardTitle>
                <CardDescription>
                  Section içinde kullanılacak bileşenleri ekleyin
                </CardDescription>
              </div>
              <Button
                type="button"
                onClick={() => setShowComponentPicker(!showComponentPicker)}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Bileşen Ekle
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Component Picker */}
            {showComponentPicker && (
              <Card className="bg-accent/50">
                <CardContent className="pt-6">
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availableComponents?.data.map((component) => (
                      <button
                        key={component.id}
                        type="button"
                        onClick={() => handleAddComponent(component.id)}
                        className="w-full p-3 text-left border rounded-lg hover:bg-background transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Box className="h-4 w-4" />
                          <div className="flex-1">
                            <p className="font-medium">{component.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {component.componentType}
                              {component.blockType && ` · ${component.blockType}`}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Components List */}
            {components.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Box className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Henüz bileşen eklenmedi</p>
                <p className="text-sm">Yukarıdaki butonu kullanarak bileşen ekleyin</p>
              </div>
            ) : (
              <div className="space-y-2">
                {components.map((component, index) => {
                  const reusableComp = availableComponents?.data.find(
                    (c) => c.id === component.reusableComponentId
                  );
                  return (
                    <div
                      key={component.id}
                      className="flex items-center gap-2 p-3 border rounded-lg"
                    >
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                      <div className="flex-1">
                        <p className="font-medium">
                          {reusableComp?.name || component.componentType}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {component.componentType}
                          {component.blockType && ` · ${component.blockType}`}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveComponent(component.id, 'up')}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveComponent(component.id, 'down')}
                          disabled={index === components.length - 1}
                        >
                          ↓
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveComponent(component.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Etiketler</CardTitle>
            <CardDescription>Section\'ı bulmak için etiketler ekleyin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Etiket ekle..."
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                Ekle
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Ayarlar</CardTitle>
            <CardDescription>Görünürlük ve özellik ayarları</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isPublic">Herkese Açık</Label>
                <p className="text-sm text-muted-foreground">
                  Diğer kullanıcılar bu section\'ı görebilir
                </p>
              </div>
              <Switch
                id="isPublic"
                checked={isPublic}
                onCheckedChange={(checked) => setValue('isPublic', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isFeatured">Öne Çıkan</Label>
                <p className="text-sm text-muted-foreground">
                  Bu section\'ı öne çıkan olarak işaretle
                </p>
              </div>
              <Switch
                id="isFeatured"
                checked={isFeatured}
                onCheckedChange={(checked) => setValue('isFeatured', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
              <Input
                id="thumbnailUrl"
                {...register('thumbnailUrl')}
                placeholder="https://example.com/thumbnail.jpg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="min-w-32"
          >
            {(createMutation.isPending || updateMutation.isPending) && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            <Save className="h-4 w-4 mr-2" />
            {isNewSection ? 'Oluştur' : 'Güncelle'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/cms/reusable-sections')}
          >
            İptal
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SectionDetailPage;
