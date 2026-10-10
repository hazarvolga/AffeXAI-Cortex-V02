"use client";

import React from 'react';
import { TrackableBlock } from './trackable-block';
import { blockRegistry, isBlockType } from './block-registry';
import type { PageTemplate, BlockInstance } from '@/types/cms-template';

// Import V2 blocks directly as fallback
import {
  V2HeroSimple,
  V2HeroWithImage,
  V2CtaBanner,
  V2FeatureGrid,
  V2ContentText,
  V2ContentSplit,
  V2StatsGrid,
  V2Testimonials,
  V2Pricing,
  V2Faq,
  V2Gallery,
  V2Footer,
  V2ContactForm,
  V2TeamGrid,
  V2LogoCloud,
  V2Newsletter,
} from './blocks/v2';

interface TemplateRendererProps {
  template: PageTemplate;
  pageId: string;
  enableTracking?: boolean;
  className?: string;
}

/**
 * Block type mapping from seed templates to V2 components
 */
const v2BlockMapping: Record<string, React.ComponentType<any>> = {
  // V2 blocks (primary)
  'v2-hero-simple': V2HeroSimple,
  'v2-hero-with-image': V2HeroWithImage,
  'v2-cta-banner': V2CtaBanner,
  'v2-feature-grid': V2FeatureGrid,
  'v2-content-text': V2ContentText,
  'v2-content-split': V2ContentSplit,
  'v2-stats-grid': V2StatsGrid,
  'v2-testimonials': V2Testimonials,
  'v2-pricing': V2Pricing,
  'v2-faq': V2Faq,
  'v2-gallery': V2Gallery,
  'v2-footer': V2Footer,
  'v2-contact-form': V2ContactForm,
  'v2-team-grid': V2TeamGrid,
  'v2-logo-cloud': V2LogoCloud,
  'v2-newsletter': V2Newsletter,

  // Legacy type aliases (map to V2 equivalents)
  'hero': V2HeroSimple,
  'hero-simple': V2HeroSimple,
  'hero-with-image': V2HeroWithImage,
  'features': V2FeatureGrid,
  'feature-grid': V2FeatureGrid,
  'stats': V2StatsGrid,
  'stats-grid': V2StatsGrid,
  'testimonials': V2Testimonials,
  'pricing': V2Pricing,
  'faq': V2Faq,
  'gallery': V2Gallery,
  'footer': V2Footer,
  'content': V2ContentText,
  'content-text': V2ContentText,
  'content-split': V2ContentSplit,
  'cta': V2CtaBanner,
  'cta-banner': V2CtaBanner,
  'contact': V2ContactForm,
  'contact-form': V2ContactForm,
  'team': V2TeamGrid,
  'team-grid': V2TeamGrid,
  'logos': V2LogoCloud,
  'logo-cloud': V2LogoCloud,
  'newsletter': V2Newsletter,
};

/**
 * getBlockComponent - Returns the React component for a given block type
 * 
 * Priority:
 * 1. Check V2 block mapping (includes aliases)
 * 2. Check block registry
 * 3. Return null if not found
 */
function getBlockComponent(blockType: string): React.ComponentType<any> | null {
  // First check V2 block mapping (includes aliases)
  if (blockType in v2BlockMapping) {
    return v2BlockMapping[blockType];
  }

  // Then check block registry
  if (isBlockType(blockType)) {
    return blockRegistry[blockType];
  }

  return null;
}

/**
 * TemplateRenderer - Renders a complete page template with all blocks
 * 
 * Features:
 * - Renders all blocks in sequence using V2 block components
 * - Optional analytics tracking per block
 * - Design token resolution
 * - Responsive layout with template constraints
 * 
 * Usage:
 * ```tsx
 * <TemplateRenderer 
 *   template={pageTemplate} 
 *   pageId="home-page"
 *   enableTracking={true}
 * />
 * ```
 */
