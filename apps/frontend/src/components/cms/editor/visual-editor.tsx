'use client';

import { readFullWidth } from './layout-width';

import React, { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ComponentsLibrary } from './components-library';
import { EditorCanvas } from './editor-canvas';
import { PropertiesPanel } from './properties-panel';
import { HistoryPanel } from './history-panel';
import { ComponentTree } from './component-tree';
import { SEOPanel } from './seo-panel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Media } from '@/lib/media/types';
import { cmsService, type Category, type Menu, type MenuItem } from '@/lib/cms/cms-service';
import type { CreateComponentDto } from '@/lib/cms/cms-service';
import { templateService } from '@/lib/api/templateService';
import type { PageTemplate } from '@/types/cms-template';
import { Skeleton } from '@/components/loading/skeleton';
import {
  Undo2,
  Redo2,
  Lock,
  Unlock,
  Save,
  Eye,
  EyeOff,
  Upload,
  Search,
  Menu as MenuIcon,
  X,
  Package,
  Monitor,
  Tablet,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Settings,
  Layers,
  Network,
  GripVertical,
  Pin,
  PinOff,
  Maximize2,
  Minimize2,
  Image as ImageIcon,
  History as HistoryIcon,
  Layout,
  Square,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SectionPicker, type SectionTemplate } from '../section-editor';
import { Plus } from 'lucide-react';
import { SimpleEditorContent, type SimpleSection } from '../simple-editor';

// Lazy load MediaLibrary - only loaded when media tab is selected
const MediaLibrary = dynamic(
  () => import('./media-library').then(mod => ({ default: mod.MediaLibrary })),
  {
    loading: () => <Skeleton className="h-full w-full" />,
    ssr: false,
  }
);

interface EditorComponent {
  id: string;
  type: string;
  props: any;
  parentId?: string | null;
  orderIndex?: number;
  children?: EditorComponent[];
  locked?: boolean; // Add locked property
  reusableComponentId?: string; // Database ID for reusable components
}

// Define history item type
interface HistoryItem {
  components: EditorComponent[];
  timestamp: number;
}

interface VisualEditorProps {
  pageId?: string;
  templateId?: string;
}

