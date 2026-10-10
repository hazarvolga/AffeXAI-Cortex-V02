'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ComponentLibrary } from './component-library';
import { EditorCanvas } from './editor-canvas';
import { PropertiesPanel } from './properties-panel';
import { HistoryPanel } from './history-panel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { MediaLibrary } from './media-library';
import { Media } from '@/lib/media/types';
import { cmsService } from '@/lib/cms/cms-service';
import ComponentFactory from '@/components/cms/component-factory';
import type { CreateComponentDto } from '@/lib/cms/cms-service';
import { useActivityTracking } from '@/hooks/use-cms-tracking';
import { 
  Undo2, 
  Redo2, 
  Lock, 
  Unlock, 
  Save, 
  Eye, 
  Upload, 
  Search,
  Menu,
  X,
  Copy,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutOptionsPanel } from './layout-options-panel';
import { DebugPanel } from './debug-panel';
import { TemplateManager } from './template-manager';
import { EditorProvider } from './editor-context'; // Import EditorProvider
import { LayoutComponent } from './layout-component'; // Import LayoutComponent

interface EditorComponent {
  id: string;
  type: string;
  props: any;
  children?: EditorComponent[];
  locked?: boolean;
}

// Define history item type with more detailed information
interface HistoryItem {
  components: EditorComponent[];
  timestamp: number;
  action: string; // Description of what action was performed
}

interface LayoutOptions {
  showHeader?: boolean;
  showFooter?: boolean;
  fullWidth?: boolean;
  backgroundColor?: string;
  showTitle?: boolean;
}

interface VisualEditorProps {
  pageId?: string;
}

