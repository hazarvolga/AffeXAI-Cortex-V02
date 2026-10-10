import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { useToast } from '../../hooks/use-toast';
import { CategoryTreeNode } from './CategoryList';

const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255, 'Name must not exceed 255 characters'),
  description: z.string().max(1000, 'Description must not exceed 1000 characters').optional(),
  color: z.enum(['blue', 'green', 'red', 'yellow', 'purple', 'pink', 'indigo', 'gray']),
  icon: z.enum(['folder', 'book', 'file', 'tag', 'star', 'heart', 'info', 'help']),
  parentId: z.string().uuid().optional().or(z.literal('none')).or(z.literal('')),
  sortOrder: z.number().min(0, 'Sort order must be non-negative').optional(),
  isActive: z.boolean().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  category?: CategoryTreeNode | null;
  parentCategories?: CategoryTreeNode[];
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

const colorOptions = [
  { value: 'blue', label: 'Mavi', class: 'bg-blue-500' },
  { value: 'green', label: 'Yeşil', class: 'bg-green-500' },
  { value: 'red', label: 'Kırmızı', class: 'bg-red-500' },
  { value: 'yellow', label: 'Sarı', class: 'bg-yellow-500' },
  { value: 'purple', label: 'Mor', class: 'bg-purple-500' },
  { value: 'pink', label: 'Pembe', class: 'bg-pink-500' },
  { value: 'indigo', label: 'İndigo', class: 'bg-indigo-500' },
  { value: 'gray', label: 'Gri', class: 'bg-gray-500' },
];

const iconOptions = [
  { value: 'folder', label: 'Klasör', icon: '📁' },
  { value: 'book', label: 'Kitap', icon: '📚' },
  { value: 'file', label: 'Dosya', icon: '📄' },
  { value: 'tag', label: 'Etiket', icon: '🏷️' },
  { value: 'star', label: 'Yıldız', icon: '⭐' },
  { value: 'heart', label: 'Kalp', icon: '❤️' },
  { value: 'info', label: 'Bilgi', icon: 'ℹ️' },
  { value: 'help', label: 'Yardım', icon: '❓' },
];

