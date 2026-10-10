/**
 * V2 Block Schemas
 * Schema definitions for all V2 blocks (matching BlockSchema interface)
 */

import { type BlockSchema, registerBlockSchema, type PropField } from './block-schema';

// ============ HERO SCHEMAS ============

const v2HeroSimpleSchema: BlockSchema = {
    type: 'v2-hero-simple',
    label: 'V2 Hero Simple',
    description: 'Simple hero with title, subtitle and CTA',
    category: 'hero',
    icon: 'Layout',
    version: 1,
    defaultProps: {
        title: 'Welcome to Our Platform',
        subtitle: 'Discover amazing features',
        alignment: 'center',
        backgroundColor: '#1a1a2e',
        textColor: '#ffffff',
        ctaText: 'Get Started',
        ctaLink: '/contact',
    },
    propSchema: [
        { key: 'title', label: 'Title', type: 'text', required: true } as PropField,
        { key: 'subtitle', label: 'Subtitle', type: 'text' } as PropField,
        {
            key: 'alignment', label: 'Alignment', type: 'select', options: [
                { value: 'left', label: 'Left' },
                { value: 'center', label: 'Center' },
                { value: 'right', label: 'Right' },
            ]
        } as PropField,
        { key: 'backgroundColor', label: 'Background Color', type: 'color' } as PropField,
        { key: 'textColor', label: 'Text Color', type: 'color' } as PropField,
        { key: 'ctaText', label: 'Button Text', type: 'text' } as PropField,
        { key: 'ctaLink', label: 'Button Link', type: 'text' } as PropField,
    ],
};

const v2HeroWithImageSchema: BlockSchema = {
    type: 'v2-hero-with-image',
    label: 'V2 Hero With Image',
    description: 'Split hero with image',
    category: 'hero',
    icon: 'Image',
    version: 1,
    defaultProps: {
        title: 'Powerful Solutions',
        subtitle: 'Discover Our Offerings',
        description: 'Transform your workflow with our platform.',
        imageUrl: '',
        imagePosition: 'right',
        ctaText: 'Get Started',
        ctaLink: '/contact',
    },
    propSchema: [
        { key: 'title', label: 'Title', type: 'text', required: true } as PropField,
        { key: 'subtitle', label: 'Subtitle', type: 'text' } as PropField,
        { key: 'description', label: 'Description', type: 'textarea' } as PropField,
        { key: 'imageUrl', label: 'Image URL', type: 'image' } as PropField,
        {
            key: 'imagePosition', label: 'Image Position', type: 'select', options: [
                { value: 'left', label: 'Left' },
                { value: 'right', label: 'Right' },
            ]
        } as PropField,
        { key: 'ctaText', label: 'Button Text', type: 'text' } as PropField,
        { key: 'ctaLink', label: 'Button Link', type: 'text' } as PropField,
    ],
};

// ============ CTA SCHEMA ============

const v2CtaBannerSchema: BlockSchema = {
    type: 'v2-cta-banner',
    label: 'V2 CTA Banner',
    description: 'Call-to-action banner',
    category: 'cta',
    icon: 'Megaphone',
    version: 1,
    defaultProps: {
        heading: 'Ready to Get Started?',
        description: 'Contact us today.',
        buttonText: 'Contact Us',
        buttonLink: '/contact',
        backgroundColor: '#4f46e5',
        textColor: '#ffffff',
        alignment: 'center',
    },
    propSchema: [
        { key: 'heading', label: 'Heading', type: 'text', required: true } as PropField,
        { key: 'description', label: 'Description', type: 'text' } as PropField,
        { key: 'buttonText', label: 'Button Text', type: 'text' } as PropField,
        { key: 'buttonLink', label: 'Button Link', type: 'text' } as PropField,
        { key: 'backgroundColor', label: 'Background Color', type: 'color' } as PropField,
        { key: 'textColor', label: 'Text Color', type: 'color' } as PropField,
        {
            key: 'alignment', label: 'Alignment', type: 'select', options: [
                { value: 'left', label: 'Left' },
                { value: 'center', label: 'Center' },
                { value: 'right', label: 'Right' },
            ]
        } as PropField,
    ],
};

// ============ FEATURE SCHEMA ============

