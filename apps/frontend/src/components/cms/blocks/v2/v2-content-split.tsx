'use client';

/**
 * V2 Content Split Block
 * Text + Image split layout
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface V2ContentSplitProps {
    heading?: string;
    subheading?: string;
    content?: string;
    imageUrl?: string;
    imageAlt?: string;
    imagePosition?: 'left' | 'right';
    ctaText?: string;
    ctaLink?: string;
    backgroundColor?: string;
    textColor?: string;
    className?: string;
}

export function V2ContentSplit({
    heading = 'About Our Company',
    subheading = 'Our Story',
    content = 'We are dedicated to providing the best solutions for our customers. Our team of experts works tirelessly to ensure your success.',
    imageUrl = '',
    imageAlt = 'Content image',
    imagePosition = 'right',
    ctaText = '',
    ctaLink = '',
    backgroundColor = '#ffffff',
    textColor = '#1a1a2e',
    className,
}: V2ContentSplitProps) {
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
                    {subheading && (
                        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                            {subheading}
                        </p>
                    )}

                    <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                        {heading}
                    </h2>

                    {content && (
                        <p className="text-lg opacity-80 leading-relaxed">
                            {content}
                        </p>
                    )}

                    {ctaText && ctaLink && (
                        <Link href={ctaLink}>
                            <Button size="lg" className="mt-4">{ctaText}</Button>
                        </Link>
                    )}
                </div>

                {/* Image */}
                <div className={cn(
                    'relative aspect-[4/3] rounded-lg overflow-hidden bg-muted',
                    imagePosition === 'left' && 'md:col-start-1'
                )}>
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={imageAlt}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <span>No image selected</span>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

export default V2ContentSplit;
