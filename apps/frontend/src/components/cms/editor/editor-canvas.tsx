"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BlockRenderer } from "./block-renderer";
import { Lock } from "lucide-react";
import { EditableText } from "./editable-text";
import { EditorProvider } from "./editor-context";
import { PreviewProvider } from "@/components/cms/preview-context";
import { blockRegistry } from "@/components/cms/block-registry";
import { mergeComponentClasses } from "@/lib/cms/style-utils";

// V2 blocks are loaded from blockRegistry (no legacy imports needed)

interface EditorComponent {
  id: string;
  pageId?: string;
  blockId?: string;
  parentId?: string | null;
  type: string;
  props: any;
  children?: EditorComponent[];
  locked?: boolean; // Add locked property
  orderIndex?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface EditorCanvasProps {
  components: EditorComponent[];
  onComponentUpdate: (id: string, props: any) => void;
  onComponentDelete: (id: string) => void;
  onComponentSelect: (id: string, type?: string) => void;
  selectedComponentId: string | null;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  isPreviewMode?: boolean;
  isFullWidth?: boolean; // NEW: Layout mode control
  onReorderComponents?: (
    componentId: string,
    newParentId: string | null,
    index: number,
  ) => void;
}

// Component Registry - Maps component types to their React components
// V2 System: Only uses blockRegistry (no legacy fallback)
const componentRegistry: Record<string, React.FC<any>> = {};

// Add all blocks from blockRegistry
Object.entries(blockRegistry).forEach(([key, component]) => {
  componentRegistry[key] = component as React.FC<any>;
});

// V2 block system - no legacy blocks needed

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  components,
  onComponentUpdate,
  onComponentDelete,
  onComponentSelect,
  selectedComponentId,
  onMoveUp,
  onMoveDown,
  onReorderComponents,
  isPreviewMode = false,
  isFullWidth = false, // NEW: Default to boxed layout
}) => {
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [copiedComponent, setCopiedComponent] =
    useState<EditorComponent | null>(null);
  const [isDraggingPrebuild, setIsDraggingPrebuild] = useState(false);

  // Sort components by orderIndex for consistent rendering order
  const sortedComponents = [...components].sort((a, b) => {
    const orderA = a.orderIndex ?? 0;
    const orderB = b.orderIndex ?? 0;
    return orderA - orderB;
  });

  // Copy component to clipboard
  const handleCopyComponent = useCallback((component: EditorComponent) => {
    if (component.locked) return; // Can't copy locked components
    setCopiedComponent(component);
  }, []);

  // Paste component from clipboard
  const handlePasteComponent = useCallback(() => {
    if (copiedComponent) {
      const newComponent = {
        ...copiedComponent,
        id: `comp-${Date.now()}`, // Generate new ID
      };

      // Add to components (this would be handled by parent in a real implementation)
      // For now, we'll just log it
      console.log("Pasting component:", newComponent);
    }
  }, [copiedComponent]);

  const renderComponent = (component: EditorComponent): React.ReactNode => {
    const isSelected = selectedComponentId === component.id;
    const isDragOver = dragOverId === component.id;
    const isLocked = component.locked;
    const componentIndex = sortedComponents.findIndex(
      (c) => c.id === component.id,
    );
    const isFirst = componentIndex === 0;
    const isLast = componentIndex === sortedComponents.length - 1;

    const baseClasses = `
      relative ${!isPreviewMode ? "border-2 border-dashed border-transparent" : ""} rounded
      ${!isPreviewMode && isSelected ? "border-primary ring-2 ring-primary/20" : ""}
      ${!isPreviewMode && isDragOver ? "border-primary bg-primary/5" : ""}
      ${isLocked ? "opacity-75" : ""}
      transition-all duration-200
    `;

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      // Can't select in preview mode or locked components
      if (isPreviewMode || isLocked) return;
      onComponentSelect(component.id, component.type);
    };

    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      onComponentDelete(component.id);
    };

    const handleCopy = (e: React.MouseEvent) => {
      e.stopPropagation();
      handleCopyComponent(component);
    };

    const handleMoveUp = (e: React.MouseEvent) => {
      e.stopPropagation();
      onMoveUp && onMoveUp(component.id);
    };

    const handleMoveDown = (e: React.MouseEvent) => {
      e.stopPropagation();
      onMoveDown && onMoveDown(component.id);
    };

    const componentWithHandlers = {
      ...component.props,
      id: component.id,
      key: component.id,
      className: `${component.props.className || ""} ${baseClasses}`,
      onClick: handleClick,
    };

    // Render action buttons
    const renderActionButtons = () => {
      // Hide buttons in preview mode
      if (isPreviewMode || isLocked || !isSelected) return null;

      return (
        <div className="absolute -top-2 -right-2 flex space-x-1 bg-background p-1 rounded shadow-md z-10">
          {onMoveUp && !isFirst && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMoveUp}
              className="h-6 px-2 text-xs"
            >
              ↑
            </Button>
          )}
          {onMoveDown && !isLast && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMoveDown}
              className="h-6 px-2 text-xs"
            >
              ↓
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            className="h-6 px-2 text-xs"
          >
            Copy
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            className="h-6 px-2 text-xs"
          >
            Delete
          </Button>
        </div>
      );
    };

    // Check if this is a reusable component with blockId at root level
    // Fallback to props.blockId for backward compatibility with old data
    const blockId =
      component.blockId || component.props?.blockId || component.type;
    const ComponentToRender = componentRegistry[blockId];

    if (ComponentToRender) {
      // Extract Advanced tab properties
      const {
        marginTop,
        marginBottom,
        marginLeft,
        marginRight,
        paddingTop,
        paddingBottom,
        paddingLeft,
        paddingRight,
        display,
        maxWidth,
        minHeight,
        shadow,
        opacity,
        width,
        height,
        ...otherProps
      } = component.props;

      // Build advancedProps object
      const advancedProps = {
        marginTop,
        marginBottom,
        marginLeft,
        marginRight,
        paddingTop,
        paddingBottom,
        paddingLeft,
        paddingRight,
        display,
        maxWidth,
        minHeight,
        shadow,
        opacity,
        width,
        height,
      };

      // Merge component classes with Advanced properties
      const mergedClassName = mergeComponentClasses(
        component.props.className || "",
        advancedProps,
        component.props.cssClasses || "",
      );

      return (
        <div key={component.id} className={baseClasses} onClick={handleClick}>
          <ComponentToRender
            {...otherProps}
            className={mergedClassName}
            props={component.props}
          />
          {renderActionButtons()}
          {isLocked && (
            <div className="absolute top-2 left-2 bg-primary text-primary-foreground rounded-full p-1">
              <Lock className="h-3 w-3" />
            </div>
          )}
          {/* Reusable badge removed - these are normal page components */}
        </div>
      );
    }

    // Unknown component type
    return (
      <div
        key={component.id}
        className="p-4 text-center text-muted-foreground border border-dashed rounded bg-red-50"
      >
        <p className="text-sm text-red-600 font-medium">
          Unknown component type: {blockId}
        </p>
        <p className="text-xs text-red-500 mt-1">
          This component is not registered in the component registry
        </p>
      </div>
    );
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();

    // Check if dragging a prebuild component
    const types = e.dataTransfer.types;
    if (types.includes("application/json")) {
      setIsDraggingPrebuild(true);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverId(null);
    setIsDraggingPrebuild(false);

    // Try to get prebuild component data first
    try {
      const jsonData = e.dataTransfer.getData("application/json");
      if (jsonData) {
        const data = JSON.parse(jsonData);

        if (data.type === "prebuild-component") {
          // Handle prebuild component drop
          const event = new CustomEvent("addPrebuildComponentAtPosition", {
            detail: {
              componentId: data.componentId,
              defaultProps: data.defaultProps,
              parentId: null,
              index: components.length,
            },
          });
          window.dispatchEvent(event);
          return;
        }
      }
    } catch (err) {
      console.error("Failed to parse drop data:", err);
    }

    // Fallback to existing component reordering
    if (onReorderComponents) {
      const componentId = e.dataTransfer.getData("componentId");
      if (componentId) {
        // Drop at root level (parentId = null, append to end)
        onReorderComponents(componentId, null, components.length);
      }
    }
  };

  // Calculate depth for a component in the tree
  const getComponentDepth = (componentId: string, currentDepth = 0): number => {
    for (const comp of components) {
      if (comp.id === componentId) {
        if (!comp.parentId) return 0;
        return getComponentDepth(comp.parentId, currentDepth + 1);
      }
    }
    return currentDepth;
  };

  return (
    <PreviewProvider initialMode={isPreviewMode ? "preview" : "edit"}>
      <EditorProvider onComponentUpdate={onComponentUpdate}>
        <Card className="h-full flex flex-col">
          <CardContent
            role="region"
            aria-label="Sayfa kanvası"
            tabIndex={0}
            className={`flex-1 p-4 overflow-auto h-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isDraggingPrebuild ? "bg-primary/5 border-2 border-dashed border-primary" : ""}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragLeave={() => {
              setDragOverId(null);
              setIsDraggingPrebuild(false);
            }}
          >
            {sortedComponents.length === 0 ? (
              <div className="flex items-center justify-center h-full border-2 border-dashed border-muted-foreground/30 rounded-lg">
                <div className="text-center space-y-2">
                  <p className="text-muted-foreground">No blocks yet</p>
                  <p className="text-sm text-muted-foreground">
                    Başlamak için bileşen panelinden blok sürükleyin ya da araç
                    çubuğundan bölüm ekleyin.
                  </p>
                </div>
              </div>
            ) : (
              // Container wrapper - Full Width vs Boxed
              <div
                className={
                  isFullWidth
                    ? "w-full"
                    : "container mx-auto max-w-screen-xl px-4"
                }
              >
                <div className="space-y-4">
                  {sortedComponents.map((component) =>
                    renderComponent(component),
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </EditorProvider>
    </PreviewProvider>
  );
};

export default EditorCanvas;
