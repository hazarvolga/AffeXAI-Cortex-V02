'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/loading/skeleton';

// Lazy load the Visual Editor - it's a heavy component
const VisualEditor = dynamic(
  () => import('@/components/cms/editor/visual-editor').then(mod => ({ default: mod.VisualEditor })),
  {
    loading: () => (
      <div className="w-full h-screen p-8">
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <div className="grid grid-cols-12 gap-4">
            <Skeleton className="h-[600px] col-span-3" />
            <Skeleton className="h-[600px] col-span-6" />
            <Skeleton className="h-[600px] col-span-3" />
          </div>
        </div>
      </div>
    ),
    ssr: false, // Editor doesn't need SSR
  }
);

const CmsEditorContent = () => {
  const searchParams = useSearchParams();
  const pageId = searchParams.get('pageId') || undefined;
  const templateId = searchParams.get('template') || undefined;

  return (
    <div className="w-full h-screen overflow-hidden">
      <VisualEditor pageId={pageId} templateId={templateId} />
    </div>
  );
};

const CmsEditorPage = () => {
  return (
    <Suspense fallback={
      <div className="w-full h-screen p-8">
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <div className="grid grid-cols-12 gap-4">
            <Skeleton className="h-[600px] col-span-3" />
            <Skeleton className="h-[600px] col-span-6" />
            <Skeleton className="h-[600px] col-span-3" />
          </div>
        </div>
      </div>
    }>
      <CmsEditorContent />
    </Suspense>
  );
};

export const dynamicParams = false;
export default CmsEditorPage;