export const VisualEditor: React.FC<VisualEditorProps> = ({ pageId, templateId }) => {
  const { toast } = useToast();
  const [components, setComponents] = useState<EditorComponent[]>([]);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [selectedComponentType, setSelectedComponentType] = useState<string>('');
  const [history, setHistory] = useState<HistoryItem[]>([{ components: [], timestamp: Date.now() }]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [pageTitle, setPageTitle] = useState<string>('');
  const [pageSlug, setPageSlug] = useState<string>('');
  const [pageDescription, setPageDescription] = useState<string>('');
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('templates');
  const [isSEOExpanded, setIsSEOExpanded] = useState(false);

  // Component Tree Sidebar states
  const [isTreeSidebarOpen, setIsTreeSidebarOpen] = useState(false);
  const [treeSidebarWidth, setTreeSidebarWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('treeSidebarWidth');
      return saved ? parseInt(saved) : 400;
    }
    return 400;
  });
  const [isTreePinned, setIsTreePinned] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isDocked, setIsDocked] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('treeSidebarDocked');
      return saved ? saved === 'true' : true;
    }
    return true;
  });
  const [floatingPosition, setFloatingPosition] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('treeSidebarPosition');
      if (saved) {
        return JSON.parse(saved);
      }
    }
    return { x: 100, y: 100 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Preview mode states
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Layout options state
  const [showHeader, setShowHeader] = useState(true);
  const [showFooter, setShowFooter] = useState(true);
  const [isFullWidth, setIsFullWidth] = useState(false);

  // Editor mode: 'simple' (new 3-panel) or 'advanced' (legacy)
  const [editorMode, setEditorMode] = useState<'simple' | 'advanced'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cmsEditorMode');
      return (saved as 'simple' | 'advanced') || 'simple';
    }
    return 'simple';
  });
  // Category & Menu state
  const [categories, setCategories] = useState<Category[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]);
  const [selectedParentItemId, setSelectedParentItemId] = useState<string>('');
  const [selectedPosition, setSelectedPosition] = useState<'first' | 'last' | 'after'>('last');
  const [selectedAfterItemId, setSelectedAfterItemId] = useState<string>('');

  // SEO data state
  const [seoData, setSeoData] = useState({
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    canonicalUrl: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    ogType: 'website',
    ogUrl: '',
    twitterCard: 'summary_large_image',
    twitterTitle: '',
    twitterDescription: '',
    twitterImage: '',
    twitterCreator: '',
    robotsIndex: true,
    robotsFollow: true,
    structuredData: '',
  });

  // ✅ FIXED: History with 50-entry limit (prevents memory bloat)
  // Limits undo/redo to last 50 actions, removes oldest entries when exceeded
  const MAX_HISTORY_ENTRIES = 50;

  const saveToHistory = useCallback((newComponents: EditorComponent[]) => {
    // Trim history if we're at the limit
    const trimmedHistory = history.length >= MAX_HISTORY_ENTRIES
      ? history.slice(history.length - MAX_HISTORY_ENTRIES + 1)
      : history.slice(0, historyIndex + 1);

    // Add new entry
    const newHistory = [...trimmedHistory, { components: newComponents, timestamp: Date.now() }];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Move component up in the list
  const handleMoveUp = useCallback(() => {
    if (!selectedComponentId) return;

    const selectedIndex = components.findIndex(comp => comp.id === selectedComponentId);
    if (selectedIndex <= 0) return; // Already at the top or not found

    const newComponents = [...components];
    // Swap with the previous component
    [newComponents[selectedIndex], newComponents[selectedIndex - 1]] =
      [newComponents[selectedIndex - 1], newComponents[selectedIndex]];

    setComponents(newComponents);
    saveToHistory(newComponents);
  }, [components, selectedComponentId, saveToHistory]);

  // Move component down in the list
  const handleMoveDown = useCallback(() => {
    if (!selectedComponentId) return;

    const selectedIndex = components.findIndex(comp => comp.id === selectedComponentId);
    if (selectedIndex === -1 || selectedIndex >= components.length - 1) return; // Already at the bottom or not found

    const newComponents = [...components];
    // Swap with the next component
    [newComponents[selectedIndex], newComponents[selectedIndex + 1]] =
      [newComponents[selectedIndex + 1], newComponents[selectedIndex]];

    setComponents(newComponents);
    saveToHistory(newComponents);
  }, [components, selectedComponentId, saveToHistory]);

  // Helper: Build hierarchical menu tree structure
  const buildMenuTree = useCallback((items: MenuItem[]): MenuItem[] => {
    const itemMap = new Map<string, MenuItem & { children?: MenuItem[] }>();
    const rootItems: (MenuItem & { children?: MenuItem[] })[] = [];

    // First pass: create map of all items
    items.forEach(item => {
      itemMap.set(item.id, { ...item, children: [] });
    });

    // Second pass: build tree structure
    items.forEach(item => {
      const node = itemMap.get(item.id)!;
      if (item.parentId) {
        const parent = itemMap.get(item.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        } else {
          rootItems.push(node);
        }
      } else {
        rootItems.push(node);
      }
    });

    // Sort by orderIndex at each level
    const sortByOrder = (items: (MenuItem & { children?: MenuItem[] })[]) => {
      items.sort((a, b) => a.orderIndex - b.orderIndex);
      items.forEach(item => {
        if (item.children && item.children.length > 0) {
          sortByOrder(item.children);
        }
      });
    };

    sortByOrder(rootItems);
    return rootItems;
  }, []);

  // Helper: Get current menu items
  const getCurrentMenuItems = useCallback((): MenuItem[] => {
    if (!selectedMenuIds[0]) return [];
    const menu = menus.find(m => m.id === selectedMenuIds[0]);
    return menu?.items || [];
  }, [selectedMenuIds, menus]);

  // Helper: Calculate order index for new item
  const calculateOrderIndex = useCallback((
    menuItems: MenuItem[],
    parentId: string | null,
    position: 'first' | 'last' | 'after',
    afterItemId?: string
  ): number => {
    const siblings = menuItems.filter(item =>
      (parentId ? item.parentId === parentId : !item.parentId)
    );

    if (siblings.length === 0) return 0;

    if (position === 'first') {
      const minOrder = Math.min(...siblings.map(s => s.orderIndex));
      return Math.max(0, minOrder - 1);
    }

    if (position === 'last') {
      const maxOrder = Math.max(...siblings.map(s => s.orderIndex));
      return maxOrder + 1;
    }

    // position === 'after'
    if (afterItemId) {
      const afterItem = siblings.find(s => s.id === afterItemId);
      if (afterItem) {
        return afterItem.orderIndex + 0.5; // Insert between items
      }
    }

    return siblings.length;
  }, []);

  // Load page data if pageId is provided
  useEffect(() => {
    if (pageId) {
      const loadPageData = async () => {
        try {
          const page = await cmsService.getPage(pageId);
          setPageTitle(page.title);
          setPageSlug(page.slug);
          setPageDescription(page.description || '');

          // Load layout options
          if (page.layoutOptions) {
            setShowHeader(page.layoutOptions.showHeader !== false); // default true
            setShowFooter(page.layoutOptions.showFooter !== false); // default true
            setIsFullWidth(readFullWidth(page.layoutOptions)); // default false (boxed)
          }

          // Load category if exists
          if ((page as any).categoryId) {
            setSelectedCategoryId((page as any).categoryId);
          }

          // Load components from page response if they exist, otherwise load separately
          if (page.components && page.components.length > 0) {
            console.log('Loaded components from page response:', page.components);

            // Transform components: if type is 'block', use blockId as type
            // Support both new format (blockId at root) and old format (blockId in props)
            const transformedComponents = page.components.map((comp: any) => ({
              ...comp,
              type: comp.type === 'block' && (comp.blockId || comp.props?.blockId)
                ? (comp.blockId || comp.props.blockId)
                : comp.type,
              blockId: comp.blockId || comp.props?.blockId, // Preserve blockId at root level
            }));

            setComponents(transformedComponents);
            setHistory([{ components: transformedComponents, timestamp: Date.now() }]);
            setHistoryIndex(0);
          } else {
            // Load components separately since they might not be included in page response
            try {
              const pageComponents = await cmsService.getComponents(pageId);
              console.log('Loaded components separately:', pageComponents);

              // Transform components: if type is 'block', use blockId as type
              // Support both new format (blockId at root) and old format (blockId in props)
              const transformedComponents = pageComponents.map((comp: any) => ({
                ...comp,
                type: comp.type === 'block' && (comp.blockId || comp.props?.blockId)
                  ? (comp.blockId || comp.props.blockId)
                  : comp.type,
                blockId: comp.blockId || comp.props?.blockId, // Preserve blockId at root level
              }));

              console.log('Transformed components:', transformedComponents);
              setComponents(transformedComponents);
              setHistory([{ components: transformedComponents, timestamp: Date.now() }]);
              setHistoryIndex(0);
            } catch (componentError) {
              console.error('Failed to load components:', componentError);
              // Initialize with empty components if loading fails
              setComponents([]);
              setHistory([{ components: [], timestamp: Date.now() }]);
              setHistoryIndex(0);
            }
          }
        } catch (error) {
          console.error('Failed to load page data:', error);
          toast({
            title: "Error",
            description: "Failed to load page data",
            variant: "destructive",
          });
        }
      };

      loadPageData();
    }
  }, [pageId, toast]);

  // Load template if templateId is provided
  useEffect(() => {
    if (templateId && !pageId) {
      const loadTemplate = async () => {
        try {
          const template: PageTemplate = await templateService.getById(templateId);

          // Transform template blocks to editor components
          const editorComponents: EditorComponent[] = template.blocks
            .map((block, index) => {
              const props = block.properties || {};

              // Add blockId to props for proper block rendering
              const componentProps: Record<string, unknown> = {
                ...props,
                blockId: block.type
              };

              console.log(`[Template Load] Block ${block.id} (${block.type}):`, {
                hasProps: !!block.properties,
                propsKeys: Object.keys(componentProps),
                mainTabsLength: Array.isArray(componentProps.mainTabs) ? componentProps.mainTabs.length : 0
              });

              return {
                id: `${block.id}-${Date.now()}-${index}`,
                type: 'block', // All components are type 'block'
                props: componentProps,
                orderIndex: index,
                parentId: null,
                children: []
              };
            });

          // Set components in editor
          setComponents(editorComponents);

          // Initialize history with template
          setHistory([{ components: editorComponents, timestamp: Date.now() }]);
          setHistoryIndex(0);

          // Set page title from template name
          setPageTitle(template.name);
          const slug = template.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          setPageSlug(slug);
          setPageDescription(template.description);

          toast({
            title: 'Template Yüklendi',
            description: `"${template.name}" şablonu editöre yüklendi. Kategori ve menü seçimini yapmayı unutmayın.`,
          });
        } catch (error) {
          console.error('Error loading template:', error);
          toast({
            variant: 'destructive',
            title: 'Hata',
            description: 'Template yüklenirken bir hata oluştu.',
          });
        }
      };

      loadTemplate();
    }
  }, [templateId, pageId, toast]);

  // Load categories and menus
  useEffect(() => {
    const loadCategoriesAndMenus = async () => {
      try {
        const [categoriesData, menusData] = await Promise.all([
          cmsService.getCategories(),
          cmsService.getMenus(),
        ]);
        setCategories(categoriesData);

        // Load full menu items for each menu (to include nested items)
        const menusWithFullItems = await Promise.all(
          menusData.map(async (menu) => {
            try {
              const fullItems = await cmsService.getMenuItems(menu.id);
              return { ...menu, items: fullItems };
            } catch (error) {
              console.error(`Failed to load items for menu ${menu.id}:`, error);
              return menu;
            }
          })
        );
        setMenus(menusWithFullItems);

        // If we have a pageId, check which menus contain this page
        if (pageId && menusWithFullItems.length > 0) {
          const pageMenuIds: string[] = [];
          menusWithFullItems.forEach(menu => {
            if (menu.items?.some(item => item.pageId === pageId)) {
              pageMenuIds.push(menu.id);
            }
          });
          setSelectedMenuIds(pageMenuIds);
        }
      } catch (error) {
        console.error('Failed to load categories and menus:', error);
      }
    };

    loadCategoriesAndMenus();
  }, [pageId]);

  // Auto-select default category and menu for template mode
  useEffect(() => {
    // Only run in template mode (templateId exists, pageId doesn't)
    if (templateId && !pageId && categories.length > 0 && menus.length > 0) {
      // Set default category if not already selected
      if (!selectedCategoryId && categories.length > 0) {
        const defaultCategory = categories[0];
        setSelectedCategoryId(defaultCategory.id);
        console.log('[Template Mode] Auto-selected default category:', defaultCategory.name);
      }

      // Set default menu if not already selected
      if (selectedMenuIds.length === 0 && menus.length > 0) {
        const defaultMenu = menus[0];
        setSelectedMenuIds([defaultMenu.id]);
        console.log('[Template Mode] Auto-selected default menu:', defaultMenu.name);
      }
    }
  }, [templateId, pageId, categories, menus, selectedCategoryId, selectedMenuIds]);

  // Handle Tree Sidebar Resize
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDocked) {
        const newWidth = window.innerWidth - e.clientX;
        const clampedWidth = Math.max(300, Math.min(600, newWidth));
        setTreeSidebarWidth(clampedWidth);
        localStorage.setItem('treeSidebarWidth', clampedWidth.toString());
      } else {
        // Floating mode - resize from drag point
        const newWidth = Math.max(300, Math.min(600, e.clientX - floatingPosition.x));
        setTreeSidebarWidth(newWidth);
        localStorage.setItem('treeSidebarWidth', newWidth.toString());
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, isDocked, floatingPosition.x]);

  // Handle Floating Mode Drag
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (isDocked) return;
    e.preventDefault();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - floatingPosition.x,
      y: e.clientY - floatingPosition.y,
    });
  }, [isDocked, floatingPosition]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Keep within viewport bounds
      const maxX = window.innerWidth - treeSidebarWidth;
      const maxY = window.innerHeight - 200; // Minimum 200px visible

      const clampedPosition = {
        x: Math.max(0, Math.min(maxX, newX)),
        y: Math.max(0, Math.min(maxY, newY)),
      };

      setFloatingPosition(clampedPosition);
      localStorage.setItem('treeSidebarPosition', JSON.stringify(clampedPosition));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, treeSidebarWidth]);

  // Toggle Dock/Float mode
  const handleToggleDock = useCallback(() => {
    setIsDocked(!isDocked);
    localStorage.setItem('treeSidebarDocked', (!isDocked).toString());
  }, [isDocked]);

  // Undo functionality
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const prevState = history[newIndex];
      setComponents(prevState.components);

      // Clear selection if component no longer exists
      if (selectedComponentId && !prevState.components.find(c => c.id === selectedComponentId)) {
        setSelectedComponentId(null);
        setSelectedComponentType('');
      }
    }
  }, [history, historyIndex, selectedComponentId]);

  // Redo functionality
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const nextState = history[newIndex];
      setComponents(nextState.components);

      // Clear selection if component no longer exists
      if (selectedComponentId && !nextState.components.find(c => c.id === selectedComponentId)) {
        setSelectedComponentId(null);
        setSelectedComponentType('');
      }
    }
  }, [history, historyIndex, selectedComponentId]);

  // Jump to specific history item
  const handleHistorySelect = useCallback((index: number) => {
    if (index >= 0 && index < history.length) {
      setHistoryIndex(index);
      const state = history[index];
      setComponents(state.components);

      // Clear selection if component no longer exists
      if (selectedComponentId && !state.components.find(c => c.id === selectedComponentId)) {
        setSelectedComponentId(null);
        setSelectedComponentType('');
      }
    }
  }, [history, selectedComponentId]);

  // Delete selected component
  const handleDelete = useCallback(() => {
    if (selectedComponentId) {
      const componentToDelete = components.find(comp => comp.id === selectedComponentId);
      if (componentToDelete?.locked) {
        toast({
          title: "Action Denied",
          description: "Cannot delete locked component",
          variant: "destructive",
        });
        return;
      }

      const newComponents = components.filter(comp => comp.id !== selectedComponentId);
      setComponents(newComponents);
      saveToHistory(newComponents);
      setSelectedComponentId(null);
      setSelectedComponentType('');
    }
  }, [components, selectedComponentId, saveToHistory, toast]);

  // Toggle component lock
  const handleToggleLock = useCallback(() => {
    if (selectedComponentId) {
      const newComponents = components.map(comp =>
        comp.id === selectedComponentId ? { ...comp, locked: !comp.locked } : comp
      );
      setComponents(newComponents);
      saveToHistory(newComponents);
      const isLocked = components.find(c => c.id === selectedComponentId)?.locked;
      toast({
        title: "Component Updated",
        description: `Component ${isLocked ? 'unlocked' : 'locked'}`,
      });
    }
  }, [components, selectedComponentId, saveToHistory, toast]);

  // Toggle preview mode (hide panels and edit controls)
  const handleTogglePreview = useCallback(() => {
    const newPreviewMode = !isPreviewMode;
    setIsPreviewMode(newPreviewMode);

    if (newPreviewMode) {
      // Entering preview mode - hide panels and clear selection
      setIsLeftPanelOpen(false);
      setIsRightPanelOpen(false);
      setSelectedComponentId(null);

      toast({
        title: "Preview Mode",
        description: "Panels hidden. Click again to exit preview mode.",
      });
    } else {
      // Exiting preview mode - restore panels
      setIsLeftPanelOpen(true);
      setIsRightPanelOpen(true);

      toast({
        title: "Edit Mode",
        description: "Panels restored. You can now edit components.",
      });
    }
  }, [isPreviewMode, toast]);

  // Open published page in new tab
  const handleViewLive = useCallback(() => {
    if (!pageSlug) {
      toast({
        title: "Page Not Saved",
        description: "Please save the page first to view it live.",
        variant: "destructive",
      });
      return;
    }

    // Open the published page URL
    const liveUrl = `/pages/${pageSlug}`;
    window.open(liveUrl, '_blank');

    toast({
      title: "Opening Live Page",
      description: "Published page opened in new tab",
    });
  }, [pageSlug, toast]);

  // Open preview in new tab
  const handleOpenPreview = useCallback(() => {
    // Save components to sessionStorage for preview page
    sessionStorage.setItem('previewComponents', JSON.stringify(components));

    // Build preview URL with layout options
    const previewUrl = `/cms/preview?showHeader=${showHeader}&showFooter=${showFooter}`;

    // Open in new tab
    window.open(previewUrl, '_blank');

    toast({
      title: "Preview Opened",
      description: "Preview opened in new tab",
    });
  }, [components, showHeader, showFooter, toast]);

  // Save page
  const handleSavePage = useCallback(async () => {
    let currentPageId = pageId;

    try {
      // If no pageId, create a new page first
      if (!currentPageId) {
        console.log('Creating new page...');
        const newPage = await cmsService.createPage({
          title: pageTitle || 'Untitled Page',
          slug: pageSlug || `page-${Date.now()}`,
          description: pageDescription,
          status: 'draft',
          layoutOptions: {
            showHeader,
            showFooter,
            fullWidth: isFullWidth,
            isFullWidth, // Keep legacy page renderers compatible with saved layouts.
          },
          categoryId: selectedCategoryId || undefined,
        } as any);

        currentPageId = newPage.id;
        console.log('New page created with ID:', currentPageId);

        // Update URL with new pageId
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('pageId', currentPageId);
        newUrl.searchParams.delete('template'); // Remove template param
        window.history.pushState({}, '', newUrl);

        toast({
          title: "Page Created",
          description: "New page created successfully. Saving components...",
        });
      } else {
        // Page exists, verify it
        try {
          const page = await cmsService.getPage(currentPageId);
          console.log('Page exists:', page);
        } catch (error) {
          console.error('Page not found:', error);
          toast({
            title: "Error",
            description: "Page not found. Please make sure you're editing a valid page.",
            variant: "destructive",
          });
          return;
        }

        // Update page metadata with layout options and category
        await cmsService.updatePage(currentPageId, {
          title: pageTitle,
          slug: pageSlug,
          description: pageDescription,
          layoutOptions: {
            showHeader,
            showFooter,
            fullWidth: isFullWidth,
            isFullWidth, // Keep legacy page renderers compatible with saved layouts.
          },
          categoryId: selectedCategoryId || undefined,
        } as any);
      }

      // Save components to the backend
      // First, get existing components for this page
      const existingComponents = await cmsService.getComponents(currentPageId);
      console.log('Existing components:', existingComponents);

      // Delete components that no longer exist
      const componentIds = components.map(c => c.id);
      const componentsToDelete = existingComponents.filter(c => !componentIds.includes(c.id));
      console.log('Components to delete:', componentsToDelete);
      await Promise.all(componentsToDelete.map(c => cmsService.deleteComponent(c.id)));

      // Log components we're about to save
      console.log('Components to save:', components);

      // Track successfully saved components
      const savedComponents: any[] = [];

      const savedPageId = currentPageId;

      // Create or update components
      await Promise.all(components.map(async (component) => {
        const existingComponent = existingComponents.find(c => c.id === component.id);

        // For prebuild blocks, use type 'block' and store block ID at root level
        const isPrebuildBlock = !['text', 'button', 'image', 'container', 'card', 'grid'].includes(component.type);

        const componentData: CreateComponentDto = {
          pageId: savedPageId,
          parentId: null,
          type: isPrebuildBlock ? 'block' : component.type as any,
          blockId: isPrebuildBlock ? component.type : undefined, // Store blockId at root level
          props: component.props, // Don't store blockId in props anymore
          orderIndex: component.orderIndex || 0,
        };

        // Log the component data for debugging
        console.log('Saving component:', {
          originalType: component.type,
          isPrebuildBlock,
          componentData
        });

        if (existingComponent) {
          // Update existing component
          try {
            const result = await cmsService.updateComponent(component.id, componentData);
            console.log(`Updated component ${component.id}:`, result);
            savedComponents.push(result);
          } catch (error) {
            console.error(`Failed to update component ${component.id}:`, error);
            throw error;
          }
        } else {
          // Create new component
          try {
            const result = await cmsService.createComponent(componentData);
            console.log(`Created component ${component.id}:`, result);
            savedComponents.push(result);
          } catch (error) {
            console.error(`Failed to create component ${component.id}:`, error);
            throw error;
          }
        }
      }));

      console.log('All saved components:', savedComponents);

      // Handle hierarchical menu assignment with advanced placement
      if (selectedMenuIds.length > 0 && selectedMenuIds[0]) {
        const menuId = selectedMenuIds[0];
        try {
          const menu = await cmsService.getMenu(menuId);
          const menuItems = menu.items || [];
          const existingItem = menuItems.find(item => item.pageId === currentPageId);

          if (!existingItem) {
            // Calculate the correct order index based on position settings
            const parentId = selectedParentItemId || null;
            const orderIndex = calculateOrderIndex(
              menuItems,
              parentId,
              selectedPosition,
              selectedAfterItemId || undefined
            );

            // Add page to menu with full hierarchical placement support
            await cmsService.addPageToMenu(
              menuId,
              currentPageId,
              pageTitle,
              orderIndex,
              parentId || undefined
            );

            console.log(`Page added to menu: ${menuId}, parent: ${parentId || 'root'}, orderIndex: ${orderIndex}, position: ${selectedPosition}`);
          } else {
            // Page already exists in menu
            console.log('Page already exists in menu, skipping assignment');
          }
        } catch (error) {
          console.error('Failed to assign page to menu:', error);
          toast({
            title: "Warning",
            description: "Page saved but menu assignment failed",
            variant: "destructive",
          });
        }
      }

      // Reload menus to reflect new menu item
      if (selectedMenuIds.length > 0) {
        try {
          const menusData = await cmsService.getMenus();
          const menusWithFullItems = await Promise.all(
            menusData.map(async (menu) => {
              try {
                const fullItems = await cmsService.getMenuItems(menu.id);
                return { ...menu, items: fullItems };
              } catch (error) {
                console.error(`Failed to load items for menu ${menu.id}:`, error);
                return menu;
              }
            })
          );
          setMenus(menusWithFullItems);
        } catch (error) {
          console.error('Failed to reload menus:', error);
        }
      }

      toast({
        title: "Success",
        description: "Page saved successfully",
      });
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: `Failed to save page: ${error.message || error}`,
        variant: "destructive",
      });
    }
  }, [
    pageId,
    pageTitle,
    pageSlug,
    pageDescription,
    components,
    showHeader,
    showFooter,
    selectedCategoryId,
    selectedMenuIds,
    selectedParentItemId,
    selectedPosition,
    selectedAfterItemId,
    calculateOrderIndex,
    toast
  ]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when not in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl/Cmd + Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        toast({
          title: "Action Performed",
          description: "Undo action performed",
        });
      }

      // Ctrl/Cmd + Shift + Z for redo
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Z') {
        e.preventDefault();
        handleRedo();
        toast({
          title: "Action Performed",
          description: "Redo action performed",
        });
      }

      // Delete key for deleting selected component
      if (e.key === 'Delete' && selectedComponentId) {
        e.preventDefault();
        handleDelete();
        toast({
          title: "Component Deleted",
          description: "Component has been deleted",
        });
      }

      // Ctrl/Cmd + D for duplicating component
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedComponentId) {
        e.preventDefault();
        const componentToDuplicate = components.find(comp => comp.id === selectedComponentId);
        if (componentToDuplicate) {
          const newComponent = {
            ...componentToDuplicate,
            id: `comp-${Date.now()}`,
            props: {
              ...componentToDuplicate.props,
              // Add "copy" to text content to indicate duplication
              content: componentToDuplicate.props.content ? `${componentToDuplicate.props.content} (copy)` : undefined
            }
          };
          const newComponents = [...components, newComponent];
          setComponents(newComponents);
          saveToHistory(newComponents);
          toast({
            title: "Component Duplicated",
            description: "Component has been duplicated",
          });
        }
      }

      // Ctrl/Cmd + L for locking/unlocking component
      if ((e.ctrlKey || e.metaKey) && e.key === 'l' && selectedComponentId) {
        e.preventDefault();
        handleToggleLock();
      }

      // Ctrl/Cmd + Shift + Arrow Up to move component up
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'ArrowUp' && selectedComponentId) {
        e.preventDefault();
        handleMoveUp();
        toast({
          title: "Component Moved",
          description: "Component moved up",
        });
      }

      // Ctrl/Cmd + Shift + Arrow Down to move component down
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'ArrowDown' && selectedComponentId) {
        e.preventDefault();
        handleMoveDown();
        toast({
          title: "Component Moved",
          description: "Component moved down",
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleUndo, handleRedo, handleDelete, handleToggleLock, handleMoveUp, handleMoveDown, selectedComponentId, components, saveToHistory, toast]);

  // Listen for prebuild component drop events
  useEffect(() => {
    const handleAddPrebuildComponentAtPosition = (e: CustomEvent) => {
      const { componentId, defaultProps, parentId, index } = e.detail;

      const newComponent: EditorComponent = {
        id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: componentId,
        props: defaultProps,
        parentId: parentId || undefined,
        orderIndex: index,
        children: [],
        locked: false,
      };

      const newComponents = [...components];

      if (parentId === null) {
        // Add to root level at specific index
        newComponents.splice(index, 0, newComponent);
      } else {
        // Add as child to parent
        newComponents.push(newComponent);
      }

      setComponents(newComponents);
      saveToHistory(newComponents);

      // Auto-select the newly added component
      setSelectedComponentId(newComponent.id);
      setSelectedComponentType(newComponent.type);

      toast({
        title: "Component Added",
        description: `${componentId} has been added to the page`,
      });
    };

    window.addEventListener('addPrebuildComponentAtPosition', handleAddPrebuildComponentAtPosition as EventListener);

    return () => {
      window.removeEventListener('addPrebuildComponentAtPosition', handleAddPrebuildComponentAtPosition as EventListener);
    };
  }, [components, saveToHistory, toast]);

  // Handle section template selection from SectionPicker (Layer 2)
  const handleSectionSelect = useCallback((template: SectionTemplate) => {
    const newComponent: EditorComponent = {
      id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: template.blockType,
      props: { ...template.defaultProps, blockId: template.blockType },
      orderIndex: components.length,
      parentId: null,
    };

    const newComponents = [...components, newComponent];
    setComponents(newComponents);
    saveToHistory(newComponents);

    // Auto-select the newly added section
    setSelectedComponentId(newComponent.id);
    setSelectedComponentType(newComponent.type);

    toast({
      title: "Section Added",
      description: `${template.name} section has been added`,
    });
  }, [components, saveToHistory, toast]);

  const handleComponentUpdate = (id: string, propsOrUpdates: any) => {
    // Check if component is locked
    const componentToUpdate = components.find(comp => comp.id === id);
    if (componentToUpdate?.locked) {
      toast({
        title: "Action Denied",
        description: "Cannot edit locked component",
        variant: "destructive",
      });
      return;
    }

    // If propsOrUpdates has 'props' key, it's a full update object
    // Otherwise, treat it as props only (backwards compatibility)
    const updates = propsOrUpdates.props
      ? propsOrUpdates
      : { props: propsOrUpdates };

    const newComponents = components.map(comp =>
      comp.id === id ? { ...comp, ...updates } : comp
    );
    setComponents(newComponents);
    saveToHistory(newComponents);
  };

  const handleComponentDelete = (id: string) => {
    const componentToDelete = components.find(comp => comp.id === id);
    if (componentToDelete?.locked) {
      toast({
        title: "Action Denied",
        description: "Cannot delete locked component",
        variant: "destructive",
      });
      return;
    }

    const newComponents = components.filter(comp => comp.id !== id);
    setComponents(newComponents);
    saveToHistory(newComponents);
    if (selectedComponentId === id) {
      setSelectedComponentId(null);
      setSelectedComponentType('');
    }
  };

  const handlePropertyChange = (props: any) => {
    if (selectedComponentId) {
      handleComponentUpdate(selectedComponentId, props);
    }
  };

  // Add prebuild component from Components Library
  const handleAddPrebuildComponent = useCallback((componentId: string, defaultProps: any) => {
    // For reusable components, use blockId as type; for prebuild components, use componentId
    const componentType = defaultProps.blockId || componentId;

    const newComponent: EditorComponent = {
      id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: componentType, // Use blockId for reusable, componentId for prebuild
      props: defaultProps,
      children: [],
      locked: false,
      // Store reusableComponentId if this is a reusable component (has blockId in props)
      reusableComponentId: defaultProps.blockId ? componentId : undefined,
    };

    const newComponents = [...components, newComponent];
    setComponents(newComponents);
    saveToHistory(newComponents);

    // Auto-select the newly added component
    setSelectedComponentId(newComponent.id);
    setSelectedComponentType(newComponent.type);

    toast({
      title: "Component Added",
      description: `${componentType} has been added to the page`,
    });
  }, [components, saveToHistory, toast]);

  const handleMediaSelect = (media: Media) => {
    // Note: Media is now used within prebuild blocks via Properties Panel
    // Direct media-to-canvas functionality removed with basic elements
    toast({
      title: "Media Selected",
      description: "Use Properties Panel to add media to your blocks",
    });
  };

  const selectedComponent = components.find(comp => comp.id === selectedComponentId);
  const selectedComponentProps = selectedComponent ? selectedComponent.props : {};
  const isComponentLocked = selectedComponent?.locked || false;
  const selectedIndex = selectedComponentId ? components.findIndex(comp => comp.id === selectedComponentId) : -1;
  const canMoveUp = !!(selectedComponentId && selectedIndex > 0);
  const canMoveDown = !!(selectedComponentId && selectedIndex < components.length - 1 && selectedIndex !== -1);

  // SEO data handler
  const handleSEODataChange = useCallback((data: any) => {
    setSeoData(data);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <Card className="m-4 rounded-lg shadow-sm">
        <CardHeader className="p-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <h1 className="text-xl font-bold">Visual CMS Editor</h1>
              <div className="flex flex-col w-full md:w-auto">
                <Input
                  type="text"
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value)}
                  placeholder="Page Title"
                  className="font-bold text-lg bg-transparent border-none focus:outline-none focus:ring-0 p-0 h-auto"
                />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Slug:</span>
                  <Input
                    type="text"
                    value={pageSlug}
                    onChange={(e) => setPageSlug(e.target.value)}
                    placeholder="page-slug"
                    className="bg-transparent border-none focus:outline-none focus:ring-0 p-0 h-auto text-sm"
                  />
                </div>
              </div>
            </div>

            {/* SEO Button */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSEOExpanded(!isSEOExpanded)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                SEO
                {isSEOExpanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
              </Button>
            </div>

          </div>

        </CardHeader>

        {/* SEO Section - Collapsible */}
        <AnimatePresence>
          {isSEOExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent className="pt-4 border-t">
                <SEOPanel
                  seoData={seoData}
                  onSEODataChange={handleSEODataChange}
                  showHeader={showHeader}
                  showFooter={showFooter}
                  onShowHeaderChange={setShowHeader}
                  onShowFooterChange={setShowFooter}
                />
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Page Layout & Actions Bar */}
      <div className="mx-4 mb-4">
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              {/* Page Layout Controls - Left Side */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant={showHeader ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowHeader(!showHeader)}
                  className="flex items-center gap-2"
                >
                  {showHeader ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  Header
                </Button>
                <Button
                  variant={showFooter ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowFooter(!showFooter)}
                  className="flex items-center gap-2"
                >
                  {showFooter ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  Footer
                </Button>
                {/* Layout Mode - Segmented Control */}
                <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsFullWidth(false)}
                    className={`flex items-center gap-2 transition-all ${!isFullWidth
                      ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
                      : 'text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100'
                      }`}
                  >
                    <Square className="h-4 w-4" />
                    Boxed
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsFullWidth(true)}
                    className={`flex items-center gap-2 transition-all ${isFullWidth
                      ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
                      : 'text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100'
                      }`}
                  >
                    <Maximize2 className="h-4 w-4" />
                    Full Width
                  </Button>
                </div>

                {/* Category Selection */}
                <div className="flex items-center gap-2">
                  <Label htmlFor="category-select" className="text-sm whitespace-nowrap">Category:</Label>
                  <Select
                    value={selectedCategoryId || undefined}
                    onValueChange={(value) => setSelectedCategoryId(value || '')}
                  >
                    <SelectTrigger id="category-select" className="w-[180px] h-9">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Menu Assignment - Step 1: Select Menu */}
                <div className="flex items-center gap-2">
                  <Label htmlFor="menu-select" className="text-sm whitespace-nowrap">Menu:</Label>
                  <Select
                    value={selectedMenuIds[0] || undefined}
                    onValueChange={(value) => {
                      if (value) {
                        setSelectedMenuIds([value]);
                        setSelectedParentItemId(''); // Reset parent when menu changes
                        setSelectedPosition('last');
                      } else {
                        setSelectedMenuIds([]);
                        setSelectedParentItemId('');
                      }
                    }}
                  >
                    <SelectTrigger id="menu-select" className="w-[180px] h-9">
                      <SelectValue placeholder="Select menu" />
                    </SelectTrigger>
                    <SelectContent>
                      {menus.map((menu) => (
                        <SelectItem key={menu.id} value={menu.id}>
                          {menu.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Menu Assignment - Step 2: Hierarchical Placement */}
                {selectedMenuIds[0] && (() => {
                  const menuItems = getCurrentMenuItems();
                  const menuTree = buildMenuTree(menuItems);

                  // Recursive function to render menu items with indentation
                  const renderMenuItems = (items: (MenuItem & { children?: MenuItem[] })[], level: number = 0): React.ReactNode => {
                    return items.map((item) => (
                      <React.Fragment key={item.id}>
                        <SelectItem value={item.id}>
                          <span style={{ paddingLeft: `${level * 16}px` }}>
                            {level > 0 && '└─ '}{item.label}
                          </span>
                        </SelectItem>
                        {item.children && item.children.length > 0 && renderMenuItems(item.children, level + 1)}
                      </React.Fragment>
                    ));
                  };

                  return (
                    <>
                      {/* Parent Item Selection */}
                      <div className="flex items-center gap-2">
                        <Label htmlFor="parent-item-select" className="text-sm whitespace-nowrap">Place under:</Label>
                        <Select
                          value={selectedParentItemId || 'root'}
                          onValueChange={(value) => {
                            setSelectedParentItemId(value === 'root' ? '' : value);
                          }}
                        >
                          <SelectTrigger id="parent-item-select" className="w-[200px] h-9">
                            <SelectValue placeholder="Select parent" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="root">📁 Root (Main Level)</SelectItem>
                            {menuTree.length > 0 && renderMenuItems(menuTree)}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Position Control */}
                      <div className="flex items-center gap-2">
                        <Label htmlFor="position-select" className="text-sm whitespace-nowrap">Position:</Label>
                        <Select
                          value={selectedPosition}
                          onValueChange={(value: 'first' | 'last' | 'after') => {
                            setSelectedPosition(value);
                            if (value !== 'after') {
                              setSelectedAfterItemId('');
                            }
                          }}
                        >
                          <SelectTrigger id="position-select" className="w-[140px] h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="first">↑ First</SelectItem>
                            <SelectItem value="last">↓ Last</SelectItem>
                            <SelectItem value="after">→ After item</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* After Item Selection (only if position is 'after') */}
                      {selectedPosition === 'after' && (() => {
                        const siblings = menuItems.filter(item =>
                          selectedParentItemId ? item.parentId === selectedParentItemId : !item.parentId
                        );

                        return siblings.length > 0 ? (
                          <div className="flex items-center gap-2">
                            <Label htmlFor="after-item-select" className="text-sm whitespace-nowrap">After:</Label>
                            <Select
                              value={selectedAfterItemId || undefined}
                              onValueChange={setSelectedAfterItemId}
                            >
                              <SelectTrigger id="after-item-select" className="w-[160px] h-9">
                                <SelectValue placeholder="Select item" />
                              </SelectTrigger>
                              <SelectContent>
                                {siblings.map((item) => (
                                  <SelectItem key={item.id} value={item.id}>
                                    {item.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : null;
                      })()}

                      {/* Visual Preview of Menu Placement */}
                      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md border border-border">
                        <span className="text-xs font-medium text-muted-foreground">Preview:</span>
                        <span className="text-xs">
                          {pageTitle} → {' '}
                          {selectedParentItemId ? (
                            <>📁 {menuItems.find(i => i.id === selectedParentItemId)?.label || 'Parent'} / </>
                          ) : (
                            <>📁 Root / </>
                          )}
                          {selectedPosition === 'first' && '↑ First'}
                          {selectedPosition === 'last' && '↓ Last'}
                          {selectedPosition === 'after' && selectedAfterItemId && (
                            <>→ After "{menuItems.find(i => i.id === selectedAfterItemId)?.label}"</>
                          )}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Action Buttons - Right Side */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUndo}
                  disabled={historyIndex === 0}
                  className="flex items-center gap-2"
                >
                  <Undo2 className="h-4 w-4" />
                  Undo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRedo}
                  disabled={historyIndex === history.length - 1}
                  className="flex items-center gap-2"
                >
                  <Redo2 className="h-4 w-4" />
                  Redo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleLock}
                  disabled={!selectedComponentId}
                  className="flex items-center gap-2"
                >
                  {selectedComponent?.locked ? (
                    <>
                      <Unlock className="h-4 w-4" />
                      Unlock
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      Lock
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSavePage}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Draft
                </Button>

                {/* Section Picker - Layer 2 */}
                <SectionPicker
                  onSelect={handleSectionSelect}
                  trigger={
                    <Button variant="secondary" size="sm" className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add Section
                    </Button>
                  }
                />
                <Button
                  variant="default"
                  size="sm"
                  onClick={async () => {
                    if (!pageId) {
                      toast({
                        title: "Error",
                        description: "Please save the page first before publishing",
                        variant: "destructive",
                      });
                      return;
                    }
                    try {
                      await cmsService.publishPage(pageId);
                      toast({
                        title: "Success",
                        description: "Page published successfully!",
                      });
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Failed to publish page",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Publish
                </Button>

                {/* Preview Mode Toggle */}
                <div className="flex items-center gap-1 border rounded-md p-1">
                  <Button
                    variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPreviewMode('desktop')}
                    className="h-7 px-2"
                    title="Desktop Preview"
                  >
                    <Monitor className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={previewMode === 'tablet' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPreviewMode('tablet')}
                    className="h-7 px-2"
                    title="Tablet Preview"
                  >
                    <Tablet className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPreviewMode('mobile')}
                    className="h-7 px-2"
                    title="Mobile Preview"
                  >
                    <Smartphone className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  size="sm"
                  variant={isPreviewMode ? "default" : "outline"}
                  onClick={handleTogglePreview}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  {isPreviewMode ? "Exit Preview" : "Preview"}
                </Button>

                <Button
                  size="sm"
                  variant="default"
                  onClick={handleViewLive}
                  className="flex items-center gap-2"
                  disabled={!pageSlug}
                  title={!pageSlug ? "Save page first to view live" : "Open published page in new tab"}
                >
                  <ExternalLink className="h-4 w-4" />
                  View Live
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      {editorMode === 'simple' ? (
        /* Simple Editor Mode - Clean 3-panel layout */
        <SimpleEditorContent
          sections={components.map((c, i) => ({
            id: c.id,
            blockType: (c as any).blockId || c.props?.blockId || c.type,
            props: c.props || {},
            orderIndex: c.orderIndex ?? i,
          }))}
          onSectionsChange={(newSections) => {
            const newComponents = newSections.map(s => ({
              id: s.id,
              type: s.blockType,
              props: { ...s.props, blockId: s.blockType },
              orderIndex: s.orderIndex,
              parentId: null,
            }));
            setComponents(newComponents);
            saveToHistory(newComponents);
          }}
          className="flex-1 mx-4 mb-4"
        />
      ) : (
        /* Advanced Editor Mode - Legacy full editor */
        <div className="flex-1 flex flex-col md:flex-row gap-4 mx-4 mb-4 overflow-hidden">
          {/* Left Panel - Component Library, History, and Media */}
          <AnimatePresence>
            {isLeftPanelOpen && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full md:w-80 flex-shrink-0 flex flex-col gap-4"
              >
                <Card className="flex-shrink-0">
                  <div className="p-3 border-b flex justify-between items-center">
                    <h3 className="font-medium">Elements & Templates</h3>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => setIsTreeSidebarOpen(!isTreeSidebarOpen)}
                      >
                        <Network className="h-4 w-4" />
                        <span className="hidden md:inline">Tree View</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="md:hidden"
                        onClick={() => setIsLeftPanelOpen(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="templates">
                        <Package className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Components</span>
                        <span className="sm:hidden">Blocks</span>
                      </TabsTrigger>
                      <TabsTrigger value="media">
                        <ImageIcon className="h-4 w-4 mr-1" />
                        Media
                      </TabsTrigger>
                      <TabsTrigger value="history">
                        <HistoryIcon className="h-4 w-4 mr-1" />
                        History
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="templates" className="mt-0 h-[calc(100vh-338px)] overflow-hidden">
                      <ComponentsLibrary
                        onAddComponent={handleAddPrebuildComponent}
                      />
                    </TabsContent>
                    <TabsContent value="media" className="mt-0 h-[calc(100vh-338px)] overflow-hidden">
                      <MediaLibrary onMediaSelect={handleMediaSelect} />
                    </TabsContent>
                    <TabsContent value="history" className="mt-0 h-[calc(100vh-338px)] overflow-hidden">
                      <HistoryPanel
                        history={history}
                        currentIndex={historyIndex}
                        onHistorySelect={handleHistorySelect}
                      />
                    </TabsContent>
                  </Tabs>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Editor Canvas */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Mobile menu buttons */}
            {(!isLeftPanelOpen || !isRightPanelOpen) && (
              <div className="flex justify-end gap-2 mb-2 md:hidden">
                {!isLeftPanelOpen && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsLeftPanelOpen(true)}
                  >
                    <MenuIcon className="h-4 w-4" />
                  </Button>
                )}
                {!isRightPanelOpen && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsRightPanelOpen(true)}
                  >
                    <MenuIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
            <Card className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-auto bg-muted/20">
                {/* Preview Mode Wrapper */}
                <div className={`h-full flex items-center justify-center ${isPreviewMode ? 'p-8' : ''}`}>
                  <div
                    className={`
                    ${isPreviewMode ? 'bg-background shadow-2xl rounded-lg overflow-hidden transition-all duration-300' : 'w-full h-full'}
                    ${previewMode === 'desktop' ? 'w-full max-w-[1920px]' : ''}
                    ${previewMode === 'tablet' ? 'w-[768px] h-[1024px]' : ''}
                    ${previewMode === 'mobile' ? 'w-[375px] h-[667px]' : ''}
                  `}
                    style={{
                      minHeight: isPreviewMode && previewMode === 'desktop' ? '800px' : undefined,
                    }}
                  >
                    {isPreviewMode && (
                      <div className="bg-muted/50 px-4 py-2 border-b flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {previewMode === 'desktop' && <Monitor className="h-4 w-4" />}
                          {previewMode === 'tablet' && <Tablet className="h-4 w-4" />}
                          {previewMode === 'mobile' && <Smartphone className="h-4 w-4" />}
                          <span className="text-sm font-medium capitalize">{previewMode} Preview</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {previewMode === 'desktop' && 'Full Width'}
                          {previewMode === 'tablet' && '768 × 1024'}
                          {previewMode === 'mobile' && '375 × 667'}
                        </div>
                      </div>
                    )}
                    <div className={`${isPreviewMode ? 'overflow-auto' : ''} h-full`}>
                      <EditorCanvas
                        components={components as any}
                        onComponentUpdate={handleComponentUpdate}
                        onComponentDelete={handleComponentDelete}
                        onComponentSelect={(id, type) => {
                          setSelectedComponentId(id);
                          if (type) {
                            setSelectedComponentType(type);
                          }
                        }}
                        selectedComponentId={selectedComponentId}
                        onMoveUp={handleMoveUp}
                        onMoveDown={handleMoveDown}
                        isPreviewMode={isPreviewMode}
                        isFullWidth={isFullWidth}
                        onReorderComponents={(componentId, newParentId, newIndex) => {
                          // Handle nested component reordering
                          const newComponents = [...components];
                          const componentIndex = newComponents.findIndex(c => c.id === componentId);

                          if (componentIndex !== -1) {
                            const component = newComponents[componentIndex];
                            component.parentId = newParentId;
                            component.orderIndex = newIndex;

                            setComponents(newComponents);
                            saveToHistory(newComponents);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Properties Panel - Only shown when a component is selected */}
          <AnimatePresence>
            {isRightPanelOpen && selectedComponentId && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="w-full md:w-80 flex-shrink-0 flex flex-col gap-4"
              >
                <Card className="flex-shrink-0 h-full flex flex-col">
                  <div className="p-3 border-b flex justify-between items-center">
                    <h3 className="font-medium">Properties</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="md:hidden"
                      onClick={() => setIsRightPanelOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-auto">
                    <PropertiesPanel
                      componentType={selectedComponentType}
                      componentProps={selectedComponentProps}
                      onPropsChange={handlePropertyChange}
                      isLocked={isComponentLocked}
                      onMoveUp={canMoveUp ? handleMoveUp : undefined}
                      onMoveDown={canMoveDown ? handleMoveDown : undefined}
                      canMoveUp={canMoveUp}
                      canMoveDown={canMoveDown}
                      reusableComponentId={selectedComponent?.reusableComponentId}
                    />
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Resizable Component Tree Sidebar */}
      <AnimatePresence>
        {isTreeSidebarOpen && (
          <>
            {/* Overlay - only show when unpinned in docked mode or when dragging in floating mode */}
            {((!isTreePinned && isDocked) || (isDragging && !isDocked)) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20 z-40"
                onClick={() => !isDragging && setIsTreeSidebarOpen(false)}
              />
            )}

            {/* Sidebar */}
            <motion.div
              initial={isDocked ? { x: '100%' } : { opacity: 0, scale: 0.95 }}
              animate={isDocked ? { x: 0 } : { opacity: 1, scale: 1 }}
              exit={isDocked ? { x: '100%' } : { opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`${isDocked
                ? 'fixed right-0 top-0 bottom-0'
                : 'fixed'
                } bg-background border-2 ${isDocked ? 'border-l border-border' : 'border-primary rounded-lg shadow-2xl'
                } z-50 flex ${isDragging ? 'cursor-move' : ''}`}
              style={
                isDocked
                  ? { width: `${treeSidebarWidth}px` }
                  : {
                    width: `${treeSidebarWidth}px`,
                    left: `${floatingPosition.x}px`,
                    top: `${floatingPosition.y}px`,
                    maxHeight: '80vh',
                  }
              }
            >
              {/* Resize Handle - Left edge for docked, right edge for floating */}
              <div
                className={`absolute ${isDocked ? 'left-0' : 'right-0'
                  } top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 active:bg-primary group`}
                onMouseDown={handleResizeStart}
              >
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>

              {/* Sidebar Content */}
              <div className={`flex-1 flex flex-col ${isDocked ? 'ml-4' : 'mr-4'}`}>
                {/* Header - Draggable in floating mode */}
                <div
                  className={`flex items-center justify-between p-4 border-b ${!isDocked ? 'cursor-move' : ''
                    }`}
                  onMouseDown={!isDocked ? handleDragStart : undefined}
                >
                  <h3 className="font-semibold text-lg">Component Tree</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleToggleDock}
                      className="h-8 w-8 p-0"
                      title={isDocked ? 'Detach to floating mode' : 'Dock to right edge'}
                    >
                      {isDocked ? (
                        <Maximize2 className="h-4 w-4" />
                      ) : (
                        <Minimize2 className="h-4 w-4" />
                      )}
                    </Button>
                    {isDocked && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsTreePinned(!isTreePinned)}
                        className="h-8 w-8 p-0"
                        title={isTreePinned ? 'Unpin sidebar' : 'Pin sidebar'}
                      >
                        {isTreePinned ? (
                          <PinOff className="h-4 w-4" />
                        ) : (
                          <Pin className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsTreeSidebarOpen(false)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Tree Content */}
                <div className="flex-1 overflow-hidden">
                  <ComponentTree
                    components={components as any}
                    selectedComponentId={selectedComponentId}
                    onSelectComponent={(id) => {
                      setSelectedComponentId(id);
                      if (id) {
                        const comp = components.find(c => c.id === id);
                        if (comp) {
                          setSelectedComponentType(comp.type);
                        }
                      } else {
                        setSelectedComponentType('');
                      }
                    }}
                    onDeleteComponent={handleComponentDelete}
                    onUpdateComponent={handleComponentUpdate}
                    onReorderComponents={(componentId, newParentId, newIndex) => {
                      const newComponents = [...components];
                      const componentIndex = newComponents.findIndex(c => c.id === componentId);

                      if (componentIndex !== -1) {
                        const [component] = newComponents.splice(componentIndex, 1);
                        component.parentId = newParentId;
                        component.orderIndex = newIndex;

                        setComponents(newComponents);
                        saveToHistory(newComponents);
                      }
                    }}
                    className="h-full"
                  />
                </div>

                {/* Footer - Resize Indicator */}
                <div className="p-2 border-t text-xs text-muted-foreground text-center">
                  {treeSidebarWidth}px {isResizing && '(resizing...)'} {isDragging && '(moving...)'}
                  {!isDocked && ` • Floating mode`}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VisualEditor;