import React, { useState, useEffect } from 'react';
import { 
  ChevronDown as ChevronDownIcon, 
  ChevronRight as ChevronRightIcon,
  Folder as FolderIcon,
  Pencil as PencilIcon,
  Trash2 as TrashIcon,
  Plus as PlusIcon,
  Search as MagnifyingGlassIcon,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useToast } from '../../hooks/use-toast';

export interface CategoryTreeNode {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  articleCount: number;
  children: CategoryTreeNode[];
  level: number;
  isActive: boolean;
  parentId?: string;
}

interface CategoryListProps {
  categories: CategoryTreeNode[];
  onCategorySelect?: (category: CategoryTreeNode) => void;
  onCategoryEdit?: (category: CategoryTreeNode) => void;
  onCategoryDelete?: (categoryId: string) => void;
  onCategoryReorder?: (categoryIds: string[]) => void;
  onCategoryCreate?: (parentId?: string) => void;
  isLoading?: boolean;
  showActions?: boolean;
  allowReorder?: boolean;
  searchable?: boolean;
}

const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  onCategorySelect,
  onCategoryEdit,
  onCategoryDelete,
  onCategoryReorder,
  onCategoryCreate,
  isLoading = false,
  showActions = true,
  allowReorder = true,
  searchable = true,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCategories, setFilteredCategories] = useState<CategoryTreeNode[]>(categories);
  const { toast } = useToast();

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = filterCategories(categories, searchQuery.toLowerCase());
      setFilteredCategories(filtered);
      // Auto-expand all categories when searching
      const allIds = getAllCategoryIds(filtered);
      setExpandedCategories(new Set(allIds));
    } else {
      setFilteredCategories(categories);
    }
  }, [categories, searchQuery]);

  const filterCategories = (cats: CategoryTreeNode[], query: string): CategoryTreeNode[] => {
    return cats.reduce((acc: CategoryTreeNode[], category) => {
      const matchesQuery = 
        category.name.toLowerCase().includes(query) ||
        category.slug.toLowerCase().includes(query);
      
      const filteredChildren = filterCategories(category.children, query);
      
      if (matchesQuery || filteredChildren.length > 0) {
        acc.push({
          ...category,
          children: filteredChildren,
        });
      }
      
      return acc;
    }, []);
  };

  const getAllCategoryIds = (cats: CategoryTreeNode[]): string[] => {
    const ids: string[] = [];
    const traverse = (categories: CategoryTreeNode[]) => {
      categories.forEach(cat => {
        ids.push(cat.id);
        if (cat.children.length > 0) {
          traverse(cat.children);
        }
      });
    };
    traverse(cats);
    return ids;
  };

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleReorder = (categoryId: string, direction: 'up' | 'down') => {
    if (!allowReorder) return;
    
    // Simple reordering logic - in a real implementation, this would be more sophisticated
    const flatCategories = flattenCategories(filteredCategories);
    const currentIndex = flatCategories.indexOf(categoryId);
    
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= flatCategories.length) return;
    
    const reorderedIds = [...flatCategories];
    [reorderedIds[currentIndex], reorderedIds[newIndex]] = [reorderedIds[newIndex], reorderedIds[currentIndex]];
    
    onCategoryReorder?.(reorderedIds);
  };

  const flattenCategories = (cats: CategoryTreeNode[]): string[] => {
    const ids: string[] = [];
    const traverse = (categories: CategoryTreeNode[]) => {
      categories.forEach(cat => {
        ids.push(cat.id);
        if (expandedCategories.has(cat.id) && cat.children.length > 0) {
          traverse(cat.children);
        }
      });
    };
    traverse(cats);
    return ids;
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      pink: 'bg-pink-100 text-pink-800 border-pink-200',
      indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colorMap[color] || colorMap.gray;
  };

  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      folder: FolderIcon,
      // Add more icons as needed
    };
    const IconComponent = iconMap[iconName] || FolderIcon;
    return <IconComponent className="h-4 w-4" />;
  };

  const renderCategory = (category: CategoryTreeNode, index: number, level: number = 0) => {
    const isExpanded = expandedCategories.has(category.id);
    const hasChildren = category.children.length > 0;
    const paddingLeft = level * 24;

    return (
      <div
        key={category.id}
        className={`${!category.isActive ? 'opacity-50' : ''}`}
      >
        <div
          className="flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50"
          style={{ paddingLeft: paddingLeft + 12 }}
        >
          <div className="flex items-center space-x-3 flex-1">
            {/* Reorder Buttons */}
            {allowReorder && (
              <div className="flex flex-col space-y-1">
                <button
                  onClick={() => handleReorder(category.id, 'up')}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  title="Yukarı taşı"
                >
                  <ChevronDownIcon className="h-3 w-3 rotate-180" />
                </button>
                <button
                  onClick={() => handleReorder(category.id, 'down')}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  title="Aşağı taşı"
                >
                  <ChevronDownIcon className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Expand/Collapse Button */}
            {hasChildren ? (
              <button
                onClick={() => toggleExpanded(category.id)}
                className="text-gray-400 hover:text-gray-600"
              >
                {isExpanded ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
              </button>
            ) : (
              <div className="w-4 h-4" />
            )}

            {/* Category Icon */}
            <div className={`p-1 rounded ${getColorClasses(category.color)}`}>
              {getIconComponent(category.icon)}
            </div>

            {/* Category Info */}
            <div 
              className="flex-1 cursor-pointer"
              onClick={() => onCategorySelect?.(category)}
            >
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">{category.name}</span>
                {category.articleCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {category.articleCount}
                  </Badge>
                )}
                {!category.isActive && (
                  <Badge variant="destructive" className="text-xs">
                    Pasif
                  </Badge>
                )}
              </div>
              <div className="text-sm text-gray-500">/{category.slug}</div>
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex items-center space-x-1">
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCategoryCreate?.(category.id)}
                  className="h-8 w-8 p-0"
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCategoryEdit?.(category)}
                className="h-8 w-8 p-0"
              >
                <PencilIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCategoryDelete?.(category.id)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div>
            {category.children.map((child, childIndex) =>
              renderCategory(child, childIndex, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Kategoriler</CardTitle>
          {showActions && (
            <Button
              onClick={() => onCategoryCreate?.()}
              size="sm"
              className="flex items-center space-x-2"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Kategori Ekle</span>
            </Button>
          )}
        </div>
        
        {searchable && (
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Kategori ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        {filteredCategories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchQuery ? 'Aramanızla eşleşen kategori bulunamadı.' : 'Henüz kategori bulunmuyor.'}
          </div>
        ) : (
          <div className="min-h-[200px]">
            {filteredCategories.map((category, index) =>
              renderCategory(category, index)
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryList;