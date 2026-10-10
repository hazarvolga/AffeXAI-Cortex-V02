/**
 * CMS Components Registry
 * Central registry for all prebuild components with metadata
 */

import { getAllBlockSchemas, type BlockSchema } from '@/components/cms/schemas';

export type ComponentCategory =
  | 'Reusable' // Reusable components from database
  | 'Navigation'
  | 'Hero'
  | 'Content'
  | 'ContentVariant'
  | 'Element'
  | 'Gallery'
  | 'Footer'
  | 'Ecommerce'
  | 'Blog'
  | 'Social'
  | 'Special'
  | 'Testimonials'
  | 'Features'
  | 'Stats'
  | 'Pricing'
  | 'Rating'
  | 'Progress';

export interface ComponentRegistryItem {
  id: string; // e.g., 'nav-minimal-logo-left'
  name: string; // Display name
  description: string;
  category: ComponentCategory;
  icon?: string; // Lucide icon name
  thumbnail?: string; // Preview image URL
  defaultProps: any;
}

/**
 * Legacy ID mapping for backwards compatibility
 * Maps old component IDs to new ones
 */
const legacyIdMap: Record<string, string> = {
  // Old icon-* IDs → New features-* IDs
  'icon-single': 'features-single-centered',
  'icon-box': 'features-box-centered',
  'icon-grid': 'features-icon-grid-three',
  'icon-list': 'features-list-with-icons',

  // Old features-* variations
  'features-single': 'features-single-centered',
  'features-feature-grid': 'features-icon-grid-three',
  'features-grid': 'features-icon-grid-three',
};

/**
 * Normalize component ID (handle legacy IDs)
 */
export const normalizeComponentId = (id: string): string => {
  return legacyIdMap[id] || id;
};

/**
 * Extract category from component ID
 */
const getCategoryFromId = (id: string): ComponentCategory => {
  if (id.startsWith('nav-')) return 'Navigation';
  if (id.startsWith('hero-')) return 'Hero';
  if (id.startsWith('content-') && !id.includes('variant')) return 'Content';
  if (id.includes('variant')) return 'ContentVariant';
  if (id.startsWith('element-')) return 'Element';
  if (id.startsWith('gallery-')) return 'Gallery';
  if (id.startsWith('footer-')) return 'Footer';
  if (id.startsWith('ecommerce-')) return 'Ecommerce';
  if (id.startsWith('blog-') || id.startsWith('rss-')) return 'Blog';
  if (id.startsWith('social-')) return 'Social';
  if (id.startsWith('special-')) return 'Special';
  if (id.startsWith('testimonial-')) return 'Testimonials';
  if (id.startsWith('features-')) return 'Features';
  if (id.startsWith('stats-')) return 'Stats';
  if (id.startsWith('pricing-')) return 'Pricing';
  if (id.startsWith('rating-') || id.startsWith('review-')) return 'Rating';
  if (id.startsWith('progress-')) return 'Progress';
  if (id.startsWith('stats-')) return 'Stats';
  return 'Content'; // Default
};

/**
 * Format component ID to readable name
 */
