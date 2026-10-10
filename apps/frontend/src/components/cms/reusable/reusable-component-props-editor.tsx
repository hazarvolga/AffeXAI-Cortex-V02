'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { DynamicFormGenerator } from './dynamic-form-generator';
import { allBlockSchemas } from '@/components/cms/schemas';

interface PropsEditorProps {
  componentType: string;
  blockType?: string;
  blockId?: string;
  value: Record<string, any>;
  onChange: (props: Record<string, any>) => void;
}

export const ReusableComponentPropsEditor: React.FC<PropsEditorProps> = ({
  componentType,
  blockType,
  blockId,
  value,
  onChange,
}) => {
  const handlePropChange = (key: string, propValue: any) => {
    const newProps = { ...value, [key]: propValue };
    onChange(newProps);
  };

  // Check if we have a V2 block schema
  const blockSchema = blockId ? allBlockSchemas[blockId] : null;
  if (blockId && blockSchema) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bileşen Özellikleri</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            V2 Block: {blockId}
          </p>
        </CardHeader>
        <CardContent>
          <DynamicFormGenerator
            schema={blockSchema.propSchema}
            values={value}
            onChange={handlePropChange}
          />
        </CardContent>
      </Card>
    );
  }

  // Common properties for all components
  const renderCommonProps = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>CSS Class</Label>
        <Input
          value={value.className || ''}
          onChange={(e) => handlePropChange('className', e.target.value)}
          placeholder="custom-class"
        />
      </div>

      <div className="space-y-2">
        <Label>ID</Label>
        <Input
          value={value.id || ''}
          onChange={(e) => handlePropChange('id', e.target.value)}
          placeholder="unique-id"
        />
      </div>
    </div>
  );

  // Render visual editor based on component type and block type
  const renderVisualEditor = () => {
    // Check blockType first for block-specific editors
    if (blockType === 'hero') {
      return (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Hero Title *</Label>
              <Input
                value={value.title || ''}
                onChange={(e) => handlePropChange('title', e.target.value)}
                placeholder="Hoş Geldiniz"
              />
            </div>

            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Input
                value={value.subtitle || ''}
                onChange={(e) => handlePropChange('subtitle', e.target.value)}
                placeholder="Modern ve profesyonel web deneyimi"
              />
            </div>

            <div className="space-y-2">
              <Label>Background Image URL</Label>
              <Input
                value={value.backgroundImage || ''}
                onChange={(e) => handlePropChange('backgroundImage', e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
              />
            </div>

            <div className="space-y-2">
              <Label>Background Gradient</Label>
              <Input
                value={value.backgroundGradient || ''}
                onChange={(e) => handlePropChange('backgroundGradient', e.target.value)}
                placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              />
            </div>

            <div className="space-y-2">
              <Label>Height</Label>
              <Input
                value={value.height || ''}
                onChange={(e) => handlePropChange('height', e.target.value)}
                placeholder="600px"
              />
            </div>

            <div className="space-y-2">
              <Label>Overlay Opacity (0-1)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={value.overlay || ''}
                onChange={(e) => handlePropChange('overlay', e.target.value)}
                placeholder="0.4"
              />
            </div>

            <div className="space-y-2">
              <Label>Text Alignment</Label>
              <Select
                value={value.textAlign || 'center'}
                onValueChange={(val) => handlePropChange('textAlign', val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-4">Styling</h4>
            {renderCommonProps()}
          </div>
        </div>
      );
    }

    // Type-specific properties
    switch (componentType) {
      case 'button':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Button Text *</Label>
                <Input
                  value={value.text || ''}
                  onChange={(e) => handlePropChange('text', e.target.value)}
                  placeholder="Click Me"
                />
              </div>

              <div className="space-y-2">
                <Label>Button Variant</Label>
                <Select
                  value={value.variant || 'primary'}
                  onValueChange={(val) => handlePropChange('variant', val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primary</SelectItem>
                    <SelectItem value="secondary">Secondary</SelectItem>
                    <SelectItem value="outline">Outline</SelectItem>
                    <SelectItem value="ghost">Ghost</SelectItem>
                    <SelectItem value="destructive">Destructive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Size</Label>
                <Select
                  value={value.size || 'default'}
                  onValueChange={(val) => handlePropChange('size', val)}
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

              <div className="space-y-2">
                <Label>Link URL</Label>
                <Input
                  value={value.href || ''}
                  onChange={(e) => handlePropChange('href', e.target.value)}
                  placeholder="https://example.com"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="fullWidth"
                  checked={value.fullWidth || false}
                  onCheckedChange={(checked) => handlePropChange('fullWidth', checked)}
                />
                <Label htmlFor="fullWidth">Full Width</Label>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-4">Styling</h4>
              {renderCommonProps()}
            </div>
          </div>
        );

      case 'text':
      case 'container':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Content *</Label>
                <Textarea
                  value={value.content || ''}
                  onChange={(e) => handlePropChange('content', e.target.value)}
                  placeholder="Enter your content here..."
                  rows={6}
                />
              </div>

              {componentType === 'text' && (
                <>
                  <div className="space-y-2">
                    <Label>Typography Variant</Label>
                    <Select
                      value={value.variant || 'body'}
                      onValueChange={(val) => handlePropChange('variant', val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="h1">Heading 1</SelectItem>
                        <SelectItem value="h2">Heading 2</SelectItem>
                        <SelectItem value="h3">Heading 3</SelectItem>
                        <SelectItem value="h4">Heading 4</SelectItem>
                        <SelectItem value="body">Body Text</SelectItem>
                        <SelectItem value="subtitle">Subtitle</SelectItem>
                        <SelectItem value="caption">Caption</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Text Alignment</Label>
                    <Select
                      value={value.align || 'left'}
                      onValueChange={(val) => handlePropChange('align', val)}
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
                </>
              )}
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-4">Styling</h4>
              {renderCommonProps()}
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Image URL *</Label>
                <Input
                  value={value.src || ''}
                  onChange={(e) => handlePropChange('src', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label>Alt Text *</Label>
                <Input
                  value={value.alt || ''}
                  onChange={(e) => handlePropChange('alt', e.target.value)}
                  placeholder="Description of image"
                />
              </div>

              <div className="space-y-2">
                <Label>Width</Label>
                <Input
                  value={value.width || ''}
                  onChange={(e) => handlePropChange('width', e.target.value)}
                  placeholder="300px or 100%"
                />
              </div>

              <div className="space-y-2">
                <Label>Height</Label>
                <Input
                  value={value.height || ''}
                  onChange={(e) => handlePropChange('height', e.target.value)}
                  placeholder="200px or auto"
                />
              </div>

              <div className="space-y-2">
                <Label>Border Radius</Label>
                <Input
                  value={value.borderRadius || ''}
                  onChange={(e) => handlePropChange('borderRadius', e.target.value)}
                  placeholder="8px"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rounded"
                  checked={value.rounded || false}
                  onCheckedChange={(checked) => handlePropChange('rounded', checked)}
                />
                <Label htmlFor="rounded">Fully Rounded</Label>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-4">Styling</h4>
              {renderCommonProps()}
            </div>
          </div>
        );

      case 'card':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={value.title || ''}
                  onChange={(e) => handlePropChange('title', e.target.value)}
                  placeholder="Card Title"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={value.description || ''}
                  onChange={(e) => handlePropChange('description', e.target.value)}
                  placeholder="Card description..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input
                  value={value.imageUrl || ''}
                  onChange={(e) => handlePropChange('imageUrl', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label>Button Text</Label>
                <Input
                  value={value.buttonText || ''}
                  onChange={(e) => handlePropChange('buttonText', e.target.value)}
                  placeholder="Learn More"
                />
              </div>

              <div className="space-y-2">
                <Label>Button Link</Label>
                <Input
                  value={value.buttonLink || ''}
                  onChange={(e) => handlePropChange('buttonLink', e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-4">Styling</h4>
              {renderCommonProps()}
            </div>
          </div>
        );

      // Block-specific editors based on blockType
      default:
        // Generic fallback - show JSON editor with help text
        return (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No visual editor available for this component type ({componentType}).
              Please use JSON mode to edit properties.
            </AlertDescription>
          </Alert>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bileşen Özellikleri</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Bileşenin görsel özelliklerini aşağıdaki form alanlarından düzenleyin
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {renderVisualEditor()}
        </div>
      </CardContent>
    </Card>
  );
};
