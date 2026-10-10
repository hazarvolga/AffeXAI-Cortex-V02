'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BlockRenderer } from '@/components/cms/editor/block-renderer';
import { PreviewProvider } from '@/components/cms/preview-context';
import { templateService } from '@/lib/api/templateService';
import type { PageTemplate } from '@/types/cms-template';
import {
  ArrowLeft,
  Download,
  Monitor,
  Tablet,
  Smartphone,
  RefreshCw,
  Eye,
  Layers,
} from 'lucide-react';

type ViewportSize = 'desktop' | 'tablet' | 'mobile';

/**
 * Template Preview Page
 * 
 * Full-page preview of a template with real component rendering
 * Features:
 * - Real block component rendering
 * - Responsive viewport preview
 * - Back navigation
 * - Apply template functionality
 */
export default function TemplatePreviewPage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params?.id as string;

  const [template, setTemplate] = useState<PageTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewport, setViewport] = useState<ViewportSize>('desktop');

  useEffect(() => {
    if (templateId) {
      loadTemplate();
    }
  }, [templateId]);

  const loadTemplate = async () => {
    try {
      setIsLoading(true);
      const data = await templateService.getById(templateId);
      setTemplate(data);
    } catch (error) {
      console.error('Error loading template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyTemplate = () => {
    if (!template) return;
    // TODO: Navigate to editor with template
    console.log('Applying template:', template.name);
    router.push(`/admin/cms/editor?template=${template.id}`);
  };

  const handleBack = () => {
    router.push('/admin/cms/templates');
  };

  const viewportDimensions = {
    desktop: { width: '100%', maxWidth: '1920px' },
    tablet: { width: '768px', maxWidth: '768px' },
    mobile: { width: '375px', maxWidth: '375px' },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Şablon yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Eye className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-semibold">Şablon bulunamadı</h2>
          <Button onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri Dön
          </Button>
        </div>
      </div>
    );
  }

  const { width, maxWidth } = viewportDimensions[viewport];

  return (
    <PreviewProvider initialMode="preview">
      <div className="min-h-screen bg-muted/30">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-background border-b shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Left: Back Button + Info */}
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Geri
                </Button>

                <div className="hidden md:block">
                  <h1 className="text-lg font-semibold">{template.name}</h1>
                  <p className="text-sm text-muted-foreground">
                    {template.description}
                  </p>
                </div>
              </div>

              {/* Center: Viewport Controls */}
              <div className="flex items-center gap-2 border rounded-lg p-1 bg-muted/50">
                <Button
                  variant={viewport === 'desktop' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewport('desktop')}
                >
                  <Monitor className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Desktop</span>
                </Button>
                <Button
                  variant={viewport === 'tablet' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewport('tablet')}
                >
                  <Tablet className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Tablet</span>
                </Button>
                <Button
                  variant={viewport === 'mobile' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewport('mobile')}
                >
                  <Smartphone className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Mobile</span>
                </Button>
              </div>

              {/* Right: Metadata + Apply Button */}
              <div className="flex items-center gap-3">
                <div className="hidden lg:flex items-center gap-2">
                  <Badge variant="outline">
                    <Layers className="h-3 w-3 mr-1" />
                    {template.blocks.length} blok
                  </Badge>
                  <Badge variant="secondary">{template.category}</Badge>
                </div>

                <Button onClick={handleApplyTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Şablonu Kullan
                </Button>
              </div>
            </div>

            {/* Mobile Info */}
            <div className="md:hidden mt-3 pt-3 border-t">
              <h1 className="text-base font-semibold">{template.name}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  <Layers className="h-3 w-3 mr-1" />
                  {template.blocks.length} blok
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {template.category}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center">
            <div
              className="transition-all duration-300 bg-background rounded-lg shadow-lg overflow-hidden"
              style={{ width, maxWidth }}
            >
              {/* Browser Chrome */}
              <div className="bg-muted border-b px-4 py-3 flex items-center gap-3">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 bg-background rounded px-3 py-1 text-xs text-muted-foreground font-mono text-center">
                  {template.name} - Preview
                </div>
              </div>

              {/* Template Content */}
              <ScrollArea className="h-[calc(100vh-16rem)]">
                <div className="bg-background">
                  {template.blocks.map((block) => (
                    <div key={block.id}>
                      <BlockRenderer
                        blockId={block.type}
                        props={{
                          ...block.properties,
                          id: block.id,
                          data: block.properties,
                        }}
                      />
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Footer Info */}
              <div className="bg-muted border-t px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>Desteklenen Context:</span>
                  <div className="flex gap-1">
                    {template.designSystem.supportedContexts.map((ctx) => (
                      <Badge key={ctx} variant="outline" className="text-xs">
                        {ctx}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  {viewport === 'desktop' && '1920px'}
                  {viewport === 'tablet' && '768px'}
                  {viewport === 'mobile' && '375px'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PreviewProvider>
  );
}
