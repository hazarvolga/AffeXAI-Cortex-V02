
'use client'

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PlusCircle, Edit, Trash2, GripVertical, ArrowUp, ArrowDown, Save, CornerDownRight } from "lucide-react";
import { menus as initialMenus, Menu as MenuType, MenuItem as MenuItemType } from '@/lib/menu-data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


const EditMenuItemDialog = ({ item, menuItems, onSave, onOpenChange }: { item: MenuItemType, menuItems: MenuItemType[], onSave: (updatedItem: MenuItemType) => void, onOpenChange: (open: boolean) => void }) => {
    const [title, setTitle] = useState(item.title);
    const [href, setHref] = useState(item.href);
    const [behavior, setBehavior] = useState(item.behavior);
    const [parentId, setParentId] = useState(item.parentId || 'none');

    const handleSave = () => {
        onSave({ ...item, title, href, behavior, parentId: parentId === 'none' ? undefined : parentId });
        onOpenChange(false);
    };

    const getValidParentOptions = (items: MenuItemType[], currentItemId: string): MenuItemType[] => {
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
    
    const potentialParents = getValidParentOptions(menuItems, item.id);


    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Menü Öğesini Düzenle</DialogTitle>
                <DialogDescription>"{item.title}" öğesinin detaylarını güncelleyin.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="item-title">Başlık</Label>
                    <Input id="item-title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="item-href">URL</Label>
                    <Input id="item-href" value={href} onChange={(e) => setHref(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="item-behavior">Davranış</Label>
                    <Select value={behavior} onValueChange={(value) => setBehavior(value as any)}>
                        <SelectTrigger id="item-behavior">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="link">Basit Link</SelectItem>
                            <SelectItem value="dropdown">Dropdown Menü</SelectItem>
                            <SelectItem value="mega">Mega Menü</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="item-parent">Üst Kategori</Label>
                    <Select value={parentId || 'none'} onValueChange={setParentId}>
                        <SelectTrigger id="item-parent">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Yok (Ana Kategori)</SelectItem>
                            {potentialParents.map(parent => (
                                <SelectItem key={parent.id} value={parent.id}>
                                    {parent.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                 <Button variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
                 <Button onClick={handleSave}><Save className="mr-2 h-4 w-4"/> Kaydet</Button>
            </DialogFooter>
        </DialogContent>
    );
};


const MenuItem = ({ item, onMove, isFirst, isLast, allItems, onSave, onDelete }: { item: MenuItemType, onMove: (direction: 'up' | 'down') => void, isFirst: boolean, isLast: boolean, allItems: MenuItemType[], onSave: (updatedItem: MenuItemType) => void, onDelete: () => void }) => {
    const [open, setOpen] = useState(false);
    
    const getBehaviorBadge = (behavior: MenuItemType['behavior']) => {
        switch (behavior) {
            case 'mega': return <Badge variant="default" className="bg-purple-600">Mega Menü</Badge>;
            case 'dropdown': return <Badge variant="secondary">Dropdown</Badge>;
            default: return <Badge variant="outline">Link</Badge>;
        }
    };

    return (
        <div className="flex items-center gap-2 bg-background p-2 rounded-lg border group">
            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
            <div className="flex-grow">
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.href}</p>
            </div>
            <div className="flex items-center gap-2">
                {getBehaviorBadge(item.behavior)}
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onMove('up')} disabled={isFirst}>
                        <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onMove('down')} disabled={isLast}>
                        <ArrowDown className="h-4 w-4" />
                    </Button>
                </div>
                 <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                         <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <EditMenuItemDialog item={item} menuItems={allItems} onSave={onSave} onOpenChange={setOpen} />
                </Dialog>
                 <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={onDelete}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

const CategoryRow = ({
  item,
  allItems,
  onMove,
  onSave,
  onDelete,
  level,
}: {
  item: MenuItemType;
  allItems: MenuItemType[];
  onMove: (itemId: string, direction: "up" | "down") => void;
  onSave: (updatedItem: MenuItemType) => void;
  onDelete: (itemId: string) => void;
  level: number;
}) => {
  const children = allItems.filter((child) => child.parentId === item.id);
  const siblings = allItems.filter(i => i.parentId === item.parentId);
  const itemIndex = siblings.findIndex(i => i.id === item.id);

  return (
    <div className="space-y-2">
      <div style={{ marginLeft: `${level * 2}rem` }} className="flex items-start gap-2">
        {level > 0 && <CornerDownRight className="h-5 w-5 text-muted-foreground mt-2.5 flex-shrink-0" />}
        <div className="flex-grow">
          <MenuItem
            item={item}
            onMove={(direction) => onMove(item.id, direction)}
            isFirst={itemIndex === 0}
            isLast={itemIndex === siblings.length - 1}
            allItems={allItems}
            onSave={onSave}
            onDelete={() => onDelete(item.id)}
          />
        </div>
      </div>
      {children.map((child) => (
        <CategoryRow
          key={child.id}
          item={child}
          allItems={allItems}
          onMove={onMove}
          onSave={onSave}
          onDelete={onDelete}
          level={level + 1}
        />
      ))}
    </div>
  );
};


export default function MenuManagementPage() {
    const [menusData, setMenusData] = useState(initialMenus);
    const [activeMenuId, setActiveMenuId] = useState(menusData[0].id);

    const activeMenu = menusData.find(m => m.id === activeMenuId);

    const handleMove = (menuId: string, itemId: string, direction: 'up' | 'down') => {
        setMenusData(currentMenusData => {
            const newMenusData = JSON.parse(JSON.stringify(currentMenusData));
            const menu = newMenusData.find((m: MenuType) => m.id === menuId);
            if (!menu) return currentMenusData;
            
            const targetItem = menu.items.find((i: MenuItemType) => i.id === itemId);
            if (!targetItem) return currentMenusData;
            
            const siblings = menu.items.filter((i: MenuItemType) => i.parentId === targetItem.parentId);
            const currentIndexInSiblings = siblings.findIndex((item: MenuItemType) => item.id === itemId);
            
            if (currentIndexInSiblings === -1) return currentMenusData;
            
            const newIndexInSiblings = direction === 'up' ? currentIndexInSiblings - 1 : currentIndexInSiblings + 1;
            
            if (newIndexInSiblings < 0 || newIndexInSiblings >= siblings.length) return currentMenusData;

            const otherItemInSiblings = siblings[newIndexInSiblings];
            
            const targetItemGlobalIndex = menu.items.findIndex((i: MenuItemType) => i.id === targetItem.id);
            const otherItemGlobalIndex = menu.items.findIndex((i: MenuItemType) => i.id === otherItemInSiblings.id);

            if (targetItemGlobalIndex > -1 && otherItemGlobalIndex > -1) {
                [menu.items[targetItemGlobalIndex], menu.items[otherItemGlobalIndex]] = [menu.items[otherItemGlobalIndex], menu.items[targetItemGlobalIndex]];
            }
            
            return newMenusData;
        });
    };

    const handleSaveItem = (updatedItem: MenuItemType) => {
        setMenusData(currentMenusData => {
            return currentMenusData.map(menu => {
                if (menu.id === activeMenuId) {
                    const newItems = menu.items.map(item => item.id === updatedItem.id ? updatedItem : item);
                    return { ...menu, items: newItems };
                }
                return menu;
            });
        });
    };

    const handleDeleteItem = (itemId: string) => {
       setMenusData(currentMenusData => {
            return currentMenusData.map(menu => {
                if (menu.id === activeMenuId) {
                    // Also remove children of the deleted item
                    let itemsToDelete = new Set([itemId]);
                    let newItems = [...menu.items];
                    let changed = true;
                    while(changed) {
                        changed = false;
                        newItems = newItems.filter(item => {
                            if (item.parentId && itemsToDelete.has(item.parentId)) {
                                itemsToDelete.add(item.id);
                                changed = true;
                                return false;
                            }
                            return true;
                        });
                    }
                    newItems = newItems.filter(item => !itemsToDelete.has(item.id));
                    return { ...menu, items: newItems };
                }
                return menu;
            });
        });
    }

    const handleAddItem = () => {
         setMenusData(currentMenusData => {
            return currentMenusData.map(menu => {
                if (menu.id === activeMenuId) {
                    const newItem: MenuItemType = {
                        id: `new-item-${Date.now()}`,
                        title: 'Yeni Öğe',
                        href: '#',
                        behavior: 'link',
                        parentId: null
                    };
                    return { ...menu, items: [...menu.items, newItem] };
                }
                return menu;
            });
        });
    };


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Menü Yönetimi</h1>
                    <p className="text-muted-foreground">
                        Web sitenizin ana navigasyonunu ve diğer menülerini buradan yönetin.
                    </p>
                </div>
            </div>

            <Card>
                <Tabs value={activeMenuId} onValueChange={setActiveMenuId}>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <TabsList>
                            {menusData.map(menu => (
                                <TabsTrigger key={menu.id} value={menu.id}>{menu.name}</TabsTrigger>
                            ))}
                        </TabsList>
                        <Button onClick={handleAddItem}>
                            <PlusCircle className="mr-2 h-4 w-4"/>
                            Yeni Menü Öğesi Ekle
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {menusData.map(menu => (
                            <TabsContent key={menu.id} value={menu.id}>
                               <div className="space-y-2">
                                {activeMenu && activeMenu.items.filter(i => i.parentId === null).map(item => (
                                    <CategoryRow 
                                        key={item.id}
                                        item={item}
                                        allItems={activeMenu.items}
                                        onMove={(itemId, direction) => handleMove(menu.id, itemId, direction)}
                                        onSave={handleSaveItem}
                                        onDelete={handleDeleteItem}
                                        level={0}
                                    />
                                ))}
                               </div>
                            </TabsContent>
                        ))}
                    </CardContent>
                </Tabs>
            </Card>
        </div>
    );
}

    