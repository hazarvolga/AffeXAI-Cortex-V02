'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { ComponentLibrary } from './component-library';
import { EditorCanvas } from './editor-canvas';
import { PropertiesPanel } from './properties-panel';
import { HistoryPanel } from './history-panel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { MediaLibrary } from './media-library';
import { Media } from '@/lib/media/types';
import { cmsService } from '@/lib/cms/cms-service';

interface EditorComponent {
  id: string;
  type: string;
  props: any;
  children?: EditorComponent[];
  locked?: boolean; // Add locked property
}

// Define history item type
interface HistoryItem {
  components: EditorComponent[];
  timestamp: number;
}

interface VisualEditorProps {
  pageId?: string;
}

export const VisualEditor: React.FC<VisualEditorProps> = ({ pageId }) => {
  const { toast } = useToast();
  const [components, setComponents] = useState<EditorComponent[]>([]);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [selectedComponentType, setSelectedComponentType] = useState<string>('');
  const [history, setHistory] = useState<HistoryItem[]>([{ components: [], timestamp: Date.now() }]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [pageTitle, setPageTitle] = useState<string>('');
  const [pageSlug, setPageSlug] = useState<string>('');
  const [pageDescription, setPageDescription] = useState<string>('');

  // Load page data if pageId is provided
  useEffect(() => {
    if (pageId) {
      const loadPageData = async () => {
        try {
          const page = await cmsService.getPage(pageId);
          setPageTitle(page.title);
          setPageSlug(page.slug);
          setPageDescription(page.description || '');
          
          // Load components if they exist
          if (page.components) {
            setComponents(page.components);
            setHistory([{ components: page.components, timestamp: Date.now() }]);
            setHistoryIndex(0);
          }
        } catch (error) {
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

  // Save state to history
  const saveToHistory = useCallback((newComponents: EditorComponent[]) => {
    const newHistory = [...history.slice(0, historyIndex + 1), { components: newComponents, timestamp: Date.now() }];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

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

  // Save page
  const handleSavePage = useCallback(async () => {
    if (!pageId) return;
    
    try {
      // Update page metadata
      await cmsService.updatePage(pageId, {
        title: pageTitle,
        slug: pageSlug,
        description: pageDescription,
      });
      
      // TODO: Save components to the backend
      // This would require implementing component saving in the CMS service
      
      toast({
        title: "Success",
        description: "Page saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save page",
        variant: "destructive",
      });
    }
  }, [pageId, pageTitle, pageSlug, pageDescription, toast]);

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
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleUndo, handleRedo, handleDelete, handleToggleLock, selectedComponentId, components, saveToHistory, toast]);

  const handleComponentSelect = (componentType: string) => {
    const newComponent: EditorComponent = {
      id: `comp-${Date.now()}`,
      type: componentType,
      props: getDefaultProps(componentType),
    };

    const newComponents = [...components, newComponent];
    setComponents(newComponents);
    saveToHistory(newComponents);
    setSelectedComponentId(newComponent.id);
    setSelectedComponentType(componentType);
  };

  const handleBlockSelect = (block: any) => {
    // Create a block component
    const newComponent: EditorComponent = {
      id: `block-${Date.now()}`,
      type: 'block',
      props: {
        blockId: block.id,
        className: 'w-full',
      },
    };

    const newComponents = [...components, newComponent];
    setComponents(newComponents);
    saveToHistory(newComponents);
    setSelectedComponentId(newComponent.id);
    setSelectedComponentType('block');
    
    toast({
      title: "Block Added",
      description: `${block.name} has been added to the canvas`,
    });
  };

  const handleComponentUpdate = (id: string, props: any) => {
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
    
    const newComponents = components.map(comp => 
      comp.id === id ? { ...comp, props } : comp
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
    // Create an image component when media is selected
    if (media.type === 'image') {
      const newComponent: EditorComponent = {
        id: `comp-${Date.now()}`,
        type: 'image',
        props: {
          src: media.url,
          alt: media.altText || media.originalName,
          caption: media.title || '',
        },
      };

      const newComponents = [...components, newComponent];
      setComponents(newComponents);
      saveToHistory(newComponents);
      setSelectedComponentId(newComponent.id);
      setSelectedComponentType('image');
      
      toast({
        title: "Media Added",
        description: "Image added to the canvas",
      });
    }
  };

  const selectedComponent = components.find(comp => comp.id === selectedComponentId);
  const selectedComponentProps = selectedComponent ? selectedComponent.props : {};
  const isComponentLocked = selectedComponent?.locked || false;

  return (
    <div className="h-screen flex flex-col">
      <Card className="m-4">
        <CardHeader>
          <CardTitle>Visual CMS Editor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <input
                  type="text"
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value)}
                  placeholder="Page Title"
                  className="font-bold text-lg bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Slug:</span>
                  <input
                    type="text"
                    value={pageSlug}
                    onChange={(e) => setPageSlug(e.target.value)}
                    placeholder="page-slug"
                    className="bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                  />
                </div>
              </div>
            </div>
            <div className="space-x-2">
              <Button 
                variant="outline" 
                onClick={handleUndo}
                disabled={historyIndex === 0}
              >
                Undo (Ctrl+Z)
              </Button>
              <Button 
                variant="outline" 
                onClick={handleRedo}
                disabled={historyIndex === history.length - 1}
              >
                Redo (Ctrl+Shift+Z)
              </Button>
              <Button 
                variant="outline" 
                onClick={handleToggleLock}
                disabled={!selectedComponentId}
              >
                {selectedComponent?.locked ? 'Unlock' : 'Lock'} (Ctrl+L)
              </Button>
              <Button variant="outline" onClick={handleSavePage}>Save Draft</Button>
              <Button>Preview</Button>
              <Button variant="default">Publish</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex-1 flex gap-4 mx-4 mb-4">
        {/* Left Panel - Component Library, History, and Media */}
        <div className="w-1/4 flex flex-col gap-4">
          <Tabs defaultValue="components" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="components">Components</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            <TabsContent value="components" className="mt-0">
              <ComponentLibrary 
                onComponentSelect={handleComponentSelect}
                onBlockSelect={handleBlockSelect}
              />
            </TabsContent>
            <TabsContent value="media" className="mt-0">
              <MediaLibrary onMediaSelect={handleMediaSelect} />
            </TabsContent>
            <TabsContent value="history" className="mt-0">
              <HistoryPanel 
                history={history} 
                currentIndex={historyIndex}
                onHistorySelect={handleHistorySelect}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Editor Canvas */}
        <div className="w-1/2">
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
          />
        </div>

        {/* Properties Panel */}
        <div className="w-1/4">
          <PropertiesPanel
            componentType={selectedComponentType}
            componentProps={selectedComponentProps}
            onPropsChange={handlePropertyChange}
            isLocked={isComponentLocked}
          />
        </div>
      </div>
    </div>
  );
};

export default VisualEditor;