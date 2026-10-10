'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TextComponent } from '../text-component';
import { ButtonComponent } from '../button-component';
import { ImageComponent } from '../image-component';
import { ContainerComponent } from '../container-component';
import { CardComponent } from '../card-component';
import { GridComponent } from '../grid-component';
import { BlockRenderer } from './block-renderer';
import { Lock, Copy, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EditorComponent {
  id: string;
  pageId?: string;
  parentId?: string;
  type: string;
  props: any;
  children?: EditorComponent[];
  locked?: boolean;
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
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  components,
  onComponentUpdate,
  onComponentDelete,
  onComponentSelect,
  selectedComponentId,
  onMoveUp,
  onMoveDown,
}) => {
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [hoveredComponentId, setHoveredComponentId] = useState<string | null>(null);
  const [copiedComponent, setCopiedComponent] = useState<EditorComponent | null>(null);

  // Copy component to clipboard
  const handleCopyComponent = useCallback((component: EditorComponent) => {
    if (component.locked) return;
    setCopiedComponent(component);
  }, []);

  const renderComponent = (component: EditorComponent): React.ReactNode => {
    const isSelected = selectedComponentId === component.id;
    const isHovered = hoveredComponentId === component.id;
    const isDragOver = dragOverId === component.id;
    const isLocked = component.locked;
    const componentIndex = components.findIndex(c => c.id === component.id);
    const isFirst = componentIndex === 0;
    const isLast = componentIndex === components.length - 1;

    // Enhanced styling with better visual feedback
    const baseClasses = `
      relative border-2 border-dashed rounded transition-all duration-200
      ${isSelected 
        ? 'border-primary ring-4 ring-primary/30 shadow-lg' 
        : isHovered 
          ? 'border-primary/50 ring-2 ring-primary/20' 
          : 'border-transparent'}
      ${isDragOver ? 'border-primary bg-primary/10' : ''}
      ${isLocked ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}
    `;

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isLocked) return;
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
      className: `${component.props.className || ''} ${baseClasses}`,
      onClick: handleClick,
    };

    // Enhanced action buttons with animations
    const renderActionButtons = () => {
      if (isLocked || !isSelected) return null;
      
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute -top-3 -right-3 flex space-x-1 bg-background p-1 rounded-lg shadow-lg z-20 border"
        >
          {onMoveUp && !isFirst && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMoveUp}
              className="h-7 w-7 p-0"
              title="Move Up"
            >
              <ArrowUp className="h-3 w-3" />
            </Button>
          )}
          {onMoveDown && !isLast && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMoveDown}
              className="h-7 w-7 p-0"
              title="Move Down"
            >
              <ArrowDown className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            className="h-7 w-7 p-0"
            title="Copy Component"
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            className="h-7 w-7 p-0"
            title="Delete Component"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </motion.div>
      );
    };

    // Enhanced locked indicator
    const renderLockedIndicator = () => {
      if (!isLocked) return null;
      
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 left-2 bg-primary text-primary-foreground rounded-full p-1 z-10"
        >
          <Lock className="h-3 w-3" />
        </motion.div>
      );
    };

    switch (component.type) {
      case 'text':
        return (
          <motion.div 
            className="relative"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
            onMouseEnter={() => setHoveredComponentId(component.id)}
            onMouseLeave={() => setHoveredComponentId(null)}
          >
            <TextComponent {...componentWithHandlers} />
            <AnimatePresence>
              {renderActionButtons()}
            </AnimatePresence>
            {renderLockedIndicator()}
          </motion.div>
        );
      
      case 'button':
        return (
          <motion.div 
            className={baseClasses} 
            onClick={handleClick}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
            onMouseEnter={() => setHoveredComponentId(component.id)}
            onMouseLeave={() => setHoveredComponentId(null)}
          >
            <ButtonComponent {...component.props} />
            <AnimatePresence>
              {renderActionButtons()}
            </AnimatePresence>
            {renderLockedIndicator()}
          </motion.div>
        );
      
      case 'image':
        return (
          <motion.div 
            className={baseClasses} 
            onClick={handleClick}
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
            onMouseEnter={() => setHoveredComponentId(component.id)}
            onMouseLeave={() => setHoveredComponentId(null)}
          >
            <ImageComponent {...component.props} />
            <AnimatePresence>
              {renderActionButtons()}
            </AnimatePresence>
            {renderLockedIndicator()}
          </motion.div>
        );
      
      case 'container':
        return (
          <motion.div 
            className={baseClasses} 
            onClick={handleClick}
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
            onMouseEnter={() => setHoveredComponentId(component.id)}
            onMouseLeave={() => setHoveredComponentId(null)}
          >
            <ContainerComponent {...component.props}>
              {component.children?.map(renderComponent)}
            </ContainerComponent>
            <AnimatePresence>
              {renderActionButtons()}
            </AnimatePresence>
            {renderLockedIndicator()}
          </motion.div>
        );
      
      case 'card':
        return (
          <motion.div 
            className={baseClasses} 
            onClick={handleClick}
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
            onMouseEnter={() => setHoveredComponentId(component.id)}
            onMouseLeave={() => setHoveredComponentId(null)}
          >
            <CardComponent {...component.props}>
              {component.children?.map(renderComponent)}
            </CardComponent>
            <AnimatePresence>
              {renderActionButtons()}
            </AnimatePresence>
            {renderLockedIndicator()}
          </motion.div>
        );
      
      case 'grid':
        return (
          <motion.div 
            className={baseClasses} 
            onClick={handleClick}
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
            onMouseEnter={() => setHoveredComponentId(component.id)}
            onMouseLeave={() => setHoveredComponentId(null)}
          >
            <GridComponent {...component.props}>
              {component.children?.map(renderComponent)}
            </GridComponent>
            <AnimatePresence>
              {renderActionButtons()}
            </AnimatePresence>
            {renderLockedIndicator()}
          </motion.div>
        );
      
      case 'block':
        return (
          <motion.div 
            key={component.id} 
            className={baseClasses} 
            onClick={handleClick}
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
            onMouseEnter={() => setHoveredComponentId(component.id)}
            onMouseLeave={() => setHoveredComponentId(null)}
          >
            {component.props.blockId ? (
              <BlockRenderer blockId={component.props.blockId} props={component.props} />
            ) : (
              <div className="p-4 text-center text-muted-foreground border border-dashed rounded">
                Block component not properly configured
              </div>
            )}
            <AnimatePresence>
              {renderActionButtons()}
            </AnimatePresence>
            {renderLockedIndicator()}
          </motion.div>
        );
      
      default:
        return (
          <motion.div 
            className="p-4 text-center text-muted-foreground border border-dashed rounded"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
            onMouseEnter={() => setHoveredComponentId(component.id)}
            onMouseLeave={() => setHoveredComponentId(null)}
          >
            Unknown component type: {component.type}
          </motion.div>
        );
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverId(null);
    // Handle drop logic would go here
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Page Canvas</CardTitle>
      </CardHeader>
      <CardContent 
        className="flex-1 p-4 overflow-auto h-full"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragLeave={() => setDragOverId(null)}
      >
        {components.length === 0 ? (
          <motion.div 
            key="empty-canvas" 
            className="h-full min-h-[400px] flex items-center justify-center text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-center">
              <p className="mb-2">Drag components here to start building your page</p>
              <p className="text-sm">Select a component from the library to add it to the canvas</p>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            className="space-y-4 min-h-[400px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {components.map((component) => (
              <motion.div
                key={component.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderComponent(component)}
              </motion.div>
            ))}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default EditorCanvas;