export function TemplateRenderer({
  template,
  pageId,
  enableTracking = true,
  className = ''
}: TemplateRendererProps) {
  const { blocks, layoutOptions, designSystem } = template;

  // Apply layout styles based on maxWidth option
  const getMaxWidth = (maxWidth?: string) => {
    switch (maxWidth) {
      case 'full': return '100%';
      case 'wide': return '1400px';
      case 'narrow': return '768px';
      case 'standard':
      default: return '1200px';
    }
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: getMaxWidth(layoutOptions?.maxWidth),
    margin: '0 auto',
    padding: layoutOptions?.containerPadding || '0 1rem',
  };

  return (
    <div
      className={`template-renderer flex flex-col ${className}`}
      style={containerStyle}
      data-template-id={template.id}
      data-template-category={template.category}
      data-design-system={designSystem?.preferredMode || 'light'}
    >
      {blocks.map((block) => {
        const BlockComponent = getBlockComponent(block.type);

        if (!BlockComponent) {
          console.warn(`Block type "${block.type}" not found in V2 block registry`);
          return (
            <div
              key={block.id}
              className="p-4 border-2 border-dashed border-amber-300 bg-amber-50 rounded my-2"
            >
              <p className="text-amber-700 font-medium">Unknown block type: {block.type}</p>
              <p className="text-amber-600 text-sm mt-1">
                Available V2 types: {Object.keys(v2BlockMapping).filter(k => k.startsWith('v2-')).join(', ')}
              </p>
            </div>
          );
        }

        // Wrap with tracking if enabled
        if (enableTracking) {
          return (
            <TrackableBlock
              key={block.id}
              block={block}
              pageId={pageId}
              className="block-wrapper"
            >
              <BlockComponent {...block.properties} blockId={block.id} />
            </TrackableBlock>
          );
        }

        // Render without tracking
        return (
          <div key={block.id} className="block-wrapper" data-block-id={block.id}>
            <BlockComponent {...block.properties} blockId={block.id} />
          </div>
        );
      })}
    </div>
  );
}

/**
 * BlockRenderer - Renders a single block with optional tracking
 */
interface BlockRendererProps {
  block: BlockInstance;
  pageId: string;
  enableTracking?: boolean;
}

export function BlockRenderer({
  block,
  pageId,
  enableTracking = true
}: BlockRendererProps) {
  const BlockComponent = getBlockComponent(block.type);

  if (!BlockComponent) {
    return (
      <div className="p-4 border-2 border-dashed border-red-300 bg-red-50 rounded">
        <p className="text-red-600 font-medium">Block type "{block.type}" not found</p>
        <p className="text-red-500 text-sm mt-1">
          Please use a V2 block type (e.g., v2-hero-simple, v2-feature-grid)
        </p>
      </div>
    );
  }

  if (enableTracking) {
    return (
      <TrackableBlock block={block} pageId={pageId}>
        <BlockComponent {...block.properties} blockId={block.id} />
      </TrackableBlock>
    );
  }

  return <BlockComponent {...block.properties} blockId={block.id} />;
}

/**
 * TemplatePreview - Simplified preview component for template cards
 */
interface TemplatePreviewProps {
  template: PageTemplate;
  maxBlocks?: number;
}

export function TemplatePreview({ template, maxBlocks = 3 }: TemplatePreviewProps) {
  const previewBlocks = template.blocks.slice(0, maxBlocks);

  return (
    <div className="template-preview scale-50 origin-top-left pointer-events-none">
      {previewBlocks.map((block) => {
        const BlockComponent = getBlockComponent(block.type);

        if (!BlockComponent) {
          return (
            <div
              key={block.id}
              className="h-16 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500"
            >
              {block.type}
            </div>
          );
        }

        return (
          <div key={block.id} className="block-preview mb-2">
            <BlockComponent {...block.properties} blockId={block.id} />
          </div>
        );
      })}
      {template.blocks.length > maxBlocks && (
        <div className="text-center text-xs text-gray-400 py-2">
          +{template.blocks.length - maxBlocks} more blocks
        </div>
      )}
    </div>
  );
}
