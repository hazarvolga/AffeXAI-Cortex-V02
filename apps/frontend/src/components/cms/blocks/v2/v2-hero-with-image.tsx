'use client';

/**
 * V2 Hero With Image Block
 * Schema-validated hero with image and content split
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface V2HeroWithImageProps {
    title?: string;
    subtitle?: string;
    description?: string;
    imageUrl?: string;
    imageAlt?: string;
    imagePosition?: 'left' | 'right';
    backgroundColor?: string;
    textColor?: string;
    ctaText?: string;
    ctaLink?: string;
    secondaryCtaText?: string;
    secondaryCtaLink?: string;
    className?: string;
}

export function V2HeroWithImage({
    title = 'Powerful Solutions for Your Business',
    subtitle = 'Discover Our Offerings',
    description = 'Transform your workflow with our comprehensive platform. Built for teams who want to achieve more.',
    imageUrl = '/images/placeholder-hero.jpg',
    imageAlt = 'Hero image',
    imagePosition = 'right',
    backgroundColor = '#0f172a',
    textColor = '#ffffff',
    ctaText = 'Get Started',
    ctaLink = '#',
    secondaryCtaText = 'Learn More',
    secondaryCtaLink = '#',
    className,
}: V2HeroWithImageProps) {
    return (
        <section
            className={cn('py-16 md:py-24 px-4', className)}
            style={{ backgroundColor, color: textColor }}
        >
            <div className={cn(
                'container mx-auto grid md:grid-cols-2 gap-12 items-center',
                imagePosition === 'left' && 'md:grid-flow-col-dense'
            )}>
                {/* Content */}
                <div className={cn('space-y-6', imagePosition === 'left' && 'md:col-start-2')}>
                    {subtitle && (
                        <p className="text-sm font-semibold uppercase tracking-wide opacity-80">
                            {subtitle}
                        </p>
                    )}

                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                        {title}
                    </h1>

                    {description && (
                        <p className="text-lg opacity-80 max-w-lg">
                            {description}
                        </p>
                    )}

                    <div className="flex flex-wrap gap-4 pt-4">
                        {ctaText && ctaLink && (
                            <Link href={ctaLink}>
                                <Button size="lg">{ctaText}</Button>
                            </Link>
                        )}

                        {secondaryCtaText && secondaryCtaLink && (
                            <Link href={secondaryCtaLink}>
                                <Button size="lg" variant="outline" style={{ borderColor: textColor, color: textColor }}>
                                    {secondaryCtaText}
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Image */}
                <div className={cn(
                    'relative aspect-[4/3] rounded-lg overflow-hidden',
                    imagePosition === 'left' && 'md:col-start-1'
                )}>
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={imageAlt}
                            fill
                            className="object-cover"
                            priority
                        />
                    ) : (
                        <div className="w-full h-full bg-white/10 flex items-center justify-center">
                            <span className="text-white/50">No image</span>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

export default V2HeroWithImage;
