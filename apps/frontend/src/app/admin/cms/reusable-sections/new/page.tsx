'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load the Section Builder - heavy component
const SectionBuilder = dynamic(
  () => import('@/components/cms/section-builder/section-builder').then(mod => ({ default: mod.SectionBuilder })),
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
    ssr: false, // No SSR needed for builder
  }
);

const SectionBuilderContent = () => {
  return (
    <div className="w-full h-screen overflow-hidden">
      <SectionBuilder />
    </div>
  );
};

const NewSectionPage = () => {
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
      <SectionBuilderContent />
    </Suspense>
  );
};

export const dynamicParams = false;
export default NewSectionPage;
