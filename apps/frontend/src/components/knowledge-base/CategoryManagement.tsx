import React, { useState, useEffect } from 'react';
import { 
  Plus as PlusIcon, 
  Settings as Cog6ToothIcon,
  BarChart3 as ChartBarIcon,
  RotateCcw as ArrowPathIcon,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useToast } from '../../hooks/use-toast';
import CategoryList, { CategoryTreeNode } from './CategoryList';
import CategoryForm from './CategoryForm';
import { Alert, AlertDescription } from '../ui/alert';

interface CategoryStats {
  totalCategories: number;
  activeCategories: number;
  totalArticles: number;
  averageArticlesPerCategory: number;
  mostPopularCategories: CategoryTreeNode[];
  unusedCategories: CategoryTreeNode[];
}

interface CategoryManagementProps {
  // API functions - these would be passed from parent or hooks
  onLoadCategories: () => Promise<CategoryTreeNode[]>;
  onLoadStats: () => Promise<CategoryStats>;
  onCreateCategory: (data: any) => Promise<CategoryTreeNode>;
  onUpdateCategory: (id: string, data: any) => Promise<CategoryTreeNode>;
  onDeleteCategory: (id: string) => Promise<void>;
  onReorderCategories: (categoryIds: string[]) => Promise<void>;
  onInitializeDefaults: () => Promise<CategoryTreeNode[]>;
  onUpdateArticleCounts: () => Promise<void>;
}

