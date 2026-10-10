/**
 * Section Templates
 * Pre-built section configurations for Layer 2 Section Editor
 * Uses V2 blocks only (schema-validated)
 */

export interface SectionTemplate {
    id: string;
    name: string;
    description: string;
    category: 'hero' | 'features' | 'cta' | 'content' | 'testimonial' | 'pricing' | 'contact' | 'gallery' | 'footer';
    previewImage?: string;
    previewColor: string;
    blockType: string;
    defaultProps: Record<string, any>;
    customizableFields: string[];
}

// ============ HERO TEMPLATES ============

export const heroTemplates: SectionTemplate[] = [
    {
        id: 'hero-centered',
        name: 'Centered Hero',
        description: 'Clean centered hero with title, subtitle, and CTA',
        category: 'hero',
        previewColor: '#1a1a2e',
        blockType: 'v2-hero-simple',
        defaultProps: {
            title: 'Welcome to Our Platform',
            subtitle: 'Discover amazing features and solutions',
            ctaText: 'Get Started',
            ctaLink: '/contact',
            alignment: 'center',
        },
        customizableFields: ['title', 'subtitle', 'ctaText', 'ctaLink'],
    },
    {
        id: 'hero-left',
        name: 'Left Aligned Hero',
        description: 'Bold left-aligned hero for strong statements',
        category: 'hero',
        previewColor: '#0f3460',
        blockType: 'v2-hero-simple',
        defaultProps: {
            title: 'Transform Your Business',
            subtitle: 'Enterprise solutions designed for modern challenges',
            ctaText: 'Learn More',
            ctaLink: '/about',
            alignment: 'left',
        },
        customizableFields: ['title', 'subtitle', 'ctaText', 'ctaLink'],
    },
    {
        id: 'hero-with-image',
        name: 'Hero with Image',
        description: 'Split layout with image',
        category: 'hero',
        previewColor: '#16213e',
        blockType: 'v2-hero-with-image',
        defaultProps: {
            title: 'Your Vision, Our Mission',
            subtitle: 'Building the future together',
            ctaText: 'Contact Us',
            ctaLink: '/contact',
        },
        customizableFields: ['title', 'subtitle', 'imageUrl', 'ctaText'],
    },
];

// ============ FEATURE TEMPLATES ============

export const featureTemplates: SectionTemplate[] = [
    {
        id: 'features-3col',
        name: '3-Column Features',
        description: 'Classic 3-column feature grid with icons',
        category: 'features',
        previewColor: '#f8f9fa',
        blockType: 'v2-feature-grid',
        defaultProps: {
            heading: 'Why Choose Us',
            subheading: 'Everything you need to succeed',
            columns: 3,
        },
        customizableFields: ['heading', 'subheading'],
    },
    {
        id: 'features-4col',
        name: '4-Column Features',
        description: 'Compact 4-column feature grid',
        category: 'features',
        previewColor: '#ffffff',
        blockType: 'v2-feature-grid',
        defaultProps: {
            heading: 'Our Capabilities',
            subheading: 'Comprehensive solutions for every need',
            columns: 4,
        },
        customizableFields: ['heading', 'subheading'],
    },
];

// ============ CTA TEMPLATES ============

export const ctaTemplates: SectionTemplate[] = [
    {
        id: 'cta-primary',
        name: 'Primary CTA',
        description: 'Bold call-to-action banner',
        category: 'cta',
        previewColor: '#4f46e5',
        blockType: 'v2-cta-banner',
        defaultProps: {
            heading: 'Ready to Get Started?',
            description: 'Contact us today and transform your workflow.',
            buttonText: 'Contact Us',
            buttonLink: '/contact',
        },
        customizableFields: ['heading', 'description', 'buttonText', 'buttonLink'],
    },
];

// ============ CONTENT TEMPLATES ============

export const contentTemplates: SectionTemplate[] = [
    {
        id: 'content-text',
        name: 'Text Section',
        description: 'Rich text content block',
        category: 'content',
        previewColor: '#ffffff',
        blockType: 'v2-content-text',
        defaultProps: {
            heading: 'About Our Company',
            content: '<p>We are dedicated to providing the best solutions for our customers.</p>',
        },
        customizableFields: ['heading', 'content'],
    },
    {
        id: 'content-split',
        name: 'Split Content',
        description: 'Text with image side by side',
        category: 'content',
        previewColor: '#f3f4f6',
        blockType: 'v2-content-split',
        defaultProps: {
            heading: 'Our Story',
            content: 'Founded with a vision to transform how businesses operate.',
        },
        customizableFields: ['heading', 'content', 'imageUrl'],
    },
    {
        id: 'stats-grid',
        name: 'Stats Grid',
        description: 'Statistics and metrics display',
        category: 'content',
        previewColor: '#1a1a2e',
        blockType: 'v2-stats-grid',
        defaultProps: {
            heading: 'Our Impact',
            subheading: 'Numbers that speak for themselves',
        },
        customizableFields: ['heading', 'subheading'],
    },
];

