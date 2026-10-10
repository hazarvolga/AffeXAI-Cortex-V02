/**
 * Schema-Validated Hero Blocks
 * Enterprise-grade hero sections with full type safety
 */

import { BlockSchema, registerBlockSchema } from './block-schema';

// ============ HERO SIMPLE ============

export const heroSimpleSchema: BlockSchema = {
    type: 'v2-hero-simple',
    label: 'Hero Simple',
    description: 'Clean hero with title, subtitle, and CTA button',
    category: 'hero',
    icon: 'Layout',
    version: 1,
    tags: ['hero', 'landing', 'header'],
    defaultProps: {
        title: 'Welcome to Our Platform',
        subtitle: 'Discover amazing features and solutions',
        ctaText: 'Get Started',
        ctaLink: '/contact',
        alignment: 'center',
        backgroundColor: '#1a1a2e',
        textColor: '#ffffff',
    },
    propSchema: [
        {
            key: 'title',
            label: 'Title',
            type: 'text',
            required: true,
            placeholder: 'Enter hero title',
            group: 'content',
            maxLength: 100,
        },
        {
            key: 'subtitle',
            label: 'Subtitle',
            type: 'textarea',
            placeholder: 'Enter subtitle text',
            group: 'content',
            rows: 2,
            maxLength: 200,
        },
        {
            key: 'ctaText',
            label: 'Button Text',
            type: 'text',
            placeholder: 'Button label',
            group: 'content',
        },
        {
            key: 'ctaLink',
            label: 'Button Link',
            type: 'link',
            placeholder: '/page or https://...',
            group: 'content',
            allowExternal: true,
        },
        {
            key: 'alignment',
            label: 'Text Alignment',
            type: 'select',
            group: 'style',
            options: [
                { value: 'left', label: 'Left' },
                { value: 'center', label: 'Center' },
                { value: 'right', label: 'Right' },
            ],
            defaultValue: 'center',
        },
        {
            key: 'backgroundColor',
            label: 'Background Color',
            type: 'color',
            group: 'style',
            presets: ['#1a1a2e', '#0f3460', '#16213e', '#1a1a1a', '#ffffff'],
        },
        {
            key: 'textColor',
            label: 'Text Color',
            type: 'color',
            group: 'style',
            presets: ['#ffffff', '#000000', '#e2e2e2'],
        },
    ],
};

// ============ HERO WITH IMAGE ============

export const heroWithImageSchema: BlockSchema = {
    type: 'v2-hero-with-image',
    label: 'Hero with Image',
    description: 'Hero section with background image and overlay',
    category: 'hero',
    icon: 'Image',
    version: 1,
    tags: ['hero', 'image', 'background'],
    defaultProps: {
        title: 'Transform Your Business',
        subtitle: 'Enterprise solutions for modern challenges',
        ctaText: 'Learn More',
        ctaLink: '/about',
        backgroundImage: '',
        overlayOpacity: 50,
        minHeight: 600,
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
            key: 'subtitle',
            label: 'Subtitle',
            type: 'textarea',
            group: 'content',
        },
        {
            key: 'ctaText',
            label: 'Button Text',
            type: 'text',
            group: 'content',
        },
        {
            key: 'ctaLink',
            label: 'Button Link',
            type: 'link',
            group: 'content',
        },
        {
            key: 'backgroundImage',
            label: 'Background Image',
            type: 'image',
            required: true,
            group: 'media',
            aspectRatio: '16:9',
        },
        {
            key: 'overlayOpacity',
            label: 'Overlay Opacity',
            type: 'number',
            group: 'style',
            min: 0,
            max: 100,
            step: 10,
            unit: '%',
            defaultValue: 50,
        },
        {
            key: 'minHeight',
            label: 'Minimum Height',
            type: 'number',
            group: 'style',
            min: 300,
            max: 1000,
            step: 50,
            unit: 'px',
            defaultValue: 600,
        },
    ],
};

// ============ REGISTER SCHEMAS ============

export function registerHeroSchemas(): void {
    registerBlockSchema(heroSimpleSchema);
    registerBlockSchema(heroWithImageSchema);
}