const CategoryManagement: React.FC<CategoryManagementProps> = ({
  onLoadCategories,
  onLoadStats,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onReorderCategories,
  onInitializeDefaults,
  onUpdateArticleCounts,
}) => {
  const [categories, setCategories] = useState<CategoryTreeNode[]>([]);
  const [stats, setStats] = useState<CategoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryTreeNode | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [isUpdatingCounts, setIsUpdatingCounts] = useState(false);
  const { toast } = useToast();

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [categoriesData, statsData] = await Promise.all([
        onLoadCategories(),
        onLoadStats(),
      ]);
      setCategories(categoriesData);
      setStats(statsData);
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Kategori verileri yüklenemedi.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = () => {
    setSelectedCategory(null);
    setFormMode('create');
    setIsFormOpen(true);
  };

  const handleEditCategory = (category: CategoryTreeNode) => {
    setSelectedCategory(category);
    setFormMode('edit');
    setIsFormOpen(true);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Bu kategoriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }

    try {
      await onDeleteCategory(categoryId);
      await loadData(); // Reload data
      toast({
        title: 'Başarılı',
        description: 'Kategori başarıyla silindi.',
      });
    } catch (error) {
      toast({
        title: 'Hata',
        description: error instanceof Error ? error.message : 'Kategori silinemedi.',
        variant: 'destructive',
      });
    }
  };

  const handleFormSubmit = async (data: any) => {
    if (formMode === 'create') {
      await onCreateCategory(data);
    } else if (selectedCategory) {
      await onUpdateCategory(selectedCategory.id, data);
    }
    await loadData(); // Reload data
  };

  const handleReorderCategories = async (categoryIds: string[]) => {
    try {
      await onReorderCategories(categoryIds);
      await loadData(); // Reload data
      toast({
        title: 'Başarılı',
        description: 'Kategoriler başarıyla yeniden sıralandı.',
      });
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Kategoriler yeniden sıralanamadı.',
        variant: 'destructive',
      });
    }
  };

  const handleInitializeDefaults = async () => {
    if (!confirm('Bu işlem varsayılan kategorileri oluşturacak. Devam etmek istiyor musunuz?')) {
      return;
    }

    try {
      await onInitializeDefaults();
      await loadData(); // Reload data
      toast({
        title: 'Başarılı',
        description: 'Varsayılan kategoriler başarıyla oluşturuldu.',
      });
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Varsayılan kategoriler oluşturulamadı.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateArticleCounts = async () => {
    try {
      setIsUpdatingCounts(true);
      await onUpdateArticleCounts();
      await loadData(); // Reload data
      toast({
        title: 'Başarılı',
        description: 'Makale sayıları başarıyla güncellendi.',
      });
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Makale sayıları güncellenemedi.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingCounts(false);
    }
  };

  const flattenCategories = (cats: CategoryTreeNode[]): CategoryTreeNode[] => {
    const result: CategoryTreeNode[] = [];
    const traverse = (categories: CategoryTreeNode[]) => {
      categories.forEach(cat => {
        result.push(cat);
        if (cat.children.length > 0) {
          traverse(cat.children);
        }
      });
    };
    traverse(cats);
    return result;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kategori Yönetimi</h1>
          <p className="text-muted-foreground">
            Bilgi bankası makalelerinizi kategoriler ve alt kategoriler ile organize edin.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleUpdateArticleCounts}
            disabled={isUpdatingCounts}
            className="flex items-center space-x-2"
          >
            <ArrowPathIcon className={`h-4 w-4 ${isUpdatingCounts ? 'animate-spin' : ''}`} />
            <span>Sayıları Güncelle</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleInitializeDefaults}
            className="flex items-center space-x-2"
          >
            <Cog6ToothIcon className="h-4 w-4" />
            <span>Varsayılan Kategoriler</span>
          </Button>
          <Button
            onClick={handleCreateCategory}
            className="flex items-center space-x-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Yeni Kategori</span>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Kategori</CardTitle>
              <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCategories}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeCategories} aktif
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Makale</CardTitle>
              <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalArticles}</div>
              <p className="text-xs text-muted-foreground">
                Tüm kategorilerde
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ort. Makale/Kategori</CardTitle>
              <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageArticlesPerCategory}</div>
              <p className="text-xs text-muted-foreground">
                Aktif kategori başına
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kullanılmayan Kategoriler</CardTitle>
              <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unusedCategories.length}</div>
              <p className="text-xs text-muted-foreground">
                0 makaleli kategoriler
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts for unused categories */}
      {stats && stats.unusedCategories.length > 0 && (
        <Alert>
          <AlertDescription>
            {stats.unusedCategories.length} adet kullanılmayan kategoriniz var. Bunlara makale eklemeyi veya bilgi bankanızı düzenli tutmak için silmeyi düşünün.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Category List */}
        <div className="lg:col-span-2">
          <CategoryList
            categories={categories}
            onCategoryEdit={handleEditCategory}
            onCategoryDelete={handleDeleteCategory}
            onCategoryReorder={handleReorderCategories}
            onCategoryCreate={handleCreateCategory}
            isLoading={isLoading}
            showActions={true}
            allowReorder={true}
            searchable={true}
          />
        </div>

        {/* Sidebar with Popular Categories */}
        <div className="space-y-6">
          {stats && stats.mostPopularCategories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>En Popüler Kategoriler</CardTitle>
                <CardDescription>
                  En çok makaleye sahip kategoriler
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.mostPopularCategories.slice(0, 5).map((category) => (
                    <div key={category.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full bg-${category.color}-500`}></div>
                        <span className="text-sm font-medium">{category.name}</span>
                      </div>
                      <Badge variant="secondary">{category.articleCount}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {stats && stats.unusedCategories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Kullanılmayan Kategoriler</CardTitle>
                <CardDescription>
                  Hiç makalesi olmayan kategoriler
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.unusedCategories.slice(0, 5).map((category) => (
                    <div key={category.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full bg-${category.color}-500`}></div>
                        <span className="text-sm font-medium">{category.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                        className="h-6 px-2 text-xs"
                      >
                        Düzenle
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Hızlı İşlemler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleCreateCategory}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Yeni Kategori Oluştur
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleInitializeDefaults}
              >
                <Cog6ToothIcon className="h-4 w-4 mr-2" />
                Varsayılan Kategorileri Başlat
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleUpdateArticleCounts}
                disabled={isUpdatingCounts}
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${isUpdatingCounts ? 'animate-spin' : ''}`} />
                Makale Sayılarını Güncelle
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Category Form Dialog */}
      <CategoryForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        category={selectedCategory}
        parentCategories={flattenCategories(categories)}
        mode={formMode}
      />
    </div>
  );
};

export default CategoryManagement;