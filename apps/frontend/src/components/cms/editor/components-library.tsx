'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, GripVertical, ChevronLeft, ChevronRight, Loader2, Copy, Trash2, MoreVertical, Download, Upload } from 'lucide-react';
import {
  componentsRegistry,
  getComponentsByCategory,
  getAllCategories,
  searchComponents,
  type ComponentCategory,
  type ComponentRegistryItem,
} from '@/lib/cms/components-registry';
import { ReusableComponentsService, ReusableSectionsService, type ReusableSection } from '@/services/reusable-content.service';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

interface ComponentsLibraryProps {
  hideReusableTab?: boolean;
  onAddComponent: (componentId: string, defaultProps: any) => void;
}

export const ComponentsLibrary: React.FC<ComponentsLibraryProps> = ({ onAddComponent, hideReusableTab = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ComponentCategory>(hideReusableTab ? getAllCategories().find(category => category !== 'Reusable') || 'Hero' : 'Reusable');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const categories = getAllCategories().filter(category => !hideReusableTab || category !== 'Reusable');

  // Fetch reusable sections from API (not components!)
  const { data: reusableSectionsData, isLoading: isLoadingReusable } = useQuery({
    queryKey: ['reusable-sections-editor'],
    queryFn: () => ReusableSectionsService.getAll({ isPublic: true, limit: 100 }),
    // Always fetch sections so they're available when Reusable tab is clicked
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: (sectionId: string) =>
      ReusableSectionsService.duplicate(sectionId, `Copy of Section`, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reusable-sections-editor'] });
      toast({
        title: "Section Duplicated",
        description: "Section has been successfully duplicated",
      });
    },
    onError: (error) => {
      console.error('Duplicate failed:', error);
      toast({
        title: "Duplicate Failed",
        description: "Failed to duplicate section. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (sectionId: string) => ReusableSectionsService.delete(sectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reusable-sections-editor'] });
      toast({
        title: "Section Deleted",
        description: "Section has been successfully deleted",
      });
    },
    onError: (error) => {
      console.error('Delete failed:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete component. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: (componentId: string) => ReusableComponentsService.export(componentId),
    onSuccess: (data) => {
      // Download as JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `component-${data.slug || 'export'}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Component Exported",
        description: "Component has been successfully exported",
      });
    },
    onError: (error) => {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export component. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handler functions
  const handleDuplicate = (componentId: string) => {
    duplicateMutation.mutate(componentId);
  };

  const handleDelete = (componentId: string) => {
    deleteMutation.mutate(componentId);
  };

  const handleExport = (componentId: string) => {
    exportMutation.mutate(componentId);
  };

  // Check scroll position to show/hide arrows and gradients
  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5); // 5px tolerance
    }
  };

  useEffect(() => {
    checkScrollPosition();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      // Check on mount and window resize
      window.addEventListener('resize', checkScrollPosition);
      return () => {
        container.removeEventListener('scroll', checkScrollPosition);
        window.removeEventListener('resize', checkScrollPosition);
      };
    }
  }, []);

  // Auto-scroll active tab to center when category changes
  useEffect(() => {
    if (activeTabRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const activeTab = activeTabRef.current;

      // Calculate position to center the active tab
      const containerWidth = container.clientWidth;
      const tabLeft = activeTab.offsetLeft;
      const tabWidth = activeTab.offsetWidth;
      const scrollPosition = tabLeft - (containerWidth / 2) + (tabWidth / 2);

      container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
    }
  }, [selectedCategory]);

  // Scroll functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // Convert reusable sections to registry format (NOT components!)
  const reusableSections: ComponentRegistryItem[] = useMemo(() => {
    // Handle both wrapped {data: []} and direct array responses
    const sections = Array.isArray(reusableSectionsData)
      ? reusableSectionsData
      : (reusableSectionsData?.data && Array.isArray(reusableSectionsData.data)
        ? reusableSectionsData.data
        : []);

    return sections.map((section: ReusableSection) => ({
      id: section.id, // Use database ID
      name: section.name,
      description: section.description || 'Reusable section',
      category: 'Reusable' as ComponentCategory,
      thumbnailUrl: section.thumbnailUrl,
      defaultProps: {}, // Sections have components, not direct props
      sectionType: section.sectionType,
    }));
  }, [reusableSectionsData]);

  // Filter components based on search query and category
  const filteredComponents = useMemo(() => {
    if (searchQuery.trim()) {
      // Search in both prebuild and reusable sections
      const prebuildResults = searchComponents(searchQuery);
      const reusableResults = reusableSections.filter(section =>
        section.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (section.description && section.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      return [...reusableResults, ...prebuildResults];
    }

    if (selectedCategory === 'Reusable') {
      // ONLY show user-created sections, NO prebuild components!
      return reusableSections;
    }

    return getComponentsByCategory(selectedCategory);
  }, [searchQuery, selectedCategory, reusableSections]);

  // Get component count per category for badges
  const getCategoryCount = (category: ComponentCategory) => {
    if (category === 'Reusable') {
      return reusableSections.length;
    }
    return getComponentsByCategory(category).length;
  };

  const handleAddComponent = async (component: ComponentRegistryItem) => {
    // For reusable sections, expand into individual components
    if (component.category === 'Reusable') {
      try {
        // Fetch section's components
        const sectionComponents = await ReusableSectionsService.getComponents(component.id);

        // Sort by orderIndex and add each component to canvas
        const sortedComponents = sectionComponents.sort((a, b) => a.orderIndex - b.orderIndex);

        console.log('🔍 Section components loaded:', {
          sectionId: component.id,
          sectionName: component.name,
          componentCount: sortedComponents.length,
          components: sortedComponents.map(c => ({
            id: c.id,
            reusableComponentId: c.reusableComponentId,
            blockType: c.blockType,
            componentType: c.componentType,
            hasReusableComponent: !!c.reusableComponent,
            reusableBlockId: c.reusableComponent?.blockId,
            reusableComponentType: c.reusableComponent?.componentType,
          }))
        });

        for (const comp of sortedComponents) {
          // Determine component ID with comprehensive fallback chain:
          // Priority: reusableComponent.blockId > reusableComponent.componentType > blockType > componentType
          let componentId: string | undefined;
          let componentProps: Record<string, any> = {};

          if (comp.reusableComponent) {
            // Using existing reusable component - try blockId first, then componentType
            componentId = comp.reusableComponent.blockId || comp.reusableComponent.componentType;
            componentProps = {
              ...comp.reusableComponent.props,
              ...comp.props, // Override with section-specific props
              reusableComponentId: comp.reusableComponentId,
            };
          } else if (comp.blockType) {
            // Using prebuild block directly
            componentId = comp.blockType;
            componentProps = comp.props || {};
          } else if (comp.componentType) {
            // Inline component definition
            componentId = comp.componentType;
            componentProps = comp.props || {};
          }

          if (!componentId) {
            console.error('❌ Section component missing all identifiers:', {
              id: comp.id,
              reusableComponentId: comp.reusableComponentId,
              hasReusableComponent: !!comp.reusableComponent,
              reusableComponentBlockId: comp.reusableComponent?.blockId,
              reusableComponentType: comp.reusableComponent?.componentType,
              blockType: comp.blockType,
              componentType: comp.componentType,
            });
            continue;
          }

          // Add section metadata
          const finalProps = {
            ...componentProps,
            _fromSection: component.id,
            _sectionName: component.name,
            _orderIndex: comp.orderIndex,
          };

          onAddComponent(componentId, finalProps);
        }

        toast({
          title: "Section Added",
          description: `Added ${sortedComponents.length} component(s) from "${component.name}"`,
        });
      } catch (error) {
        console.error('Failed to load section components:', error);
        toast({
          title: "Failed to Add Section",
          description: "Could not load section components. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      // Regular prebuild component - add directly
      onAddComponent(component.id, component.defaultProps);
    }
  };

  // Import file handler
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Assuming the file contains an array of components or a single component
      const components = Array.isArray(data) ? data : [data];

      await ReusableComponentsService.import(components, false);
      queryClient.invalidateQueries({ queryKey: ['reusable-components-editor'] });

      toast({
        title: "Components Imported",
        description: `Successfully imported ${components.length} component(s)`,
      });
    } catch (error) {
      console.error('Import failed:', error);
      toast({
        title: "Import Failed",
        description: "Failed to import components. Please check the file format.",
        variant: "destructive",
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Import Button (only show for Reusable category) */}
        {selectedCategory === 'Reusable' && (
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={handleImportClick}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Import Components
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}
      </div>

      {/* Category Tabs */}
      {!searchQuery && (
        <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as ComponentCategory)}>
          <div className="border-b px-4 py-2 relative">{/* Left Gradient Shadow */}
            {canScrollLeft && (
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background via-background/80 to-transparent pointer-events-none z-10" />
            )}

            {/* Right Gradient Shadow */}
            {canScrollRight && (
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background via-background/80 to-transparent pointer-events-none z-10" />
            )}

            <div className="flex items-center gap-2">
              {/* Left Arrow Button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={scrollLeft}
                disabled={!canScrollLeft}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Scrollable Tabs */}
              <div
                ref={scrollContainerRef}
                className="flex-1 overflow-x-auto scrollbar-hide"
              >
                <TabsList className="inline-flex h-auto justify-start gap-2 bg-transparent p-0 w-max">
                  {categories.map((category) => (
                    <TabsTrigger
                      key={category}
                      value={category}
                      ref={selectedCategory === category ? activeTabRef : null}
                      className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      {category}
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                        {getCategoryCount(category)}
                      </Badge>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {/* Right Arrow Button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={scrollRight}
                disabled={!canScrollRight}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Tabs>
      )}

      {/* Components Grid */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {/* Loading state for reusable components */}
          {selectedCategory === 'Reusable' && isLoadingReusable ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="h-12 w-12 text-muted-foreground mb-3 animate-spin" />
              <p className="text-sm text-muted-foreground">
                Loading reusable sections...
              </p>
            </div>
          ) : filteredComponents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-muted-foreground mb-2">
                {selectedCategory === 'Reusable'
                  ? 'Henüz reusable section oluşturmadınız'
                  : (searchQuery ? 'No components found' : 'No components in this category')
                }
              </p>
              {selectedCategory === 'Reusable' && !searchQuery && (
                <p className="text-xs text-muted-foreground max-w-sm">
                  Visual editor'da section grupları oluşturup "Save as Reusable Section" ile kaydedin.
                  Daha sonra buradan tekrar kullanabilirsiniz.
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredComponents.map((component) => (
                <ComponentCard
                  key={component.id}
                  component={component}
                  onAdd={handleAddComponent}
                  onDuplicate={selectedCategory === 'Reusable' ? handleDuplicate : undefined}
                  onDelete={selectedCategory === 'Reusable' ? handleDelete : undefined}
                  onExport={selectedCategory === 'Reusable' ? handleExport : undefined}
                  isReusable={selectedCategory === 'Reusable'}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

interface ComponentCardProps {
  component: ComponentRegistryItem;
  onAdd: (component: ComponentRegistryItem) => void | Promise<void>;
  onDuplicate?: (componentId: string) => void;
  onDelete?: (componentId: string) => void;
  onExport?: (componentId: string) => void;
  isReusable?: boolean;
}

const ComponentCard: React.FC<ComponentCardProps> = ({
  component,
  onAdd,
  onDuplicate,
  onDelete,
  onExport,
  isReusable = false
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(true);
    // Set drag data
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'prebuild-component',
      componentId: component.id,
      defaultProps: component.defaultProps,
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(component.id);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <div
        className={`group relative rounded-lg border bg-card p-4 hover:border-primary transition-colors ${isReusable ? 'cursor-default' : 'cursor-move'} ${isDragging ? 'opacity-50' : ''}`}
        draggable={!isReusable}
        onDragStart={!isReusable ? handleDragStart : undefined}
        onDragEnd={!isReusable ? handleDragEnd : undefined}
      >
        {/* Drag Handle - Top Left (hidden for reusable sections) */}
        {!isReusable && (
          <div className="absolute top-2 left-2 p-1 rounded bg-muted/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        )}

        {/* Actions Menu - Top Right (only for reusable components) */}
        {isReusable && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onDuplicate && (
                  <DropdownMenuItem onClick={() => onDuplicate(component.id)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                )}
                {onExport && (
                  <DropdownMenuItem onClick={() => onExport(component.id)}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Component Info */}
        <div className="space-y-2 pr-8 pl-8">
          <h3 className="font-semibold text-sm leading-tight">{component.name}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {component.description}
          </p>
        </div>

        {/* Add Button */}
        <Button
          size="sm"
          variant="outline"
          className="mt-3 w-full"
          onClick={() => onAdd(component)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add to Page
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Component</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{component.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ComponentsLibrary;
