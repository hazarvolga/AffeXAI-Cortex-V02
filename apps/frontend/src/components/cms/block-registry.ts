/**
 * Block Registry
 * Central registry for all CMS blocks
 * 
 * V2 System: Clean 16-block architecture
 */

// Import V2 blocks
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

export const blockRegistry = {
  // V2 blocks (schema-validated)
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
  // New V2 blocks
  'v2-contact-form': V2ContactForm,
  'v2-team-grid': V2TeamGrid,
  'v2-logo-cloud': V2LogoCloud,
  'v2-newsletter': V2Newsletter,

  // Legacy mappings
  'gallery-three-image-grid': V2Gallery,
  'video-embed-section': V2ContentText,
  'content-three-column-grid': V2FeatureGrid,
  'content-section-with-title': V2ContentText,
  'hero-with-background-image': V2HeroWithImage,
  'newsletter-signup': V2Newsletter,
  'cta-banner': V2CtaBanner,
  'special-feature-trio': V2FeatureGrid,
  'content-single-fullwidth': V2ContentText,
  'element-button-group': V2CtaBanner,
  'gallery-single-image': V2HeroWithImage,
} as const;

export type BlockType = keyof typeof blockRegistry;
export type BlockComponent = typeof blockRegistry[BlockType];

// Type guard to check if a type is a valid block type
export function isBlockType(type: string): type is BlockType {
  return type in blockRegistry;
}