const v2FeatureGridSchema: BlockSchema = {
    type: 'v2-feature-grid',
    label: 'V2 Feature Grid',
    description: 'Feature icons grid',
    category: 'content',
    icon: 'Grid3x3',
    version: 1,
    defaultProps: {
        heading: 'Why Choose Us',
        subheading: 'Everything you need to succeed',
        columns: 3,
        backgroundColor: '#ffffff',
        textColor: '#1a1a2e',
    },
    propSchema: [
        { key: 'heading', label: 'Heading', type: 'text' } as PropField,
        { key: 'subheading', label: 'Subheading', type: 'text' } as PropField,
        {
            key: 'columns', label: 'Columns', type: 'select', options: [
                { value: '2', label: '2 Columns' },
                { value: '3', label: '3 Columns' },
                { value: '4', label: '4 Columns' },
            ]
        } as PropField,
        { key: 'backgroundColor', label: 'Background Color', type: 'color' } as PropField,
        { key: 'textColor', label: 'Text Color', type: 'color' } as PropField,
    ],
};

// ============ CONTENT SCHEMAS ============

const v2ContentTextSchema: BlockSchema = {
    type: 'v2-content-text',
    label: 'V2 Content Text',
    description: 'Rich text content',
    category: 'content',
    icon: 'FileText',
    version: 1,
    defaultProps: {
        heading: '',
        content: '<p>Add your content here.</p>',
        alignment: 'left',
        maxWidth: 'lg',
        backgroundColor: '#ffffff',
    },
    propSchema: [
        { key: 'heading', label: 'Heading', type: 'text' } as PropField,
        { key: 'content', label: 'Content', type: 'richtext' } as PropField,
        {
            key: 'alignment', label: 'Alignment', type: 'select', options: [
                { value: 'left', label: 'Left' },
                { value: 'center', label: 'Center' },
                { value: 'right', label: 'Right' },
            ]
        } as PropField,
        {
            key: 'maxWidth', label: 'Max Width', type: 'select', options: [
                { value: 'sm', label: 'Small' },
                { value: 'md', label: 'Medium' },
                { value: 'lg', label: 'Large' },
                { value: 'full', label: 'Full' },
            ]
        } as PropField,
        { key: 'backgroundColor', label: 'Background Color', type: 'color' } as PropField,
    ],
};

const v2ContentSplitSchema: BlockSchema = {
    type: 'v2-content-split',
    label: 'V2 Content Split',
    description: 'Text + image layout',
    category: 'content',
    icon: 'Columns',
    version: 1,
    defaultProps: {
        heading: 'About Our Company',
        subheading: 'Our Story',
        content: 'We are dedicated to providing the best solutions.',
        imageUrl: '',
        imagePosition: 'right',
    },
    propSchema: [
        { key: 'heading', label: 'Heading', type: 'text', required: true } as PropField,
        { key: 'subheading', label: 'Subheading', type: 'text' } as PropField,
        { key: 'content', label: 'Content', type: 'textarea' } as PropField,
        { key: 'imageUrl', label: 'Image URL', type: 'image' } as PropField,
        {
            key: 'imagePosition', label: 'Image Position', type: 'select', options: [
                { value: 'left', label: 'Left' },
                { value: 'right', label: 'Right' },
            ]
        } as PropField,
        { key: 'ctaText', label: 'Button Text', type: 'text' } as PropField,
        { key: 'ctaLink', label: 'Button Link', type: 'text' } as PropField,
    ],
};

const v2StatsGridSchema: BlockSchema = {
    type: 'v2-stats-grid',
    label: 'V2 Stats Grid',
    description: 'Statistics display',
    category: 'content',
    icon: 'BarChart3',
    version: 1,
    defaultProps: {
        heading: 'Our Impact',
        subheading: 'Numbers that speak for themselves',
        columns: 4,
        backgroundColor: '#1a1a2e',
        textColor: '#ffffff',
        accentColor: '#4f46e5',
    },
    propSchema: [
        { key: 'heading', label: 'Heading', type: 'text' } as PropField,
        { key: 'subheading', label: 'Subheading', type: 'text' } as PropField,
        {
            key: 'columns', label: 'Columns', type: 'select', options: [
                { value: '2', label: '2 Columns' },
                { value: '3', label: '3 Columns' },
                { value: '4', label: '4 Columns' },
            ]
        } as PropField,
        { key: 'backgroundColor', label: 'Background Color', type: 'color' } as PropField,
        { key: 'textColor', label: 'Text Color', type: 'color' } as PropField,
        { key: 'accentColor', label: 'Accent Color', type: 'color' } as PropField,
    ],
};

// ============ TESTIMONIAL SCHEMA ============

const v2TestimonialsSchema: BlockSchema = {
    type: 'v2-testimonials',
    label: 'V2 Testimonials',
    description: 'Customer testimonials',
    category: 'content',
    icon: 'Quote',
    version: 1,
    defaultProps: {
        heading: 'What Our Clients Say',
        subheading: 'Trusted by companies worldwide',
        backgroundColor: '#f8f9fa',
        textColor: '#1a1a2e',
    },
    propSchema: [
        { key: 'heading', label: 'Heading', type: 'text' } as PropField,
        { key: 'subheading', label: 'Subheading', type: 'text' } as PropField,
        { key: 'backgroundColor', label: 'Background Color', type: 'color' } as PropField,
        { key: 'textColor', label: 'Text Color', type: 'color' } as PropField,
    ],
};

