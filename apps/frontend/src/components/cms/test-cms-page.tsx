'use client';

import React from 'react';
import { CmsPageRenderer } from '@/components/cms/cms-page-renderer';
import { PreviewProvider } from '@/components/cms/preview-context';

// Test data for CMS page
const testPage = {
  id: 'test-page-1',
  title: 'Test CMS Page',
  slug: 'test-page',
  description: 'This is a test page to verify CMS functionality',
  components: [
    {
      id: 'component-1',
      type: 'text',
      props: {
        content: 'Welcome to our test CMS page!',
        className: 'text-2xl font-bold text-center mb-4'
      }
    },
    {
      id: 'component-2',
      type: 'container',
      props: {
        className: 'bg-secondary p-6 rounded-lg'
      },
      children: [
        {
          id: 'component-2-1',
          type: 'text',
          props: {
            content: 'This is content inside a container',
            className: 'text-lg'
          }
        },
        {
          id: 'component-2-2',
          type: 'button',
          props: {
            text: 'Click Me',
            variant: 'default',
            className: 'mt-4'
          }
        }
      ]
    }
  ]
};

export function TestCmsPage() {
  return (
    <PreviewProvider initialMode="public">
      <div className="container mx-auto py-8">
        {/* @ts-ignore */}
        <CmsPageRenderer page={testPage} />
      </div>
    </PreviewProvider>
  );
}