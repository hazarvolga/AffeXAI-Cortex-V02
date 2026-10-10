'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import { SortableTreeWrapper } from '@/components/common/sortable-tree';
import { cmsCategoryService } from '@/lib/cms/category-service';
import { Edit, Plus, Trash2, Folder, FolderOpen, GripVertical, FolderTree, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { CmsCategory, CmsCategoryTree, CreateCmsCategoryDto, UpdateCmsCategoryDto } from '@affexai/shared-types';

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  parentId: string | null;
  isActive: boolean;
}

// Extended tree node for dnd-kit
interface CategoryTreeNode extends CmsCategoryTree {
  children: CategoryTreeNode[];
}

const CmsCategoriesPage = () => {
  // Original backend data
  const [categoryTree, setCategoryTree] = useState<CmsCategoryTree[]>([]);
  const [allCategories, setAllCategories] = useState<CmsCategory[]>([]);

  // Draft/Published system state
  const [draftCategories, setDraftCategories] = useState<CategoryTreeNode[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // UI state
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CmsCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFormSaving, setIsFormSaving] = useState(false);

  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    parentId: null,
    isActive: true,
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  // Initialize draft when categories load
  useEffect(() => {
    if (categoryTree.length > 0) {
      // Backend already returns tree structure with children, just cast to CategoryTreeNode
      setDraftCategories(categoryTree as CategoryTreeNode[]);
      setHasUnsavedChanges(false);
    }
  }, [categoryTree]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const [tree, flat] = await Promise.all([
        cmsCategoryService.getCategoryTree(),
        cmsCategoryService.getCategories(),
      ]);
      setCategoryTree(tree);
      setAllCategories(flat);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Hata',
        description: error.response?.data?.error?.message || 'Kategoriler yüklenirken bir hata oluştu',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Note: convertToNestedTree removed - backend already returns tree structure

  // Convert tree to flat updates for batch API
  const convertToFlatUpdates = (tree: CategoryTreeNode[]): Array<{ id: string; parentId: string | null; orderIndex: number }> => {
    const result: Array<{ id: string; parentId: string | null; orderIndex: number }> = [];

    const traverse = (nodes: CategoryTreeNode[], parentId: string | null) => {
      nodes.forEach((node, index) => {
        result.push({
          id: node.id,
          parentId: parentId,
          orderIndex: index,
        });

        if (node.children && node.children.length > 0) {
          traverse(node.children, node.id);
        }
      });
    };

    traverse(tree, null);
    return result;
  };

  // Handle tree changes (drag & drop)
  const handleTreeChange = (newTreeNodes: CategoryTreeNode[]) => {
    setDraftCategories(newTreeNodes);
    setHasUnsavedChanges(true);
  };

  // Save changes (batch update)
  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);

      const updates = convertToFlatUpdates(draftCategories);

      await cmsCategoryService.batchUpdateCategories(updates);

      toast({
        title: 'Başarılı',
        description: 'Kategori sıralaması güncellendi',
      });

      await fetchCategories();
      setHasUnsavedChanges(false);
    } catch (error: any) {
      console.error('Error saving changes:', error);
      toast({
        title: 'Hata',
        description: error.response?.data?.error?.message || 'Değişiklikler kaydedilirken bir hata oluştu',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel changes (revert to original)
  const handleCancelChanges = () => {
    setDraftCategories(categoryTree as CategoryTreeNode[]);
    setHasUnsavedChanges(false);
    toast({
      title: 'İptal Edildi',
      description: 'Değişiklikler geri alındı',
    });
  };

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      parentId: null,
      isActive: true,
    });
    setDialogOpen(true);
  };

  const handleEditCategory = (category: CmsCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description ?? '',
      parentId: category.parentId ?? null,
      isActive: category.isActive,
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (category: CmsCategory) => {
    setCategoryToDelete({ id: category.id, name: category.name });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    try {
      setIsDeleting(true);
      await cmsCategoryService.deleteCategory(categoryToDelete.id);
      toast({
        title: 'Başarılı',
        description: 'Kategori silindi',
      });
      await fetchCategories();
      setCategoryToDelete(null);
    } catch (error: any) {
      console.error('Error deleting category:', error);

      const errorMessage = error?.response?.data?.message || error?.message || 'Kategori silinirken bir hata oluştu';

      if (errorMessage.includes('child categories')) {
        toast({
          title: 'Silinemez',
          description: 'Bu kategorinin alt kategorileri var. Önce alt kategorileri silin veya başka bir üst kategoriye taşıyın.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Hata',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsFormSaving(true);

      const payload = {
        name: formData.name,
        slug: formData.slug || undefined,
        description: formData.description || undefined,
        parentId: formData.parentId || null,
        isActive: formData.isActive,
      };

      if (editingCategory) {
        await cmsCategoryService.updateCategory(editingCategory.id, payload as UpdateCmsCategoryDto);
        toast({
          title: 'Başarılı',
          description: 'Kategori güncellendi',
        });
      } else {
        await cmsCategoryService.createCategory(payload as CreateCmsCategoryDto);
        toast({
          title: 'Başarılı',
          description: 'Kategori oluşturuldu',
        });
      }

      setDialogOpen(false);
      await fetchCategories();
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast({
        title: 'Hata',
        description: error.response?.data?.error?.message || 'Kategori kaydedilirken bir hata oluştu',
        variant: 'destructive',
      });
    } finally {
      setIsFormSaving(false);
    }
  };

  // Count total categories in tree (including children)
  const countCategoriesInTree = (categories: CategoryTreeNode[]): number => {
    let count = 0;
    const traverse = (items: CategoryTreeNode[]) => {
      items.forEach((item) => {
        count++;
        if (item.children && item.children.length > 0) {
          traverse(item.children);
        }
      });
    };
    traverse(categories);
    return count;
  };

  // Get available parent categories (excluding the current category and its children)
  const getAvailableParentCategories = (): CmsCategory[] => {
    if (!editingCategory) return allCategories;

    // Exclude self and all descendants
    const excludeIds = new Set<string>([editingCategory.id]);

    const collectDescendants = (parentId: string) => {
      allCategories.forEach((cat) => {
        if (cat.parentId === parentId) {
          excludeIds.add(cat.id);
          collectDescendants(cat.id);
        }
      });
    };

    collectDescendants(editingCategory.id);

    return allCategories.filter((cat) => !excludeIds.has(cat.id));
  };

  // Render category node for dnd-kit
  const renderCategoryNode = (node: CategoryTreeNode) => {
    const hasChildren = node.children && node.children.length > 0;
    const category = allCategories.find((c) => c.id === node.id);

    return (
      <div className="flex items-center justify-between p-3 bg-white hover:bg-gray-50 rounded-md group transition-all">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded">
            <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
          </div>

          {hasChildren ? (
            <FolderOpen className="h-5 w-5 text-blue-600 flex-shrink-0" />
          ) : (
            <Folder className="h-5 w-5 text-gray-600 flex-shrink-0" />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium truncate">{node.name}</span>
              {!node.isActive && (
                <Badge variant="secondary" className="text-xs flex-shrink-0">
                  Pasif
                </Badge>
              )}
              {hasChildren && (
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  {countCategoriesInTree([node])} öğe
                </Badge>
              )}
              <span className="text-xs text-gray-500 truncate">({node.slug})</span>
            </div>
            {node.description && (
              <p className="text-sm text-gray-600 mt-1 truncate">{node.description}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (category) handleEditCategory(category);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (category) handleDeleteClick(category);
            }}
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Kategoriler yükleniyor...</div>
      </div>
    );
  }

  const totalCategories = countCategoriesInTree(draftCategories);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FolderTree className="h-5 w-5" />
                Kategori Yönetimi
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Toplam {totalCategories} kategori
              </p>
            </div>
            <div className="flex items-center gap-2">
              {hasUnsavedChanges && (
                <>
                  <Badge variant="outline" className="text-amber-600 border-amber-600">
                    Kaydedilmemiş Değişiklikler
                  </Badge>
                  <Button variant="outline" size="sm" onClick={handleCancelChanges} disabled={isSaving}>
                    <X className="h-4 w-4 mr-1" />
                    İptal
                  </Button>
                  <Button size="sm" onClick={handleSaveChanges} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-1" />
                    {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
                </>
              )}
              <Button size="sm" onClick={handleCreateCategory}>
                <Plus className="h-4 w-4 mr-1" />
                Yeni Kategori
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Category Tree Card */}
      <Card>
        <CardHeader>
          <CardTitle>Kategori Ağacı</CardTitle>
          <p className="text-sm text-muted-foreground">
            Kategorileri sürükleyip bırakarak yeniden düzenleyin
          </p>
        </CardHeader>
        <CardContent>
          {draftCategories.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Henüz kategori oluşturulmamış. Başlamak için üstteki "Yeni Kategori" butonuna tıklayın.
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <SortableTreeWrapper
                items={draftCategories}
                onItemsChange={handleTreeChange}
                renderItem={renderCategoryNode}
                collapsible
                indentationWidth={24}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori'}
              </DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? 'Kategori bilgilerini güncelleyin'
                  : 'Yeni bir kategori oluşturun'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Kategori Adı *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Örn: Blog, Haberler"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="Otomatik oluşturulur"
                />
                <p className="text-xs text-gray-500">
                  Boş bırakılırsa kategori adından otomatik oluşturulur
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Kategori açıklaması"
                  className="min-h-[80px]"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="parentId">Üst Kategori</Label>
                <Select
                  value={formData.parentId || 'none'}
                  onValueChange={(value) =>
                    setFormData({ ...formData, parentId: value === 'none' ? null : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ana Kategori</SelectItem>
                    {getAvailableParentCategories().map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="isActive">Aktif</Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isFormSaving}
              >
                İptal
              </Button>
              <Button type="submit" disabled={isFormSaving}>
                {isFormSaving ? 'Kaydediliyor...' : editingCategory ? 'Güncelle' : 'Oluştur'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        itemName={categoryToDelete?.name || ''}
        isDeleting={isDeleting}
        title="Kategori Sil"
        description="Bu kategoriyi silmek istediğinizden emin misiniz?"
      />
    </div>
  );
};

export default CmsCategoriesPage;