// ============ PRICING SCHEMA ============

const v2PricingSchema: BlockSchema = {
    type: 'v2-pricing',
    label: 'V2 Pricing',
    description: 'Pricing table',
    category: 'content',
    icon: 'CreditCard',
    version: 1,
    defaultProps: {
        heading: 'Simple, Transparent Pricing',
        subheading: 'Choose the plan that works best',
        backgroundColor: '#ffffff',
        textColor: '#1a1a2e',
    },
    propSchema: [
        { key: 'heading', label: 'Heading', type: 'text' } as PropField,
        { key: 'subheading', label: 'Subheading', type: 'text' } as PropField,
        { key: 'backgroundColor', label: 'Background Color', type: 'color' } as PropField,
        { key: 'textColor', label: 'Text Color', type: 'color' } as PropField,
    ],
};

// ============ FAQ SCHEMA ============

const v2FaqSchema: BlockSchema = {
    type: 'v2-faq',
    label: 'V2 FAQ',
    description: 'FAQ accordion',
    category: 'content',
    icon: 'HelpCircle',
    version: 1,
    defaultProps: {
        heading: 'Frequently Asked Questions',
        subheading: 'Find answers to common questions',
        backgroundColor: '#ffffff',
        textColor: '#1a1a2e',
    },
    propSchema: [
        { key: 'heading', label: 'Heading', type: 'text' } as PropField,
        { key: 'subheading', label: 'Subheading', type: 'text' } as PropField,
        { key: 'backgroundColor', label: 'Background Color', type: 'color' } as PropField,
        { key: 'textColor', label: 'Text Color', type: 'color' } as PropField,
    ],
};

// ============ GALLERY SCHEMA ============

const v2GallerySchema: BlockSchema = {
    type: 'v2-gallery',
    label: 'V2 Gallery',
    description: 'Image gallery',
    category: 'media',
    icon: 'Images',
    version: 1,
    defaultProps: {
        heading: 'Our Gallery',
        subheading: 'A showcase of our work',
        columns: 3,
        backgroundColor: '#ffffff',
    },
    propSchema: [
        { key: 'heading', label: 'Heading', type: 'text' } as PropField,
        { key: 'subheading', label: 'Subheading', type: 'text' } as PropField,
        {
            key: 'columns', label: 'Columns', type: 'select', options: [
                { value: '2', label: '2 Columns' },
                { value: '3', label: '3 Columns' },
                { value: '4', label: '4 Columns' },
            ]
        } as PropField,
        { key: 'backgroundColor', label: 'Background Color', type: 'color' } as PropField,
    ],
};

// ============ FOOTER SCHEMA ============

const v2FooterSchema: BlockSchema = {
    type: 'v2-footer',
    label: 'V2 Footer',
    description: 'Page footer',
    category: 'footer',
    icon: 'Footprints',
    version: 1,
    defaultProps: {
        logoText: 'Your Company',
        description: 'Building amazing products.',
        copyright: '© 2024 Your Company. All rights reserved.',
        backgroundColor: '#1a1a2e',
        textColor: '#ffffff',
    },
    propSchema: [
        { key: 'logoText', label: 'Logo Text', type: 'text' } as PropField,
        { key: 'description', label: 'Description', type: 'text' } as PropField,
        { key: 'copyright', label: 'Copyright', type: 'text' } as PropField,
        { key: 'backgroundColor', label: 'Background Color', type: 'color' } as PropField,
        { key: 'textColor', label: 'Text Color', type: 'color' } as PropField,
    ],
};

// ============ REGISTER ALL V2 SCHEMAS ============

export function registerV2Schemas(): void {
    registerBlockSchema(v2HeroSimpleSchema);
    registerBlockSchema(v2HeroWithImageSchema);
    registerBlockSchema(v2CtaBannerSchema);
    registerBlockSchema(v2FeatureGridSchema);
    registerBlockSchema(v2ContentTextSchema);
    registerBlockSchema(v2ContentSplitSchema);
    registerBlockSchema(v2StatsGridSchema);
    registerBlockSchema(v2TestimonialsSchema);
    registerBlockSchema(v2PricingSchema);
    registerBlockSchema(v2FaqSchema);
    registerBlockSchema(v2GallerySchema);
    registerBlockSchema(v2FooterSchema);

    console.log('[CMS] V2 block schemas registered (12 blocks)');
}
