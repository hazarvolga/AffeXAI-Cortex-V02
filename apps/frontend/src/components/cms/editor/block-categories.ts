/**
 * Simplified Block Categories
 * Layer 3: Reduces 65+ blocks into manageable categories
 * 
 * Core blocks are immediately visible, legacy blocks hidden under "More"
 */

export interface BlockCategoryConfig {
    id: string;
    label: string;
    icon: string;
    description: string;
    isCore: boolean; // Core categories always visible
}

export const blockCategories: BlockCategoryConfig[] = [
    {
        id: 'hero',
        label: 'Hero',
        icon: 'Layout',
        description: 'Page headers and hero sections',
        isCore: true,
    },
    {
        id: 'content',
        label: 'Content',
        icon: 'FileText',
        description: 'Text, images, and rich content',
        isCore: true,
    },
    {
        id: 'features',
        label: 'Features',
        icon: 'Grid3x3',
        description: 'Feature grids and showcases',
        isCore: true,
    },
    {
        id: 'cta',
        label: 'Call to Action',
        icon: 'Megaphone',
        description: 'Buttons, banners, and CTAs',
        isCore: true,
    },
    {
        id: 'layout',
        label: 'Layout',
        icon: 'Columns',
        description: 'Containers, grids, and spacing',
        isCore: true,
    },
    {
        id: 'media',
        label: 'Media',
        icon: 'Image',
        description: 'Images, videos, and galleries',
        isCore: true,
    },
    {
        id: 'navigation',
        label: 'Navigation',
        icon: 'Menu',
        description: 'Menus, tabs, and accordions',
        isCore: false,
    },
    {
        id: 'testimonials',
        label: 'Testimonials',
        icon: 'Quote',
        description: 'Reviews and quotes',
        isCore: false,
    },
    {
        id: 'pricing',
        label: 'Pricing',
        icon: 'CreditCard',
        description: 'Pricing tables and plans',
        isCore: false,
    },
    {
        id: 'data',
        label: 'Data Display',
        icon: 'BarChart',
        description: 'Stats, charts, and metrics',
        isCore: false,
    },
    {
        id: 'footer',
        label: 'Footer',
        icon: 'Footprints',
        description: 'Page footers',
        isCore: false,
    },
    {
        id: 'legacy',
        label: 'Legacy Blocks',
        icon: 'Archive',
        description: 'Older blocks (use with caution)',
        isCore: false,
    },
];

/**
 * Block to Category Mapping
 * Maps existing block types to simplified categories
 */
export const blockCategoryMap: Record<string, string> = {
    // Hero blocks
    'v2-hero-simple': 'hero',
    'v2-hero-with-image': 'hero',
    'hero-solutions': 'hero',
    'hero-corporate': 'hero',
    'hero-case-study': 'hero',
    'hero-minimal': 'hero',
    'hero-campaign': 'hero',
    'hero-split-content': 'hero',
    'hero-with-image-and-text-overlay': 'hero',
    'hero-with-background-image': 'hero',
    'cms-hero-carousel': 'hero',

    // Content blocks
    'text': 'content',
    'content-rich-text': 'content',
    'content-single-fullwidth': 'content',
    'content-three-column-grid': 'content',
    'content-section-with-title': 'content',
    'content-with-call-to-action': 'content',
    'content-with-image-two-column': 'content',
    'content-text-image-split': 'content',
    'text-columns': 'content',

    // Features blocks
    'v2-feature-grid': 'features',
    'feature-showcase-grid': 'features',
    'feature-tabs': 'features',
    'feature-comparison': 'features',
    'special-feature-trio': 'features',
    'special-feature-card-single': 'features',
    'icon-grid': 'features',
    'service-grid': 'features',

    // CTA blocks
    'v2-cta-banner': 'cta',
    'button': 'cta',
    'cta-banner': 'cta',
    'newsletter-signup': 'cta',
    'newsletter-signup-form': 'cta',
    'contact-form-section': 'cta',
    'cms-newsletter-section': 'cta',

    // Layout blocks
    'container': 'layout',
    'grid': 'layout',
    'card': 'layout',
    'special-grid-container': 'layout',
    'cms-parallax-spacer': 'layout',

    // Media blocks
    'image': 'media',
    'video-embed-section': 'media',
    'carousel-gallery': 'media',
    'gallery-three-image-grid': 'media',
    'image-text-overlap': 'media',
    'client-logo-grid': 'media',
    'logo-cloud': 'media',
    'partner-showcase': 'media',

    // Navigation blocks
    'category-tabs': 'navigation',
    'content-tabs': 'navigation',
    'workflow-tabs': 'navigation',
    'special-resource-tabs': 'navigation',
    'accordion-faq': 'navigation',
    'faq-grid': 'navigation',
    'special-accordion-faq': 'navigation',
    'faq-section-with-accordion': 'navigation',
    'process-steps': 'navigation',

    // Testimonials
    'testimonial-carousel': 'testimonials',
    'quote-callout': 'testimonials',

    // Pricing
    'pricing-comparison-table': 'pricing',
    'comparison-table': 'pricing',

    // Data Display
    'stats-metrics-grid': 'data',
    'social-proof-stats': 'data',
    'metric-cards': 'data',
    'timeline-horizontal': 'data',
    'timeline-vertical': 'data',
    'cms-timeline-carousel': 'data',

    // Footers
    'footer-multi-column': 'footer',
    'footer-compact-centered': 'footer',
    'footer-extended-cta': 'footer',
    'footer-newsletter-signup': 'footer',

    // Legacy - everything else
    'cms-certificate-verification': 'legacy',
    'cms-solutions-carousel': 'legacy',
    'cms-products-carousel': 'legacy',
    'cms-why-aluplan': 'legacy',
    'cms-workflow-section': 'legacy',
    'special-product-grid': 'legacy',
    'team-member-grid': 'legacy',
    'blog-post-grid': 'legacy',
    'split-feature-highlight': 'legacy',
};

/**
 * Get category for a block type
 */
export function getBlockCategory(blockType: string): string {
    return blockCategoryMap[blockType] || 'legacy';
}

/**
 * Get core categories (always shown)
 */
export function getCoreCategories(): BlockCategoryConfig[] {
    return blockCategories.filter(c => c.isCore);
}

/**
 * Get extra categories (shown under "More")
 */
export function getExtraCategories(): BlockCategoryConfig[] {
    return blockCategories.filter(c => !c.isCore);
}

/**
 * Check if block is v2 (schema-validated)
 */
export function isV2Block(blockType: string): boolean {
    return blockType.startsWith('v2-');
}
