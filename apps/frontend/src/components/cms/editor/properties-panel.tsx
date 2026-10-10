'use client';

import { toPropertySchema } from '../schemas/property-schema-adapter';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import NextImage from 'next/image';
import MediaPicker from '@/components/media/MediaPicker';
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
import { Lock, ArrowUp, ArrowDown, X, Image as ImageIcon, Plus, GripVertical, Trash2, Video as VideoIcon, Play, Loader2, Save } from 'lucide-react';
import { LucideIconPicker } from './lucide-icon-picker';
import { allBlockSchemas } from '@/components/cms/schemas';
import { blockRegistry } from '@/components/cms/block-registry';
import { DynamicFormGenerator } from '@/components/cms/reusable/dynamic-form-generator';
import { ReusableComponentsService } from '@/services/reusable-content.service';
import { Media } from '@/lib/media/types';
import { Skeleton } from '@/components/loading/skeleton';
import { useToast } from '@/hooks/use-toast';

// Lazy load MediaLibrary - only loaded when media selector is opened
const MediaLibrary = dynamic(
  () => import('@/components/cms/editor/media-library').then(mod => ({ default: mod.MediaLibrary })),
  {
    loading: () => <Skeleton className="h-[400px] w-full" />,
    ssr: false,
  }
);

interface ComponentProps {
  [key: string]: any;
}