const formatComponentName = (id: string): string => {
  return id
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Generate default props from block config schema
 */
const generateDefaultProps = (config: any): any => {
  const props: any = {};

  Object.entries(config).forEach(([key, schema]: [string, any]) => {
    if (schema.defaultValue !== undefined) {
      props[key] = schema.defaultValue;
    } else if (schema.type === 'list') {
      props[key] = [];
    } else if (schema.type === 'boolean') {
      props[key] = false;
    } else if (schema.type === 'number') {
      props[key] = 0;
    } else {
      props[key] = '';
    }
  });

  return props;
};

/**
 * Component descriptions by ID
 */
const componentDescriptions: Record<string, string> = {
  // Navigation
  'nav-minimal-logo-left': 'Clean navigation bar with logo on the left',
  'nav-centered-logo': 'Centered logo with split navigation items',
  'nav-logo-cta': 'Navigation with prominent call-to-action button',
  'nav-social-links': 'Navigation with integrated social media links',
  'nav-sticky-transparent': 'Sticky transparent navigation that appears on scroll',
  'nav-split': 'Split navigation with left and right sections',

  // Hero
  'hero-centered-bg-image': 'Hero section with centered content and background image',
  'hero-split-image-right': 'Split hero with image on the right side',
  'hero-gradient-floating-cta': 'Gradient hero with floating call-to-action',
  'hero-video-background': 'Hero section with video background',
  'hero-fullscreen-sticky-cta': 'Fullscreen hero with sticky CTA button',
  'hero-carousel-slides': 'Hero section with carousel/slider functionality',

  // Content
  'content-single-fullwidth': 'Single column full-width content section',
  'content-two-column': 'Two column content layout',
  'content-three-column-grid': 'Three column grid layout',
  'content-large-small-column': 'Asymmetric layout with large and small columns',
  'content-small-large-column': 'Asymmetric layout with small and large columns',
  'content-asymmetric-accent': 'Asymmetric content with accent styling',

  // Content Variants
  'content-simple-block': 'Simple content block with text',
  'content-boxed-block': 'Content in a bordered box container',
  'content-image-side-by-side': 'Image and text side by side layout',
  'content-double-image-text': 'Two images with text content',
  'content-triple-grid': 'Three items in grid layout',
  'content-cta-box': 'Call-to-action box with emphasis',
  'content-image-stacked': 'Stacked images with text',
  'content-mini-box-cta': 'Compact call-to-action box',

  // Elements
  'element-spacer': 'Vertical spacing element',
  'element-divider': 'Horizontal divider line',
  'element-title-subtitle': 'Title with subtitle text',
  'element-title-button': 'Title with action button',
  'element-quote-block': 'Styled quote or testimonial block',
  'element-media-image': 'Single image element',
  'element-button-group': 'Group of action buttons',
  'element-table-list': 'Table or list layout',

  // Gallery
  'gallery-single-image': 'Single large image display',
  'gallery-two-image-split': 'Two images side by side',
  'gallery-three-image-grid': 'Three images in grid layout',
  'gallery-four-image-mosaic': 'Four images in mosaic pattern',
  'gallery-five-image-showcase': 'Five images showcase layout',
  'gallery-carousel': 'Image carousel/slider',

  // Footer
  'footer-basic': 'Basic footer with links and copyright',
  'footer-multi-column': 'Multi-column footer with sections',
  'footer-newsletter-signup': 'Footer with newsletter subscription',
  'footer-social-heavy': 'Footer with prominent social media links',
  'footer-compact-centered': 'Compact centered footer',
  'footer-extended-cta': 'Extended footer with call-to-action',

  // Ecommerce
  'ecommerce-single-product': 'Single product display',
  'ecommerce-aligned-product': 'Product with aligned layout',
  'ecommerce-two-product-grid': 'Two products in grid',
  'ecommerce-three-product-grid': 'Three products in grid',
  'ecommerce-three-product-showcase': 'Three products showcase',
  'ecommerce-discount-banner': 'Discount or sale banner',
  'ecommerce-horizontal-discount': 'Horizontal discount banner',

  // Blog
  'blog-extended-feature': 'Featured blog post with extended preview',
  'blog-basic-list': 'Basic list of blog posts',
  'blog-double-post-highlight': 'Two highlighted blog posts',
  'blog-mini-highlight': 'Mini blog post highlight',
  'blog-author-bio-left': 'Author bio with left alignment',
  'blog-author-bio-centered': 'Centered author bio',
  'blog-rss-featured-article': 'Featured RSS article',
  'blog-rss-list': 'RSS feed list',

  // Social
  'social-links-row': 'Row of social media links',
  'social-share-buttons': 'Social sharing buttons',
  'social-facebook-embed': 'Embedded Facebook post',
  'social-instagram-grid': 'Instagram photo grid',
  'social-tiktok-youtube-embed': 'TikTok or YouTube video embed',

  // Special
  'special-accordion-faq': 'Accordion FAQ section',
  'special-countdown-timer': 'Countdown timer widget',
  'special-survey-quiz': 'Survey or quiz component',
  'special-digital-signature': 'Digital signature capture',
  'special-event-highlight': 'Event highlight section',
  'special-feature-trio': 'Three features showcase',
  'special-code-snippet': 'Code snippet display',

  // Testimonials
  'testimonial-single-card': 'Single testimonial card with quote and rating',
  'testimonial-grid-three': 'Three testimonials in grid layout',
  'testimonial-carousel': 'Testimonial slider/carousel with navigation',
  'testimonial-minimal': 'Minimal testimonial with border accent',
  'testimonial-wall': 'Masonry grid of multiple testimonials',

  // Features
  'features-single-centered': 'Single feature section with centered icon',
  'features-box-centered': 'Feature box with CTA button',
  'features-box-left': 'Feature box with left-aligned icon',
  'features-icon-grid-three': 'Grid of features with icons (3 columns)',
  'features-list-with-icons': 'Features list with icon bullets',
  'features-services-two-column': 'Services grid with icons (2 columns)',

  // Stats
  'stats-four-column': 'Four stats with icons in columns',
  'stats-counter-animated': 'Animated counter stats',
  'stats-circular-progress': 'Stats with circular progress bars',
  'stats-minimal': 'Minimal stats with border separators',
  'stats-with-background': 'Stats with background cards',

  // Pricing
  'pricing-table-three-column': 'Three column pricing table with features',
  'pricing-comparison-detailed': 'Detailed pricing comparison table',
  'pricing-toggle-switch': 'Pricing with monthly/yearly toggle switch',

  // Rating & Reviews
  'rating-stars-inline': 'Inline star rating with review count',
  'review-card-single': 'Single detailed review card',
  'review-grid-three': 'Three reviews in grid layout',

  // Progress Bars
  'progress-bar-single': 'Single animated progress bar',
  'progress-bars-stacked': 'Stacked progress bars for skills',
  'progress-circular': 'Circular progress indicators grid',
};

/**
 * Generate complete components registry
 */
export const getComponentsRegistry = (): ComponentRegistryItem[] => {
  const schemas = getAllBlockSchemas();
  return Object.keys(schemas).map(id => ({
    id,
    name: formatComponentName(id),
    description: componentDescriptions[id] || `${formatComponentName(id)} component`,
    category: getCategoryFromId(id),
    defaultProps: schemas[id]?.defaultProps || {},
  }));
};

// Lazy-loaded registry for backwards compatibility
export const componentsRegistry: ComponentRegistryItem[] = [];

/**
 * Get components by category
 */
export const getComponentsByCategory = (category: ComponentCategory): ComponentRegistryItem[] => {
  return componentsRegistry.filter(comp => comp.category === category);
};

/**
 * Get component by ID (with legacy ID support)
 */
export const getComponentById = (id: string): ComponentRegistryItem | undefined => {
  // Normalize legacy IDs first
  const normalizedId = normalizeComponentId(id);
  return componentsRegistry.find(comp => comp.id === normalizedId);
};

/**
 * Get all categories
 */
export const getAllCategories = (): ComponentCategory[] => {
  return [
    'Reusable', // Reusable components from database - shown first
    'Navigation',
    'Hero',
    'Content',
    'ContentVariant',
    'Element',
    'Gallery',
    'Footer',
    'Ecommerce',
    'Blog',
    'Social',
    'Special',
    'Testimonials',
    'Features',
    'Stats',
    'Pricing',
    'Rating',
    'Progress',
  ];
};

/**
 * Search components by name or description
 */
export const searchComponents = (query: string): ComponentRegistryItem[] => {
  const lowerQuery = query.toLowerCase();
  return componentsRegistry.filter(comp =>
    comp.name.toLowerCase().includes(lowerQuery) ||
    comp.description.toLowerCase().includes(lowerQuery)
  );
};
