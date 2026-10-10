'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lock, ArrowUp, ArrowDown, X, Image as ImageIcon } from 'lucide-react';
import { allBlockConfigs } from '@/components/cms/blocks/block-configs';
import { MediaLibrary } from '@/components/cms/editor/media-library';
import { Media } from '@/lib/media/types';
import { LayoutComponent } from './layout-component'; // Import LayoutComponent

interface ComponentProps {
  [key: string]: any;
}

// Define the layout options interface to match LayoutComponent
interface LayoutOptions {
  showHeader?: boolean;
  showFooter?: boolean;
  fullWidth?: boolean;
  backgroundColor?: string;
  showTitle?: boolean;
}

interface PropertiesPanelProps {
  componentType: string;
  componentProps: ComponentProps;
  onPropsChange: (props: ComponentProps) => void;
  isLocked?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  // Add layout options props
  layoutOptions?: LayoutOptions;
  onLayoutOptionsChange?: (layoutOptions: LayoutOptions) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  componentType,
  componentProps,
  onPropsChange,
  isLocked = false,
  onMoveUp,
  onMoveDown,
  canMoveUp = true,
  canMoveDown = true,
  layoutOptions,
  onLayoutOptionsChange,
}) => {
  const [localProps, setLocalProps] = useState<ComponentProps>(componentProps);
  const [mediaModalOpen, setMediaModalOpen] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState('content');

  useEffect(() => {
    setLocalProps(componentProps);
  }, [componentProps]);

  const updateProp = (key: string, value: any) => {
    if (isLocked) return;
    
    let newProps = { ...localProps };
    
    if (key.includes('.')) {
      const parts = key.split('.');
      if (parts.length === 3) {
        const [listKey, indexStr, itemKey] = parts;
        const index = parseInt(indexStr, 10);
        
        const list = [...(newProps[listKey] || [])];
        
        if (list[index]) {
          list[index] = { ...list[index], [itemKey]: value };
        } else {
          list[index] = { [itemKey]: value };
        }
        
        newProps = { ...newProps, [listKey]: list };
      }
    } else {
      newProps = { ...newProps, [key]: value };
    }
    
    setLocalProps(newProps);
    onPropsChange(newProps);
  };

  // Separate content and style properties for tabbed interface
  const getContentProperties = () => {
    switch (componentType) {
      case 'text':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={localProps.content || ''}
                onChange={(e) => updateProp('content', e.target.value)}
                disabled={isLocked}
              />
            </div>
          </div>
        );
      
      case 'button':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="text">Button Text</Label>
              <Input
                id="text"
                value={localProps.text || ''}
                onChange={(e) => updateProp('text', e.target.value)}
                disabled={isLocked}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="href">Link URL (optional)</Label>
              <Input
                id="href"
                value={localProps.href || ''}
                onChange={(e) => updateProp('href', e.target.value)}
                disabled={isLocked}
              />
            </div>
          </div>
        );
      
      case 'image':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="src">Image URL</Label>
              <Input
                id="src"
                value={localProps.src || ''}
                onChange={(e) => updateProp('src', e.target.value)}
                disabled={isLocked}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="alt">Alt Text</Label>
              <Input
                id="alt"
                value={localProps.alt || ''}
                onChange={(e) => updateProp('alt', e.target.value)}
                disabled={isLocked}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="caption">Caption (optional)</Label>
              <Input
                id="caption"
                value={localProps.caption || ''}
                onChange={(e) => updateProp('caption', e.target.value)}
                disabled={isLocked}
              />
            </div>
          </div>
        );
      
      case 'block':
        const blockId = componentProps.blockId;
        const blockConfig = blockId ? allBlockConfigs[blockId] : null;
        
        if (!blockConfig) {
          return (
            <div className="space-y-4">
              <div className="text-center text-muted-foreground py-4">
                <p>Block components are pre-built designs with limited editable properties.</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="blockId">Block ID</Label>
                  <Input id="blockId" value={componentProps.blockId || ''} readOnly />
                </div>
              </div>
            </div>
          );
        }
        
        // Render block-specific content properties
        return (
          <div className="space-y-4">
            <div className="text-center text-muted-foreground py-2">
              <p>Edit block content</p>
            </div>
            
            <div className="space-y-4">
              {Object.entries(blockConfig).map(([key, config]: [string, any]) => {
                // For blocks, we'll show all properties in the content tab for now
                // In the future, we might want to categorize them properly
                return (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key}>{config.label}</Label>
                    {renderPropertyInput(key, config, componentProps[key])}
                  </div>
                );
              })}
            </div>
          </div>
        );
      
      default:
        return (
          <div className="text-center text-muted-foreground py-8">
            <p>Select a component to edit its content properties</p>
          </div>
        );
    }
  };

  const getStyleProperties = () => {
    switch (componentType) {
      case 'text':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="variant">Variant</Label>
              <Select
                value={localProps.variant || 'body'}
                onValueChange={(value) => updateProp('variant', value)}
                disabled={isLocked}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="heading1">Heading 1</SelectItem>
                  <SelectItem value="heading2">Heading 2</SelectItem>
                  <SelectItem value="heading3">Heading 3</SelectItem>
                  <SelectItem value="body">Body</SelectItem>
                  <SelectItem value="caption">Caption</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="align">Alignment</Label>
              <Select
                value={localProps.align || 'left'}
                onValueChange={(value) => updateProp('align', value)}
                disabled={isLocked}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                  <SelectItem value="justify">Justify</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Select
                value={localProps.color || 'primary'}
                onValueChange={(value) => updateProp('color', value)}
                disabled={isLocked}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                  <SelectItem value="muted">Muted</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      
      case 'button':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="variant">Variant</Label>
              <Select
                value={localProps.variant || 'default'}
                onValueChange={(value) => updateProp('variant', value)}
                disabled={isLocked}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="destructive">Destructive</SelectItem>
                  <SelectItem value="outline">Outline</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                  <SelectItem value="ghost">Ghost</SelectItem>
                  <SelectItem value="link">Link</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="size">Size</Label>
              <Select
                value={localProps.size || 'default'}
                onValueChange={(value) => updateProp('size', value)}
                disabled={isLocked}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Small</SelectItem>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="disabled"
                checked={localProps.disabled || false}
                onCheckedChange={(checked) => updateProp('disabled', checked)}
                disabled={isLocked}
              />
              <Label htmlFor="disabled">Disabled</Label>
            </div>
          </div>
        );
      
      case 'image':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Width</Label>
              <Input
                type="number"
                value={localProps.width || ''}
                onChange={(e) => updateProp('width', e.target.value)}
                disabled={isLocked}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Height</Label>
              <Input
                type="number"
                value={localProps.height || ''}
                onChange={(e) => updateProp('height', e.target.value)}
                disabled={isLocked}
              />
            </div>
          </div>
        );
      
      case 'container':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="padding">Padding</Label>
              <Select
                value={localProps.padding || 'md'}
                onValueChange={(value) => updateProp('padding', value)}
                disabled={isLocked}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="xs">Extra Small</SelectItem>
                  <SelectItem value="sm">Small</SelectItem>
                  <SelectItem value="md">Medium</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                  <SelectItem value="xl">Extra Large</SelectItem>
                  <SelectItem value="2xl">2X Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="background">Background</Label>
              <Select
                value={localProps.background || 'none'}
                onValueChange={(value) => updateProp('background', value)}
                disabled={isLocked}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                  <SelectItem value="muted">Muted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      
      case 'block':
        const blockId = componentProps.blockId;
        const blockConfig = blockId ? allBlockConfigs[blockId] : null;
        
        if (!blockConfig) {
          return (
            <div className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="blockClass">CSS Classes</Label>
                  <Input 
                    id="blockClass" 
                    value={componentProps.className || ''} 
                    onChange={(e) => updateProp('className', e.target.value)}
                    placeholder="Additional CSS classes"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="blockMargin">Margin</Label>
                  <Select
                    value={componentProps.margin || 'default'}
                    onValueChange={(value) => updateProp('margin', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="blockPadding">Padding</Label>
                  <Select
                    value={componentProps.padding || 'default'}
                    onValueChange={(value) => updateProp('padding', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          );
        }
        
        // Define style property keywords
        const isStyleProperty = (propName: string): boolean => {
          const styleKeywords = [
            'color', 'background', 'padding', 'margin', 'width', 'height',
            'size', 'variant', 'align', 'weight', 'border', 'shadow',
            'opacity', 'radius', 'rounded', 'spacing', 'gap', 'font'
          ];
          
          const lowerProp = propName.toLowerCase();
          return styleKeywords.some(keyword => lowerProp.includes(keyword));
        };
        
        // For block components, show actual style properties from the block config
        const styleProperties = Object.entries(blockConfig).filter(([key, config]: [string, any]) => {
          // Filter for style-related properties using keywords
          return isStyleProperty(key) && key !== 'className';
        });
        
        if (styleProperties.length === 0) {
          return (
            <div className="space-y-4">
              <div className="text-center text-muted-foreground py-8">
                <p>No editable style properties for this block.</p>
                <p className="mt-2">Block styles are predefined in the block design.</p>
                <p className="mt-2">To change styles, select a different block variant.</p>
              </div>
            </div>
          );
        }
        
        return (
          <div className="space-y-4">
            <div className="text-center text-muted-foreground py-2">
              <p>Edit block styles</p>
            </div>
            
            <div className="space-y-4">
              {styleProperties.map(([key, config]: [string, any]) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key}>{config.label}</Label>
                  {renderPropertyInput(key, config, componentProps[key])}
                </div>
              ))}
            </div>
          </div>
        );
      
      default:
        return (
          <div className="text-center text-muted-foreground py-8">
            <p>Select a component to edit its style properties</p>
          </div>
        );
    }
  };

  // Add layout properties function
  const getLayoutProperties = () => {
    if (!layoutOptions || !onLayoutOptionsChange) {
      return (
        <div className="text-center text-muted-foreground py-8">
          <p>Layout options not available</p>
        </div>
      );
    }

    // Create a wrapper function to convert the signature
    const handleLayoutChange = (newOptions: LayoutOptions) => {
      onLayoutOptionsChange(newOptions);
    };

    return (
      <div className="space-y-4">
        <LayoutComponent
          showHeader={layoutOptions.showHeader}
          showFooter={layoutOptions.showFooter}
          fullWidth={layoutOptions.fullWidth}
          backgroundColor={layoutOptions.backgroundColor}
          showTitle={layoutOptions.showTitle}
          onLayoutChange={handleLayoutChange}
        />
      </div>
    );
  };

  const renderPropertyInput = (key: string, propConfig: any, value: any) => {
    switch (propConfig.type) {
      case 'text':
        return (
          <Input
            id={key}
            value={value || ''}
            onChange={(e) => updateProp(key, e.target.value)}
          />
        );
      case 'textarea':
        return (
          <Textarea
            id={key}
            value={value || ''}
            onChange={(e) => updateProp(key, e.target.value)}
          />
        );
      case 'number':
        return (
          <Input
            id={key}
            type="number"
            value={value || ''}
            onChange={(e) => updateProp(key, parseFloat(e.target.value) || 0)}
          />
        );
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={key}
              checked={value || false}
              onCheckedChange={(checked) => updateProp(key, checked)}
            />
            <Label htmlFor={key}>{propConfig.label}</Label>
          </div>
        );
      case 'color':
        return (
          <div className="flex items-center space-x-2">
            <Input
              id={key}
              type="color"
              value={value || '#000000'}
              onChange={(e) => updateProp(key, e.target.value)}
              className="w-16 h-10 p-1"
            />
            <Input
              type="text"
              value={value || '#000000'}
              onChange={(e) => updateProp(key, e.target.value)}
              className="flex-1"
            />
          </div>
        );
      case 'select':
        return (
          <Select
            value={value || propConfig.options?.[0] || ''}
            onValueChange={(newValue) => updateProp(key, newValue)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {propConfig.options?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'image':
        return (
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">{propConfig.label}</Label>

            {value ? (
              <div className="relative group">
                <img
                  src={value}
                  alt=""
                  className="w-full h-32 object-cover rounded border"
                />
                <button
                  onClick={() => updateProp(key, "")}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full text-xs px-2 opacity-80 hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="border border-dashed rounded p-3 text-center text-xs text-gray-500">
                No image selected
              </div>
            )}

            <Button
              onClick={() => setMediaModalOpen(prev => ({ ...prev, [key]: true }))}
              className="text-xs text-blue-600 underline"
              variant="link"
              size="sm"
            >
              Select Image
            </Button>

            <Dialog 
              open={mediaModalOpen[key] || false} 
              onOpenChange={(open) => setMediaModalOpen(prev => ({ ...prev, [key]: open }))}
            >
              <DialogContent className="max-w-4xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>Select Image</DialogTitle>
                </DialogHeader>
                <MediaLibrary
                  onMediaSelect={(media: Media) => {
                    updateProp(key, media.url);
                    setMediaModalOpen(prev => ({ ...prev, [key]: false }));
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        );
      case 'list':
        const list = value || [];
        return (
          <div className="space-y-3">
            {list.map((item: any, index: number) => (
              <div
                key={index}
                className="border p-3 rounded bg-gray-50 space-y-2"
              >
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-semibold text-gray-600">
                    {propConfig.label} #{index + 1}
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const updated = list.filter((_: any, i: number) => i !== index);
                      updateProp(key, updated);
                    }}
                    className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                </div>
                {propConfig.itemSchema && Object.entries(propConfig.itemSchema).map(([subKey, subConfig]: [string, any]) => (
                  <div key={subKey}>
                    <Label className="text-xs text-gray-500">{subConfig.label}</Label>
                    {renderPropertyInput(`${key}.${index}.${subKey}`, subConfig, item[subKey])}
                  </div>
                ))}
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newItem: Record<string, any> = {};
                if (propConfig.itemSchema) {
                  Object.entries(propConfig.itemSchema).forEach(([subKey, subConfig]: [string, any]) => {
                    newItem[subKey] = subConfig.defaultValue || '';
                  });
                }
                const updated = [...list, newItem];
                updateProp(key, updated);
              }}
              className="w-full"
            >
              + Add New Item
            </Button>
          </div>
        );
      default:
        return (
          <Input
            id={key}
            value={value || ''}
            onChange={(e) => updateProp(key, e.target.value)}
          />
        );
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>
          {componentType ? `${componentType.charAt(0).toUpperCase() + componentType.slice(1)} Properties` : 'Page Properties'}
          {isLocked && <Lock className="inline-block ml-2 h-4 w-4" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        {/* Move buttons at the top */}
        {(onMoveUp || onMoveDown) && (
          <div className="flex justify-center gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onMoveUp}
              disabled={!canMoveUp}
              className="flex items-center gap-1"
            >
              <ArrowUp className="h-4 w-4" />
              Move Up
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onMoveDown}
              disabled={!canMoveDown}
              className="flex items-center gap-1"
            >
              <ArrowDown className="h-4 w-4" />
              Move Down
            </Button>
          </div>
        )}
        
        {/* Tabbed interface for Content, Style, and Layout */}
        {componentType || layoutOptions ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="style">Style</TabsTrigger>
            </TabsList>
            <TabsContent value="content" className="mt-4">
              {isLocked ? (
                <Alert>
                  <Lock className="h-4 w-4" />
                  <AlertDescription>
                    This component is locked. Unlock it to make changes.
                  </AlertDescription>
                </Alert>
              ) : (
                getContentProperties()
              )}
            </TabsContent>
            <TabsContent value="style" className="mt-4">
              {isLocked ? (
                <Alert>
                  <Lock className="h-4 w-4" />
                  <AlertDescription>
                    This component is locked. Unlock it to make changes.
                  </AlertDescription>
                </Alert>
              ) : (
                getStyleProperties()
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <p>Select a component to edit its properties</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PropertiesPanel;