export const VisualEditor: React.FC<VisualEditorProps> = ({ pageId }) => {
  const { toast } = useToast();
  const trackActivity = useActivityTracking();
  const [components, setComponents] = useState<EditorComponent[]>([]);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [selectedComponentType, setSelectedComponentType] = useState<string>('');
  const [history, setHistory] = useState<HistoryItem[]>([
    { 
      components: [], 
      timestamp: Date.now(), 
      action: "Initial state" 
    }
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [pageTitle, setPageTitle] = useState<string>('');
  const [pageSlug, setPageSlug] = useState<string>('');
  const [pageDescription, setPageDescription] = useState<string>('');
  const [layoutOptions, setLayoutOptions] = useState<LayoutOptions>({
    showHeader: true,
    showFooter: true,
    fullWidth: false,
    backgroundColor: 'bg-background',
    showTitle: true
  });
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('components');
  const [isPreviewMode, setIsPreviewMode] = useState(false); // New state for preview mode

  // Category and Menu states
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [menus, setMenus] = useState<any[]>([]);

  // Refs for tracking state changes
  const lastActionRef = useRef<string>("");
  const isSavingRef = useRef<boolean>(false);

  // Save state to history with action description
  const saveToHistory = useCallback((newComponents: EditorComponent[], action: string) => {
    // Don't save to history if we're in the middle of saving
    if (isSavingRef.current) return;
    
    // If this is the same action as the last one, update the last history item instead of creating a new one
    if (action === lastActionRef.current && historyIndex === history.length - 1) {
      const newHistory = [...history];
      newHistory[historyIndex] = { 
        components: [...newComponents], 
        timestamp: Date.now(), 
        action 
      };
      setHistory(newHistory);
      return;
    }
    
    // Otherwise, add a new history item
    const newHistory = [...history.slice(0, historyIndex + 1), { 
      components: [...newComponents], 
      timestamp: Date.now(), 
      action 
    }];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    lastActionRef.current = action;
  }, [history, historyIndex]);

  // Move component up in the list
  const handleMoveUp = useCallback(() => {
    if (!selectedComponentId) return;
    
    const selectedIndex = components.findIndex(comp => comp.id === selectedComponentId);
    if (selectedIndex <= 0) return;
    
    const newComponents = [...components];
    [newComponents[selectedIndex], newComponents[selectedIndex - 1]] = 
    [newComponents[selectedIndex - 1], newComponents[selectedIndex]];
    
    setComponents(newComponents);
    saveToHistory(newComponents, `Moved component up: ${selectedComponentId}`);
  }, [components, selectedComponentId, saveToHistory]);

  // Move component down in the list
  const handleMoveDown = useCallback(() => {
    if (!selectedComponentId) return;
    
    const selectedIndex = components.findIndex(comp => comp.id === selectedComponentId);
    if (selectedIndex === -1 || selectedIndex >= components.length - 1) return;
    
    const newComponents = [...components];
    [newComponents[selectedIndex], newComponents[selectedIndex + 1]] = 
    [newComponents[selectedIndex + 1], newComponents[selectedIndex]];
    
    setComponents(newComponents);
    saveToHistory(newComponents, `Moved component down: ${selectedComponentId}`);
  }, [components, selectedComponentId, saveToHistory]);

  // Handle layout options change
  const handleLayoutOptionsChange = useCallback((newLayoutOptions: Partial<typeof layoutOptions>) => {
    setLayoutOptions(prev => ({ ...prev, ...newLayoutOptions }));
    // Save to history when layout options change
    saveToHistory(components, "Updated layout options");
  }, [components, saveToHistory]);

  // Load page data if pageId is provided
  useEffect(() => {
    if (pageId) {
      const loadPageData = async () => {
        try {
          const page = await cmsService.getPage(pageId);
          setPageTitle(page.title);
          setPageSlug(page.slug);
          setPageDescription(page.description || '');
          setSelectedCategoryId(page.categoryId || '');

          if (page.layoutOptions) {
            setLayoutOptions({
              showHeader: page.layoutOptions.showHeader ?? true,
              showFooter: page.layoutOptions.showFooter ?? true,
              fullWidth: page.layoutOptions.fullWidth ?? false,
              backgroundColor: page.layoutOptions.backgroundColor ?? 'bg-background',
              showTitle: page.layoutOptions.showTitle ?? true
            });
          }
          
          if (page.components && page.components.length > 0) {
            console.log('Loaded components from page response:', page.components);
            setComponents(page.components);
            setHistory([{
              components: page.components,
              timestamp: Date.now(),
              action: "Loaded page data"
            }]);
            setHistoryIndex(0);
          } else {
            try {
              const pageComponents = await cmsService.getComponents(pageId);
              console.log('Loaded components separately:', pageComponents);
              setComponents(pageComponents);
              setHistory([{
                components: pageComponents,
                timestamp: Date.now(),
                action: "Loaded components"
              }]);
              setHistoryIndex(0);
            } catch (componentError) {
              console.error('Failed to load components:', componentError);
              setComponents([]);
              setHistory([{
                components: [],
                timestamp: Date.now(),
                action: "Initialized with empty components"
              }]);
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

  // Load categories and menus
  useEffect(() => {
    const loadCategoriesAndMenus = async () => {
      try {
        const [categoriesData, menusData] = await Promise.all([
          cmsService.getCategories(),
          cmsService.getMenus(),
        ]);
        setCategories(categoriesData);
        setMenus(menusData);

        // If we have a pageId, check which menus contain this page
        if (pageId && menusData.length > 0) {
          const pageMenuIds: string[] = [];
          menusData.forEach(menu => {
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

  // Undo functionality
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const prevState = history[newIndex];
      setComponents(prevState.components);
      
      toast({
        title: "Undo",
        description: `Reverted: ${prevState.action}`,
      });
      
      if (selectedComponentId && !prevState.components.find(c => c.id === selectedComponentId)) {
        setSelectedComponentId(null);
        setSelectedComponentType('');
      }
    }
  }, [history, historyIndex, selectedComponentId, toast]);

  // Redo functionality
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const nextState = history[newIndex];
      setComponents(nextState.components);
      
      toast({
        title: "Redo",
        description: `Reapplied: ${nextState.action}`,
      });
      
      if (selectedComponentId && !nextState.components.find(c => c.id === selectedComponentId)) {
        setSelectedComponentId(null);
        setSelectedComponentType('');
      }
    }
  }, [history, historyIndex, selectedComponentId, toast]);

  // Jump to specific history item
  const handleHistorySelect = useCallback((index: number) => {
    if (index >= 0 && index < history.length) {
      setHistoryIndex(index);
      const state = history[index];
      setComponents(state.components);
      
      toast({
        title: "History Navigation",
        description: `Loaded state: ${state.action}`,
      });
      
      if (selectedComponentId && !state.components.find(c => c.id === selectedComponentId)) {
        setSelectedComponentId(null);
        setSelectedComponentType('');
      }
    }
  }, [history, selectedComponentId, toast]);

  // Duplicate selected component
  const handleDuplicate = useCallback(() => {
    if (selectedComponentId) {
      const componentToDuplicate = components.find(comp => comp.id === selectedComponentId);
      if (componentToDuplicate) {
        const newComponent = {
          ...componentToDuplicate,
          id: `comp-${Date.now()}`,
          props: {
            ...componentToDuplicate.props,
            content: componentToDuplicate.props.content ? `${componentToDuplicate.props.content} (copy)` : undefined
          }
        };
        const newComponents = [...components, newComponent];
        setComponents(newComponents);
        saveToHistory(newComponents, `Duplicated component: ${selectedComponentId}`);
        setSelectedComponentId(newComponent.id);
        setSelectedComponentType(newComponent.type);
        
        toast({
          title: "Component Duplicated",
          description: "Component has been duplicated",
        });
      }
    }
  }, [components, selectedComponentId, saveToHistory, toast]);

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
      saveToHistory(newComponents, `Deleted component: ${selectedComponentId}`);
      setSelectedComponentId(null);
      setSelectedComponentType('');
      
      toast({
        title: "Component Deleted",
        description: "Component has been deleted",
      });
    }
  }, [components, selectedComponentId, saveToHistory, toast]);

  // Toggle component lock
  const handleToggleLock = useCallback(() => {
    if (selectedComponentId) {
      const newComponents = components.map(comp => 
        comp.id === selectedComponentId ? { ...comp, locked: !comp.locked } : comp
      );
      setComponents(newComponents);
      saveToHistory(newComponents, `Toggled lock for component: ${selectedComponentId}`);
      const isLocked = components.find(c => c.id === selectedComponentId)?.locked;
      toast({
        title: "Component Updated",
        description: `Component ${isLocked ? 'unlocked' : 'locked'}`,
      });
    }
  }, [components, selectedComponentId, saveToHistory, toast]);

  // Toggle preview mode
  const handleTogglePreview = useCallback(() => {
    setIsPreviewMode(!isPreviewMode);
    toast({
      title: "Preview Mode",
      description: `Preview mode ${!isPreviewMode ? 'enabled' : 'disabled'}`,
    });
  }, [isPreviewMode, toast]);

  // Save page
  const handleSavePage = useCallback(async () => {
    if (!pageId) {
      toast({
        title: "Error",
        description: "No page ID provided",
        variant: "destructive",
      });
      return;
    }
    
    try {
      isSavingRef.current = true;
      
      try {
        const page = await cmsService.getPage(pageId);
        console.log('Page exists:', page);
      } catch (error) {
        console.error('Page not found:', error);
        toast({
          title: "Error",
          description: "Page not found. Please make sure you're editing a valid page.",
          variant: "destructive",
        });
        isSavingRef.current = false;
        return;
      }
      
      await cmsService.updatePage(pageId, {
        title: pageTitle,
        slug: pageSlug,
        description: pageDescription,
        layoutOptions: layoutOptions,
        categoryId: selectedCategoryId || undefined,
      });

      // Track edit activity
      await trackActivity('edit', pageId, pageTitle);

      // Handle menu assignment
      // Note: For simplicity, we're handling single menu assignment
      // If a menu is selected, ensure the page is in that menu
      if (selectedMenuIds.length > 0 && selectedMenuIds[0]) {
        const menuId = selectedMenuIds[0];
        try {
          // Check if page already exists in this menu
          const menu = await cmsService.getMenu(menuId);
          const existingItem = menu.items?.find(item => item.pageId === pageId);

          if (!existingItem) {
            // Add page to menu
            await cmsService.addPageToMenu(menuId, pageId, pageTitle);
          }
        } catch (error) {
          console.error('Failed to assign page to menu:', error);
          // Don't fail the entire save operation if menu assignment fails
        }
      }

      const existingComponents = await cmsService.getComponents(pageId);
      console.log('Existing components:', existingComponents);
      
      const componentIds = components.map(c => c.id);
      const componentsToDelete = existingComponents.filter(c => !componentIds.includes(c.id));
      console.log('Components to delete:', componentsToDelete);
      await Promise.all(componentsToDelete.map(c => cmsService.deleteComponent(c.id)));
      
      console.log('Components to save:', components);
      
      const savedComponents: any[] = [];
      
      await Promise.all(components.map(async (component) => {
        const existingComponent = existingComponents.find(c => c.id === component.id);
        
        const componentData: CreateComponentDto = {
          pageId,
          type: component.type as 'text' | 'button' | 'image' | 'container' | 'card' | 'grid' | 'block',
          props: component.props,
          orderIndex: 0,
        };
        
        console.log('Saving component:', componentData);
        
        if (existingComponent) {
          try {
            const result = await cmsService.updateComponent(component.id, componentData);
            console.log(`Updated component ${component.id}:`, result);
            savedComponents.push(result);
          } catch (error) {
            console.error(`Failed to update component ${component.id}:`, error);
            throw error;
          }
        } else {
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
      
      // Add save action to history
      saveToHistory(components, "Saved page");
      
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
    } finally {
      isSavingRef.current = false;
    }
  }, [pageId, pageTitle, pageSlug, pageDescription, layoutOptions, components, saveToHistory, toast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if we're in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl/Cmd + Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }

      // Ctrl/Cmd + Shift + Z for redo
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Z') {
        e.preventDefault();
        handleRedo();
      }

      // Delete key for deleting selected component
      if (e.key === 'Delete' && selectedComponentId) {
        e.preventDefault();
        handleDelete();
      }

      // Ctrl/Cmd + D for duplicating component
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedComponentId) {
        e.preventDefault();
        handleDuplicate();
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
      }

      // Ctrl/Cmd + Shift + Arrow Down to move component down
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'ArrowDown' && selectedComponentId) {
        e.preventDefault();
        handleMoveDown();
      }

      // Ctrl/Cmd + P for preview mode
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handleTogglePreview();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    handleUndo, 
    handleRedo, 
    handleDelete, 
    handleDuplicate,
    handleToggleLock, 
    handleMoveUp, 
    handleMoveDown,
    handleTogglePreview,
    selectedComponentId
  ]);

  const handleComponentSelect = (componentType: string) => {
    // Use the ComponentFactory to create a new component
    const newComponent = ComponentFactory.createComponent(componentType as any);
    
    const newComponents = [...components, newComponent];
    setComponents(newComponents);
    saveToHistory(newComponents, `Added new ${componentType} component`);
    setSelectedComponentId(newComponent.id);
    setSelectedComponentType(newComponent.type);
  };

  const handleBlockSelect = (block: any) => {
    // Use the ComponentFactory to create a new block component
    const newComponent = ComponentFactory.createBlockComponent(block.id);
    
    const newComponents = [...components, newComponent];
    setComponents(newComponents);
    saveToHistory(newComponents, `Added block: ${block.name}`);
    setSelectedComponentId(newComponent.id);
    setSelectedComponentType('block');
    
    toast({
      title: "Block Added",
      description: `${block.name} has been added to the canvas`,
    });
  };

  const handleComponentUpdate = (id: string, props: any) => {
    const componentToUpdate = components.find(comp => comp.id === id);
    if (componentToUpdate?.locked) {
      toast({
        title: "Action Denied",
        description: "Cannot edit locked component",
        variant: "destructive",
      });
      return;
    }
    
    const newComponents = components.map(comp => 
      comp.id === id ? { ...comp, props } : comp
    );
    setComponents(newComponents);
    // We don't save to history here to avoid too many history items for small changes
    // History will be saved when user performs explicit actions
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
    saveToHistory(newComponents, `Deleted component: ${id}`);
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

  const getDefaultProps = (type: string): any => {
    switch (type) {
      case 'text':
        return {
          content: 'New text component',
          variant: 'body',
          align: 'left',
        };
      case 'button':
        return {
          text: 'Click me',
          variant: 'default',
          size: 'default',
        };
      case 'image':
        return {
          src: '/placeholder-image.jpg',
          alt: 'Placeholder image',
        };
      case 'container':
        return {
          padding: 'md',
          background: 'none',
        };
      case 'card':
        return {
          padding: 'md',
          rounded: 'lg',
        };
      case 'grid':
        return {
          columns: 3,
          gap: 'md',
        };
      default:
        return {};
    }
  };

  const handleMediaSelect = (media: Media) => {
    // Use the ComponentFactory to create a new image component
    const newComponent = ComponentFactory.createImageComponent(
      media.url,
      media.altText || media.originalName,
      {
        caption: media.title || '',
      }
    );

    const newComponents = [...components, newComponent];
    setComponents(newComponents);
    saveToHistory(newComponents, `Added image: ${media.title}`);
    setSelectedComponentId(newComponent.id);
    setSelectedComponentType('image');
    
    toast({
      title: "Media Added",
      description: "Image added to the canvas",
    });
  };

  const selectedComponent = components.find(comp => comp.id === selectedComponentId);
  const selectedComponentProps = selectedComponent ? selectedComponent.props : {};
  const isComponentLocked = selectedComponent?.locked || false;
  const selectedIndex = selectedComponentId ? components.findIndex(comp => comp.id === selectedComponentId) : -1;
  const canMoveUp = !!(selectedComponentId && selectedIndex > 0);
  const canMoveDown = !!(selectedComponentId && selectedIndex < components.length - 1 && selectedIndex !== -1);

  const [isMobileToolbarOpen, setIsMobileToolbarOpen] = useState(false);

  // Handle loading a template
  const handleLoadTemplate = useCallback((template: any) => {
    setComponents(template.components);
    setLayoutOptions(template.layoutOptions);
    saveToHistory(template.components, `Loaded template: ${template.name}`);
    
    toast({
      title: "Template Loaded",
      description: `${template.name} has been loaded successfully`,
    });
  }, [saveToHistory, toast]);
  
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
            
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2 flex-wrap">
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
                onClick={handleDuplicate}
                disabled={!selectedComponentId}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Duplicate
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDelete}
                disabled={!selectedComponentId}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
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
              <Button 
                variant={isPreviewMode ? "default" : "outline"} 
                size="sm" 
                onClick={handleTogglePreview}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                {isPreviewMode ? "Exit Preview" : "Preview"}
              </Button>
              <Button variant="default" size="sm" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Publish
              </Button>
            </div>
            
            {/* Mobile Menu Button */}
            <Button 
              variant="outline" 
              size="sm"
              className="md:hidden flex items-center gap-2"
              onClick={() => setIsMobileToolbarOpen(!isMobileToolbarOpen)}
            >
              {isMobileToolbarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              Actions
            </Button>
          </div>
          
          {/* Mobile Actions - Collapsible */}
          <AnimatePresence>
            {isMobileToolbarOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden mt-4 flex flex-wrap gap-2"
              >
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
                  onClick={handleDuplicate}
                  disabled={!selectedComponentId}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Duplicate
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDelete}
                  disabled={!selectedComponentId}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSavePage}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save
                </Button>
                <Button 
                  variant={isPreviewMode ? "default" : "outline"} 
                  size="sm" 
                  onClick={handleTogglePreview}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  {isPreviewMode ? "Exit" : "Preview"}
                </Button>
                <Button variant="default" size="sm" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Publish
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardHeader>
      </Card>

      {/* Layout Options and Template Manager Cards - Three Column Layout */}
      <div className="m-4 mt-0 flex flex-col md:flex-row gap-4">
        {/* Layout Options Card */}
        <Card className="flex-1 rounded-lg shadow-sm">
          <CardContent className="p-4">
            <LayoutComponent
              showHeader={layoutOptions.showHeader}
              showFooter={layoutOptions.showFooter}
              fullWidth={layoutOptions.fullWidth}
              backgroundColor={layoutOptions.backgroundColor}
              showTitle={layoutOptions.showTitle}
              onLayoutChange={handleLayoutOptionsChange}
            />
          </CardContent>
        </Card>

        {/* Category and Menu Management Card */}
        <Card className="flex-1 rounded-lg shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Category & Menu</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {/* Category Selection */}
            <div className="space-y-2">
              <Label htmlFor="category-select" className="text-xs">Category</Label>
              <Select
                value={selectedCategoryId}
                onValueChange={setSelectedCategoryId}
              >
                <SelectTrigger id="category-select" className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Menu Assignment */}
            <div className="space-y-2">
              <Label htmlFor="menu-select" className="text-xs">Assign to Menu</Label>
              <Select
                value={selectedMenuIds[0] || ''}
                onValueChange={(value) => {
                  if (value) {
                    setSelectedMenuIds([value]);
                  } else {
                    setSelectedMenuIds([]);
                  }
                }}
              >
                <SelectTrigger id="menu-select" className="w-full">
                  <SelectValue placeholder="Select menu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Menu</SelectItem>
                  {menus.map((menu) => (
                    <SelectItem key={menu.id} value={menu.id}>
                      {menu.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Template Manager Card */}
        <Card className="flex-1 rounded-lg shadow-sm">
          <CardContent className="p-4">
            <TemplateManager
              onSaveTemplate={(template) => {
                // In a real implementation, you would save to a database
                console.log('Save template:', template);
              }}
              onLoadTemplate={handleLoadTemplate}
              currentComponents={components}
              currentLayoutOptions={layoutOptions}
            />
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 mx-4 mb-4 overflow-hidden">
        {/* Left Panel - Component Library, History, and Media */}
        <AnimatePresence>
          {isLeftPanelOpen && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full md:w-[600px] flex-shrink-0 flex flex-col gap-4"
            >
              <Card className="flex-shrink-0">
                <div className="p-3 border-b flex justify-between items-center">
                  <h3 className="font-medium">Components & Blocks</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="md:hidden"
                    onClick={() => setIsLeftPanelOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="components">Components</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                    <TabsTrigger value="debug">Debug</TabsTrigger>
                  </TabsList>
                  <TabsContent value="components" className="mt-0 h-[calc(100vh-200px)] overflow-hidden">
                    <ComponentLibrary 
                      onComponentSelect={handleComponentSelect}
                      onBlockSelect={handleBlockSelect}
                      displayMode="blocks" // Show only prebuilt blocks in the Components tab
                    />
                  </TabsContent>
                  <TabsContent value="media" className="mt-0 h-[calc(100vh-200px)] overflow-hidden">
                    <MediaLibrary onMediaSelect={handleMediaSelect} />
                  </TabsContent>
                  <TabsContent value="blocks" className="mt-0 h-[calc(100vh-200px)] overflow-hidden">
                    <ComponentLibrary 
                      onComponentSelect={handleComponentSelect}
                      onBlockSelect={handleBlockSelect}
                      displayMode="blocks" // Show only prebuilt blocks in the Blocks tab as well
                    />
                  </TabsContent>
                  <TabsContent value="history" className="mt-0 h-[calc(100vh-200px)] overflow-hidden">
                    <HistoryPanel 
                      history={history} 
                      currentIndex={historyIndex}
                      onHistorySelect={handleHistorySelect}
                    />
                  </TabsContent>
                  <TabsContent value="debug" className="mt-0 h-[calc(100vh-200px)] overflow-hidden">
                    <DebugPanel 
                      pageData={{
                        id: pageId,
                        title: pageTitle,
                        slug: pageSlug,
                        description: pageDescription,
                      }}
                      components={components}
                      layoutOptions={layoutOptions}
                    />
                  </TabsContent>
                </Tabs>

              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Editor Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Editor Canvas</h2>
            <div className="flex gap-2">
              {!isLeftPanelOpen && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsLeftPanelOpen(true)}
                  className="md:hidden"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              )}
              {!isRightPanelOpen && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsRightPanelOpen(true)}
                  className="md:hidden"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <Card className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-auto">
              {/* Wrap EditorCanvas with EditorProvider */}
              <EditorProvider onComponentUpdate={handleComponentUpdate}>
                <EditorCanvas
                  components={components}
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
                />
              </EditorProvider>
            </div>
          </Card>
        </div>

        {/* Properties Panel */}
        <AnimatePresence>
          {isRightPanelOpen && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
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
                    // Pass layout options and change handler when no component is selected
                    layoutOptions={!selectedComponentId ? layoutOptions : undefined}
                    onLayoutOptionsChange={!selectedComponentId ? handleLayoutOptionsChange : undefined}
                  />
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VisualEditor;