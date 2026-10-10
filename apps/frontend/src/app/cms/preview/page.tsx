'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BlockRenderer } from '@/components/cms/editor/block-renderer';
import { EditorProvider } from '@/components/cms/editor/editor-context';
import { Skeleton } from '@/components/loading/skeleton';
import { Monitor, Tablet, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

interface EditorComponent {
  id: string;
  type: string;
  props: any;
  parentId?: string | null;
  orderIndex?: number;
  children?: EditorComponent[];
}

function PreviewContent() {
  const searchParams = useSearchParams();
  const [components, setComponents] = useState<EditorComponent[]>([]);
  const [showHeader, setShowHeader] = useState(true);
  const [showFooter, setShowFooter] = useState(true);
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      // Get components from sessionStorage (sent from editor)
      const storedComponents = sessionStorage.getItem('previewComponents');
      if (storedComponents) {
        setComponents(JSON.parse(storedComponents));
      }

      // Get layout options from query params
      const headerParam = searchParams.get('showHeader');
      const footerParam = searchParams.get('showFooter');
      
      if (headerParam !== null) setShowHeader(headerParam === 'true');
      if (footerParam !== null) setShowFooter(footerParam === 'true');
    } catch (error) {
      console.error('Error loading preview data:', error);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  const getViewportWidth = () => {
    switch (viewportMode) {
      case 'tablet':
        return '768px';
      case 'mobile':
        return '375px';
      default:
        return '100%';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Skeleton className="h-screen w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Preview Toolbar */}
      <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Preview Mode</span>
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          </div>

          {/* Viewport Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewportMode === 'desktop' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewportMode('desktop')}
              className="gap-2"
            >
              <Monitor className="h-4 w-4" />
              <span className="hidden sm:inline">Desktop</span>
            </Button>
            <Button
              variant={viewportMode === 'tablet' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewportMode('tablet')}
              className="gap-2"
            >
              <Tablet className="h-4 w-4" />
              <span className="hidden sm:inline">Tablet</span>
            </Button>
            <Button
              variant={viewportMode === 'mobile' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewportMode('mobile')}
              className="gap-2"
            >
              <Smartphone className="h-4 w-4" />
              <span className="hidden sm:inline">Mobile</span>
            </Button>
          </div>

          {/* Layout Options */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showHeader}
                onChange={(e) => setShowHeader(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-gray-700">Show Header</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showFooter}
                onChange={(e) => setShowFooter(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-gray-700">Show Footer</span>
            </label>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex justify-center py-8">
        <div
          className="bg-white shadow-xl transition-all duration-300 ease-in-out"
          style={{
            width: getViewportWidth(),
            minHeight: 'calc(100vh - 120px)',
            maxWidth: '100%',
          }}
        >
          <EditorProvider onComponentUpdate={() => {}}>
            {/* Header */}
            {showHeader && <Header />}

            {/* Page Content */}
            <main className="min-h-[400px]">
              {components.length > 0 ? (
                components.map((component) => (
                  <BlockRenderer
                    key={component.id}
                    blockId={component.type}
                    props={component.props}
                  />
                ))
              ) : (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="text-gray-400 text-6xl mb-4">📄</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Content Yet
                    </h3>
                    <p className="text-gray-500">
                      Add some components in the editor to see them here
                    </p>
                  </div>
                </div>
              )}
            </main>

            {/* Footer */}
            {showFooter && <Footer />}
          </EditorProvider>
        </div>
      </div>

      {/* Viewport Info Badge */}
      <div className="fixed bottom-4 right-4 bg-black/80 text-white px-4 py-2 rounded-lg text-sm font-medium">
        {viewportMode === 'desktop' && '🖥️ Desktop'}
        {viewportMode === 'tablet' && '📱 Tablet (768px)'}
        {viewportMode === 'mobile' && '📱 Mobile (375px)'}
      </div>
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<Skeleton className="h-screen w-full" />}>
      <PreviewContent />
    </Suspense>
  );
}
