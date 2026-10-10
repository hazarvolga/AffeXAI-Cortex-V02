/**
 * Schema-Validated CTA & Feature Blocks
 */

import { BlockSchema, registerBlockSchema } from './block-schema';

// ============ CTA BANNER ============

export const ctaBannerSchema: BlockSchema = {
    type: 'v2-cta-banner',
    label: 'CTA Banner',
    description: 'Call-to-action banner with title and button',
    category: 'cta',
    icon: 'Megaphone',
    version: 1,
    tags: ['cta', 'banner', 'action'],
    defaultProps: {
        title: 'Ready to Get Started?',
        description: 'Contact us today and transform your workflow.',
        buttonText: 'Contact Us',
        buttonLink: '/contact',
        variant: 'primary',
    },
    propSchema: [
        {
            key: 'title',
            label: 'Title',
            type: 'text',
            required: true,
            group: 'content',
        },
        {
            key: 'description',
            label: 'Description',
            type: 'textarea',
            group: 'content',
        },
        {
            key: 'buttonText',
            label: 'Button Text',
            type: 'text',
            required: true,
            group: 'content',
        },
        {
            key: 'buttonLink',
            label: 'Button Link',
            type: 'link',
            group: 'content',
        },
        {
            key: 'variant',
            label: 'Style Variant',
            type: 'select',
            group: 'style',
            options: [
                { value: 'primary', label: 'Primary (Blue)' },
                { value: 'secondary', label: 'Secondary (Gray)' },
                { value: 'gradient', label: 'Gradient' },
                { value: 'dark', label: 'Dark' },
            ],
        },
    ],
};

// ============ FEATURE GRID ============

export const featureGridSchema: BlockSchema = {
    type: 'v2-feature-grid',
    label: 'Feature Grid',
    description: 'Grid of feature cards with icons',
    category: 'content',
    icon: 'Grid3x3',
    version: 1,
    tags: ['features', 'grid', 'cards'],
    defaultProps: {
        title: 'Our Features',
        subtitle: 'Everything you need to succeed',
        columns: 3,
        features: [
            { icon: 'Zap', title: 'Fast', description: 'Lightning quick performance' },
            { icon: 'Shield', title: 'Secure', description: 'Enterprise-grade security' },
            { icon: 'Headphones', title: 'Support', description: '24/7 customer support' },
        ],
    },
    propSchema: [
        {
            key: 'title',
            label: 'Section Title',
            type: 'text',
            group: 'content',
        },
        {
            key: 'subtitle',
            label: 'Section Subtitle',
            type: 'textarea',
            group: 'content',
        },
        {
            key: 'columns',
            label: 'Columns',
            type: 'select',
            group: 'layout',
            options: [
                { value: '2', label: '2 Columns' },
                { value: '3', label: '3 Columns' },
                { value: '4', label: '4 Columns' },
            ],
        },
        {
            key: 'features',
            label: 'Features',
            type: 'array',
            group: 'content',
            minItems: 1,
            maxItems: 12,
            itemSchema: {
                key: 'feature',
                label: 'Feature',
                type: 'object',
                fields: [
                    { key: 'icon', label: 'Icon', type: 'icon', iconSet: 'lucide' },
                    { key: 'title', label: 'Title', type: 'text', required: true },
                    { key: 'description', label: 'Description', type: 'textarea' },
                ],
            },
        },
    ],
};

// ============ REGISTER ============

export function registerCtaFeatureSchemas(): void {
    registerBlockSchema(ctaBannerSchema);
    registerBlockSchema(featureGridSchema);
}
