'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { PlusCircle, Edit, Trash2, Save, Loader2, Menu as MenuIcon, GripVertical } from "lucide-react";
import type { CmsMenu, CmsMenuItem, MenuLocation } from '@affexai/shared-types';
import { MenuItemType } from '@affexai/shared-types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cmsMenuService } from '@/lib/cms/menu-service';
import { cmsCategoryService } from '@/lib/cms/category-service';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { CmsPageService } from '@/services/cms-page.service';
import { SortableTreeWrapper, SortableTreeNode } from '@/components/common/sortable-tree';

// Helper: Convert flat menu items to nested tree structure
interface MenuTreeNode extends SortableTreeNode {
  id: string;
  label: string;
  type: MenuItemType;
  url?: string;
  parentId?: string | null;
  orderIndex: number;
  target?: '_blank' | '_self';
  icon?: string;
  isActive: boolean;
  children?: MenuTreeNode[];
}

const convertToNestedTree = (items: CmsMenuItem[]): MenuTreeNode[] => {
  if (!items || items.length === 0) return [];

  // If items already have children property from backend, use them directly
  const rootItems: MenuTreeNode[] = items
    .filter(item => !item.parentId)
    .map(item => ({
      id: item.id,
      label: item.label,
      type: item.type,
      url: item.url,
      parentId: item.parentId,
      orderIndex: item.orderIndex,
      target: item.target,
      icon: item.icon,
      isActive: item.isActive,
      children: item.children ? convertChildrenToTreeNodes(item.children) : [],
    }))
    .sort((a, b) => a.orderIndex - b.orderIndex);

  return rootItems;
};

// Helper function to recursively convert children
const convertChildrenToTreeNodes = (children: any[]): MenuTreeNode[] => {
  return children
    .map(child => ({
      id: child.id,
      label: child.label,
      type: child.type,
      url: child.url,
      parentId: child.parentId,
      orderIndex: child.orderIndex,
      target: child.target,
      icon: child.icon,
      isActive: child.isActive,
      children: child.children ? convertChildrenToTreeNodes(child.children) : [],
    }))
    .sort((a, b) => a.orderIndex - b.orderIndex);
};