const CategoryForm: React.FC<CategoryFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  category,
  parentCategories = [],
  isLoading = false,
  mode,
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      color: 'blue',
      icon: 'folder',
      parentId: 'none',
      sortOrder: 0,
      isActive: true,
    },
  });

  // Reset form when category changes or dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      if (category && mode === 'edit') {
        form.reset({
          name: category.name,
          description: '', // Add description field to CategoryTreeNode if needed
          color: category.color as any,
          icon: category.icon as any,
          parentId: category.parentId || 'none',
          sortOrder: 0, // Add sortOrder field to CategoryTreeNode if needed
          isActive: category.isActive,
        });
      } else {
        form.reset({
          name: '',
          description: '',
          color: 'blue',
          icon: 'folder',
          parentId: 'none',
          sortOrder: 0,
          isActive: true,
        });
      }
    }
  }, [isOpen, category, mode, form]);

  const handleSubmit = async (data: CategoryFormData) => {
    try {
      setIsSubmitting(true);
      
      // Clean up empty parentId
      const submitData = {
        ...data,
        parentId: data.parentId === 'none' || data.parentId === '' ? undefined : data.parentId,
      };
      
      await onSubmit(submitData);
      
      toast({
        title: mode === 'create' ? 'Kategori Oluşturuldu' : 'Kategori Güncellendi',
        description: `"${data.name}" kategorisi başarıyla ${mode === 'create' ? 'oluşturuldu' : 'güncellendi'}.`,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: 'Hata',
        description: error instanceof Error ? error.message : 'Kategori kaydedilirken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9ğüşıöçĞÜŞİÖÇ\s]+/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const watchedName = form.watch('name');
  const previewSlug = watchedName ? generateSlug(watchedName) : '';

  // Filter out the current category and its descendants from parent options
  const getAvailableParents = () => {
    if (mode === 'create') return parentCategories;
    
    // For edit mode, exclude the current category and its descendants
    const excludeIds = new Set<string>();
    
    if (category) {
      excludeIds.add(category.id);
      
      // Add all descendants
      const addDescendants = (cat: CategoryTreeNode) => {
        cat.children.forEach(child => {
          excludeIds.add(child.id);
          addDescendants(child);
        });
      };
      addDescendants(category);
    }
    
    return parentCategories.filter(cat => !excludeIds.has(cat.id));
  };

  const renderCategoryOption = (cat: CategoryTreeNode, level: number = 0) => {
    const indent = '  '.repeat(level);
    return (
      <SelectItem key={cat.id} value={cat.id}>
        <div className="flex items-center space-x-2">
          <span>{indent}</span>
          <div className={`w-3 h-3 rounded-full bg-${cat.color}-500`}></div>
          <span>{cat.name}</span>
        </div>
      </SelectItem>
    );
  };

  const renderCategoryTree = (categories: CategoryTreeNode[], level: number = 0): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    categories.forEach((cat, index) => {
      result.push(renderCategoryOption(cat, level));
      if (cat.children && cat.children.length > 0) {
        result.push(...renderCategoryTree(cat.children, level + 1));
      }
    });
    
    return result;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Yeni Kategori Oluştur' : 'Kategori Düzenle'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Makalelerinizi organize etmek için yeni bir bilgi bankası kategorisi oluşturun.'
              : 'Kategori bilgilerini ve ayarlarını güncelleyin.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategori Adı *</FormLabel>
                  <FormControl>
                    <Input placeholder="Kategori adını girin" {...field} />
                  </FormControl>
                  {previewSlug && (
                    <FormDescription>
                      URL slug: <code className="text-sm bg-gray-100 px-1 rounded">/{previewSlug}</code>
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description Field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Açıklama</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Kategori açıklamasını girin (opsiyonel)"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Bu kategorinin ne içerdiğine dair kısa bir açıklama.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Parent Category Field */}
            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Üst Kategori</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Üst kategori seçin (opsiyonel)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Üst Kategori Yok (Ana Seviye)</SelectItem>
                      {renderCategoryTree(getAvailableParents())}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Hiyerarşi oluşturmak için bir üst kategori seçin.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Color Field */}
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Renk</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Renk seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {colorOptions.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center space-x-2">
                              <div className={`w-4 h-4 rounded-full ${color.class}`}></div>
                              <span>{color.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Icon Field */}
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İkon</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="İkon seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {iconOptions.map((icon) => (
                          <SelectItem key={icon.value} value={icon.value}>
                            <div className="flex items-center space-x-2">
                              <span>{icon.icon}</span>
                              <span>{icon.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Sort Order Field */}
            <FormField
              control={form.control}
              name="sortOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sıralama</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Düşük sayılar önce görünür. Otomatik sıralama için 0 bırakın.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Active Status Field (only for edit mode) */}
            {mode === 'edit' && (
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Aktif Durum</FormLabel>
                      <FormDescription>
                        Pasif kategoriler halktan gizlenir ancak yöneticiler tarafından erişilebilir kalır.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            {/* Preview */}
            <div className="rounded-lg border p-4 bg-gray-50">
              <h4 className="text-sm font-medium mb-2">Önizleme</h4>
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded bg-${form.watch('color')}-100 text-${form.watch('color')}-800`}>
                  <span className="text-lg">
                    {iconOptions.find(i => i.value === form.watch('icon'))?.icon || '📁'}
                  </span>
                </div>
                <div>
                  <div className="font-medium">{form.watch('name') || 'Kategori Adı'}</div>
                  <div className="text-sm text-gray-500">
                    /{previewSlug || 'kategori-slug'}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                İptal
              </Button>
              <Button type="submit" disabled={isSubmitting || isLoading}>
                {isSubmitting ? 'Kaydediliyor...' : (mode === 'create' ? 'Kategori Oluştur' : 'Kategori Güncelle')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryForm;