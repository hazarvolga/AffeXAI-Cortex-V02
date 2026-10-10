'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { PageTemplate } from '@/types/cms-template';
import {
  Eye,
  Download,
  Monitor,
  Tablet,
  Smartphone,
  Code,
  Palette,
  Layers,
  X,
} from 'lucide-react';

interface TemplatePreviewDialogProps {
  template: PageTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply?: (template: PageTemplate) => void;
}

type ViewportSize = 'desktop' | 'tablet' | 'mobile';

/**
 * Template Preview Dialog
 *
 * Displays a comprehensive preview of a page template with:
 * - Responsive viewport preview
 * - Block structure view
 * - Design tokens view
 * - Template metadata
 */
export function TemplatePreviewDialog({
  template,
  open,
  onOpenChange,
  onApply,
}: TemplatePreviewDialogProps) {
  const [viewport, setViewport] = useState<ViewportSize>('desktop');
  const [activeTab, setActiveTab] = useState('preview');

  if (!template) {
    return null;
  }

  const viewportDimensions = {
    desktop: { width: '100%', height: '600px' },
    tablet: { width: '768px', height: '600px' },
    mobile: { width: '375px', height: '600px' },
  };

  const renderBlockPreview = () => {
    return (
      <div className="space-y-4">
        {template.blocks.map((block, index) => (
          <div
            key={block.id}
            className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">
                  {index + 1}
                </Badge>
                <span className="font-medium">{block.type}</span>
                <Badge variant="secondary" className="text-xs">
                  {block.id}
                </Badge>
              </div>
            </div>

            {/* Block Configuration Preview */}
            {block.properties && Object.keys(block.properties).length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="text-xs text-muted-foreground font-medium">
                  Configuration:
                </div>
                <div className="bg-muted/50 rounded p-2 space-y-1">
                  {Object.entries(block.properties).map(([key, value]) => (
                    <div key={key} className="flex items-start gap-2 text-xs font-mono">
                      <span className="text-muted-foreground">{key}:</span>
                      <span className="text-foreground">
                        {typeof value === 'object'
                          ? JSON.stringify(value)
                          : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderDesignTokens = () => {
    const tokens = { colors: template.designSystem.colorScheme, spacing: template.designSystem.spacing, typography: template.designSystem.typography };

    return (
      <div className="space-y-6">
        {/* Colors */}
        {tokens.colors && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              <h4 className="font-medium">Colors</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(tokens.colors).map(([key, value]) => (
                <div
                  key={key}
                  className="border rounded-lg p-3 space-y-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{key}</span>
                  </div>
                  <div className="text-xs font-mono text-muted-foreground break-all">
                    {String(value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Spacing */}
        {tokens.spacing && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <h4 className="font-medium">Spacing</h4>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(tokens.spacing).map(([key, value]) => (
                <div
                  key={key}
                  className="border rounded p-2 text-center hover:bg-muted/50 transition-colors"
                >
                  <div className="text-xs font-medium">{key}</div>
                  <div className="text-xs font-mono text-muted-foreground mt-1">
                    {String(value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Typography */}
        {tokens.typography && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4 text-primary" />
              <h4 className="font-medium">Typography</h4>
            </div>
            <div className="space-y-2">
              {Object.entries(tokens.typography).map(([key, value]) => (
                <div
                  key={key}
                  className="border rounded p-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{key}</span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {String(value)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderVisualPreview = () => {
    const { width, height } = viewportDimensions[viewport];

    return (
      <div className="space-y-4">
        {/* Viewport Controls */}
        <div className="flex items-center justify-center gap-2 border-b pb-4">
          <Button
            variant={viewport === 'desktop' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewport('desktop')}
          >
            <Monitor className="h-4 w-4 mr-2" />
            Desktop
          </Button>
          <Button
            variant={viewport === 'tablet' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewport('tablet')}
          >
            <Tablet className="h-4 w-4 mr-2" />
            Tablet
          </Button>
          <Button
            variant={viewport === 'mobile' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewport('mobile')}
          >
            <Smartphone className="h-4 w-4 mr-2" />
            Mobile
          </Button>
        </div>

        {/* Preview Frame */}
        <div className="flex justify-center">
          <div
            className="border rounded-lg bg-background overflow-hidden transition-all duration-300"
            style={{ width, maxWidth: '100%' }}
          >
            <div className="bg-muted border-b px-4 py-2 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="flex-1 text-center text-xs text-muted-foreground font-mono">
                {template.name}
              </div>
            </div>

            <ScrollArea style={{ height }}>
              <div className="p-6 space-y-6">
                {template.blocks.map((block) => (
                  <div
                    key={block.id}
                    className="border-2 border-dashed border-muted rounded-lg p-6 bg-muted/20"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline">{block.type}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {block.id}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {block.type === 'hero' && '🎯 Hero Section'}
                      {block.type === 'text' && '📝 Text Content'}
                      {block.type === 'grid' && '📊 Grid Layout'}
                      {block.type === 'cta' && '🎬 Call to Action'}
                      {block.type === 'image' && '🖼️ Image Block'}
                      {block.type === 'form' && '📋 Form'}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Eye className="h-5 w-5" />
            {template.name}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 flex-wrap">
            <span>{template.description}</span>
            <Badge variant="outline">{template.category}</Badge>
            <Badge variant="secondary">{template.blocks.length} blocks</Badge>
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preview">
              <Eye className="h-4 w-4 mr-2" />
              Visual Preview
            </TabsTrigger>
            <TabsTrigger value="blocks">
              <Layers className="h-4 w-4 mr-2" />
              Blocks ({template.blocks.length})
            </TabsTrigger>
            <TabsTrigger value="tokens">
              <Palette className="h-4 w-4 mr-2" />
              Design Tokens
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="flex-1 mt-4">
            <ScrollArea className="h-full">
              {renderVisualPreview()}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="blocks" className="flex-1 mt-4">
            <ScrollArea className="h-full">
              {renderBlockPreview()}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="tokens" className="flex-1 mt-4">
            <ScrollArea className="h-full">
              {renderDesignTokens()}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Contexts:</span>
            {template.designSystem.supportedContexts.map((ctx) => (
              <Badge key={ctx} variant="outline" className="text-xs">
                {ctx}
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4 mr-2" />
              Kapat
            </Button>
            <Button
              onClick={() => {
                onApply?.(template);
                onOpenChange(false);
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Şablonu Kullan
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
