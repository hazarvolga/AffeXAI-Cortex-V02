'use client';

import React, { useState, useCallback } from 'react';
import { ComponentsLibrary } from '../editor/components-library';
import { EditorCanvas } from '../editor/editor-canvas';
import { PropertiesPanel } from '../editor/properties-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ReusableSectionsService } from '@/services/reusable-content.service';
import { useRouter } from 'next/navigation';
import {
  Save,
  ArrowLeft,
  Eye,
  Layers,
  Package
} from 'lucide-react';
import { motion } from 'framer-motion';

interface EditorComponent {
  id: string;
  type: string;
  props: any;
  parentId?: string | null;
  orderIndex?: number;
  children?: EditorComponent[];
}

export const SectionBuilder: React.FC = () => {
  const { toast } = useToast();
  const router = useRouter();

  // Section metadata
  const [sectionName, setSectionName] = useState('');
  const [sectionDescription, setSectionDescription] = useState('');
  const [sectionType, setSectionType] = useState('custom');
  const [tags, setTags] = useState('');

  // Editor state
  const [components, setComponents] = useState<EditorComponent[]>([]);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [selectedComponentType, setSelectedComponentType] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Panel states
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  // Add component to canvas
  const handleAddComponent = useCallback((type: string, props: any = {}) => {
    const newComponent: EditorComponent = {
      id: `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      props,
      orderIndex: components.length,
    };

    setComponents(prev => [...prev, newComponent]);

    toast({
      title: 'Component Added',
      description: `${type} component added to section`,
    });
  }, [components.length, toast]);

  // Update component props
  const handleUpdateComponentProps = useCallback((componentId: string, newProps: any) => {
    setComponents(prev =>
      prev.map(comp =>
        comp.id === componentId
          ? { ...comp, props: { ...comp.props, ...newProps } }
          : comp
      )
    );
  }, []);

  // Delete component
  const handleDeleteComponent = useCallback((componentId: string) => {
    setComponents(prev => prev.filter(comp => comp.id !== componentId));
    if (selectedComponentId === componentId) {
      setSelectedComponentId(null);
      setSelectedComponentType('');
    }

    toast({
      title: 'Component Deleted',
      description: 'Component removed from section',
    });
  }, [selectedComponentId, toast]);

  // Move component
  const handleMoveComponent = useCallback((componentId: string, direction: 'up' | 'down') => {
    setComponents(prev => {
      const index = prev.findIndex(c => c.id === componentId);
      if (index === -1) return prev;

      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;

      const newComponents = [...prev];
      [newComponents[index], newComponents[newIndex]] = [newComponents[newIndex], newComponents[index]];

      // Update orderIndex
      return newComponents.map((comp, idx) => ({ ...comp, orderIndex: idx }));
    });
  }, []);

  // Select component
  const handleSelectComponent = useCallback((componentId: string, componentType?: string) => {
    console.log('🎯 Component selected:', { componentId, componentType });
    setSelectedComponentId(componentId);
    setSelectedComponentType(componentType || '');
  }, []);

  // Save section
  const handleSave = async () => {
    // Validation
    if (!sectionName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a section name',
        variant: 'destructive',
      });
      return;
    }

    if (components.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please add at least one component to the section',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      // Map components to SectionComponent format
      const sectionComponents = components.map((comp, index) => ({
        componentType: comp.type,
        blockType: undefined,
        props: comp.props,
        orderIndex: index,
        layoutProps: {},
        reusableComponentId: comp.props?.reusableComponentId || null,
      }));

      // Create section
      const newSection = await ReusableSectionsService.create({
        name: sectionName,
        description: sectionDescription || undefined,
        sectionType: sectionType,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        isPublic: true,
        isFeatured: false,
        components: sectionComponents,
      });

      toast({
        title: 'Section Created',
        description: `"${sectionName}" has been created successfully`,
      });

      // Redirect to sections list
      router.push('/admin/cms/reusable-sections');
    } catch (error: any) {
      console.error('Failed to create section:', error);
      toast({
        title: 'Save Failed',
        description: error?.response?.data?.message || 'Failed to create section. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Get selected component
  const selectedComponent = components.find(c => c.id === selectedComponentId);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-card">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Back button + Title */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/cms/reusable-sections')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold">Create Reusable Section</h1>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
            >
              <Package className="h-4 w-4 mr-2" />
              {isLeftPanelOpen ? 'Hide' : 'Show'} Components
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {isRightPanelOpen ? 'Hide' : 'Show'} Properties
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || components.length === 0 || !sectionName.trim()}
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Section'}
            </Button>
          </div>
        </div>

        {/* Section Metadata Input */}
        <div className="px-4 pb-3 pt-2 border-t bg-muted/30">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="section-name" className="text-xs">Section Name *</Label>
              <Input
                id="section-name"
                placeholder="e.g., Homepage Hero Section"
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="section-tags" className="text-xs">Tags (comma-separated)</Label>
              <Input
                id="section-tags"
                placeholder="e.g., hero, homepage, featured"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="section-description" className="text-xs">Description (optional)</Label>
              <Textarea
                id="section-description"
                placeholder="Describe this section..."
                value={sectionDescription}
                onChange={(e) => setSectionDescription(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: 3-column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Components Library */}
        {isLeftPanelOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="flex-shrink-0 border-r bg-card overflow-hidden"
          >
            <ComponentsLibrary
              onAddComponent={handleAddComponent}
              hideReusableTab={false}
            />
          </motion.div>
        )}

        {/* Center: Canvas */}
        <div className="flex-1 overflow-auto bg-muted/30">
          <EditorCanvas
            components={components}
            selectedComponentId={selectedComponentId}
            onComponentSelect={handleSelectComponent}
            onComponentUpdate={handleUpdateComponentProps}
            onComponentDelete={handleDeleteComponent}
            onMoveUp={(id) => handleMoveComponent(id, 'up')}
            onMoveDown={(id) => handleMoveComponent(id, 'down')}
          />
        </div>

        {/* Right Panel: Properties */}
        {isRightPanelOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="flex-shrink-0 border-l bg-card overflow-hidden"
          >
            {selectedComponent && selectedComponentType ? (
              <PropertiesPanel
                componentType={selectedComponentType}
                componentProps={selectedComponent.props || {}}
                onPropsChange={(newProps) => handleUpdateComponentProps(selectedComponent.id, newProps)}
              />
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">
                  {selectedComponent && !selectedComponentType
                    ? 'Loading component properties...'
                    : 'Select a component to edit its properties'}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};
