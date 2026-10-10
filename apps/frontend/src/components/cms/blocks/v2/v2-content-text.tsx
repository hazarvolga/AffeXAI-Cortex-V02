'use client';

/**
 * V2 Content Text Block
 * Rich text content section
 */

import React from 'react';
import { cn } from '@/lib/utils';
import DOMPurify from 'dompurify';

export interface V2ContentTextProps {
    heading?: string;
    content?: string;
    alignment?: 'left' | 'center' | 'right';
    maxWidth?: 'sm' | 'md' | 'lg' | 'full';
    backgroundColor?: string;
    textColor?: string;
    className?: string;
}

export function V2ContentText({
    heading = '',
    content = '<p>Add your content here. You can use <strong>bold</strong>, <em>italic</em>, and other formatting.</p>',
    alignment = 'left',
    maxWidth = 'lg',
    backgroundColor = '#ffffff',
    textColor = '#1a1a2e',
    className,
}: V2ContentTextProps) {
    const alignmentClasses = {
        left: 'text-left',
        center: 'text-center mx-auto',
        right: 'text-right ml-auto',
    };

    const maxWidthClasses = {
        sm: 'max-w-xl',
        md: 'max-w-3xl',
        lg: 'max-w-5xl',
        full: 'max-w-none',
    };

    return (
        <section
            className={cn('py-16 px-4', className)}
            style={{ backgroundColor, color: textColor }}
        >
            <div className={cn('container mx-auto', alignmentClasses[alignment])}>
                <div className={cn(maxWidthClasses[maxWidth])}>
                    {heading && (
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">
                            {heading}
                        </h2>
                    )}

                    <div
                        className="prose prose-lg max-w-none"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
                    />
                </div>
            </div>
        </section>
    );
}

export default V2ContentText;
