'use client';

import React, { useEffect } from 'react';
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
import { ReusableComponentsService } from '@/services/reusable-content.service';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2, X } from 'lucide-react';
import { ReusableComponentPropsEditor } from '@/components/cms/reusable/reusable-component-props-editor';

const componentSchema = z.object({
  name: z.string().min(3, 'İsim en az 3 karakter olmalı').max(255),
  description: z.string().optional(),
  componentType: z.enum(['text', 'button', 'image', 'card', 'form', 'input', 'container', 'grid', 'block', 'custom']),
  blockType: z.string().optional(),
  blockCategory: z.string().optional(),
  blockId: z.string().optional(),
  props: z.record(z.any()),
  tags: z.array(z.string()),
  categoryId: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  isPublic: z.boolean(),
  isFeatured: z.boolean(),
});

type ComponentFormData = z.infer<typeof componentSchema>;

const ComponentDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const componentId = params.componentId as string;
  const isNewComponent = componentId === 'new';

  const [tagInput, setTagInput] = React.useState('');
  const [propsJson, setPropsJson] = React.useState('{}');

  // Fetch component if editing
  const { data: component, isLoading } = useQuery({
    queryKey: ['reusable-component', componentId],
    queryFn: () => ReusableComponentsService.getById(componentId),
    enabled: !isNewComponent,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ComponentFormData>({
    resolver: zodResolver(componentSchema),
    defaultValues: {
      name: '',
      description: '',
      componentType: 'custom',
      props: {},
      tags: [],
      isPublic: false,
      isFeatured: false,
    },
  });

  const tags = watch('tags') || [];
  const isPublic = watch('isPublic');
  const isFeatured = watch('isFeatured');

  // Update form when component data is loaded
  useEffect(() => {
    if (component) {
      reset({
        name: component.name,
        description: component.description || '',
        componentType: component.componentType as any,
        blockType: component.blockType,
        blockCategory: component.blockCategory,
        blockId: component.blockId, // ✅ Add blockId for DynamicFormGenerator
        props: component.props,
        tags: component.tags,
        categoryId: component.categoryId,
        thumbnailUrl: component.thumbnailUrl,
        isPublic: component.isPublic,
        isFeatured: component.isFeatured,
      });
      setPropsJson(JSON.stringify(component.props, null, 2));
    }
  }, [component, reset]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: ComponentFormData) => ReusableComponentsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reusable-components'] });
      toast({
        title: 'Bileşen oluşturuldu',
        description: 'Bileşen başarıyla oluşturuldu.',
      });
      router.push('/admin/cms/reusable-components');
    },
    onError: (error) => {
      console.error('Failed to create component:', error);
      toast({
        title: 'Hata',
        description: 'Bileşen oluşturulurken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: ComponentFormData) =>
      ReusableComponentsService.update(componentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reusable-components'] });
      queryClient.invalidateQueries({ queryKey: ['reusable-component', componentId] });
      toast({
        title: 'Bileşen güncellendi',
        description: 'Bileşen başarıyla güncellendi.',
      });
      router.push('/admin/cms/reusable-components');
    },
    onError: (error) => {
      console.error('Failed to update component:', error);
      toast({
        title: 'Hata',
        description: 'Bileşen güncellenirken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ComponentFormData) => {
    // Props are already managed by the ReusableComponentPropsEditor
    // and set via setValue('props', newProps)

    if (isNewComponent) {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setValue('tags', [...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setValue('tags', tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (!isNewComponent && isLoading) {
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
          onClick={() => router.push('/admin/cms/reusable-components')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri
        </Button>
        <h1 className="text-3xl font-bold">
          {isNewComponent ? 'Yeni Bileşen Oluştur' : 'Bileşeni Düzenle'}
        </h1>
        <p className="text-muted-foreground">
          {isNewComponent
            ? 'Yeniden kullanılabilir yeni bir bileşen oluşturun'
            : 'Mevcut bileşeni düzenleyin'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Temel Bilgiler</CardTitle>
            <CardDescription>Bileşenin temel özelliklerini girin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">İsim *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Örn: Hero Section Background"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Bileşen hakkında açıklama..."
                rows={3}
              />
            </div>

            {/* Component Type */}
            <div className="space-y-2">
              <Label htmlFor="componentType">Bileşen Tipi *</Label>
              <Select
                value={watch('componentType')}
                onValueChange={(value) => setValue('componentType', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Block Type */}
              <div className="space-y-2">
                <Label htmlFor="blockType">Blok Tipi</Label>
                <Input
                  id="blockType"
                  {...register('blockType')}
                  placeholder="Örn: hero, content, features"
                />
              </div>

              {/* Block Category */}
              <div className="space-y-2">
                <Label htmlFor="blockCategory">Blok Kategorisi</Label>
                <Input
                  id="blockCategory"
                  {...register('blockCategory')}
                  placeholder="Örn: layout, content, media"
                />
              </div>
            </div>

            {/* Block ID - For prebuild blocks */}
            <div className="space-y-2">
              <Label htmlFor="blockId">Prebuild Block ID (Opsiyonel)</Label>
              <Input
                id="blockId"
                {...register('blockId')}
                placeholder="Örn: hero-gradient-1, feature-grid-3-col"
              />
              <p className="text-xs text-muted-foreground">
                Prebuild block ID girerseniz, otomatik form oluşturulur
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Props & Configuration */}
        <ReusableComponentPropsEditor
          componentType={watch('componentType')}
          blockType={watch('blockType')}
          blockId={watch('blockId')}
          value={watch('props')}
          onChange={(newProps) => {
            setValue('props', newProps);
            setPropsJson(JSON.stringify(newProps, null, 2));
          }}
        />

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Etiketler</CardTitle>
            <CardDescription>Bileşeni bulmak için etiketler ekleyin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
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
            {/* Is Public */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isPublic">Herkese Açık</Label>
                <p className="text-sm text-muted-foreground">
                  Diğer kullanıcılar bu bileşeni görebilir
                </p>
              </div>
              <Switch
                id="isPublic"
                checked={isPublic}
                onCheckedChange={(checked) => setValue('isPublic', checked)}
              />
            </div>

            {/* Is Featured */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isFeatured">Öne Çıkan</Label>
                <p className="text-sm text-muted-foreground">
                  Bu bileşeni öne çıkan olarak işaretle
                </p>
              </div>
              <Switch
                id="isFeatured"
                checked={isFeatured}
                onCheckedChange={(checked) => setValue('isFeatured', checked)}
              />
            </div>

            {/* Thumbnail URL */}
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
            {isNewComponent ? 'Oluştur' : 'Güncelle'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/cms/reusable-components')}
          >
            İptal
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ComponentDetailPage;
