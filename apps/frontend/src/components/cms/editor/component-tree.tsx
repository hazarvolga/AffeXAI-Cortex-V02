'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, GripVertical, Trash2, Eye, EyeOff, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface Component {
  id: string;
  type: string;
  props: any;
  orderIndex: number;
  parentId: string | null;
  children?: Component[];
}

interface ComponentTreeProps {
  components: Component[];
  selectedComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
  onDeleteComponent: (id: string) => void;
  onReorderComponents: (componentId: string, newParentId: string | null, newIndex: number) => void;
  onUpdateComponent?: (componentId: string, updates: Partial<Component>) => void;
  className?: string;
}

export function ComponentTree({
  components,
  selectedComponentId,
  onSelectComponent,
  onDeleteComponent,
  onReorderComponents,
  onUpdateComponent,
  className,
}: ComponentTreeProps) {
  // Build tree structure from flat array
  const buildTree = (items: Component[]): Component[] => {
    const map = new Map<string, Component>();
    const roots: Component[] = [];

    // Initialize map
    items.forEach((item) => {
      map.set(item.id, { ...item, children: [] });
    });

    // Build tree
    items.forEach((item) => {
      const node = map.get(item.id)!;
      if (item.parentId && map.has(item.parentId)) {
        const parent = map.get(item.parentId)!;
        parent.children = parent.children || [];
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    // Sort by orderIndex
    const sortByOrder = (nodes: Component[]) => {
      nodes.sort((a, b) => a.orderIndex - b.orderIndex);
      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          sortByOrder(node.children);
        }
      });
    };

    sortByOrder(roots);
    return roots;
  };

  const tree = buildTree(components);

  return (
    <div className={cn('bg-card', className)}>
      <ScrollArea className="h-full">
        <div className="p-2">
          {tree.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 text-sm">
              No components yet. Add components from the library.
            </div>
          ) : (
            tree.map((component) => (
              <TreeItem
                key={component.id}
                component={component}
                depth={0}
                selectedId={selectedComponentId}
                onSelect={onSelectComponent}
                onDelete={onDeleteComponent}
                onReorder={onReorderComponents}
                onUpdate={onUpdateComponent}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

interface TreeItemProps {
  component: Component;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  onReorder: (componentId: string, newParentId: string | null, newIndex: number) => void;
  onUpdate?: (componentId: string, updates: Partial<Component>) => void;
}

function TreeItem({
  component,
  depth,
  selectedId,
  onSelect,
  onDelete,
  onReorder,
  onUpdate,
}: TreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const hasChildren = component.children && component.children.length > 0;
  const isSelected = selectedId === component.id;
  const maxDepth = 3;
  const canHaveChildren = depth < maxDepth;

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Handle double click to edit
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onUpdate) return;
    
    const currentName = component.props?.customName || component.props?.title || '';
    setEditValue(currentName);
    setIsEditing(true);
  };

  // Handle save
  const handleSave = () => {
    if (!onUpdate) return;
    
    const trimmedValue = editValue.trim();
    onUpdate(component.id, {
      props: {
        ...component.props,
        customName: trimmedValue || undefined, // Remove if empty
      },
    });
    setIsEditing(false);
  };

  // Handle cancel
  const handleCancel = () => {
    setIsEditing(false);
    setEditValue('');
  };

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // Get component display name and icon
  const getComponentInfo = (type: string) => {
    // Safety check
    if (!type) {
      return { label: 'Unknown', color: 'bg-gray-500' };
    }
    
    const typeMap: Record<string, { label: string; color: string }> = {
      HERO: { label: 'Hero', color: 'bg-purple-500' },
      TEXT: { label: 'Text', color: 'bg-blue-500' },
      IMAGE: { label: 'Image', color: 'bg-green-500' },
      GALLERY: { label: 'Gallery', color: 'bg-yellow-500' },
      CTA: { label: 'CTA', color: 'bg-red-500' },
      ACCORDION: { label: 'Accordion', color: 'bg-indigo-500' },
      FEATURES: { label: 'Features', color: 'bg-pink-500' },
      TESTIMONIALS: { label: 'Testimonials', color: 'bg-cyan-500' },
      PRICING: { label: 'Pricing', color: 'bg-orange-500' },
      CONTACT_FORM: { label: 'Contact', color: 'bg-teal-500' },
      VIDEO: { label: 'Video', color: 'bg-violet-500' },
      TEAM: { label: 'Team', color: 'bg-lime-500' },
      STATS: { label: 'Stats', color: 'bg-fuchsia-500' },
      LOGO_CLOUD: { label: 'Logos', color: 'bg-amber-500' },
      NEWSLETTER: { label: 'Newsletter', color: 'bg-rose-500' },
      CONTAINER: { label: 'Container', color: 'bg-slate-500' },
      GRID: { label: 'Grid', color: 'bg-stone-500' },
      CARD: { label: 'Card', color: 'bg-zinc-500' },
      BLOCK: { label: 'Block', color: 'bg-neutral-500' },
      BUTTON: { label: 'Button', color: 'bg-sky-500' },
    };
    
    // If type is found in map, return it
    if (typeMap[type.toUpperCase()]) {
      return typeMap[type.toUpperCase()];
    }
    
    // Otherwise, capitalize first letter and return
    const capitalized = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    return { label: capitalized, color: 'bg-gray-500' };
  };

  const componentInfo = getComponentInfo(component?.type || '');
  
  // Get component display title
  const getDisplayTitle = (comp: Component) => {
    // 1. Try to get custom name (user-defined)
    if (comp.props?.customName) {
      return comp.props.customName;
    }
    
    // 2. Try to get title from props
    if (comp.props?.title) {
      return comp.props.title;
    }
    
    // 3. Try to get content preview
    if (comp.props?.content && typeof comp.props.content === 'string') {
      const preview = comp.props.content.substring(0, 30);
      return preview.length < comp.props.content.length ? `${preview}...` : preview;
    }
    
    // 4. Try to get heading
    if (comp.props?.heading) {
      return comp.props.heading;
    }
    
    // 5. Try to get text
    if (comp.props?.text) {
      const preview = comp.props.text.substring(0, 30);
      return preview.length < comp.props.text.length ? `${preview}...` : preview;
    }
    
    // 6. Try to get alt (for images)
    if (comp.props?.alt) {
      return comp.props.alt;
    }
    
    // 7. Try to get label (for buttons)
    if (comp.props?.label) {
      return comp.props.label;
    }
    
    // 8. Default to component type (e.g., "Container", "Button", "Text")
    return componentInfo.label;
  };
  
  const displayTitle = getDisplayTitle(component);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('componentId', component.id);
    e.stopPropagation();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canHaveChildren) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (!canHaveChildren) return;

    const draggedId = e.dataTransfer.getData('componentId');
    if (draggedId && draggedId !== component.id) {
      // Check if trying to drop component into its own children (prevent circular reference)
      const isCircular = checkCircularReference(component, draggedId);
      if (!isCircular) {
        const newIndex = component.children ? component.children.length : 0;
        onReorder(draggedId, component.id, newIndex);
        setIsExpanded(true);
      }
    }
  };

  // Check for circular reference
  const checkCircularReference = (node: Component, targetId: string): boolean => {
    if (node.id === targetId) return true;
    if (!node.children || node.children.length === 0) return false;
    return node.children.some((child) => checkCircularReference(child, targetId));
  };

  return (
    <div className="select-none">
      <div
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => onSelect(component.id)}
        className={cn(
          'group flex items-center gap-1 py-1.5 px-2 rounded-md hover:bg-accent cursor-pointer transition-colors',
          isSelected && 'bg-accent ring-2 ring-primary',
          isDragOver && canHaveChildren && 'bg-primary/10 ring-2 ring-primary ring-dashed'
        )}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {/* Expand/Collapse */}
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 p-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        ) : (
          <div className="h-5 w-5" />
        )}

        {/* Drag Handle */}
        <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Component Title - Editable */}
        {isEditing ? (
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 h-6 text-sm px-2 py-0"
            placeholder={componentInfo.label}
          />
        ) : (
          <span 
            className="flex-1 text-sm truncate font-medium"
            onDoubleClick={handleDoubleClick}
            title={onUpdate ? 'Double-click to edit' : displayTitle}
          >
            {displayTitle}
          </span>
        )}
        
        {/* Type Badge - Small subtle indicator */}
        <Badge variant="outline" className="text-xs text-muted-foreground">
          {componentInfo.label}
        </Badge>

        {/* Depth Indicator */}
        {depth > 0 && (
          <Badge variant="outline" className="text-xs">
            L{depth + 1}
          </Badge>
        )}

        {/* Children Count */}
        {hasChildren && (
          <Badge variant="outline" className="text-xs">
            {component.children!.length}
          </Badge>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              // Cancel editing if active before deleting
              if (isEditing) {
                setIsEditing(false);
              }
              if (confirm(`Delete ${componentInfo.label}?`)) {
                onDelete(component.id);
              }
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="ml-2">
          {component.children!.map((child) => (
            <TreeItem
              key={child.id}
              component={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onDelete={onDelete}
              onReorder={onReorder}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}

      {/* Max Depth Warning */}
      {depth >= maxDepth - 1 && (
        <div className="ml-12 text-xs text-muted-foreground italic py-1">
          Max nesting depth reached
        </div>
      )}
    </div>
  );
}