const convertToFlatItems = (treeNodes: MenuTreeNode[]): CmsMenuItem[] => {
  const flatItems: CmsMenuItem[] = [];

  const flatten = (nodes: MenuTreeNode[], parentId: string | null = null, startIndex: number = 0) => {
    nodes.forEach((node, index) => {
      const flatItem: CmsMenuItem = {
        id: node.id,
        menuId: '', // Will be set by backend
        label: node.label,
        type: node.type,
        url: node.url,
        parentId: parentId,
        orderIndex: startIndex + index,
        target: node.target,
        icon: node.icon,
        isActive: node.isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      flatItems.push(flatItem);

      if (node.children && node.children.length > 0) {
        flatten(node.children, node.id, 0);
      }
    });
  };

  flatten(treeNodes);
  return flatItems;
};

// Delete Confirm Dialog Component
const DeleteConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
  title,
  description
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
          <Button variant="destructive" onClick={() => { onConfirm(); onOpenChange(false); }}>
            Sil
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Menu Dialog Component
const MenuDialog = ({
  menu,
  onSave,
  onOpenChange
}: {
  menu?: CmsMenu;
  onSave: (data: { name: string; slug: string; location: MenuLocation; isActive: boolean }) => void;
  onOpenChange: (open: boolean) => void;
}) => {
  const [name, setName] = useState(menu?.name || '');
  const [slug, setSlug] = useState(menu?.slug || '');
  const [location, setLocation] = useState<MenuLocation>((menu?.location as MenuLocation) || 'header');
  const [isActive, setIsActive] = useState(menu?.isActive ?? true);

  const handleSave = () => {
    onSave({ name, slug, location, isActive });
    onOpenChange(false);
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{menu ? 'Menü Düzenle' : 'Yeni Menü Oluştur'}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="menu-name">Menü Adı</Label>
          <Input id="menu-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ana Menü" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="menu-slug">Slug</Label>
          <Input id="menu-slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="ana-menu" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="menu-location">Konum</Label>
          <Select value={location} onValueChange={(value) => setLocation(value as MenuLocation)}>
            <SelectTrigger id="menu-location">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="header">Header</SelectItem>
              <SelectItem value="footer">Footer</SelectItem>
              <SelectItem value="sidebar">Sidebar</SelectItem>
              <SelectItem value="mobile">Mobile</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="menu-active">Aktif</Label>
          <Switch id="menu-active" checked={isActive} onCheckedChange={setIsActive} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
        <Button onClick={handleSave} disabled={!name || !slug}>
          <Save className="mr-2 h-4 w-4" /> Kaydet
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

// Menu Item Dialog Component
const MenuItemDialog = ({
  item,
  menuId,
  menuItems,
  onSave,
  onOpenChange
}: {
  item?: CmsMenuItem;
  menuId: string;
  menuItems: CmsMenuItem[];
  onSave: (data: {
    label: string;
    type: MenuItemType;
    url?: string;
    pageId?: string;
    categoryId?: string;
    parentId?: string | null;
    target?: '_blank' | '_self';
    icon?: string;
    isActive: boolean;
  }) => void;
  onOpenChange: (open: boolean) => void;
}) => {
  // State initialization with empty defaults
  const [label, setLabel] = useState('');
  const [type, setType] = useState<MenuItemType>(MenuItemType.CUSTOM);
  const [url, setUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [target, setTarget] = useState<'_blank' | '_self'>('_self');
  const [icon, setIcon] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Sync state when item prop changes (edit mode) or resets (create mode)
  useEffect(() => {
    if (item) {
      // Editing existing item - populate with item data
      setLabel(item.label || '');
      setType(item.type || MenuItemType.CUSTOM);
      setUrl(item.url || '');
      setCategoryId(item.categoryId || '');
      setParentId(item.parentId || null);
      setTarget(item.target || '_self');
      setIcon(item.icon || '');
      setIsActive(item.isActive ?? true);
    } else {
      // Creating new item - reset to defaults
      setLabel('');
      setType(MenuItemType.CUSTOM);
      setUrl('');
      setCategoryId('');
      setParentId(null);
      setTarget('_self');
      setIcon('');
      setIsActive(true);
    }
  }, [item]); // Re-run when item changes

  // Fetch published CMS pages for PAGE type selector
  const { data: cmsPages, isLoading: loadingPages } = useQuery({
    queryKey: ['cms-pages-published'],
    queryFn: () => CmsPageService.getPublishedPages(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch CMS categories for CATEGORY type selector
  const { data: cmsCategories, isLoading: loadingCategories } = useQuery({
    queryKey: ['cms-categories-active'],
    queryFn: () => cmsCategoryService.getCategories({ isActive: true }),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Handle page selection - auto-fill URL and label
  const handlePageSelect = (pageId: string) => {
    const selectedPage = cmsPages?.find(p => p.id === pageId);
    if (selectedPage) {
      setUrl(`/${selectedPage.slug}`);
      // Auto-fill label if empty
      if (!label) {
        setLabel(selectedPage.title);
      }
    }
  };

  // Handle category selection - auto-fill URL and label
  const handleCategorySelect = (categoryId: string) => {
    const selectedCategory = cmsCategories?.find(c => c.id === categoryId);
    if (selectedCategory) {
      setCategoryId(categoryId);
      setUrl(`/category/${selectedCategory.slug}`);
      // Auto-fill label if empty
      if (!label) {
        setLabel(selectedCategory.name);
      }
    }
  };

  const getValidParentOptions = (items: CmsMenuItem[], currentItemId?: string): CmsMenuItem[] => {
    if (!currentItemId) return items;

    let childIds = new Set<string>();

    const findChildrenRecursive = (parentId: string) => {
      const children = items.filter(i => i.parentId === parentId);
      for (const child of children) {
        childIds.add(child.id);
        findChildrenRecursive(child.id);
      }
    };

    findChildrenRecursive(currentItemId);
    return items.filter(i => i.id !== currentItemId && !childIds.has(i.id));
  };

  // Flatten nested menu items to flat list (needed for buildHierarchicalParentList)
  const flattenMenuItems = (items: CmsMenuItem[]): CmsMenuItem[] => {
    const result: CmsMenuItem[] = [];

    const flatten = (itemList: CmsMenuItem[]) => {
      itemList.forEach(item => {
        // Add the item itself
        result.push(item);
        // Recursively add children if they exist
        if (item.children && Array.isArray(item.children) && item.children.length > 0) {
          flatten(item.children);
        }
      });
    };

    flatten(items);
    return result;
  };

  // Build hierarchical parent list with indentation
  const buildHierarchicalParentList = (
    items: CmsMenuItem[],
    currentItemId?: string,
    parentId: string | null = null,
    level: number = 0
  ): Array<{ id: string; label: string; level: number }> => {
    const result: Array<{ id: string; label: string; level: number }> = [];

    items
      .filter(item => item.parentId === parentId && item.id !== currentItemId)
      .forEach(item => {
        // Skip if this item is a descendant of current item (prevent circular)
        const isDescendant = (itemId: string): boolean => {
          const children = items.filter(i => i.parentId === itemId);
          if (children.some(c => c.id === currentItemId)) return true;
          return children.some(c => isDescendant(c.id));
        };

        if (!isDescendant(item.id)) {
          result.push({ id: item.id, label: item.label, level });
          // Recursively add children
          result.push(...buildHierarchicalParentList(items, currentItemId, item.id, level + 1));
        }
      });

    return result;
  };

  // Flatten menuItems first (backend sends nested structure)
  const flatMenuItems = flattenMenuItems(menuItems);
  const hierarchicalParents = buildHierarchicalParentList(flatMenuItems, item?.id);

  const handleSave = () => {
    onSave({
      label,
      type,
      url: url || undefined, // Always send URL for all types (PAGE, CATEGORY, CUSTOM)
      pageId: type === MenuItemType.PAGE ? (cmsPages?.find(p => p.slug === url?.replace('/', ''))?.id || undefined) : undefined,
      categoryId: type === MenuItemType.CATEGORY ? categoryId || undefined : undefined,
      parentId: parentId || null,
      target,
      icon,
      isActive
    });
    onOpenChange(false);
  };

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{item ? 'Menü Öğesini Düzenle' : 'Yeni Menü Öğesi Ekle'}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="item-label">Etiket</Label>
            <Input
              id="item-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ana Sayfa"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="item-type">Tip</Label>
            <Select value={type} onValueChange={(value) => setType(value as MenuItemType)}>
              <SelectTrigger id="item-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={MenuItemType.CUSTOM}>Özel Link</SelectItem>
                <SelectItem value={MenuItemType.PAGE}>Sayfa</SelectItem>
                <SelectItem value={MenuItemType.CATEGORY}>Kategori</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* PAGE Type - Show page selector */}
        {type === MenuItemType.PAGE && (
          <div className="space-y-2">
            <Label htmlFor="page-select">CMS Sayfası</Label>
            <Select
              value={cmsPages?.find(p => `/${p.slug}` === url)?.id || ''}
              onValueChange={handlePageSelect}
              disabled={loadingPages}
            >
              <SelectTrigger id="page-select">
                <SelectValue placeholder={loadingPages ? "Yükleniyor..." : "Sayfa seçin"} />
              </SelectTrigger>
              <SelectContent>
                {loadingPages && (
                  <SelectItem value="loading" disabled>
                    <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
                    Yükleniyor...
                  </SelectItem>
                )}
                {!loadingPages && cmsPages && cmsPages.length === 0 && (
                  <SelectItem value="no-pages" disabled>
                    Henüz sayfa yok
                  </SelectItem>
                )}
                {!loadingPages && cmsPages && cmsPages.length > 0 && cmsPages.map((page) => (
                  <SelectItem key={page.id} value={page.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{page.title}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        /{page.slug}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {url && (
              <div className="text-xs text-muted-foreground">
                URL: {url}
              </div>
            )}
          </div>
        )}

        {/* CUSTOM Type - Show manual URL input */}
        {type === MenuItemType.CUSTOM && (
          <div className="space-y-2">
            <Label htmlFor="item-url">URL</Label>
            <Input
              id="item-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="/hakkimizda"
            />
          </div>
        )}

        {/* CATEGORY Type - Show category selector */}
        {type === MenuItemType.CATEGORY && (
          <div className="space-y-2">
            <Label htmlFor="category-select">Kategori</Label>
            <Select
              value={cmsCategories?.find(c => c.id === categoryId)?.id || ''}
              onValueChange={handleCategorySelect}
              disabled={loadingCategories}
            >
              <SelectTrigger id="category-select">
                <SelectValue placeholder={loadingCategories ? "Yükleniyor..." : "Kategori seçin"} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto">
                {loadingCategories && (
                  <SelectItem value="loading" disabled>
                    <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
                    Yükleniyor...
                  </SelectItem>
                )}
                {!loadingCategories && cmsCategories && cmsCategories.length === 0 && (
                  <SelectItem value="no-categories" disabled>
                    Henüz kategori yok
                  </SelectItem>
                )}
                {!loadingCategories && cmsCategories && cmsCategories.length > 0 && cmsCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{category.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        /{category.slug}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {url && (
              <div className="text-xs text-muted-foreground">
                URL: {url}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="item-parent">Üst Öğe</Label>
            <Select value={parentId || 'none'} onValueChange={(val) => setParentId(val === 'none' ? null : val)}>
              <SelectTrigger id="item-parent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto">
                <SelectItem value="none">Yok (Ana Öğe)</SelectItem>
                {hierarchicalParents.map(parent => (
                  <SelectItem key={parent.id} value={parent.id}>
                    <span style={{ paddingLeft: `${parent.level * 20}px` }}>
                      {parent.level > 0 && '└─ '}
                      {parent.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="item-target">Hedef</Label>
            <Select value={target} onValueChange={(value) => setTarget(value as '_blank' | '_self')}>
              <SelectTrigger id="item-target">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_self">Aynı Pencere</SelectItem>
                <SelectItem value="_blank">Yeni Pencere</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="item-icon">İkon (isteğe bağlı)</Label>
          <Input
            id="item-icon"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="home"
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="item-active">Aktif</Label>
          <Switch
            id="item-active"
            checked={isActive}
            onCheckedChange={setIsActive}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
        <Button onClick={handleSave} disabled={!label}>
          <Save className="mr-2 h-4 w-4" /> Kaydet
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

// Render menu item for SortableTreeWrapper - IMPROVED VERSION
const renderMenuItem = (
  node: MenuTreeNode,
  onEdit: (node: MenuTreeNode) => void,
  onDelete: (nodeId: string) => void
) => {
  const getTypeBadge = (type: MenuItemType) => {
    switch (type) {
      case MenuItemType.PAGE:
        return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 text-white">Sayfa</Badge>;
      case MenuItemType.CATEGORY:
        return <Badge variant="secondary" className="bg-purple-500 hover:bg-purple-600 text-white">Kategori</Badge>;
      default:
        return <Badge variant="outline" className="border-gray-400 text-gray-700 dark:text-gray-300">Link</Badge>;
    }
  };

  return (
    <div className="flex items-center gap-3 bg-card p-3 rounded-lg shadow-sm hover:shadow-md border border-border/50 hover:border-primary/30 transition-all group">
      <GripVertical className="h-5 w-5 text-muted-foreground/60 hover:text-primary cursor-grab active:cursor-grabbing flex-shrink-0" />

      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-foreground text-sm truncate">{node.label}</p>
          {node.icon && (
            <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
              {node.icon}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground/80 truncate">{node.url || 'Bağlantı yok'}</p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {getTypeBadge(node.type)}
        {!node.isActive && (
          <Badge variant="destructive" className="text-xs bg-red-500 hover:bg-red-600 text-white">
            Pasif
          </Badge>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
          onClick={() => onEdit(node)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(node.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// Main Page Component
export default function MenuManagementPage() {
  const [menus, setMenus] = useState<CmsMenu[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuDialogOpen, setMenuDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<CmsMenu | undefined>();
  const [editingItem, setEditingItem] = useState<CmsMenuItem | undefined>();
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  // Draft/Published system state
  const [draftItems, setDraftItems] = useState<MenuTreeNode[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { toast } = useToast();

  const activeMenu = menus.find(m => m.id === activeMenuId);

  // Initialize draft items when active menu changes
  useEffect(() => {
    if (activeMenu && activeMenu.items) {
      setDraftItems(convertToNestedTree(activeMenu.items));
      setHasUnsavedChanges(false);
    }
  }, [activeMenu]);

  useEffect(() => {
    loadMenus();
  }, []);

  const loadMenus = async () => {
    try {
      setLoading(true);
      const data = await cmsMenuService.getMenus();
      setMenus(data);
      if (data.length > 0 && !activeMenuId) {
        setActiveMenuId(data[0].id);
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Menüler yüklenirken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMenu = async (data: { name: string; slug: string; location: MenuLocation; isActive: boolean }) => {
    try {
      const newMenu = await cmsMenuService.createMenu(data);
      setMenus([...menus, newMenu]);
      setActiveMenuId(newMenu.id);
      toast({
        title: 'Başarılı',
        description: 'Menü başarıyla oluşturuldu.',
      });
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Menü oluşturulurken bir hata oluştu.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateMenu = async (data: { name: string; slug: string; location: MenuLocation; isActive: boolean }) => {
    if (!editingMenu) return;

    try {
      const updatedMenu = await cmsMenuService.updateMenu(editingMenu.id, data);
      setMenus(menus.map(m => m.id === updatedMenu.id ? updatedMenu : m));
      toast({
        title: 'Başarılı',
        description: 'Menü başarıyla güncellendi.',
      });
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Menü güncellenirken bir hata oluştu.',
        variant: 'destructive',
      });
    }
  };

  const handleCreateMenuItem = async (data: {
    label: string;
    type: MenuItemType;
    url?: string;
    pageId?: string;
    categoryId?: string;
    parentId?: string | null;
    target?: '_blank' | '_self';
    icon?: string;
    isActive: boolean;
  }) => {
    if (!activeMenuId) return;

    try {
      await cmsMenuService.createMenuItem({
        menuId: activeMenuId,
        ...data,
      });

      // Reload menu from backend
      const updatedMenu = await cmsMenuService.getMenu(activeMenuId);
      setMenus(menus.map(m => m.id === activeMenuId ? updatedMenu : m));

      // Update draft items to reflect new item (CRITICAL FIX)
      if (updatedMenu.items) {
        setDraftItems(convertToNestedTree(updatedMenu.items));
      }
      // Don't reset hasUnsavedChanges here - CRUD operations save directly to backend
      // Only drag&drop changes need Save/Cancel buttons

      toast({
        title: 'Başarılı',
        description: 'Menü öğesi başarıyla oluşturuldu.',
      });
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Menü öğesi oluşturulurken bir hata oluştu.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateMenuItem = async (data: {
    label: string;
    type: MenuItemType;
    url?: string;
    pageId?: string;
    categoryId?: string;
    parentId?: string | null;
    target?: '_blank' | '_self';
    icon?: string;
    isActive: boolean;
  }) => {
    if (!editingItem || !activeMenuId) return;

    try {
      await cmsMenuService.updateMenuItem(editingItem.id, data);
      const updatedMenu = await cmsMenuService.getMenu(activeMenuId);
      setMenus(menus.map(m => m.id === activeMenuId ? updatedMenu : m));

      // Update draft items to reflect changes
      if (updatedMenu.items) {
        setDraftItems(convertToNestedTree(updatedMenu.items));
      }
      // Don't reset hasUnsavedChanges - update operations save directly

      toast({
        title: 'Başarılı',
        description: 'Menü öğesi başarıyla güncellendi.',
      });
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Menü öğesi güncellenirken bir hata oluştu.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteMenuItem = async (itemId: string) => {
    if (!activeMenuId) return;

    try {
      await cmsMenuService.deleteMenuItem(itemId);
      const updatedMenu = await cmsMenuService.getMenu(activeMenuId);
      setMenus(menus.map(m => m.id === activeMenuId ? updatedMenu : m));

      // Update draft items to reflect deletion
      if (updatedMenu.items) {
        setDraftItems(convertToNestedTree(updatedMenu.items));
      }
      // Don't reset hasUnsavedChanges - delete operations save directly

      toast({
        title: 'Başarılı',
        description: 'Menü öğesi başarıyla silindi.',
      });
    } catch (error: any) {
      // Better error handling for items with children
      const errorMessage = error?.response?.data?.message || error?.message || 'Menü öğesi silinirken bir hata oluştu.';

      if (errorMessage.includes('child items')) {
        toast({
          title: 'Silinemez',
          description: 'Bu menü öğesinin alt öğeleri var. Önce alt öğeleri silin veya başka bir üst öğeye taşıyın.',
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
      setDeleteItemId(null);
    }
  };

  // Handle tree structure changes from SortableTreeWrapper (local only)
  const handleTreeChange = (newTreeNodes: MenuTreeNode[]) => {
    setDraftItems(newTreeNodes);
    setHasUnsavedChanges(true);
  };

  // Save draft changes to database
  const handleSaveChanges = async () => {
    if (!activeMenuId || !hasUnsavedChanges) return;

    setIsSaving(true);
    try {
      // Convert tree back to flat structure
      const flatItems = convertToFlatItems(draftItems);

      // Prepare batch update payload
      const updates = flatItems.map(item => ({
        id: item.id,
        parentId: item.parentId ?? null, // Convert undefined to null
        orderIndex: item.orderIndex,
      }));

      // Batch update all items in one call
      await cmsMenuService.batchUpdateMenuItems(activeMenuId, updates);

      // Reload menu to get fresh data
      const updatedMenu = await cmsMenuService.getMenu(activeMenuId);
      setMenus(menus.map(m => m.id === activeMenuId ? updatedMenu : m));
      setHasUnsavedChanges(false);

      toast({
        title: 'Başarılı',
        description: 'Menü yapısı kaydedildi.',
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Hata',
        description: 'Menü yapısı kaydedilirken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel draft changes
  const handleCancelChanges = () => {
    if (activeMenu && activeMenu.items) {
      setDraftItems(convertToNestedTree(activeMenu.items));
      setHasUnsavedChanges(false);
      toast({
        title: 'İptal Edildi',
        description: 'Değişiklikler geri alındı.',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Menü Yönetimi</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Web sitenizin navigasyonunu ve menülerini buradan yönetin.
          </p>
        </div>
        <Dialog open={menuDialogOpen} onOpenChange={setMenuDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingMenu(undefined)} className="w-full md:w-auto">
              <MenuIcon className="mr-2 h-4 w-4" />
              Yeni Menü Oluştur
            </Button>
          </DialogTrigger>
          <MenuDialog
            menu={editingMenu}
            onSave={editingMenu ? handleUpdateMenu : handleCreateMenu}
            onOpenChange={setMenuDialogOpen}
          />
        </Dialog>
      </div>

      {/* Two-Card Layout: Menu List (Left) + Menu Editor (Right) - RESPONSIVE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left Card - Menu List (Full width on mobile, 4 columns on desktop) */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Menüler</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingMenu(undefined);
                  setMenuDialogOpen(true);
                }}
              >
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {menus.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MenuIcon className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">Henüz menü yok</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setMenuDialogOpen(true)}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Menü Oluştur
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {menus.map(menu => (
                  <Button
                    key={menu.id}
                    variant={activeMenuId === menu.id ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setActiveMenuId(menu.id)}
                    onDoubleClick={() => {
                      setEditingMenu(menu);
                      setMenuDialogOpen(true);
                    }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <MenuIcon className="h-4 w-4" />
                        <span className="font-medium truncate">{menu.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="secondary" className="text-xs">
                          {menu.items?.length || 0}
                        </Badge>
                        {!menu.isActive && (
                          <Badge variant="outline" className="text-xs">
                            Pasif
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Card - Menu Editor (Full width on mobile, 8 columns on desktop) */}
        <Card className="lg:col-span-8">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-4">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold">
                {activeMenu ? `${activeMenu.name} - Menü Öğeleri` : 'Menü Öğeleri'}
              </h3>
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-amber-600 border-amber-600 dark:text-amber-400 dark:border-amber-400">
                  Kaydedilmemiş Değişiklikler
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {hasUnsavedChanges && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCancelChanges}
                    disabled={isSaving}
                    size="sm"
                  >
                    İptal
                  </Button>
                  <Button
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                    size="sm"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Kaydediliyor...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Kaydet
                      </>
                    )}
                  </Button>
                </>
              )}
              <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => setEditingItem(undefined)}
                    disabled={!activeMenuId}
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Yeni Öğe Ekle
                  </Button>
                </DialogTrigger>
                <MenuItemDialog
                  item={editingItem}
                  menuId={activeMenuId || ''}
                  menuItems={activeMenu?.items || []}
                  onSave={editingItem ? handleUpdateMenuItem : handleCreateMenuItem}
                  onOpenChange={setItemDialogOpen}
                />
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {!activeMenu ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MenuIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Soldan bir menü seçin veya yeni menü oluşturun</p>
              </div>
            ) : !activeMenu.items || activeMenu.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground mb-4">Bu menüde henüz öğe yok</p>
                <Button variant="outline" onClick={() => setItemDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  İlk Öğeyi Ekle
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <SortableTreeWrapper
                  items={draftItems}
                  onItemsChange={handleTreeChange}
                  renderItem={(node) =>
                    renderMenuItem(
                      node,
                      (item) => {
                        // Convert MenuTreeNode back to CmsMenuItem for editing
                        const cmsItem: CmsMenuItem = {
                          id: item.id,
                          menuId: activeMenuId || '',
                          label: item.label,
                          type: item.type,
                          url: item.url,
                          parentId: item.parentId || null,
                          orderIndex: item.orderIndex,
                          target: item.target,
                          icon: item.icon,
                          isActive: item.isActive,
                          createdAt: new Date(),
                          updatedAt: new Date(),
                          deletedAt: null,
                        };
                        setEditingItem(cmsItem);
                        setItemDialogOpen(true);
                      },
                      (nodeId) => setDeleteItemId(nodeId)
                    )
                  }
                  collapsible={true}
                  indentationWidth={24}
                  className="min-h-[200px]"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <DeleteConfirmDialog
        open={deleteItemId !== null}
        onOpenChange={(open: boolean) => !open && setDeleteItemId(null)}
        onConfirm={() => deleteItemId && handleDeleteMenuItem(deleteItemId)}
        title="Menü Öğesini Sil"
        description="Bu menü öğesini ve tüm alt öğelerini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
      />
    </div>
  );
}
