'use client';

import React from 'react';
import { VisualEditor } from '@/components/cms/editor/visual-editor';
import { useSearchParams } from 'next/navigation';

const CmsEditorPage = () => {
  const searchParams = useSearchParams();
  const pageId = searchParams.get('pageId') || undefined;

  return (
    <div className="w-full h-screen overflow-hidden">
      <VisualEditor pageId={pageId} />
    </div>
  );
};

export default CmsEditorPage;