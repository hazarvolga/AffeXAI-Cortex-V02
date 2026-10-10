'use client';

import React from 'react';
import { PageRenderer } from '@/components/cms/page-renderer';
import { CardComponent } from '@/components/cms/card-component';
import { GridComponent } from '@/components/cms/grid-component';

const CmsDemoEnhancedPage = () => {
  // Example page data structure with enhanced components
  const pageComponents = [
    {
      id: 'header-container',
      type: 'container',
      props: {
        padding: 'lg',
        background: 'primary',
        rounded: true,
        shadow: 'md',
        className: 'mb-8 text-center'
      },
      children: [
        {
          id: 'welcome-heading',
          type: 'text',
          props: {
            content: 'Enhanced CMS Demo',
            variant: 'heading1',
            align: 'center',
            className: 'text-white mb-4'
          }
        },
        {
          id: 'subtitle',
          type: 'text',
          props: {
            content: 'Showcasing advanced components and features',
            variant: 'heading2',
            align: 'center',
            className: 'text-white/90',
            color: 'secondary'
          }
        }
      ]
    },
    {
      id: 'features-grid',
      type: 'grid',
      props: {
        columns: 3,
        gap: 'lg',
        padding: 'md',
        className: 'mb-8'
      },
      children: [
        {
          id: 'card-1',
          type: 'card',
          props: {
            padding: 'lg',
            rounded: 'lg',
            shadow: 'md',
            hover: true,
            className: 'text-center'
          },
          children: [
            {
              id: 'card-1-title',
              type: 'text',
              props: {
                content: 'Enhanced Text',
                variant: 'heading3',
                className: 'mb-2'
              }
            },
            {
              id: 'card-1-text',
              type: 'text',
              props: {
                content: 'Text components now support colors, weights, and decorations.',
                variant: 'body',
                color: 'secondary'
              }
            }
          ]
        },
        {
          id: 'card-2',
          type: 'card',
          props: {
            padding: 'lg',
            rounded: 'lg',
            shadow: 'md',
            hover: true,
            className: 'text-center'
          },
          children: [
            {
              id: 'card-2-title',
              type: 'text',
              props: {
                content: 'Advanced Buttons',
                variant: 'heading3',
                className: 'mb-2'
              }
            },
            {
              id: 'card-2-text',
              type: 'text',
              props: {
                content: 'Buttons with icons, rounded corners, and full width options.',
                variant: 'body',
                color: 'secondary'
              }
            }
          ]
        },
        {
          id: 'card-3',
          type: 'card',
          props: {
            padding: 'lg',
            rounded: 'lg',
            shadow: 'md',
            hover: true,
            className: 'text-center'
          },
          children: [
            {
              id: 'card-3-title',
              type: 'text',
              props: {
                content: 'Flexible Containers',
                variant: 'heading3',
                className: 'mb-2'
              }
            },
            {
              id: 'card-3-text',
              type: 'text',
              props: {
                content: 'Containers with extensive styling and layout options.',
                variant: 'body',
                color: 'secondary'
              }
            }
          ]
        }
      ]
    },
    {
      id: 'cta-container',
      type: 'container',
      props: {
        padding: 'xl',
        background: 'muted',
        rounded: 'lg',
        className: 'text-center mb-8'
      },
      children: [
        {
          id: 'cta-heading',
          type: 'text',
          props: {
            content: 'Get Started with Aluplan CMS',
            variant: 'heading2',
            className: 'mb-4'
          }
        },
        {
          id: 'cta-text',
          type: 'text',
          props: {
            content: 'Experience the power of our component-based content management system.',
            variant: 'body',
            color: 'secondary',
            className: 'mb-6'
          }
        },
        {
          id: 'cta-button',
          type: 'button',
          props: {
            text: 'Start Building',
            variant: 'default',
            size: 'lg',
            rounded: 'full'
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

export default CmsDemoEnhancedPage;