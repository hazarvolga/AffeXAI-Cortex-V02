'use client';

import React from 'react';
import { PageRenderer } from '@/components/cms/page-renderer';

const CmsDemoPage = () => {
  // Example page data structure
  const pageComponents = [
    {
      id: 'header-container',
      type: 'container',
      props: {
        padding: 'lg',
        background: 'primary',
        rounded: true,
        shadow: 'md',
        className: 'mb-8'
      },
      children: [
        {
          id: 'welcome-heading',
          type: 'text',
          props: {
            content: 'Welcome to Aluplan CMS Demo',
            variant: 'heading1',
            align: 'center',
            className: 'text-white'
          }
        }
      ]
    },
    {
      id: 'intro-container',
      type: 'container',
      props: {
        padding: 'md',
        className: 'mb-6'
      },
      children: [
        {
          id: 'intro-text',
          type: 'text',
          props: {
            content: 'This is a demonstration of our new CMS components built with Shadcn/UI and Tailwind CSS.',
            variant: 'body',
            align: 'center'
          }
        }
      ]
    },
    {
      id: 'features-container',
      type: 'container',
      props: {
        padding: 'md',
        className: 'mb-6'
      },
      children: [
        {
          id: 'features-heading',
          type: 'text',
          props: {
            content: 'Key Features',
            variant: 'heading2',
            className: 'mb-4'
          }
        },
        {
          id: 'feature-list',
          type: 'text',
          props: {
            content: '• Component-based architecture\n• Design system consistency\n• Easy content management\n• Responsive by default',
            variant: 'body'
          }
        }
      ]
    },
    {
      id: 'cta-container',
      type: 'container',
      props: {
        padding: 'md',
        className: 'text-center'
      },
      children: [
        {
          id: 'cta-button',
          type: 'button',
          props: {
            text: 'Get Started',
            variant: 'default',
            size: 'lg'
          }
        }
      ]
    }
  ];

  return (
    <div className="container mx-auto py-8">
      <PageRenderer components={pageComponents} />
    </div>
  );
};

export default CmsDemoPage;