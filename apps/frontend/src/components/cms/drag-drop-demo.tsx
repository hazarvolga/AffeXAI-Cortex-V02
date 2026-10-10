'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DraggableComponent {
  id: string;
  type: string;
  label: string;
  icon: string;
}

interface PageComponent {
  id: string;
  type: string;
  props: any;
}

export const DragDropDemo: React.FC = () => {
  const [availableComponents] = useState<DraggableComponent[]>([
    { id: 'text', type: 'text', label: 'Text', icon: 'T' },
    { id: 'button', type: 'button', label: 'Button', icon: 'B' },
    { id: 'image', type: 'image', label: 'Image', icon: 'I' },
    { id: 'container', type: 'container', label: 'Container', icon: 'C' },
    { id: 'card', type: 'card', label: 'Card', icon: 'C' },
    { id: 'grid', type: 'grid', label: 'Grid', icon: 'G' },
  ]);

  const [pageComponents, setPageComponents] = useState<PageComponent[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, componentType: string) => {
    e.dataTransfer.setData('componentType', componentType);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const componentType = e.dataTransfer.getData('componentType');
    
    if (componentType) {
      const newComponent: PageComponent = {
        id: `comp-${Date.now()}`,
        type: componentType,
        props: {},
      };
      
      setPageComponents([...pageComponents, newComponent]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeComponent = (id: string) => {
    setPageComponents(pageComponents.filter(comp => comp.id !== id));
  };

  return (
    <div className="flex gap-6">
      {/* Component Palette */}
      <div className="w-1/4">
        <Card>
          <CardHeader>
            <CardTitle>Components</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {availableComponents.map((component) => (
              <div
                key={component.id}
                draggable
                onDragStart={(e) => handleDragStart(e, component.type)}
                className="flex items-center gap-2 p-2 border rounded cursor-move hover:bg-muted transition-colors"
              >
                <span className="w-8 h-8 flex items-center justify-center bg-primary text-primary-foreground rounded">
                  {component.icon}
                </span>
                <span>{component.label}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Page Canvas */}
      <div className="w-3/4">
        <Card>
          <CardHeader>
            <CardTitle>Page Canvas</CardTitle>
          </CardHeader>
          <CardContent
            className="min-h-[400px] border-2 border-dashed rounded-lg p-4"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {pageComponents.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Drag components here to build your page
              </div>
            ) : (
              <div className="space-y-4">
                {pageComponents.map((component) => (
                  <div
                    key={component.id}
                    className={cn(
                      'p-3 border rounded relative group',
                      selectedComponent === component.id ? 'ring-2 ring-primary' : ''
                    )}
                    onClick={() => setSelectedComponent(component.id)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium capitalize">{component.type} Component</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeComponent(component.id);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      Click to configure properties
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DragDropDemo;