// ============ TESTIMONIAL TEMPLATES ============

export const testimonialTemplates: SectionTemplate[] = [
    {
        id: 'testimonials',
        name: 'Testimonials',
        description: 'Customer testimonials carousel',
        category: 'testimonial',
        previewColor: '#f8f9fa',
        blockType: 'v2-testimonials',
        defaultProps: {
            heading: 'What Our Clients Say',
            subheading: 'Trusted by companies worldwide',
        },
        customizableFields: ['heading', 'subheading'],
    },
];

// ============ PRICING TEMPLATES ============

export const pricingTemplates: SectionTemplate[] = [
    {
        id: 'pricing-table',
        name: 'Pricing Table',
        description: 'Pricing comparison table',
        category: 'pricing',
        previewColor: '#ffffff',
        blockType: 'v2-pricing',
        defaultProps: {
            heading: 'Simple, Transparent Pricing',
            subheading: 'Choose the plan that works best for you',
        },
        customizableFields: ['heading', 'subheading'],
    },
];

// ============ CONTACT TEMPLATES ============

export const contactTemplates: SectionTemplate[] = [
    {
        id: 'faq',
        name: 'FAQ Section',
        description: 'Frequently asked questions accordion',
        category: 'contact',
        previewColor: '#ffffff',
        blockType: 'v2-faq',
        defaultProps: {
            heading: 'Frequently Asked Questions',
            subheading: 'Find answers to common questions',
        },
        customizableFields: ['heading', 'subheading'],
    },
];

// ============ GALLERY TEMPLATES ============

export const galleryTemplates: SectionTemplate[] = [
    {
        id: 'gallery',
        name: 'Image Gallery',
        description: 'Grid gallery with lightbox',
        category: 'gallery',
        previewColor: '#ffffff',
        blockType: 'v2-gallery',
        defaultProps: {
            heading: 'Our Gallery',
            subheading: 'A showcase of our work',
            columns: 3,
        },
        customizableFields: ['heading', 'subheading', 'columns'],
    },
];

// ============ FOOTER TEMPLATES ============

export const footerTemplates: SectionTemplate[] = [
    {
        id: 'footer',
        name: 'Footer',
        description: 'Multi-column page footer',
        category: 'footer',
        previewColor: '#1a1a2e',
        blockType: 'v2-footer',
        defaultProps: {
            logoText: 'Your Company',
            description: 'Building amazing products for our customers.',
            copyright: '© 2024 Your Company. All rights reserved.',
        },
        customizableFields: ['logoText', 'description', 'copyright'],
    },
];

// ============ ALL TEMPLATES ============

export const allSectionTemplates: SectionTemplate[] = [
    ...heroTemplates,
    ...featureTemplates,
    ...ctaTemplates,
    ...contentTemplates,
    ...testimonialTemplates,
    ...pricingTemplates,
    ...contactTemplates,
    ...galleryTemplates,
    ...footerTemplates,
];

export function getTemplatesByCategory(category: SectionTemplate['category']): SectionTemplate[] {
    return allSectionTemplates.filter(t => t.category === category);
}

export function getTemplateById(id: string): SectionTemplate | undefined {
    return allSectionTemplates.find(t => t.id === id);
}

export const templateCategories = [
    { id: 'hero', label: 'Hero', icon: 'Layout' },
    { id: 'features', label: 'Features', icon: 'Grid3x3' },
    { id: 'cta', label: 'CTA', icon: 'Megaphone' },
    { id: 'content', label: 'Content', icon: 'FileText' },
    { id: 'testimonial', label: 'Testimonials', icon: 'Quote' },
    { id: 'pricing', label: 'Pricing', icon: 'CreditCard' },
    { id: 'contact', label: 'FAQ', icon: 'HelpCircle' },
    { id: 'gallery', label: 'Gallery', icon: 'Image' },
    { id: 'footer', label: 'Footer', icon: 'Footprints' },
] as const;