interface PropertiesPanelProps {
  componentType: string;
  componentProps: ComponentProps;
  onPropsChange: (props: ComponentProps) => void;
  isLocked?: boolean; // Add locked state
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  reusableComponentId?: string; // ID of reusable component from database
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
  reusableComponentId,
}) => {
  const [localProps, setLocalProps] = useState<ComponentProps>(componentProps);
  const [activeTab, setActiveTab] = useState<'content' | 'style' | 'advanced'>('content');
  const [mediaModalOpen, setMediaModalOpen] = useState<Record<string, boolean>>({});
  const [loadingMedia, setLoadingMedia] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Handle saving reusable component changes to database
  const handleSaveToLibrary = async () => {
    if (!reusableComponentId || !componentProps.blockId) {
      toast({
        title: "Cannot Save",
        description: "This is not a reusable component",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await ReusableComponentsService.update(reusableComponentId, {
        props: localProps,
      });

      toast({
        title: "Saved Successfully",
        description: "Component changes have been saved to the library",
      });
    } catch (error) {
      console.error('Failed to save reusable component:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save component changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Normalize component type - detect if it's a block component
  const normalizedComponentType = (() => {
    const knownTypes = ['text', 'button', 'image', 'video', 'container', 'gallery'];

    // If it's a known basic type, return as is
    if (knownTypes.includes(componentType)) {
      return componentType;
    }

    // If it's not a known type, it's likely a block component (nav-logo-cta, hero-split, etc.)
    // Check if componentProps has blockId or if componentType looks like a block ID
    if (componentType.includes('-') || componentProps.blockId) {
      return 'block';
    }

    // Fallback to original type
    return componentType;
  })();

  // ✅ FIXED: Only sync when component selection changes, not on every prop update
  // This prevents race condition where parent updates overwrite user's rapid edits
  useEffect(() => {
    setLocalProps(componentProps);
  }, [componentType]); // Use componentType instead of selectedComponentId

  // ✅ FIXED: Debounced callback to parent (prevents history flooding)
  // Batches rapid changes into single history entry after 500ms of inactivity
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedPropsChange = useCallback((props: any) => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer (500ms debounce)
    debounceTimerRef.current = setTimeout(() => {
      onPropsChange(props);
    }, 500);
  }, [onPropsChange]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const updateProp = (key: string, value: any) => {
    // Don't allow changes to locked components
    if (isLocked) return;

    let newProps = { ...localProps };

    // Handle nested properties (for list items)
    if (key.includes('.')) {
      const parts = key.split('.');
      if (parts.length === 3) {
        // Format: "items.0.question" - updating a specific item in a list
        const [listKey, indexStr, itemKey] = parts;
        const index = parseInt(indexStr, 10);

        // Create a copy of the list
        const list = [...(newProps[listKey] || [])];

        // Update the specific item
        if (list[index]) {
          list[index] = { ...list[index], [itemKey]: value };
        } else {
          // Create the item if it doesn't exist
          list[index] = { [itemKey]: value };
        }

        newProps = { ...newProps, [listKey]: list };
      }
    } else {
      // Regular property update
      newProps = { ...newProps, [key]: value };
    }

    // ✅ Instant local UI feedback
    setLocalProps(newProps);

    // ✅ Debounced parent notification (prevents history spam)
    debouncedPropsChange(newProps);
  };

  // ============================================================================
  // CONTENT PROPERTIES (What to display)
  // ============================================================================

  const renderTextContentProperties = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={localProps.content || ''}
          onChange={(e) => updateProp('content', e.target.value)}
          disabled={isLocked}
          rows={4}
        />
      </div>
    </div>
  );

  // ============================================================================
  // STYLE PROPERTIES (How to style)
  // ============================================================================

  const renderTextStyleProperties = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="variant">Typography Variant</Label>
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
        <Label htmlFor="align">Text Alignment</Label>
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
        <Label htmlFor="color">Text Color</Label>
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

      <div className="space-y-2">
        <Label htmlFor="weight">Font Weight</Label>
        <Select
          value={localProps.weight || 'normal'}
          onValueChange={(value) => updateProp('weight', value)}
          disabled={isLocked}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="semibold">Semibold</SelectItem>
            <SelectItem value="bold">Bold</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // Backward compatibility wrapper
  const renderTextProperties = () => renderTextContentProperties();

  const renderButtonContentProperties = () => (
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
          placeholder="https://example.com or /page"
          disabled={isLocked}
        />
      </div>
    </div>
  );

  const renderButtonStyleProperties = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="variant">Button Variant</Label>
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
        <Label htmlFor="size">Button Size</Label>
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
        <Label htmlFor="disabled">Disabled State</Label>
      </div>
    </div>
  );

  // Backward compatibility wrapper
  const renderButtonProperties = () => renderButtonContentProperties();

  const renderImageContentProperties = () => (
    <div className="space-y-4">
      {/* Media Picker */}
      <div className="space-y-2">
        <Label>Image</Label>
        <MediaPicker
          value={localProps.mediaId || null}
          onChange={async (mediaId) => {
            if (mediaId) {
              setLoadingMedia({ ...loadingMedia, image: true });
              try {
                const res = await fetch(`/api/media/${mediaId}`);
                if (!res.ok) throw new Error('Failed to fetch media');

                const media = await res.json();
                updateProp('mediaId', mediaId);
                updateProp('src', media.url);
                if (!localProps.alt) {
                  updateProp('alt', media.title || media.originalName);
                }

                toast({
                  title: "Image selected",
                  description: media.title || media.originalName,
                });
              } catch (err) {
                console.error('Failed to fetch media:', err);
                toast({
                  title: "Error",
                  description: "Failed to load image. Please try again.",
                  variant: "destructive",
                });
              } finally {
                setLoadingMedia({ ...loadingMedia, image: false });
              }
            } else {
              updateProp('mediaId', null);
              updateProp('src', '');
            }
          }}
          placeholder="Select an image"
        />
        {loadingMedia.image && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading image...
          </div>
        )}
      </div>

      {/* Preview */}
      {localProps.src && (
        <div className="space-y-2">
          <Label>Preview</Label>
          <div className="relative w-full h-48 border rounded-md overflow-hidden bg-muted">
            <NextImage
              src={localProps.src}
              alt={localProps.alt || 'Image preview'}
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}

      {/* Manual URL Input (fallback) */}
      <div className="space-y-2">
        <Label htmlFor="src">Image URL (Manual)</Label>
        <Input
          id="src"
          value={localProps.src || ''}
          onChange={(e) => updateProp('src', e.target.value)}
          disabled={isLocked}
          placeholder="https://example.com/image.jpg"
        />
        <p className="text-xs text-muted-foreground">
          Or use the media picker above
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="alt">Alt Text</Label>
        <Input
          id="alt"
          value={localProps.alt || ''}
          onChange={(e) => updateProp('alt', e.target.value)}
          disabled={isLocked}
          placeholder="Describe the image"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="caption">Caption (optional)</Label>
        <Input
          id="caption"
          value={localProps.caption || ''}
          onChange={(e) => updateProp('caption', e.target.value)}
          disabled={isLocked}
          placeholder="Image caption"
        />
      </div>
    </div>
  );

  const renderImageStyleProperties = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="width">Width</Label>
          <Input
            type="text"
            id="width"
            value={localProps.width || ''}
            onChange={(e) => updateProp('width', e.target.value)}
            disabled={isLocked}
            placeholder="auto or 500px"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="height">Height</Label>
          <Input
            type="text"
            id="height"
            value={localProps.height || ''}
            onChange={(e) => updateProp('height', e.target.value)}
            disabled={isLocked}
            placeholder="auto or 300px"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="objectFit">Object Fit</Label>
        <Select
          value={localProps.objectFit || 'cover'}
          onValueChange={(value) => updateProp('objectFit', value)}
          disabled={isLocked}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cover">Cover</SelectItem>
            <SelectItem value="contain">Contain</SelectItem>
            <SelectItem value="fill">Fill</SelectItem>
            <SelectItem value="none">None</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rounded">Border Radius</Label>
        <Select
          value={localProps.rounded || 'none'}
          onValueChange={(value) => updateProp('rounded', value)}
          disabled={isLocked}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="sm">Small</SelectItem>
            <SelectItem value="md">Medium</SelectItem>
            <SelectItem value="lg">Large</SelectItem>
            <SelectItem value="full">Full (Circle)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // Backward compatibility wrapper
  const renderImageProperties = () => renderImageContentProperties();

  const renderContainerContentProperties = () => (
    <div className="text-center text-muted-foreground py-8">
      <p>Container has no editable content</p>
      <p className="text-sm mt-2">Containers hold other components</p>
    </div>
  );

  const renderContainerStyleProperties = () => (
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

  // Backward compatibility wrapper
  const renderContainerProperties = () => renderContainerContentProperties();

  /**
   * BLOCK COMPONENT PROPERTIES
   * Blocks have dynamic properties based on blockId
   * We categorize them into Content and Style properties
   */

  // Content properties keywords
  const isContentProperty = (propName: string): boolean => {
    const contentKeywords = [
      'text', 'title', 'subtitle', 'description', 'content',
      'url', 'href', 'link', 'alt', 'caption', 'author', 'role',
      'items', 'nav', 'cta', 'button', 'logo', 'social',
      'heading', 'subheading', 'label', 'placeholder', 'name',
      'email', 'phone', 'address', 'company', 'position', 'type'
    ];

    const lowerProp = propName.toLowerCase();
    return contentKeywords.some(keyword => lowerProp.includes(keyword));
  };

  // Style properties keywords
  const isStyleProperty = (propName: string): boolean => {
    const styleKeywords = [
      'color', 'background', 'padding', 'margin', 'width', 'height',
      'size', 'variant', 'align', 'weight', 'border', 'shadow',
      'opacity', 'radius', 'rounded', 'spacing', 'gap', 'font'
    ];

    const lowerProp = propName.toLowerCase();
    return styleKeywords.some(keyword => lowerProp.includes(keyword));
  };

  // Helper function to render a single property input (moved to component level)
  const renderPropertyInput = (key: string, propConfig: any, value: any) => {
    // Special handling for mediaId fields (logoMediaId, imageMediaId, etc.)
    if (key.toLowerCase().includes('mediaid')) {
      // Determine the corresponding URL field name (logoMediaId -> logoUrl, imageMediaId -> imageUrl)
      const urlFieldName = key.replace(/MediaId$/i, 'Url').replace(/mediaid$/i, 'url');
      const currentUrl = localProps[urlFieldName];

      return (
        <div className="space-y-2">
          <div className="border rounded-lg p-3 bg-gray-50">
            <MediaPicker
              value={value || undefined}
              onChange={async (mediaId) => {
                if (mediaId) {
                  // Update mediaId
                  updateProp(key, mediaId);

                  // Fetch and update corresponding URL field
                  try {
                    const response = await fetch(`/api/media/${mediaId}`);

                    if (!response.ok) {
                      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    const data = await response.json();

                    // ✅ FIXED: Backend returns Media entity with url field
                    // Support both direct response and nested data
                    const mediaUrl = data?.url || data?.data?.url;

                    if (mediaUrl) {
                      updateProp(urlFieldName, mediaUrl);
                    } else {
                      // Log full response for debugging
                      console.warn('Media response missing URL:', data);
                      throw new Error('Media URL not found in response');
                    }
                  } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                    console.error('Error fetching media URL:', errorMessage, err);
                    toast({
                      title: 'Medya Yükleme Hatası',
                      description: `URL alınamadı: ${errorMessage}`,
                      variant: 'destructive',
                    });
                  }
                } else {
                  // Clear both mediaId and URL
                  updateProp(key, null);
                  updateProp(urlFieldName, '');
                }
              }}
              placeholder={`Select ${propConfig.label || 'media'}`}
            />
          </div>
          {currentUrl && (
            <div className="relative group">
              <NextImage
                src={currentUrl}
                alt="Preview"
                width={300}
                height={128}
                className="w-full h-32 object-contain rounded border bg-white"
              />
              <button
                onClick={() => {
                  updateProp(key, null);
                  updateProp(urlFieldName, '');
                }}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-80 hover:opacity-100"
                disabled={isLocked}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {value && (
            <div className="text-xs text-muted-foreground">
              Media ID: {value}
            </div>
          )}
        </div>
      );
    }

    // Debug: Log propConfig.type for troubleshooting
    console.log('[DEBUG] renderPropertyInput:', { key, type: propConfig.type, propConfig });

    switch (propConfig.type) {
      case 'text':
        return (
          <Input
            id={key}
            value={value || ''}
            onChange={(e) => updateProp(key, e.target.value)}
            disabled={isLocked}
          />
        );
      case 'textarea':
        return (
          <Textarea
            id={key}
            value={value || ''}
            onChange={(e) => updateProp(key, e.target.value)}
            disabled={isLocked}
          />
        );
      case 'number':
        return (
          <Input
            id={key}
            type="number"
            value={value || ''}
            onChange={(e) => updateProp(key, parseFloat(e.target.value) || 0)}
            disabled={isLocked}
          />
        );
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={key}
              checked={value || false}
              onCheckedChange={(checked) => updateProp(key, checked)}
              disabled={isLocked}
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
              disabled={isLocked}
            />
            <Input
              type="text"
              value={value || '#000000'}
              onChange={(e) => updateProp(key, e.target.value)}
              className="flex-1"
              disabled={isLocked}
            />
          </div>
        );
      case 'select':
        return (
          <Select
            value={value || propConfig.options?.[0] || ''}
            onValueChange={(newValue) => updateProp(key, newValue)}
            disabled={isLocked}
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
      case 'icon':
        return (
          <LucideIconPicker
            value={value || null}
            onChange={(iconName) => updateProp(key, iconName)}
            disabled={isLocked}
          />
        );
      case 'image':
        // Special handling for logo images - use MediaPicker
        if (key.toLowerCase().includes('logo')) {
          return (
            <div className="space-y-2">
              <div className="border rounded-lg p-3 bg-gray-50">
                <MediaPicker
                  value={undefined}
                  onChange={(mediaId) => {
                    if (mediaId) {
                      fetch(`/api/media/${mediaId}`)
                        .then(res => res.json())
                        .then(data => {
                          if (data.url) {
                            updateProp(key, data.url);
                          }
                        })
                        .catch(err => console.error('Error fetching media URL:', err));
                    } else {
                      updateProp(key, '');
                    }
                  }}
                  placeholder="Select logo image"
                  filterType="image"
                />
              </div>
              {value && (
                <div className="relative group">
                  <NextImage
                    src={value}
                    alt="Logo preview"
                    width={300}
                    height={128}
                    className="w-full h-32 object-contain rounded border bg-white"
                  />
                  <button
                    onClick={() => updateProp(key, "")}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-80 hover:opacity-100"
                    disabled={isLocked}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          );
        }

        // Default image handling
        return (
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">{propConfig.label}</Label>
            {value ? (
              <div className="relative group">
                <NextImage
                  src={value}
                  alt="Property image"
                  width={300}
                  height={128}
                  className="w-full h-32 object-cover rounded border"
                />
                <button
                  onClick={() => updateProp(key, "")}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full text-xs px-2 opacity-80 hover:opacity-100"
                  disabled={isLocked}
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
              disabled={isLocked}
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
                    disabled={isLocked}
                  >
                    ×
                  </Button>
                </div>
                {propConfig.itemSchema && Object.entries(propConfig.itemSchema).map(([subKey, subConfig]: [string, any]) => {
                  // Debug log for icon type issue
                  if (subConfig.type === 'icon') {
                    console.log('[DEBUG] Icon field found:', { subKey, subConfig, value: item[subKey] });
                  }
                  return (
                    <div key={subKey}>
                      <Label className="text-xs text-gray-500">{subConfig.label}</Label>
                      {renderPropertyInput(`${key}.${index}.${subKey}`, subConfig, item[subKey])}
                    </div>
                  );
                })}
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
              disabled={isLocked}
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
            disabled={isLocked}
          />
        );
    }
  };

  const renderBlockContentProperties = () => {
    // Check if this is a reusable component with blockId in componentProps
    const blockId = componentProps.blockId || componentType;

    if (!blockId) {
      return (
        <div className="text-center text-muted-foreground py-8">
          <p>Block ID not found</p>
        </div>
      );
    }

    // Get block configuration from V2 schema registry
    const blockSchema = allBlockSchemas[blockId];
    const blockConfig = blockSchema ? toPropertySchema(blockSchema.propSchema) : undefined;

    if (!blockConfig) {
      return (
        <div className="text-center text-muted-foreground py-8">
          <p>Block configuration not found for: {blockId}</p>
        </div>
      );
    }

    // If this is a reusable component (has blockId in props), use DynamicFormGenerator
    if (componentProps.blockId) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              Reusable Block: {blockId}
            </div>
            {reusableComponentId && (
              <Button
                size="sm"
                onClick={handleSaveToLibrary}
                disabled={isSaving || isLocked}
                className="h-7"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-3 w-3 mr-1" />
                    Save to Library
                  </>
                )}
              </Button>
            )}
          </div>

          <DynamicFormGenerator
            schema={blockSchema.propSchema}
            values={localProps}
            onChange={(key, value) => updateProp(key, value)}
          />
        </div>
      );
    }

    // Get all content properties from block config (not just from localProps)
    const contentPropertyKeys = Object.keys(blockConfig).filter(key => {
      // Exclude style properties and className
      if (isStyleProperty(key) || key === 'className') return false;

      // Exclude URL fields if corresponding mediaId field exists
      // (logoUrl hidden if logoMediaId exists, imageUrl hidden if imageMediaId exists)
      if (key.toLowerCase().endsWith('url')) {
        const mediaIdKey = key.replace(/Url$/i, 'MediaId');
        if (blockConfig[mediaIdKey]) {
          return false; // Hide URL field, use MediaPicker via mediaId instead
        }
      }

      return true;
    });

    if (contentPropertyKeys.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8">
          <p>No content properties</p>
          <p className="text-sm mt-2">This block is style-only</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
          Block: {blockId}
        </div>

        {/* Render all properties from block config */}
        {contentPropertyKeys.map(propKey => {
          const propConfig = blockConfig[propKey];
          const propValue = localProps[propKey] !== undefined ? localProps[propKey] : propConfig.defaultValue;

          return (
            <div key={propKey} className="space-y-2">
              <Label htmlFor={propKey} className="text-sm font-medium">
                {propConfig.label || propKey.replace(/([A-Z])/g, ' $1').trim()}
              </Label>
              {renderPropertyInput(propKey, propConfig, propValue)}
            </div>
          );
        })}
      </div>
    );
  };

  const renderBlockStyleProperties = () => {
    // Check if this is a reusable component with blockId in componentProps
    const blockId = componentProps.blockId || componentType;

    if (!blockId) {
      return (
        <div className="text-center text-muted-foreground py-8">
          <p>Block ID not found</p>
        </div>
      );
    }

    // Get block configuration from V2 schema registry
    const blockSchema = allBlockSchemas[blockId];
    const blockConfig = blockSchema ? toPropertySchema(blockSchema.propSchema) : undefined;

    if (!blockConfig) {
      return (
        <div className="text-center text-muted-foreground py-8">
          <p>Block configuration not found for: {blockId}</p>
        </div>
      );
    }

    // Filter style properties from block configuration
    // For reusable components (blockId exists), we still show style properties here
    // instead of relegating them to Content tab for better UX
    const stylePropertyKeys = Object.keys(blockConfig).filter(key =>
      isStyleProperty(key) && key !== 'className'
    );

    if (stylePropertyKeys.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8">
          <p>No style properties</p>
          <p className="text-sm mt-2">Use Advanced tab for styling</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
          Block: {blockId}
        </div>
        {stylePropertyKeys.map(propKey => {
          const propConfig = blockConfig[propKey];
          const propValue = localProps[propKey] !== undefined ? localProps[propKey] : propConfig.defaultValue;

          // Skip undefined/null values
          if (propValue === undefined || propValue === null) return null;

          // Handle color
          if (propKey.toLowerCase().includes('color')) {
            return (
              <div key={propKey} className="space-y-2">
                <Label htmlFor={propKey}>
                  {propConfig.label || propKey.replace(/([A-Z])/g, ' $1').trim()}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id={propKey}
                    type="color"
                    value={String(propValue)}
                    onChange={(e) => updateProp(propKey, e.target.value)}
                    disabled={isLocked}
                    className="w-16 h-10"
                  />
                  <Input
                    type="text"
                    value={String(propValue)}
                    onChange={(e) => updateProp(propKey, e.target.value)}
                    disabled={isLocked}
                    placeholder="#000000"
                  />
                </div>
              </div>
            );
          }

          // Handle number
          if (typeof propValue === 'number') {
            return (
              <div key={propKey} className="space-y-2">
                <Label htmlFor={propKey}>
                  {propConfig.label || propKey.replace(/([A-Z])/g, ' $1').trim()}
                </Label>
                <Input
                  id={propKey}
                  type="number"
                  value={propValue}
                  onChange={(e) => updateProp(propKey, Number(e.target.value))}
                  disabled={isLocked}
                />
              </div>
            );
          }

          // Handle boolean
          if (typeof propValue === 'boolean') {
            return (
              <div key={propKey} className="flex items-center space-x-2">
                <Checkbox
                  id={propKey}
                  checked={propValue}
                  onCheckedChange={(checked) => updateProp(propKey, checked)}
                  disabled={isLocked}
                />
                <Label htmlFor={propKey} className="text-sm">
                  {propConfig.label || propKey.replace(/([A-Z])/g, ' $1').trim()}
                </Label>
              </div>
            );
          }

          // Handle select
          if (propConfig.type === 'select' && propConfig.options) {
            return (
              <div key={propKey} className="space-y-2">
                <Label htmlFor={propKey}>
                  {propConfig.label || propKey.replace(/([A-Z])/g, ' $1').trim()}
                </Label>
                <Select
                  value={String(propValue)}
                  onValueChange={(value) => updateProp(propKey, value)}
                  disabled={isLocked}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {propConfig.options.map((option: string) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          }

          // Default: text input
          return (
            <div key={propKey} className="space-y-2">
              <Label htmlFor={propKey}>
                {propConfig.label || propKey.replace(/([A-Z])/g, ' $1').trim()}
              </Label>
              <Input
                id={propKey}
                type="text"
                value={String(propValue)}
                onChange={(e) => updateProp(propKey, e.target.value)}
                disabled={isLocked}
              />
            </div>
          );
        })}
      </div>
    );
  };

  const renderGalleryProperties = () => {
    const items = localProps.items || [];

    const addItem = () => {
      const newItems = [
        ...items,
        {
          mediaId: null,
          image: '/placeholder-image.jpg',
          title: `Item ${items.length + 1}`,
          caption: '',
        },
      ];
      updateProp('items', newItems);
    };

    const removeItem = (index: number) => {
      const newItems = items.filter((_: any, i: number) => i !== index);
      updateProp('items', newItems);
    };

    const updateItem = (index: number, field: string, value: any) => {
      const newItems = [...items];
      newItems[index] = { ...newItems[index], [field]: value };
      updateProp('items', newItems);
    };

    const moveItem = (fromIndex: number, toIndex: number) => {
      if (toIndex < 0 || toIndex >= items.length) return;
      const newItems = [...items];
      const [movedItem] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, movedItem);
      updateProp('items', newItems);
    };

    return (
      <div className="space-y-4">
        {/* Gallery Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Gallery Title</Label>
          <Input
            id="title"
            value={localProps.title || ''}
            onChange={(e) => updateProp('title', e.target.value)}
            disabled={isLocked}
            placeholder="Featured Highlights"
          />
        </div>

        {/* Gallery Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Gallery Items ({items.length})</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addItem}
              disabled={isLocked}
              className="h-8"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Image
            </Button>
          </div>

          {items.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No images yet</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addItem}
                disabled={isLocked}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add First Image
              </Button>
            </div>
          )}

          {items.map((item: any, index: number) => (
            <div
              key={index}
              className="border rounded-lg p-3 space-y-3 bg-muted/50"
            >
              {/* Item Header with Drag Handle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                  <span className="text-sm font-medium">Image {index + 1}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => moveItem(index, index - 1)}
                    disabled={isLocked || index === 0}
                    className="h-7 w-7 p-0"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => moveItem(index, index + 1)}
                    disabled={isLocked || index === items.length - 1}
                    className="h-7 w-7 p-0"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeItem(index)}
                    disabled={isLocked}
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* MediaPicker */}
              <div className="space-y-2">
                <Label>Image</Label>
                <MediaPicker
                  value={item.mediaId || null}
                  onChange={(mediaId) => {
                    if (mediaId) {
                      fetch(`/api/media/${mediaId}`)
                        .then((res) => res.json())
                        .then((media) => {
                          updateItem(index, 'mediaId', mediaId);
                          updateItem(index, 'image', media.url);
                          if (!item.title) {
                            updateItem(index, 'title', media.title || media.originalName);
                          }
                        })
                        .catch((err) => console.error('Failed to fetch media:', err));
                    } else {
                      updateItem(index, 'mediaId', null);
                      updateItem(index, 'image', '');
                    }
                  }}
                  placeholder="Select an image"
                />
              </div>

              {/* Preview */}
              {item.image && (
                <div className="relative w-full h-32 border rounded overflow-hidden bg-background">
                  <NextImage
                    src={item.image}
                    alt={item.title || `Image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              {/* Title */}
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={item.title || ''}
                  onChange={(e) => updateItem(index, 'title', e.target.value)}
                  disabled={isLocked}
                  placeholder="Image title"
                />
              </div>

              {/* Caption (optional) */}
              <div className="space-y-2">
                <Label>Caption (optional)</Label>
                <Textarea
                  value={item.caption || ''}
                  onChange={(e) => updateItem(index, 'caption', e.target.value)}
                  disabled={isLocked}
                  placeholder="Image caption or description"
                  rows={2}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderVideoProperties = () => (
    <div className="space-y-4">
      {/* Video Source */}
      <div className="space-y-2">
        <Label>Video</Label>
        <MediaPicker
          value={localProps.mediaId || null}
          onChange={async (mediaId) => {
            if (mediaId) {
              setLoadingMedia({ ...loadingMedia, video: true });
              try {
                const res = await fetch(`/api/media/${mediaId}`);
                if (!res.ok) throw new Error('Failed to fetch media');

                const media = await res.json();
                updateProp('mediaId', mediaId);
                updateProp('src', media.url);
                if (!localProps.title) {
                  updateProp('title', media.title || media.originalName);
                }

                toast({
                  title: "Video selected",
                  description: media.title || media.originalName,
                });
              } catch (err) {
                console.error('Failed to fetch media:', err);
                toast({
                  title: "Error",
                  description: "Failed to load video. Please try again.",
                  variant: "destructive",
                });
              } finally {
                setLoadingMedia({ ...loadingMedia, video: false });
              }
            } else {
              updateProp('mediaId', null);
              updateProp('src', '');
            }
          }}
          filterType="video"
          placeholder="Select a video"
        />
        {loadingMedia.video && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading video...
          </div>
        )}
      </div>

      {/* Video Preview */}
      {localProps.src && (
        <div className="space-y-2">
          <Label>Preview</Label>
          <div className="relative w-full border rounded-md overflow-hidden bg-black">
            <video
              src={localProps.src}
              poster={localProps.poster}
              controls
              className="w-full"
              style={{ maxHeight: '300px' }}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}

      {/* Manual URL Input (fallback) */}
      <div className="space-y-2">
        <Label htmlFor="src">Video URL (Manual)</Label>
        <Input
          id="src"
          value={localProps.src || ''}
          onChange={(e) => updateProp('src', e.target.value)}
          disabled={isLocked}
          placeholder="https://example.com/video.mp4"
        />
        <p className="text-xs text-muted-foreground">
          Or use the media picker above
        </p>
      </div>

      {/* Poster Image (Thumbnail) */}
      <div className="space-y-2">
        <Label>Poster Image (Thumbnail)</Label>
        <MediaPicker
          value={localProps.posterMediaId || null}
          onChange={async (mediaId) => {
            if (mediaId) {
              setLoadingMedia({ ...loadingMedia, poster: true });
              try {
                const res = await fetch(`/api/media/${mediaId}`);
                if (!res.ok) throw new Error('Failed to fetch media');

                const media = await res.json();
                updateProp('posterMediaId', mediaId);
                updateProp('poster', media.url);

                toast({
                  title: "Poster image selected",
                  description: media.title || media.originalName,
                });
              } catch (err) {
                console.error('Failed to fetch media:', err);
                toast({
                  title: "Error",
                  description: "Failed to load poster image. Please try again.",
                  variant: "destructive",
                });
              } finally {
                setLoadingMedia({ ...loadingMedia, poster: false });
              }
            } else {
              updateProp('posterMediaId', null);
              updateProp('poster', '');
            }
          }}
          filterType="image"
          placeholder="Select poster image"
        />
        {loadingMedia.poster && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading poster...
          </div>
        )}
      </div>

      {/* Poster Preview */}
      {localProps.poster && (
        <div className="space-y-2">
          <Label>Poster Preview</Label>
          <div className="relative w-full h-32 border rounded-md overflow-hidden bg-muted">
            <NextImage
              src={localProps.poster}
              alt="Video poster"
              fill
              className="object-cover"
            />
          </div>
        </div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={localProps.title || ''}
          onChange={(e) => updateProp('title', e.target.value)}
          disabled={isLocked}
          placeholder="Video title"
        />
      </div>

      {/* Caption */}
      <div className="space-y-2">
        <Label htmlFor="caption">Caption (optional)</Label>
        <Textarea
          id="caption"
          value={localProps.caption || ''}
          onChange={(e) => updateProp('caption', e.target.value)}
          disabled={isLocked}
          placeholder="Video description"
          rows={2}
        />
      </div>

      {/* Video Controls */}
      <div className="space-y-3 pt-3 border-t">
        <Label className="text-sm font-semibold">Playback Options</Label>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="controls"
            checked={localProps.controls !== false}
            onCheckedChange={(checked) => updateProp('controls', checked)}
            disabled={isLocked}
          />
          <Label htmlFor="controls" className="font-normal cursor-pointer">
            Show controls
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="autoplay"
            checked={localProps.autoplay || false}
            onCheckedChange={(checked) => updateProp('autoplay', checked)}
            disabled={isLocked}
          />
          <Label htmlFor="autoplay" className="font-normal cursor-pointer">
            Autoplay
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="loop"
            checked={localProps.loop || false}
            onCheckedChange={(checked) => updateProp('loop', checked)}
            disabled={isLocked}
          />
          <Label htmlFor="loop" className="font-normal cursor-pointer">
            Loop video
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="muted"
            checked={localProps.muted || false}
            onCheckedChange={(checked) => updateProp('muted', checked)}
            disabled={isLocked}
          />
          <Label htmlFor="muted" className="font-normal cursor-pointer">
            Muted by default
          </Label>
        </div>
      </div>

      {/* Dimensions */}
      <div className="grid grid-cols-2 gap-4 pt-3 border-t">
        <div className="space-y-2">
          <Label>Width</Label>
          <Input
            type="text"
            value={localProps.width || ''}
            onChange={(e) => updateProp('width', e.target.value)}
            disabled={isLocked}
            placeholder="100% or 800px"
          />
        </div>

        <div className="space-y-2">
          <Label>Height</Label>
          <Input
            type="text"
            value={localProps.height || ''}
            onChange={(e) => updateProp('height', e.target.value)}
            disabled={isLocked}
            placeholder="auto or 450px"
          />
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // 3-TAB SYSTEM: Content | Style | Advanced
  // ============================================================================

  /**
   * TAB 1: CONTENT PROPERTIES
   * Purpose: "What to display?" - Semantic properties
   * Properties: title, subtitle, content, text, buttonText, imageUrl, mediaId,
   *            alt, caption, href, link, items[], author, role, etc.
   */
  const getContentProperties = () => {
    switch (normalizedComponentType) {
      case 'text':
        return renderTextProperties();
      case 'button':
        return renderButtonProperties();
      case 'image':
        return renderImageProperties();
      case 'video':
        return renderVideoProperties();
      case 'container':
        return renderContainerProperties();
      case 'block':
        // Block content properties - dynamic based on blockId
        return renderBlockContentProperties();
      default:
        return (
          <div className="text-center text-muted-foreground py-8">
            <p>Select a component to edit content</p>
          </div>
        );
    }
  };

  /**
   * TAB 2: STYLE PROPERTIES
   * Purpose: "How to style?" - Typography & visual styles
   * Properties: variant, align, color, weight, size, buttonVariant,
   *            imageWidth, imageHeight, typography props (titleVariant,
   *            titleAlign, titleColor, titleWeight, etc.)
   */
  const getStyleProperties = () => {
    switch (normalizedComponentType) {
      case 'text':
        return renderTextStyleProperties();
      case 'button':
        return renderButtonStyleProperties();
      case 'image':
        return renderImageStyleProperties();
      case 'container':
        return renderContainerStyleProperties();
      case 'block':
        // Block styling properties - dynamic based on blockId
        return renderBlockStyleProperties();
      default:
        return (
          <div className="text-center text-muted-foreground py-8">
            <p>Select a component to edit styles</p>
          </div>
        );
    }
  };

  /**
   * TAB 3: ADVANCED PROPERTIES
   * Purpose: "Layout & advanced styling" - Developer features
   * Properties: margin, padding, width, height, gridItem, position, 
   *            motionEffects, transform, background, border, shadow,
   *            mask, responsive attributes (mobile/tablet/desktop)
   */
  const getAdvancedProperties = () => {
    return (
      <div className="space-y-6">
        <div className="text-center text-muted-foreground py-2">
          <p className="font-medium">Advanced Properties</p>
          <p className="text-xs mt-1">Layout, effects, and responsive settings</p>
        </div>

        {/* CSS Classes */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium border-b pb-1">Custom Styling</h4>
          <div className="space-y-2">
            <Label htmlFor="className">CSS Classes</Label>
            <Input
              id="className"
              value={localProps.className || ''}
              onChange={(e) => updateProp('className', e.target.value)}
              placeholder="custom-class another-class"
              disabled={isLocked}
            />
            <p className="text-xs text-muted-foreground">
              Add custom Tailwind or CSS classes
            </p>
          </div>
        </div>

        {/* Spacing Controls */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium border-b pb-1">Spacing</h4>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="marginTop">Margin Top</Label>
              <Input
                id="marginTop"
                type="text"
                value={localProps.marginTop || ''}
                onChange={(e) => updateProp('marginTop', e.target.value)}
                placeholder="0, 4, 8, 16..."
                disabled={isLocked}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="marginBottom">Margin Bottom</Label>
              <Input
                id="marginBottom"
                type="text"
                value={localProps.marginBottom || ''}
                onChange={(e) => updateProp('marginBottom', e.target.value)}
                placeholder="0, 4, 8, 16..."
                disabled={isLocked}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="paddingTop">Padding Top</Label>
              <Input
                id="paddingTop"
                type="text"
                value={localProps.paddingTop || ''}
                onChange={(e) => updateProp('paddingTop', e.target.value)}
                placeholder="0, 4, 8, 16..."
                disabled={isLocked}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paddingBottom">Padding Bottom</Label>
              <Input
                id="paddingBottom"
                type="text"
                value={localProps.paddingBottom || ''}
                onChange={(e) => updateProp('paddingBottom', e.target.value)}
                placeholder="0, 4, 8, 16..."
                disabled={isLocked}
              />
            </div>
          </div>
        </div>

        {/* Layout Controls */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium border-b pb-1">Layout</h4>

          <div className="space-y-2">
            <Label htmlFor="display">Display</Label>
            <Select
              value={localProps.display || 'block'}
              onValueChange={(value) => updateProp('display', value)}
              disabled={isLocked}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="block">Block</SelectItem>
                <SelectItem value="flex">Flex</SelectItem>
                <SelectItem value="grid">Grid</SelectItem>
                <SelectItem value="inline-block">Inline Block</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="maxWidth">Max Width</Label>
              <Input
                id="maxWidth"
                type="text"
                value={localProps.maxWidth || ''}
                onChange={(e) => updateProp('maxWidth', e.target.value)}
                placeholder="container, 7xl, 1200px"
                disabled={isLocked}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minHeight">Min Height</Label>
              <Input
                id="minHeight"
                type="text"
                value={localProps.minHeight || ''}
                onChange={(e) => updateProp('minHeight', e.target.value)}
                placeholder="screen, 500px"
                disabled={isLocked}
              />
            </div>
          </div>
        </div>

        {/* Visual Effects */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium border-b pb-1">Visual Effects</h4>

          <div className="space-y-2">
            <Label htmlFor="shadow">Box Shadow</Label>
            <Select
              value={localProps.shadow || 'none'}
              onValueChange={(value) => updateProp('shadow', value)}
              disabled={isLocked}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="sm">Small</SelectItem>
                <SelectItem value="md">Medium</SelectItem>
                <SelectItem value="lg">Large</SelectItem>
                <SelectItem value="xl">Extra Large</SelectItem>
                <SelectItem value="2xl">2X Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="opacity">Opacity</Label>
            <Select
              value={localProps.opacity || '100'}
              onValueChange={(value) => updateProp('opacity', value)}
              disabled={isLocked}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0%</SelectItem>
                <SelectItem value="25">25%</SelectItem>
                <SelectItem value="50">50%</SelectItem>
                <SelectItem value="75">75%</SelectItem>
                <SelectItem value="100">100%</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Coming Soon - Animation/Motion */}
        <div className="space-y-2 opacity-50 border-t pt-3">
          <h4 className="text-sm font-medium">Animation & Motion (Coming Soon)</h4>
          <p className="text-xs text-muted-foreground">
            Motion effects, transforms, and transitions will be available here
          </p>
        </div>

        {/* Coming Soon - Responsive */}
        <div className="space-y-2 opacity-50">
          <h4 className="text-sm font-medium">Responsive Settings (Coming Soon)</h4>
          <p className="text-xs text-muted-foreground">
            Breakpoint-specific settings for mobile, tablet, desktop
          </p>
        </div>
      </div>
    );
  };

  const renderProperties = () => {
    if (isLocked) {
      return (
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            This component is locked. Unlock it to make changes.
          </AlertDescription>
        </Alert>
      );
    }

    // Note: renderPropertyInput is now defined at component level (above)

    switch (normalizedComponentType) {
      case 'text':
        return renderTextProperties();
      case 'button':
        return renderButtonProperties();
      case 'image':
        return renderImageProperties();
      case 'video':
        return renderVideoProperties();
      case 'container':
        return renderContainerProperties();
      case 'block':
        // Get block config based on blockId
        const blockId = componentProps.blockId;

        // Check if this is a gallery block
        if (blockId && blockId.toLowerCase().includes('gallery')) {
          return renderGalleryProperties();
        }

        // Check if this is a video block
        if (blockId && blockId.toLowerCase().includes('video')) {
          return renderVideoProperties();
        }

        const blockConfig = blockId ? allBlockSchemas[blockId] : null;

        if (!blockConfig) {
          return (
            <div className="space-y-4">
              <div className="text-center text-muted-foreground py-4">
                <p>Block components are pre-built designs with limited editable properties.</p>
              </div>

              {/* Editable properties for blocks */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="blockId">Block ID</Label>
                  <Input id="blockId" value={componentProps.blockId || ''} readOnly />
                </div>

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

        // Render block-specific properties
        return (
          <div className="space-y-4">
            <div className="text-center text-muted-foreground py-2">
              <p>Edit block properties</p>
            </div>

            <div className="space-y-4">
              {Object.entries(blockConfig).map(([key, config]: [string, any]) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key}>{config.label}</Label>
                  {renderPropertyInput(key, config, componentProps[key])}
                </div>
              ))}
            </div>
          </div>
        );
      default:
        // Check if this is a prebuild component (from components registry)
        const prebuildConfig = allBlockSchemas[componentType];

        if (prebuildConfig) {
          // Render prebuild component properties dynamically
          return (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground py-2 border-b">
                <p className="font-medium">{componentType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</p>
              </div>

              <div className="space-y-4">
                {Object.entries(prebuildConfig).map(([key, config]: [string, any]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key}>{config.label}</Label>
                    {renderPropertyInput(key, config, localProps[key])}
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // Unknown component type
        return (
          <div className="text-center text-muted-foreground py-8">
            <p>Select a component to edit its properties</p>
          </div>
        );
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>
          {componentType ? `${componentType.charAt(0).toUpperCase() + componentType.slice(1)} Properties` : 'Properties'}
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

        {/* 3-Tab System: Content | Style | Advanced */}
        {isLocked ? (
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              This component is locked. Unlock it to make changes.
            </AlertDescription>
          </Alert>
        ) : componentType ? (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'content' | 'style' | 'advanced')} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="style">Style</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="mt-4">
              {getContentProperties()}
            </TabsContent>

            <TabsContent value="style" className="mt-4">
              {getStyleProperties()}
            </TabsContent>

            <TabsContent value="advanced" className="mt-4">
              {getAdvancedProperties()}
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